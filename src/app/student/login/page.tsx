'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * DEPRECATED: This page now redirects to /signin
 * 
 * The unified sign-in page automatically detects student emails
 * and routes them to the appropriate dashboard.
 * 
 * Students and org users now use the same /signin page.
 */
export default function StudentLoginPage() {
  const router = useRouter()

  // Redirect to unified sign-in page
  useEffect(() => {
    router.replace('/signin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  )
}
