"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle } from 'lucide-react'

interface OrganizationGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function OrganizationGuard({ children, fallback }: OrganizationGuardProps) {
  const { user, isAdmin, loading, profileLoading, userProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const validateAccess = async () => {
      console.log('🔍 [OrganizationGuard] useEffect:', {
        user: user?.email,
        isAdmin,
        loading,
        profileLoading,
        userProfile: userProfile?.role,
        orgId: (userProfile as any)?.orgId
      })
      
      // Don't make routing decisions while auth or profile is loading
      if (loading || profileLoading) {
        console.log('⏳ [OrganizationGuard] Still loading, waiting...')
        return
      }

      if (!user) {
        console.log('❌ [OrganizationGuard] No user, redirecting to /')
        router.push('/')
        return
      }

      // Redirect admins to admin dashboard (unless on subdomain)
      const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
      const isSubdomain = hostname.split('.').length > 2 && !hostname.startsWith('www.')
      
      if (isAdmin && !isSubdomain) {
        console.log('👑 [OrganizationGuard] Admin user, redirecting to /admin')
        router.push('/admin')
        return
      }

      // Require organization membership
      if (!userProfile?.orgId && !isAdmin) {
        console.log('🚫 [OrganizationGuard] No orgId, redirecting to /', { userProfile })
        router.push('/')
        return
      }

      // If on subdomain, validate session
      if (isSubdomain) {
        console.log('🔒 [OrganizationGuard] On subdomain, validating session...')
        try {
          const idToken = await user.getIdToken()
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          })

          if (!response.ok) {
            const result = await response.json()
            console.error('❌ [OrganizationGuard] Session validation failed:', result)
            
            // Sign out and redirect
            const { signOut } = await import('firebase/auth')
            const { auth } = await import('@/lib/firebase')
            await signOut(auth)
            router.push('/access-denied?reason=org_mismatch&subdomain=' + hostname.split('.')[0])
            return
          }
          
          console.log('✅ [OrganizationGuard] Session validated')
        } catch (error) {
          console.error('❌ [OrganizationGuard] Session validation error:', error)
          router.push('/')
          return
        }
      }
      
      console.log('✅ [OrganizationGuard] All checks passed, allowing access')
    }

    validateAccess()
  }, [user, isAdmin, loading, profileLoading, userProfile, router])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the organization dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAdmin || !userProfile?.orgId) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Your account doesn&apos;t have access to the organization dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Try signing in with an organization account.</p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
