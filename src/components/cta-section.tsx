import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Clock, 
  Shield,
  Zap,
  Star,
  Gift
} from "lucide-react"

const pricingFeatures = [
  "Unlimited mock interviews",
  "AI-powered instant feedback",
  "Nepal-specific question bank",
  "Detailed progress reports",
  "Bilingual support (EN/NE)",
  "Webcam coaching tips",
  "PDF report downloads",
  "30-day data retention",
  "Priority support"
]

export function CTASection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--muted))] text-foreground relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(var(--primary)/0.2)] rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(var(--primary)/0.15)] rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2 bg-foreground/10 text-foreground border-foreground/20">
            <Gift className="w-4 h-4 mr-2" />
            Limited Time Offer
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Start Your Journey to <br />
            <span className="text-[hsl(var(--warn))]">Visa Success</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Join thousands of successful students who trusted Consularly for their visa interview preparation. 
            Your dream university is just one successful interview away.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="border-0 bg-foreground/10 backdrop-blur-lg shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <Badge className="bg-[hsl(var(--warn))] text-[hsl(220,10%,6%)] px-4 py-2 text-lg font-bold">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Most Popular
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold text-foreground mb-2">
                Complete Preparation Package
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-5xl md:text-6xl font-bold text-[hsl(var(--warn))]">$29</span>
                <div className="text-left">
                  <div className="text-foreground/80">per month</div>
                  <div className="text-sm text-foreground/60">billed monthly</div>
                </div>
              </div>
              <p className="text-muted-foreground">Everything you need to ace your visa interview</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pricingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[hsl(var(--success))] flex-shrink-0" />
                    <span className="text-foreground/90">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Special Offers */}
              <div className="bg-[hsl(var(--warn)/0.1)] border border-[hsl(var(--warn)/0.3)] rounded-lg p-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[hsl(var(--warn))]" />
                  <span className="text-[hsl(var(--warn))] font-semibold">Special Launch Bonuses</span>
                </div>
                <ul className="space-y-1 text-sm text-foreground/90">
                  <li>• Free 1-on-1 counselor session (worth $50)</li>
                  <li>• Exclusive Nepal study abroad guide PDF</li>
                  <li>• Access to private success community</li>
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4 pt-6">
                <Button 
                  size="lg" 
                  className="w-full py-6 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
                
                <p className="text-center text-sm text-foreground/70">
                  7-day free trial • No credit card required • Cancel anytime
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-foreground/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[hsl(var(--success))]" />
                  <span className="text-sm text-foreground/80">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
                  <span className="text-sm text-foreground/80">Instant Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[hsl(var(--warn))]" />
                  <span className="text-sm text-foreground/80">4.9/5 Rating</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
            Still have questions?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our team is here to help you succeed. Get in touch with any questions about the platform 
            or your visa interview preparation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 bg-transparent border-2 border-foreground/30 text-foreground hover:bg-foreground/10 hover:border-foreground/50 transition-all"
            >
              Schedule a Demo Call
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 bg-transparent border-2 border-foreground/30 text-foreground hover:bg-foreground/10 hover:border-foreground/50 transition-all"
            >
              Contact Support
            </Button>
          </div>

          {/* Final Trust Signal */}
          <div className="mt-12 pt-8 border-t border-foreground/10">
            <p className="text-foreground/80 text-lg">
              Trusted by <span className="font-bold text-[hsl(var(--warn))]">1000+</span> students across Nepal
            </p>
            <div className="flex justify-center items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[hsl(var(--warn))] text-[hsl(var(--warn))]" />
              ))}
              <span className="ml-2 text-foreground/70">Based on 500+ reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
