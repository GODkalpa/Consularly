"use client"

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeroSection from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { Pricing } from '@/components/ui/pricing-cards'
import FeaturesSection from '@/components/ui/demo'
import ScrollAdventure from '@/components/ui/animated-scroll'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, profileLoading, isAdmin, userProfile, redirectToDashboard } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRedirected = useRef(false)

  // Redirect authenticated users to their dashboard (unless they explicitly came from a dashboard)
  useEffect(() => {
    // Don't redirect if user came from a dashboard (back button)
    const fromDashboard = searchParams.get('from') === 'dashboard'
    
    if (user && !profileLoading && !fromDashboard && !hasRedirected.current) {
      console.log('[Home] Authenticated user detected, redirecting to dashboard')
      hasRedirected.current = true
      redirectToDashboard()
    }
  }, [user, profileLoading, redirectToDashboard, searchParams])

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
