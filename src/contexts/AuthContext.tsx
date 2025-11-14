"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db, firebaseEnabled } from '@/lib/firebase';
import { getUserProfile, isUserAdmin, UserProfile } from '@/lib/database';
import { sendWelcomeEmail } from '@/lib/email/send-helpers';
import { prefetch } from '@/lib/cache';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  redirectToDashboard: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults for public pages where AuthProvider isn't loaded
    return {
      user: null,
      userProfile: null,
      isAdmin: false,
      loading: false,
      profileLoading: false,
      signIn: async () => { throw new Error('Auth not available on public pages') },
      signInWithGoogle: async () => { throw new Error('Auth not available on public pages') },
      logout: async () => { throw new Error('Auth not available on public pages') },
      redirectToDashboard: () => { throw new Error('Auth not available on public pages') }
    };
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false); // Changed to false to prevent hydration issues
  const [profileLoading, setProfileLoading] = useState(false);
  const router = useRouter();
  
  // Check if we're on a public page where we can defer expensive operations
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isPublicPage = ['/', '/about', '/pricing', '/contact'].includes(pathname);

  const syncSessionCookie = async (user: User | null) => {
    try {
      if (user) {
        const idToken = await user.getIdToken()
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        })
      } else {
        await fetch('/api/auth/session', { method: 'DELETE' })
      }
    } catch (error) {
      console.warn('[AuthContext] Failed to sync session cookie:', error)
    }
  }

  useEffect(() => {
    // If Firebase isn't configured, skip setting up auth listeners
    if (!firebaseEnabled) {
      return;
    }

    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clean up previous profile subscription
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(user);

      if (user) {
        // Sync session cookie when user is authenticated
        await syncSessionCookie(user);
        try {
          console.log('🔄 [AuthContext] Starting profile fetch for:', user.email)
          setProfileLoading(true);
          // Initial fetch to populate quickly
          let profile = await getUserProfile(user.uid);
          
          // If profile doesn't exist, create it (one-time fix for existing users)
          if (!profile) {
            console.log('🆕 [AuthContext] Profile missing, creating for existing user:', user.email);
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL,
              role: 'user', // Default role for new users
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
              preferences: {
                theme: 'light',
                notifications: true,
                language: 'en'
              }
            });
            // Fetch the newly created profile
            profile = await getUserProfile(user.uid);
          }
          
          const adminStatus = await isUserAdmin(user.uid);
          console.log('📊 [AuthContext] Profile fetch complete:', { profile, adminStatus })
          setUserProfile(profile);
          setIsAdmin(adminStatus);
          setProfileLoading(false);

          console.log('✅ User profile loaded:', profile);
          
          // Prefetch dashboard data immediately for instant loads
          const token = await user.getIdToken();
          const headers = { Authorization: `Bearer ${token}` };
          
          if (adminStatus) {
            // Prefetch admin dashboard data
            console.log('🚀 Prefetching admin dashboard data...');
            prefetch('admin_stats', async () => {
              const res = await fetch('/api/admin/stats/overview', { headers });
              return await res.json();
            }, { ttl: 2 * 60 * 1000 });
            
            prefetch('admin_trends', async () => {
              const res = await fetch('/api/admin/stats/trends', { headers });
              return await res.json();
            }, { ttl: 10 * 60 * 1000 });
          } else if (profile?.orgId && !isPublicPage) {
            // Only prefetch on auth-required pages to improve public page performance
            console.log('🚀 Prefetching org dashboard data...');
            prefetch(`dashboard_${profile.orgId}`, async () => {
              const res = await fetch('/api/org/dashboard', { headers });
              return await res.json();
            }, { ttl: 60 * 1000 });
          }

          // Live subscribe to user profile to reflect role/org changes immediately
          unsubProfile = onSnapshot(
            doc(db, 'users', user.uid), 
            (snap) => {
              const latest = (snap.data() as UserProfile | undefined) || null;
              console.log('📡 Profile snapshot update:', latest);
              setUserProfile(latest);
              const isAdminUser = latest?.role === 'admin';
              setIsAdmin(isAdminUser);

              // Send welcome email on first login (after password is set)
              // Only for org users who haven't received the welcome email yet
              if (latest && latest.orgId && !latest.welcomeEmailSent) {
                console.log('[AuthContext] First login detected, sending welcome email');
                
                // Send welcome email asynchronously (non-blocking)
                user.getIdToken().then((token) => {
                  fetch('/api/auth/send-welcome', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.success) {
                        console.log('[AuthContext] Welcome email sent successfully');
                      } else {
                        console.warn('[AuthContext] Welcome email failed:', data.error);
                      }
                    })
                    .catch((err) => {
                      console.error('[AuthContext] Welcome email request failed:', err);
                    });
                }).catch((err) => {
                  console.error('[AuthContext] Failed to get auth token:', err);
                });
              }
            },
            (error) => {
              console.error('❌ Profile snapshot error:', error);
            }
          );
        } catch (error) {
          console.error('❌ [AuthContext] Error loading user profile:', error);
          setUserProfile(null);
          setIsAdmin(false);
          setProfileLoading(false);
        }
      } else {
        console.log('👤 [AuthContext] No user, clearing profile state')
        // Clear session cookie when user is signed out
        await syncSessionCookie(null)
        setUserProfile(null);
        setIsAdmin(false);
        setProfileLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      if (!firebaseEnabled) throw new Error('Authentication is not configured. Please contact support.');
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user document exists, if not create it (same as Google sign-in)
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        console.log('🆕 [signIn] Creating user profile for:', result.user.email);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          photoURL: result.user.photoURL,
          role: 'user', // Default role for new users
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        });
      } else {
        // Update last login time
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      // Redirect will be handled by the auth state change listener
    } catch (error) {
      throw error;
    }
  };


  const signInWithGoogle = async () => {
    try {
      if (!firebaseEnabled) throw new Error('Authentication is not configured. Please contact support.');
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user', // Default role for new users
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        });
      } else {
        // Update last login time
        await setDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      // Redirect will be handled by the auth state change listener
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!firebaseEnabled) return;
      await syncSessionCookie(null)
      await signOut(auth);
      router.push('/'); // Redirect to home after logout
    } catch (error) {
      throw error;
    }
  };

  const redirectToDashboard = () => {
    if (!user) {
      console.log('❌ [redirectToDashboard] No user, cannot redirect');
      return;
    }
    
    // Wait for profile to load before making routing decisions
    if (profileLoading) {
      console.log('⏳ [redirectToDashboard] Profile still loading, waiting...');
      return;
    }
    
    console.log('🎯 [redirectToDashboard] Routing user:', {
      email: user.email,
      isAdmin,
      userProfile: userProfile,
      orgId: (userProfile as any)?.orgId,
      profileLoading
    });
    
    // Route based on available information
    if (isAdmin) {
      console.log('👑 [redirectToDashboard] Admin user → /admin');
      router.push('/admin');
    } else if (userProfile?.orgId) {
      console.log('🏢 [redirectToDashboard] Org user → /org');
      router.push('/org');
    } else {
      console.log('🎓 [redirectToDashboard] Default to student → /student');
      router.push('/student');
    }
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    loading,
    profileLoading,
    signIn,
    signInWithGoogle,
    logout,
    redirectToDashboard
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
