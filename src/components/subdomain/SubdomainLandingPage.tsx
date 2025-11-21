'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SubdomainLandingPageProps {
  subdomain: string
}

export default function SubdomainLandingPage({ subdomain }: SubdomainLandingPageProps) {
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch(`/api/subdomain/context`)
        if (res.ok) {
          const data = await res.json()
          setOrg(data.organization)
        }
      } catch (error) {
        console.error('Error fetching org:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [subdomain])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Organization Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">This subdomain is not configured properly.</p>
          <a href="https://consularly.com" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
            Go to main site &rarr;
          </a>
        </div>
      </div>
    )
  }

  const primaryColor = org.branding?.primaryColor || '#4840A3'
  // Create a background gradient based on the primary color
  const backgroundStyle = {
    background: `linear-gradient(135deg, ${primaryColor}15 0%, #ffffff 50%, ${primaryColor}10 100%)`,
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Decorative background elements */}
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
        style={{ backgroundColor: primaryColor }}
      ></div>
      <div
        className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
        style={{ backgroundColor: primaryColor }}
      ></div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10">
        <div className="p-8 sm:p-12">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-10">
            {org.logo ? (
              <div className="w-24 h-24 relative mb-6 p-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                <img
                  src={org.logo}
                  alt={org.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {org.name.charAt(0)}
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 text-center leading-tight">
              {org.name}
            </h1>
          </div>

          {/* Content Section */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500">Sign in to access your dashboard</p>
            </div>

            <button
              onClick={() => router.push('/signin')}
              className="w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-opacity-30 flex items-center justify-center gap-2 group"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 20px -10px ${primaryColor}80`,
                ['--tw-ring-color' as any]: primaryColor
              }}
            >
              <span>Sign In</span>
              <svg
                className="w-5 h-5 transform transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Powered by <span className="font-semibold text-gray-500">Consularly</span>
              </p>
            </div>
          </div>
        </div>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: primaryColor }}></div>
      </div>
    </div>
  )
}
