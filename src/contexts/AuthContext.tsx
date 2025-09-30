"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db, firebaseEnabled } from '@/lib/firebase';
import { getUserProfile, isUserAdmin, UserProfile } from '@/lib/database';

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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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

          // Live subscribe to user profile to reflect role/org changes immediately
          const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            const latest = (snap.data() as UserProfile | undefined) || null;
            setUserProfile(latest);
            setIsAdmin(latest?.role === 'admin' || latest?.role === 'super_admin');

            // Auto-redirect after successful authentication is disabled to keep users on the homepage.
            // Users can navigate to their dashboard via the navbar button.
          });

          // Cleanup the profile subscription when auth changes
          return () => unsubProfile();
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

    return unsubscribe;
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
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
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

      // Always send password setup email so the user can set/confirm their password via email link
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (e) {
        // Non-fatal: continue even if email fails here; user can use "Forgot password" later
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] sendPasswordResetEmail after signup failed:', e);
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
      await signOut(auth);
      router.push('/'); // Redirect to home after logout
    } catch (error) {
      throw error;
    }
  };

  const redirectToDashboard = () => {
    if (!user || !userProfile) return;
    
    // Redirect based on user role
    if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
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
