import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Brain, 
  Clock, 
  Target, 
  BarChart3, 
  Shield, 
  Users, 
  FileText,
  Video,
  Zap
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Feedback",
    description: "Advanced AI analyzes your responses and provides detailed feedback on content, delivery, and confidence level.",
    badge: "Smart"
  },
  {
    icon: Mic,
    title: "Voice Recording",
    description: "Practice with real voice recording to simulate the actual interview experience and improve your speaking skills.",
    badge: "Audio"
  },
  {
    icon: Clock,
    title: "Instant Results",
    description: "Get feedback within 4 seconds of completing each answer. No waiting, just immediate actionable insights.",
    badge: "Fast"
  },
  {
    icon: Target,
    title: "Nepal-Specific Questions",
    description: "Curated question bank specifically designed for Nepalese F-1 visa applicants with cultural context.",
    badge: "Tailored"
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Track your improvement over multiple attempts with detailed analytics and performance metrics.",
    badge: "Analytics"
  },
  {
    icon: Video,
    title: "Webcam Coaching",
    description: "Optional webcam tips for eye contact and body language without storing any video data.",
    badge: "Privacy"
  },
  {
    icon: FileText,
    title: "Detailed Reports",
    description: "Comprehensive PDF reports with scores, recommendations, and improvement tips you can share.",
    badge: "Export"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and stored for only 30 days. Complete control over your privacy.",
    badge: "Secure"
  },
  {
    icon: Users,
    title: "Counselor Dashboard",
    description: "Counselors can track student progress and identify areas needing attention across all branches.",
    badge: "Professional"
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Everything You Need to <br />
            <span className="text-blue-600">Succeed</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consularly combines cutting-edge AI technology with visa interview expertise 
            to give you the best preparation experience possible.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:scale-105"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6 text-lg">
            Ready to experience these features yourself?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              Start Your First Mock Interview
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
