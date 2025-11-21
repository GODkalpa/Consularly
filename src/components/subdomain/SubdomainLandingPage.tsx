'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationWithId } from '@/types/firestore'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Organization Not Found</h1>
          <p className="text-gray-600 mb-8">This subdomain is not configured.</p>
          <a href="https://consularly.com" className="text-blue-600 hover:underline">
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
    >
      <div className="max-w-md w-full">
        {/* Logo */}
        {org.logo && (
          <div className="text-center mb-8">
            <img 
              src={org.logo} 
              alt={org.name}
              className="h-16 mx-auto"
            />
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              {org.name}
            </h1>
            <p className="text-gray-600">
              Sign in to access your account
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={() => router.push('/signin')}
            className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Sign In
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                New here?
              </span>
            </div>
          </div>

          {/* Student Setup Link */}
          <button
            onClick={() => router.push('/student/setup')}
            className="w-full py-3 px-4 rounded-lg font-medium border-2 transition-colors"
            style={{ 
              borderColor: primaryColor,
              color: primaryColor
            }}
          >
            Student Registration
          </button>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Powered by{' '}
              <a 
                href="https://consularly.com" 
                className="hover:underline"
                style={{ color: primaryColor }}
              >
                Consularly
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
