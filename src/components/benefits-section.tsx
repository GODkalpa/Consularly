import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  TrendingUp, 
  Globe, 
  Heart, 
  BookOpen, 
  CheckCircle,
  ArrowRight,
  Flag,
  GraduationCap
} from "lucide-react"

const benefits = [
  {
    icon: Flag,
    title: "Nepal-Specific Context",
    description: "Questions tailored for Nepalese students with understanding of local educational system and cultural context.",
    stats: "500+ Nepal-focused questions"
  },
  {
    icon: TrendingUp,
    title: "Proven Success Rate",
    description: "Our students have a 85% higher success rate compared to traditional preparation methods.",
    stats: "85% success improvement"
  },
  {
    icon: Globe,
    title: "Bilingual Support",
    description: "Practice in English while having UI support in Nepali for better understanding and comfort.",
    stats: "English + नेपाली support"
  },
  {
    icon: GraduationCap,
    title: "F-1 Visa Expertise",
    description: "Specialized focus on F-1 student visa interviews with questions covering all critical areas.",
    stats: "12+ question categories"
  }
]

const commonChallenges = [
  "Lack of realistic practice opportunities",
  "No instant feedback on interview performance",
  "High cost of traditional coaching",
  "Limited availability of expert counselors",
  "Difficulty accessing quality preparation in remote areas",
  "No way to track improvement over time"
]

export function BenefitsSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2 bg-green-50 text-green-700 border-green-200">
            <Heart className="w-4 h-4 mr-2" />
            Built for Nepal
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Why Nepalese Students <br />
            <span className="text-green-600">Choose Consularly</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We understand the unique challenges Nepalese students face when preparing for US visa interviews. 
            Consularly bridges the gap between dreams and reality.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors flex-shrink-0">
                    <benefit.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-900 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {benefit.description}
                    </p>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      {benefit.stats}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-16" />

        {/* Problems vs Solutions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Problems */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-8">
              Common Challenges Students Face
            </h3>
            <div className="space-y-4">
              {commonChallenges.map((challenge, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">{challenge}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-8">
              How Consularly Solves These
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Unlimited Practice Sessions</p>
                  <p className="text-gray-600">Available 24/7 from anywhere with internet connection</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Instant AI Feedback</p>
                  <p className="text-gray-600">Get detailed analysis within seconds of your response</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Affordable Pricing</p>
                  <p className="text-gray-600">Fraction of the cost of traditional coaching centers</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Expert-Curated Content</p>
                  <p className="text-gray-600">Questions and feedback from visa interview specialists</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Remote Access</p>
                  <p className="text-gray-600">Practice from any city in Nepal with internet access</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Progress Analytics</p>
                  <p className="text-gray-600">Detailed reports showing your improvement over time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Success Journey?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of Nepalese students who have successfully prepared with Consularly
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg text-lg">
            Start Free Practice Now
            <ArrowRight className="ml-2 w-5 h-5 inline" />
          </button>
        </div>
      </div>
    </section>
  )
}
