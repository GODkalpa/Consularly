import { Badge } from "@/components/ui/badge"
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1"

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

// Stats removed in favor of columns layout

export function TestimonialsSection() {
  const images = [
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    "https://images.unsplash.com/photo-1554151228-14d9def656e4",
    "https://images.unsplash.com/photo-1541532713592-79a0317b6b77",
    "https://images.unsplash.com/photo-1545996124-0501ebae84d0",
    "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c",
  ]

  const mapped = testimonials.map((t, i) => ({
    text: `“${t.text}”`,
    image: `${images[i % images.length]}?auto=format&fit=crop&w=80&h=80&q=60`,
    name: t.name,
    role: t.university,
  }))

  const chunk = Math.ceil(mapped.length / 3)
  const firstColumn = mapped.slice(0, chunk)
  const secondColumn = mapped.slice(chunk, chunk * 2)
  const thirdColumn = mapped.slice(chunk * 2)

  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto px-6">
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center">
          <div className="flex justify-center">
            <Badge variant="outline" className="border py-1 px-4 rounded-lg">Testimonials</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75">
            See what our customers have to say about us.
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  )
}
