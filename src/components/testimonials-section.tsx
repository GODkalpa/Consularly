import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote, ThumbsUp, Users } from "lucide-react"

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Kathmandu",
    university: "University of California, Berkeley",
    avatar: "PS",
    rating: 5,
    text: "Consularly was a game-changer for my visa interview preparation. The AI feedback helped me identify my weak points and practice specific areas. I got my visa on the first attempt!",
    beforeAfter: "From 60% confidence to 95% confidence",
    outcome: "Visa approved ✅"
  },
  {
    name: "Rajesh Thapa",
    location: "Pokhara", 
    university: "Stanford University",
    avatar: "RT",
    rating: 5,
    text: "The Nepal-specific questions were incredibly helpful. I practiced for just 2 weeks and felt so much more prepared. The instant feedback saved me months of uncertainty.",
    beforeAfter: "2 weeks of focused practice",
    outcome: "Visa approved ✅"
  },
  {
    name: "Shreya Patel",
    location: "Lalitpur",
    university: "MIT",
    avatar: "SP",
    rating: 5,
    text: "As someone from a remote area, accessing quality coaching was impossible. Consularly gave me the same level of preparation as students in major cities. Highly recommend!",
    beforeAfter: "Remote area to world-class prep",
    outcome: "Visa approved ✅"
  },
  {
    name: "Anish Karki",
    location: "Bharatpur",
    university: "Carnegie Mellon",
    avatar: "AK",
    rating: 5,
    text: "The detailed reports and progress tracking kept me motivated. I could see my improvement session by session. The counselor dashboard helped my advisor guide me better.",
    beforeAfter: "Tracked 40+ practice sessions",
    outcome: "Visa approved ✅"
  },
  {
    name: "Samita Gurung",
    location: "Chitwan",
    university: "Harvard University",
    avatar: "SG",
    rating: 5,
    text: "The bilingual support made it easy to understand complex concepts. The voice recording feature helped me practice my pronunciation and speaking pace perfectly.",
    beforeAfter: "Improved speaking confidence by 80%",
    outcome: "Visa approved ✅"
  },
  {
    name: "Krishna Bahadur",
    location: "Dharan",
    university: "Columbia University",
    avatar: "KB",
    rating: 5,
    text: "Consularly's AI is incredibly smart. It caught mistakes I didn't even know I was making and gave me specific tips to improve. Worth every penny!",
    beforeAfter: "Fixed 12 common mistakes",
    outcome: "Visa approved ✅"
  }
]

const stats = [
  { number: "1000+", label: "Students Prepared" },
  { number: "85%", label: "Success Rate" },
  { number: "4.9/5", label: "Average Rating" },
  { number: "500+", label: "5-Star Reviews" }
]

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 border-blue-200">
            <ThumbsUp className="w-4 h-4 mr-2" />
            Success Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Students Love <br />
            <span className="text-blue-600">Consularly</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real stories from real students who achieved their US study dreams with Consularly&apos;s help.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg hover:scale-105 relative overflow-hidden">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-blue-200 mb-4" />
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Before/After & Outcome */}
                <div className="space-y-2 mb-6">
                  <div className="text-sm">
                    <span className="font-semibold text-blue-600">Progress: </span>
                    <span className="text-gray-600">{testimonial.beforeAfter}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-green-600">Result: </span>
                    <span className="text-green-700 font-medium">{testimonial.outcome}</span>
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-blue-100">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.name}`} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.location}</div>
                    <div className="text-sm text-blue-600 font-medium">{testimonial.university}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
          <div className="mb-6">
            <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Join Our Success Community</h3>
            <p className="text-gray-600 text-lg">
              Become part of a growing community of successful visa applicants
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-lg">
              Start Your Success Story
            </button>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors">
              Read More Reviews
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
