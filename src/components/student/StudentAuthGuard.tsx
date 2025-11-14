'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStudentAuth } from '@/contexts/StudentAuthContext'

interface StudentAuthGuardProps {
  children: React.ReactNode
}

export function StudentAuthGuard({ children }: StudentAuthGuardProps) {
  const { student, loading } = useStudentAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !student) {
      // Redirect unauthenticated users to student login
      router.push('/student/login')
    }
  }, [student, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state for inactive accounts
  if (student && !student.dashboardEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Access Disabled</h2>
          <p className="text-gray-600 mb-4">
            Your organization has disabled dashboard access for your account. Please contact them to enable access.
          </p>
          <button
            onClick={() => router.push('/student/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  // Show error state for suspended accounts
  if (student && student.accountStatus === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-4">
            Your account has been suspended. Please contact your organization for assistance.
          </p>
          <button
            onClick={() => router.push('/student/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  // Render children for authenticated and active students
  if (student && student.dashboardEnabled && student.accountStatus === 'active') {
    return <>{children}</>
  }

  // Fallback - redirect to login
  return null
}
