"use client"

import React, { createContext, useContext, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { auth, db, firebaseEnabled } from '@/lib/firebase'
import { useUser } from './UserContext'
import { useProfile } from './ProfileContext'

interface AuthActionsContextType {
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  redirectToDashboard: () => Promise<void>
}

const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined)

export function useAuthActions() {
  const context = useContext(AuthActionsContext)
  if (context === undefined) {
    return {
      signIn: async () => { throw new Error('Auth not available on public pages') },
      signInWithGoogle: async () => { throw new Error('Auth not available on public pages') },
      logout: async () => { throw new Error('Auth not available on public pages') },
      redirectToDashboard: async () => { throw new Error('Auth not available on public pages') }
    }
  }
  return context
}

export function AuthActionsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useUser()
  const { profileLoading } = useProfile()

  const syncSessionCookie = useCallback(async (user: any) => {
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
      console.warn('[AuthActionsContext] Failed to sync session cookie:', error)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      if (!firebaseEnabled) throw new Error('Authentication is not configured. Please contact support.')
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      await syncSessionCookie(result.user)
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (!userDoc.exists()) {
        console.log('🆕 [signIn] Creating user profile for:', result.user.email)
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          photoURL: result.user.photoURL,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        })
      } else {
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }
    } catch (error) {
      throw error
    }
  }, [syncSessionCookie])

  const signInWithGoogle = useCallback(async () => {
    try {
      if (!firebaseEnabled) throw new Error('Authentication is not configured. Please contact support.')
      const provider = new GoogleAuthProvider()
      const { user } = await signInWithPopup(auth, provider)
      
      await syncSessionCookie(user)
      
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        })
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }
    } catch (error) {
      throw error
    }
  }, [syncSessionCookie])

  const logout = useCallback(async () => {
    try {
      if (!firebaseEnabled) return
      await syncSessionCookie(null)
      await signOut(auth)
      router.push('/')
    } catch (error) {
      throw error
    }
  }, [router, syncSessionCookie])

  const redirectToDashboard = useCallback(async () => {
    if (!user) {
      console.log('❌ [redirectToDashboard] No user, cannot redirect')
      return
    }
    
    if (profileLoading) {
      console.log('⏳ [redirectToDashboard] Profile still loading, waiting...')
      return
    }
    
    try {
      console.log('🎯 [redirectToDashboard] Determining user type for:', user.email)
      
      const token = await user.getIdToken()
      const response = await fetch('/api/auth/user-type', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        console.error('❌ [redirectToDashboard] Failed to get user type:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('📋 [redirectToDashboard] User type:', data.userType, '→', data.dashboard)
      
      if (data.dashboard && data.dashboard !== '/') {
        console.log('✅ [redirectToDashboard] Redirecting to:', data.dashboard)
        router.replace(data.dashboard)
      } else {
        console.log('⚠️ [redirectToDashboard] No dashboard found, staying on current page')
      }
    } catch (error) {
      console.error('❌ [redirectToDashboard] Error:', error)
    }
  }, [user, profileLoading, router])

  const value = {
    signIn,
    signInWithGoogle,
    logout,
    redirectToDashboard
  }

  return (
    <AuthActionsContext.Provider value={value}>
      {children}
    </AuthActionsContext.Provider>
  )
}
