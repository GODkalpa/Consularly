import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, Star, Users, CheckCircle } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
        <div className="w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
        <div className="w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container relative z-10 mx-auto text-center max-w-6xl">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors">
            <Star className="w-4 h-4 mr-2 fill-current" />
            Trusted by 1000+ Students
          </Badge>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent leading-tight">
          Ace Your <br />
          <span className="text-blue-600">US Visa Interview</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Practice with AI-powered mock interviews tailored for Nepalese F-1 students. 
          Get instant feedback, improve your confidence, and increase your visa success rate.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>10-12 Realistic Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Instant AI Feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>4s Response Time</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Start Free Practice
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
          >
            <Play className="mr-2 w-5 h-5" />
            Watch Demo
          </Button>
        </div>

        {/* Social Proof */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500">Join thousands of successful visa applicants</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm text-gray-600">4.9/5 from 500+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  )
}
