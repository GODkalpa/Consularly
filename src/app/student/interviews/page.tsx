'use client'

import { useState, useEffect } from 'react'
import { StudentAuthGuard } from '@/components/student/StudentAuthGuard'
import { useStudentAuth } from '@/contexts/StudentAuthContext'
import Link from 'next/link'

interface Interview {
  id: string
  status: string
  score: number | null
  route: string | null
  startTime: string
  endTime: string | null
  duration: number | null
  creditSource: string
  completedQuestions: number
  finalReport?: {
    decision: string
    overall: number
    summary: string
  }
}

interface InterviewStats {
  total: number
  completed: number
  averageScore: number
  highestScore: number
  improvement: number
}

export default function StudentInterviewsPage() {
  const { student } = useStudentAuth()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState<InterviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all')

  useEffect(() => {
    if (student) {
      fetchInterviews()
    }
  }, [student])

  const fetchInterviews = async () => {
    try {
      const user = (await import('@/lib/firebase')).auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/student/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInterviews(data.interviews)
        setStats(data.statistics)
      } else {
        setError('Failed to load interviews')
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err)
      setError('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true
    if (filter === 'completed') return interview.status === 'completed'
    if (filter === 'in_progress') return interview.status === 'in_progress' || interview.status === 'scheduled'
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRouteDisplay = (route: string | null) => {
    switch (route) {
      case 'usa_f1': return 'USA F1 Visa'
      case 'uk_student': return 'UK Student Visa'
      case 'france_ema': return 'France EMA'
      case 'france_icn': return 'France ICN'
      default: return 'Interview'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'scheduled': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!student) return null

  const primaryColor = student.organization?.branding?.primaryColor || '#3B82F6'
  const orgLogo = student.organization?.branding?.logoUrl
  const orgName = student.organization?.branding?.companyName || student.organization?.name || 'Your Organization'

  return (
    <StudentAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {orgLogo && (
                  <img 
                    src={orgLogo} 
                    alt={orgName}
                    className="h-8 w-auto mr-4 bg-white rounded shadow-sm p-1"
                  />
                )}
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/student"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">Interview History</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Credits: {student.creditsRemaining}
                </span>
                <Link
                  href="/student"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Interview History</h1>
            <p className="text-gray-600 mt-1">
              Track your progress and review your performance over time
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Interviews</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">{stats.averageScore}</p>
                    <p className="text-sm text-gray-600">Average Score</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">{stats.highestScore}</p>
                    <p className="text-sm text-gray-600">Best Score</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.improvement > 0 ? '+' : ''}{stats.improvement}
                    </p>
                    <p className="text-sm text-gray-600">Improvement</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Interview List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Interviews</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'all' 
                        ? 'text-white' 
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ backgroundColor: filter === 'all' ? primaryColor : undefined }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'completed' 
                        ? 'text-white' 
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ backgroundColor: filter === 'completed' ? primaryColor : undefined }}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setFilter('in_progress')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'in_progress' 
                        ? 'text-white' 
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ backgroundColor: filter === 'in_progress' ? primaryColor : undefined }}
                  >
                    In Progress
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <div className="text-red-600 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">{error}</p>
                </div>
              ) : filteredInterviews.length > 0 ? (
                filteredInterviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/student/interviews/${interview.id}`}
                    className="block p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {getRouteDisplay(interview.route)}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {interview.creditSource === 'student' && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                              SELF-INITIATED
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span>
                            📅 {formatDate(interview.startTime)}
                          </span>
                          {interview.duration && (
                            <span>
                              ⏱️ {interview.duration} min
                            </span>
                          )}
                          <span>
                            📊 {interview.completedQuestions} questions
                          </span>
                          <span className="capitalize">
                            🎯 {interview.difficulty}
                          </span>
                        </div>

                        {interview.finalReport?.summary && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {interview.finalReport.summary}
                          </p>
                        )}
                      </div>
                      
                      {interview.status === 'completed' && interview.score !== null && (
                        <div className="text-right ml-6">
                          <div className={`text-3xl font-bold ${getScoreColor(interview.score)}`}>
                            {interview.score}
                          </div>
                          <div className="text-sm text-gray-600">/ 100</div>
                          {interview.finalReport && (
                            <div className="text-xs text-gray-500 mt-1 capitalize">
                              {interview.finalReport.decision}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'all' ? 'No interviews yet' : `No ${filter} interviews`}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filter === 'all' 
                      ? "Start practicing to see your interviews here" 
                      : `Try changing the filter to see other interviews`
                    }
                  </p>
                  {filter === 'all' && (
                    <Link
                      href="/student"
                      className="inline-flex items-center px-4 py-2 rounded-md text-white font-medium transition-colors"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Start First Interview
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentAuthGuard>
  )
}
