import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { BenefitsSection } from '@/components/benefits-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { CTASection } from '@/components/cta-section'

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <section id="features">
        <FeaturesSection />
      </section>
      <BenefitsSection />
      <section id="testimonials">
        <TestimonialsSection />
      </section>
      <section id="pricing">
        <CTASection />
      </section>
    </>
  )
}
