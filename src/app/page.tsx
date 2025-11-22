"use client"

import React, { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeroSection from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import FeaturesSection from '@/components/ui/demo'
import B2BHeroSection from '@/components/ui/b2b-hero-section'
import WhitelabelSection from '@/components/ui/whitelabel-section'
import CtaSection from '@/components/ui/cta-section'


import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'

const SubdomainLandingPage = dynamic(() => import('@/components/subdomain/SubdomainLandingPage'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  ),
  ssr: false
})

function HomeContent() {
  const { user, profileLoading, isAdmin, userProfile, redirectToDashboard } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRedirected = useRef(false)

  // Check if we're on a subdomain
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isSubdomain = hostname.split('.').length > 2 && !hostname.startsWith('www.')

  // Validate session for subdomain access before redirecting
  useEffect(() => {
    const validateAndRedirect = async () => {
      console.log('[Home useEffect] Checking redirect conditions:', {
        hasUser: !!user,
        profileLoading,
        hasRedirected: hasRedirected.current,
        fromDashboard: searchParams.get('from') === 'dashboard',
        isSubdomain
      })

      // Don't redirect if user came from a dashboard (back button)
      const fromDashboard = searchParams.get('from') === 'dashboard'

      // Only redirect if we're on the home page and user is authenticated
      if (user && !profileLoading && !fromDashboard && !hasRedirected.current) {
        // If on subdomain, validate session first
        if (isSubdomain) {
          console.log('[Home] Validating subdomain session before redirect...')
          try {
            const idToken = await user.getIdToken()
            const response = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken })
            })

            if (!response.ok) {
              const result = await response.json()
              console.error('[Home] Session validation failed:', result)

              // Sign out the user - they'll stay on the subdomain landing page
              const { signOut } = await import('firebase/auth')
              const { auth } = await import('@/lib/firebase')
              await signOut(auth)

              // Don't redirect - the subdomain landing page will show the login form
              // Just return and let the user see the landing page
              return
            }

            console.log('[Home] Session validated, proceeding with redirect')
          } catch (error) {
            console.error('[Home] Session validation error:', error)
            return
          }
        }

        console.log('[Home] ✓ All conditions met, redirecting to dashboard')
        hasRedirected.current = true
        redirectToDashboard().catch(err => {
          console.error('[Home] Redirect failed:', err)
        })
      } else {
        console.log('[Home] ✗ Redirect conditions not met')
      }
    }

    validateAndRedirect()
  }, [user, profileLoading, redirectToDashboard, searchParams, isSubdomain, router])

  // If on subdomain, show custom landing page
  if (isSubdomain) {
    const subdomain = hostname.split('.')[0]
    return <SubdomainLandingPage subdomain={subdomain} />
  }

  // Otherwise show main homepage
  return (
    <>
      <section id="hero" className="pt-12 sm:pt-16">
        <HeroSection />
      </section>
      <div className="my-6 sm:my-8" />
      <section id="features">
        <FeaturesSection />
      </section>

      <section id="b2b" className="my-6 sm:my-8">
        <B2BHeroSection />
      </section>

      <section id="whitelabel" className="my-6 sm:my-8">
        <WhitelabelSection />
      </section>

      <section id="testimonials">
        <TestimonialsSection />
      </section>

      <section id="cta" className="mt-6 sm:mt-8 mb-0">
        <CtaSection />
      </section>
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
