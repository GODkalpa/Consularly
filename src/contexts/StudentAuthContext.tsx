'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { OrgStudent, OrganizationBranding } from '@/types/firestore'

interface StudentAuthContextType {
  student: (OrgStudent & { organization?: { id: string; name: string; branding: OrganizationBranding } }) | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOutStudent: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined)

export function useStudentAuth() {
  const context = useContext(StudentAuthContext)
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider')
  }
  return context
}

interface StudentAuthProviderProps {
  children: React.ReactNode
}

export function StudentAuthProvider({ children }: StudentAuthProviderProps) {
  const [student, setStudent] = useState<StudentAuthContextType['student']>(null)
  const [loading, setLoading] = useState(true)

  const syncSessionCookie = async (user: any | null) => {
    try {
      if (user) {
        console.log('[StudentAuth] Syncing session cookie (setting)...')
        const idToken = await user.getIdToken()
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        })
        const result = await response.json()
        console.log('[StudentAuth] Session cookie set result:', result)
      } else {
        console.log('[StudentAuth] Syncing session cookie (clearing)...')
        await fetch('/api/auth/session', { method: 'DELETE' })
      }
    } catch (error) {
      console.warn('[StudentAuth] Failed to sync session cookie:', error)
    }
  }

  const fetchStudentProfile = async (idToken: string): Promise<StudentAuthContextType['student']> => {
    try {
      console.log('[StudentAuth] Fetching student profile...')
      const response = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      console.log('[StudentAuth] Profile fetch response status:', response.status)

      if (!response.ok) {
        if (response.status === 404) {
          // User exists in Firebase Auth but not in orgStudents - not a student
          console.log('[StudentAuth] Student not found (404)')
          return null
        }
        const errorData = await response.json().catch(() => ({}))
        console.error('[StudentAuth] Profile fetch failed:', response.status, errorData)
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }

      const data = await response.json()
      console.log('[StudentAuth] Profile fetched successfully:', data.student?.email)
      return {
        ...data.student,
        organization: data.organization
      }
    } catch (error) {
      console.error('[StudentAuth] Failed to fetch profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    const user = auth.currentUser
    if (!user) {
      setStudent(null)
      return
    }

    try {
      const idToken = await user.getIdToken()
      const profile = await fetchStudentProfile(idToken)
      setStudent(profile)
    } catch (error) {
      console.error('[StudentAuth] Failed to refresh profile:', error)
      setStudent(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[StudentAuth] Auth state changed, user:', user?.email || 'null')
      setLoading(true)
      
      if (!user) {
        console.log('[StudentAuth] No user, clearing state')
        setStudent(null)
        await syncSessionCookie(null)
        setLoading(false)
        return
      }

      try {
        console.log('[StudentAuth] User found, fetching profile...')
        const idToken = await user.getIdToken()
        const profile = await fetchStudentProfile(idToken)
        console.log('[StudentAuth] Profile result:', profile ? 'found' : 'null')
        setStudent(profile)
        
        // Sync session cookie after successful profile fetch
        if (profile) {
          console.log('[StudentAuth] Syncing session cookie...')
          await syncSessionCookie(user)
        } else {
          console.log('[StudentAuth] No profile found, not syncing cookie')
        }
      } catch (error) {
        console.error('[StudentAuth] Auth state change error:', error)
        setStudent(null)
      } finally {
        console.log('[StudentAuth] Loading complete, student:', !!student)
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      
      // Fetch student profile to verify this is a student account
      const profile = await fetchStudentProfile(idToken)
      if (!profile) {
        // Not a student account - sign out
        await signOut(auth)
        throw new Error('This account is not registered as a student. Please check your login credentials or contact your organization.')
      }

      // Set session cookie immediately after successful sign-in
      await syncSessionCookie(userCredential.user)

      // Update last login timestamp
      try {
        await fetch('/api/student/profile', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lastLoginAt: new Date().toISOString() })
        })
      } catch (updateError) {
        console.warn('[StudentAuth] Failed to update last login:', updateError)
      }

      setStudent(profile)
    } catch (error: any) {
      console.error('[StudentAuth] Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOutStudent = async () => {
    try {
      await syncSessionCookie(null)
      await signOut(auth)
      setStudent(null)
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (error) {
      console.error('[StudentAuth] Sign out error:', error)
      throw error
    }
  }

  const value: StudentAuthContextType = {
    student,
    loading,
    signIn,
    signOutStudent,
    refreshProfile
  }

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  )
}
