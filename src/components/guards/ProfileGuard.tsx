"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProfileGuardProps {
  children: React.ReactNode
}

/**
 * ProfileGuard: Ensures user has completed their profile before accessing protected routes
 * Redirects to /profile-setup if profile is incomplete
 */
export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Allow access to profile-setup page itself
    if (pathname === '/profile-setup') {
      setIsChecking(false)
      return
    }

    // If user is not authenticated, let UserGuard handle it
    if (!user) {
      setIsChecking(false)
      return
    }

    // Check if profile is completed
    if (userProfile) {
      const profileCompleted = userProfile.studentProfile?.profileCompleted

      if (!profileCompleted) {
        // Profile not completed - redirect to setup
        console.log('[ProfileGuard] Profile incomplete, redirecting to setup')
        router.push('/profile-setup')
        return
      }

      // Profile is completed - allow access
      setIsChecking(false)
    }
  }, [user, userProfile, router, pathname])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking profile...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

