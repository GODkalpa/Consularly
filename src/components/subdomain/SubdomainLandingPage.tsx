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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Organization Not Found</h1>
          <p className="text-gray-600 mb-8">This subdomain is not configured.</p>
          <a href="https://consularly.com" className="text-blue-600 hover:underline font-medium">
            Go to main site
          </a>
        </div>
      </div>
    )
  }

  const primaryColor = org.branding?.primaryColor || '#4840A3'
  const backgroundColor = org.branding?.backgroundColor || '#ffffff'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50"
      style={{ backgroundColor }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
        <div className="p-8 sm:p-12">
          {/* Logo */}
          {org.logo && (
            <div className="flex justify-center mb-10">
              <img
                src={org.logo}
                alt={org.name}
                className="h-20 object-contain"
              />
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {org.name}
            </h1>
            <p className="text-gray-600 text-lg">
              Sign in to access your account
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={() => router.push('/signin')}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
          >
            Sign In
          </button>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor, opacity: 0.8 }}></div>
      </div>
    </div>
  )
}
