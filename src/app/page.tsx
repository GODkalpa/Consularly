"use client"

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeroSection from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { Pricing } from '@/components/ui/pricing-cards'
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
  const { user, profileLoading, redirectToDashboard } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRedirected = useRef(false)

  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isSubdomain = hostname.split('.').length > 2 && !hostname.startsWith('www.')

  useEffect(() => {
    const validateAndRedirect = async () => {
      const fromDashboard = searchParams.get('from') === 'dashboard'

      if (user && !profileLoading && !fromDashboard && !hasRedirected.current) {
        if (isSubdomain) {
          try {
            const idToken = await user.getIdToken()
            const response = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken })
            })

            if (!response.ok) {
              const { signOut } = await import('firebase/auth')
              const { auth } = await import('@/lib/firebase')
              await signOut(auth)
              return
            }
          } catch (error) {
            console.error('Session validation error:', error)
            return
          }
        }

        hasRedirected.current = true
        redirectToDashboard().catch(err => {
          console.error('Redirect failed:', err)
        })
      }
    }

    validateAndRedirect()
  }, [user, profileLoading, redirectToDashboard, searchParams, isSubdomain, router])

  if (isSubdomain) {
    const subdomain = hostname.split('.')[0]
    return <SubdomainLandingPage subdomain={subdomain} />
  }

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
