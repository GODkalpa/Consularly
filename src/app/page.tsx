import HeroSection from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { Pricing } from '@/components/ui/pricing-cards'
import FeaturesSection from '@/components/ui/demo'
import ScrollAdventure from '@/components/ui/animated-scroll'

export default function Home() {
  return (
    <>
      <section id="hero" className="pt-12 sm:pt-16">
        <HeroSection />
      </section>
      <div className="divider my-6 sm:my-8" />
      <section id="features" data-animate="up">
        <FeaturesSection />
      </section>
      <section id="scroll-adventure" className="md:-my-16">
        <ScrollAdventure />
      </section>
      <section id="testimonials" data-animate="up">
        <TestimonialsSection />
      </section>
      <div className="divider my-6 sm:my-8" />
      <section id="pricing" data-animate="up">
        <Pricing />
      </section>
    </>
  )
}
