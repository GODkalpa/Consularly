'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface UserGuardProps {
  children: React.ReactNode
}

/**
 * UserGuard protects routes that should only be accessible to authenticated regular users.
 * Redirects:
 * - Admins to /admin
 * - Org members to /org
 * - Unauthenticated users to /signin
 */
export function UserGuard({ children }: UserGuardProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/signin')
      return
    }

    if (!userProfile) return

    // Redirect admins to their dashboard
    if (userProfile.role === 'admin') {
      router.push('/admin')
      return
    }

    // Redirect org members to org dashboard
    if ((userProfile as any).orgId) {
      router.push('/org')
      return
    }

    // Regular users can access this route
  }, [user, userProfile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  // Don't render for admins or org members
  if (userProfile.role === 'admin' || (userProfile as any).orgId) {
    return null
  }

  return <>{children}</>
}
