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
    <section className="py-24 px-4 bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2 bg-white/10 text-white border-white/20">
            <Gift className="w-4 h-4 mr-2" />
            Limited Time Offer
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Start Your Journey to <br />
            <span className="text-yellow-400">Visa Success</span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Join thousands of successful students who trusted Consularly for their visa interview preparation. 
            Your dream university is just one successful interview away.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="border-0 bg-white/10 backdrop-blur-lg shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <Badge className="bg-yellow-400 text-yellow-900 px-4 py-2 text-lg font-bold">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Most Popular
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold text-white mb-2">
                Complete Preparation Package
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-5xl md:text-6xl font-bold text-yellow-400">$29</span>
                <div className="text-left">
                  <div className="text-white/80">per month</div>
                  <div className="text-sm text-white/60">billed monthly</div>
                </div>
              </div>
              <p className="text-blue-100">Everything you need to ace your visa interview</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pricingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/90">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Special Offers */}
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">Special Launch Bonuses</span>
                </div>
                <ul className="space-y-1 text-sm text-white/90">
                  <li>• Free 1-on-1 counselor session (worth $50)</li>
                  <li>• Exclusive Nepal study abroad guide PDF</li>
                  <li>• Access to private success community</li>
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4 pt-6">
                <Button 
                  size="lg" 
                  className="w-full py-6 text-xl font-bold bg-yellow-400 hover:bg-yellow-500 text-black shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
                
                <p className="text-center text-sm text-white/70">
                  7-day free trial • No credit card required • Cancel anytime
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-white/80">Instant Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-white/80">4.9/5 Rating</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
            Still have questions?
          </h3>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Our team is here to help you succeed. Get in touch with any questions about the platform 
            or your visa interview preparation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all"
            >
              Schedule a Demo Call
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all"
            >
              Contact Support
            </Button>
          </div>

          {/* Final Trust Signal */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-white/80 text-lg">
              Trusted by <span className="font-bold text-yellow-400">1000+</span> students across Nepal
            </p>
            <div className="flex justify-center items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-white/70">Based on 500+ reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
