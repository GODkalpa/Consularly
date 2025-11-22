'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { DynamicFavicon } from '@/components/branding/DynamicFavicon'

interface SubdomainLandingPageProps {
  subdomain: string
}

export default function SubdomainLandingPage({ subdomain }: SubdomainLandingPageProps) {
  const router = useRouter()
  const { signIn: adminSignIn, redirectToDashboard } = useAuth()

  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Auth State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

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

  const checkIfStudent = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/student/check-email?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        return data.isStudent || false
      }
      return false
    } catch {
      return false
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError('')

    try {
      // Step 1: Validate credentials with Firebase (but don't persist session yet)
      // We'll use a temporary sign-in to get the user ID, then validate org, then sign out
      let userCredential
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      } catch (authError: any) {
        // Handle Firebase auth errors
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
          setError('Invalid email or password.')
        } else if (authError.code === 'auth/too-many-requests') {
          setError('Too many login attempts. Please try again later.')
        } else {
          setError(authError.message || 'Failed to sign in.')
        }
        setAuthLoading(false)
        return
      }

      // Step 2: Validate organization membership BEFORE setting session
      const idToken = await userCredential.user.getIdToken()
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })

      // Step 3: If validation fails, sign out immediately and show error
      if (!sessionResponse.ok) {
        const result = await sessionResponse.json()
        console.error('[SubdomainLanding] Session validation failed:', result)
        
        // Sign out the user immediately (before any state updates)
        await auth.signOut()
        
        // Show generic error message - don't reveal that credentials were valid
        // This prevents information disclosure about which orgs exist
        if (result.code === 'ORG_ACCESS_DENIED') {
          setError('Invalid credentials for this organization. Please check your email and password.')
        } else {
          setError('Authentication failed. Please check your credentials.')
        }
        setAuthLoading(false)
        return
      }

      // Step 4: Validation passed! Determine user type and redirect
      const isStudent = await checkIfStudent(email)
      
      if (isStudent) {
        // Wait a bit to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/student')
      } else {
        // Redirect to org dashboard
        redirectToDashboard()
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Organization Not Found</h1>
          <p className="text-gray-600 mb-8">This subdomain is not configured properly.</p>
          <a href="https://consularly.com" className="text-blue-600 hover:underline">
            Go to main site &rarr;
          </a>
        </div>
      </div>
    )
  }

  const primaryColor = org.branding?.primaryColor || '#4840A3'

  return (
    <>
      {/* Dynamic Favicon */}
      <DynamicFavicon faviconUrl={org.branding?.favicon} />
      
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-2 sm:p-4 md:p-8 font-sans">
      <div className="w-full max-w-[1200px] md:h-[800px] md:max-h-[90vh] bg-white rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side - Branding */}
        <div
          className="w-full md:w-1/2 relative flex flex-col items-center justify-center p-8 sm:p-10 md:p-12 text-white overflow-hidden min-h-[280px] md:min-h-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
          }}
        >
          {/* Background Decorations */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {org.logo ? (
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 shadow-lg border border-white/20 flex items-center justify-center">
                <img
                  src={org.logo}
                  alt={org.name}
                  className="max-w-full max-h-full object-contain brightness-0 invert"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 shadow-lg border border-white/20">
                {org.name.charAt(0)}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 tracking-tight px-4">
              {org.name}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-md font-light leading-relaxed px-4">
              Empowering Future Leaders Through Knowledge.
            </p>

            {/* Decorative Icons/Illustration at bottom - hidden on mobile */}
            <div className="mt-8 md:mt-16 opacity-60 hidden sm:block">
              <svg className="w-full max-w-[300px]" height="100" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 50 Q 75 10, 150 50 T 290 50" stroke="white" strokeWidth="2" fill="none" />
                <circle cx="10" cy="50" r="4" fill="white" />
                <circle cx="150" cy="50" r="6" fill="white" />
                <circle cx="290" cy="50" r="4" fill="white" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 bg-white p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-right mb-6 sm:mb-8">
              <p className="text-xs sm:text-sm text-gray-500">
                Don&apos;t have an account? <a href="#" className="text-blue-600 font-semibold hover:underline">Sign Up</a>
              </p>
            </div>

            <div className="mb-6 sm:mb-8 md:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-sm sm:text-base text-gray-500">Sign in to your {org.name} dashboard.</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-gray-500">
                    Remember me
                  </label>
                </div>

                <div>
                  <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                    Forgot Password?
                  </a>
                </div>
              </div>

              {error && (
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-50 border border-red-100 text-xs sm:text-sm text-red-600 flex items-start gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex justify-center py-2.5 sm:py-3 md:py-3.5 px-4 border border-transparent rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                style={{
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
                }}
              >
                {authLoading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <span aria-hidden="true">&rarr;</span>
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 md:mt-10 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Powered by <span className="font-semibold text-gray-500">Consularly</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
