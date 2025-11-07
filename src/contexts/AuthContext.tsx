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

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  redirectToDashboard: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false); // Changed to false to prevent hydration issues
  const router = useRouter();

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
        try {
          // Initial fetch to populate quickly
          const [profile, adminStatus] = await Promise.all([
            getUserProfile(user.uid),
            isUserAdmin(user.uid)
          ]);
          setUserProfile(profile);
          setIsAdmin(adminStatus);

          console.log('✅ User profile loaded:', profile);

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

              // Auto-redirect to profile setup if profile incomplete
              // Skip for: admins (role=admin) and org members (users with orgId)
              const needsProfileSetup = latest && 
                !isAdminUser && 
                !latest.orgId && 
                !latest.studentProfile?.profileCompleted;
              
              if (needsProfileSetup) {
                const currentPath = window.location.pathname;
                const allowedPaths = ['/profile-setup', '/signin', '/signup', '/'];
                
                // Only redirect if not already on allowed paths
                if (!allowedPaths.includes(currentPath)) {
                  console.log('[AuthContext] Profile incomplete, redirecting to setup');
                  router.push('/profile-setup');
                }
              }
            },
            (error) => {
              console.error('❌ Profile snapshot error:', error);
            }
          );
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
          setIsAdmin(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
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
      // Redirect will be handled by the auth state change listener
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      if (!firebaseEnabled) throw new Error('Authentication is not configured. Please contact support.');
      
      // Use server-side API to create user (bypasses Firestore security rules)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Now sign in the user with the credentials
      await signInWithEmailAndPassword(auth, email, password);

      // Send welcome email (non-blocking)
      sendWelcomeEmail({
        to: email,
        displayName: displayName,
        userId: data.uid,
      }).catch((e) => {
        console.warn('[AuthContext] Welcome email failed:', e);
      });

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
      await signOut(auth);
      router.push('/'); // Redirect to home after logout
    } catch (error) {
      throw error;
    }
  };

  const redirectToDashboard = () => {
    if (!user || !userProfile) return;
    
    // Redirect based on user role
    if (userProfile.role === 'admin') {
      router.push('/admin');
    } else if ((userProfile as any).orgId) {
      router.push('/org');
    } else {
      // Regular users go to their dashboard
      router.push('/dashboard');
    }
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    loading,
    signIn,
    signUp,
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
