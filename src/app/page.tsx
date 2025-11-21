"use client"

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeroSection from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { Pricing } from '@/components/ui/pricing-cards'
import FeaturesSection from '@/components/ui/demo'
import ScrollAdventure from '@/components/ui/animated-scroll'
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

  // Redirect authenticated users to their dashboard (unless they explicitly came from a dashboard)
  useEffect(() => {
    console.log('[Home useEffect] Checking redirect conditions:', {
      hasUser: !!user,
      profileLoading,
      hasRedirected: hasRedirected.current,
      fromDashboard: searchParams.get('from') === 'dashboard'
    })

    // Don't redirect if user came from a dashboard (back button)
    const fromDashboard = searchParams.get('from') === 'dashboard'

    // Only redirect if we're on the home page and user is authenticated
    if (user && !profileLoading && !fromDashboard && !hasRedirected.current) {
      console.log('[Home] ✓ All conditions met, redirecting to dashboard')
      hasRedirected.current = true
      redirectToDashboard().catch(err => {
        console.error('[Home] Redirect failed:', err)
      })
    } else {
      console.log('[Home] ✗ Redirect conditions not met')
    }
  }, [user, profileLoading, redirectToDashboard, searchParams])

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
      <section id="scroll-adventure" className="md:-my-16">
        <ScrollAdventure />
      </section>
      <section id="testimonials">
        <TestimonialsSection />
      </section>
      <div className="my-6 sm:my-8" />
      <section id="pricing">
        <Pricing />
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
