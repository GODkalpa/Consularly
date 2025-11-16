"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db, firebaseEnabled } from '@/lib/firebase'
import { getUserProfile, isUserAdmin, UserProfile } from '@/lib/database'
import { useUser } from './UserContext'
import { prefetch } from '@/lib/cache'

interface ProfileContextType {
  userProfile: UserProfile | null
  isAdmin: boolean
  profileLoading: boolean
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    return { userProfile: null, isAdmin: false, profileLoading: false }
  }
  return context
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setUserProfile(null)
      setIsAdmin(false)
      setProfileLoading(false)
      return
    }

    let unsubProfile: (() => void) | null = null

    const loadProfile = async () => {
      try {
        console.log('🔄 [ProfileContext] Starting profile fetch for:', user.email)
        setProfileLoading(true)
        
        // Initial fetch to populate quickly
        let profile = await getUserProfile(user.uid)
        
        // If profile doesn't exist, create it
        if (!profile) {
          console.log('🆕 [ProfileContext] Profile missing, creating for existing user:', user.email)
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
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
          profile = await getUserProfile(user.uid)
        }
        
        const adminStatus = await isUserAdmin(user.uid)
        console.log('📊 [ProfileContext] Profile fetch complete:', { profile, adminStatus })
        setUserProfile(profile)
        setIsAdmin(adminStatus)
        setProfileLoading(false)

        console.log('✅ User profile loaded:', profile)
        
        // Prefetch dashboard data immediately for instant loads
        const token = await user.getIdToken()
        const headers = { Authorization: `Bearer ${token}` }
        
        if (adminStatus) {
          console.log('🚀 Prefetching admin dashboard data...')
          prefetch('admin_stats', async () => {
            const res = await fetch('/api/admin/stats/overview', { headers })
            return await res.json()
          }, { ttl: 2 * 60 * 1000 })
          
          prefetch('admin_trends', async () => {
            const res = await fetch('/api/admin/stats/trends', { headers })
            return await res.json()
          }, { ttl: 10 * 60 * 1000 })
        } else if (profile?.orgId) {
          console.log('🚀 Prefetching org dashboard data...')
          prefetch(`dashboard_${profile.orgId}`, async () => {
            const res = await fetch('/api/org/dashboard', { headers })
            return await res.json()
          }, { ttl: 60 * 1000 })
        }

        // Live subscribe to user profile
        unsubProfile = onSnapshot(
          doc(db, 'users', user.uid), 
          (snap) => {
            const latest = (snap.data() as UserProfile | undefined) || null
            console.log('📡 Profile snapshot update:', latest)
            setUserProfile(latest)
            const isAdminUser = latest?.role === 'admin'
            setIsAdmin(isAdminUser)

            // Send welcome email on first login
            if (latest && latest.orgId && !latest.welcomeEmailSent) {
              console.log('[ProfileContext] First login detected, sending welcome email')
              
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
                      console.log('[ProfileContext] Welcome email sent successfully')
                    } else {
                      console.warn('[ProfileContext] Welcome email failed:', data.error)
                    }
                  })
                  .catch((err) => {
                    console.error('[ProfileContext] Welcome email request failed:', err)
                  })
              }).catch((err) => {
                console.error('[ProfileContext] Failed to get auth token:', err)
              })
            }
          },
          (error) => {
            console.error('❌ Profile snapshot error:', error)
          }
        )
      } catch (error) {
        console.error('❌ [ProfileContext] Error loading user profile:', error)
        setUserProfile(null)
        setIsAdmin(false)
        setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      if (unsubProfile) {
        unsubProfile()
      }
    }
  }, [user])

  return (
    <ProfileContext.Provider value={{ userProfile, isAdmin, profileLoading }}>
      {children}
    </ProfileContext.Provider>
  )
}
