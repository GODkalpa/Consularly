'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SetupForm() {
  const [token, setToken] = useState('')
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    displayName: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (!tokenFromUrl) {
      setError('No invitation token provided')
      setLoading(false)
      return
    }

    setToken(tokenFromUrl)
    validateToken(tokenFromUrl)
  }, [searchParams])

  const validateToken = async (invitationToken: string) => {
    try {
      const response = await fetch(`/api/student/setup?token=${encodeURIComponent(invitationToken)}`)
      const data = await response.json()

      if (response.ok) {
        setStudentInfo(data.student)
        setFormData(prev => ({ ...prev, displayName: data.student.name }))
      } else {
        if (data.expired) {
          setError('This invitation link has expired. Please contact your organization for a new invitation.')
        } else if (data.alreadyExists) {
          setError('This account has already been set up. Please try logging in instead.')
        } else {
          setError(data.message || 'Invalid invitation link')
        }
      }
    } catch (err) {
      console.error('Token validation error:', err)
      setError('Failed to validate invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.displayName.trim()) {
      setError('Please enter your display name')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/student/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          displayName: formData.displayName.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
      } else {
        // Handle specific error cases with helpful messages
        if (response.status === 409) {
          setError(data.message || 'This email is already in use. Please try logging in or contact your organization.')
        } else if (data.message?.includes('already set up')) {
          setError('Your account is already set up! You can log in using your credentials.')
        } else {
          setError(data.message || 'Failed to create account. Please try again.')
        }
      }
    } catch (err) {
      console.error('Setup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !studentInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/student/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const orgBranding = studentInfo?.organization?.branding
  const primaryColor = orgBranding?.primaryColor || '#3B82F6'
  const orgLogo = orgBranding?.logoUrl
  const orgName = orgBranding?.companyName || studentInfo?.organization?.name || 'Your Organization'

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center items-center mb-6">
              {orgLogo ? (
                <img className="h-12 w-auto" src={orgLogo} alt={orgName} />
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {orgName.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to {orgName}!
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div 
                className="rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Created Successfully!</h3>
              <p className="text-gray-600 mb-6">
                Your account has been set up. You can now log in and start practicing.
              </p>
              <Link
                href="/student/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Continue to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center items-center mb-6">
            {orgLogo ? (
              <img className="h-12 w-auto" src={orgLogo} alt={orgName} />
            ) : (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {orgName.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome to {orgName}!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your account to start practicing interviews
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Setup Error</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    {error.includes('already in use') && (
                      <div className="mt-2">
                        <Link
                          href="/student/login"
                          className="text-sm font-medium text-red-800 underline hover:text-red-900"
                        >
                          Try logging in instead →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Your Account</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p><strong>Email:</strong> {studentInfo?.email}</p>
                    <p><strong>Credits Allocated:</strong> {studentInfo?.creditsAllocated} interviews</p>
                    <p><strong>Organization:</strong> {orgName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Create a secure password (min 8 characters)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/student/login" className="font-medium hover:text-blue-500" style={{ color: primaryColor }}>
                  Sign in here
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SetupForm />
    </Suspense>
  )
}
