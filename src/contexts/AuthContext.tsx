"use client"

import React from 'react'
import { User } from 'firebase/auth'
import { UserProfile } from '@/lib/database'
import { UserProvider, useUser } from './UserContext'
import { ProfileProvider, useProfile } from './ProfileContext'
import { AuthActionsProvider, useAuthActions } from './AuthActionsContext'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  isAdmin: boolean
  loading: boolean
  profileLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  redirectToDashboard: () => Promise<void>
}

// Combined hook that uses all three contexts
export function useAuth(): AuthContextType {
  const { user, loading } = useUser()
  const { userProfile, isAdmin, profileLoading } = useProfile()
  const { signIn, signInWithGoogle, logout, redirectToDashboard } = useAuthActions()

  return {
    user,
    userProfile,
    isAdmin,
    loading,
    profileLoading,
    signIn,
    signInWithGoogle,
    logout,
    redirectToDashboard
  }
}

// Nested provider that combines all three contexts
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProfileProvider>
        <AuthActionsProvider>
          {children}
        </AuthActionsProvider>
      </ProfileProvider>
    </UserProvider>
  )
}
