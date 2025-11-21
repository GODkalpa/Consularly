import Link from 'next/link'

export default function MainHomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Practice. Get Feedback. Pass Your Visa Interview
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Meet Consularly — an AI toolkit that helps visa applicants get clarity, feedback, and interview confidence
          </p>
          <Link 
            href="/signin"
            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign In to Start
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-3 gap-8">
            {/* Add your features here */}
          </div>
        </div>
      </section>
    </div>
  )
}
