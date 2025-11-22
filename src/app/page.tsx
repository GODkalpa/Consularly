"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import HeroSection from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import FeaturesSection from '@/components/ui/demo'
import B2BHeroSection from '@/components/ui/b2b-hero-section'
import WhitelabelSection from '@/components/ui/whitelabel-section'
import CtaSection from '@/components/ui/cta-section'


function HomeContent() {
  // Note: Subdomain routing is now handled by middleware and layout
  // This component only renders the main portal homepage

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <HomeContent />
    </Suspense>
  )
}
