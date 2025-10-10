import HeroSection from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { Pricing } from '@/components/ui/pricing-cards'

export default function Home() {
  return (
    <>
      <HeroSection />
      <section id="features" data-animate="up">
        <FeaturesSection />
      </section>
      <section id="testimonials" data-animate="up">
        <TestimonialsSection />
      </section>
      <section id="pricing" data-animate="up">
        <Pricing />
      </section>
    </>
  )
}
