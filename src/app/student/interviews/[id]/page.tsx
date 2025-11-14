'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { StudentAuthGuard } from '@/components/student/StudentAuthGuard'
import { useStudentAuth } from '@/contexts/StudentAuthContext'
import Link from 'next/link'

interface InterviewDetail {
  id: string
  status: string
  route: string | null
  interviewMode: string
  difficulty: string
  startTime: string
  endTime: string | null
  duration: number | null
  score: number | null
  scoreDetails: any
  detailedScores: any
  completedQuestions: number
  conversationHistory: Array<{
    question: string
    answer: string
    timestamp: string
    questionType?: string
  }>
  finalReport: any
  creditSource: string
  createdAt: string
}

interface ImprovementData {
  previousScore: number
  change: number
  trend: 'improving' | 'stable' | 'declining' | null
  bestScore: number
  practiceCount: number
}

export default function StudentInterviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { student } = useStudentAuth()
  const [interview, setInterview] = useState<InterviewDetail | null>(null)
  const [improvement, setImprovement] = useState<ImprovementData | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'analysis'>('overview')

  const interviewId = params.id as string

  useEffect(() => {
    if (student && interviewId) {
      fetchInterviewDetail()
    }
  }, [student, interviewId])

  const fetchInterviewDetail = async () => {
    try {
      const user = (await import('@/lib/firebase')).auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch(`/api/student/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInterview(data.interview)
        setImprovement(data.improvement)
        setRecommendations(data.recommendations || [])
      } else {
        if (response.status === 404) {
          setError('Interview not found')
        } else {
          setError('Failed to load interview details')
        }
      }
    } catch (err) {
      console.error('Failed to fetch interview:', err)
      setError('Failed to load interview details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRouteDisplay = (route: string | null) => {
    switch (route) {
      case 'usa_f1': return 'USA F1 Student Visa'
      case 'uk_student': return 'UK Student Visa'
      case 'france_ema': return 'France EMA Program'
      case 'france_icn': return 'France ICN Program'
      default: return 'Visa Interview'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200'
    if (score >= 70) return 'bg-blue-50 border-blue-200'
    if (score >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'improving':
        return <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      case 'declining':
        return <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      default:
        return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
    }
  }

  if (loading) {
    return (
      <StudentAuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading interview details...</p>
          </div>
        </div>
      </StudentAuthGuard>
    )
  }

  if (error || !interview) {
    return (
      <StudentAuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/student/interviews"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Interviews
            </Link>
          </div>
        </div>
      </StudentAuthGuard>
    )
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
                  <Link 
                    href="/student/interviews"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Interviews
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">Interview Results</span>
                </div>
              </div>
              <Link
                href="/student/interviews"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Interviews
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Interview Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {getRouteDisplay(interview.route)}
                </h1>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span>📅 {formatDate(interview.startTime)}</span>
                  {interview.duration && <span>⏱️ {interview.duration} minutes</span>}
                  <span>📊 {interview.completedQuestions} questions</span>
                  <span className="capitalize">🎯 {interview.difficulty} difficulty</span>
                  {interview.creditSource === 'student' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                      SELF-INITIATED
                    </span>
                  )}
                </div>
              </div>
              
              {interview.status === 'completed' && interview.score !== null && (
                <div className={`text-center p-4 rounded-lg border-2 ${getScoreBackground(interview.score)}`}>
                  <div className={`text-4xl font-bold ${getScoreColor(interview.score)}`}>
                    {interview.score}
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                  {interview.finalReport?.decision && (
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      {interview.finalReport.decision}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Improvement Section */}
          {improvement && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Tracking</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{improvement.change > 0 ? '+' : ''}{improvement.change}</div>
                  <div className="text-sm text-gray-600">Change from Previous</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    {getTrendIcon(improvement.trend)}
                    <span className="ml-2 text-lg font-semibold capitalize">{improvement.trend || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-gray-600">Performance Trend</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{improvement.bestScore}</div>
                  <div className="text-sm text-gray-600">Personal Best</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{improvement.practiceCount}</div>
                  <div className="text-sm text-gray-600">Total Practice Sessions</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Score Overview
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'transcript'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Interview Transcript
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Detailed Analysis
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {interview.scoreDetails && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Score Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(interview.scoreDetails).map(([category, score]: [string, any]) => (
                          <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
                            <div className="text-sm text-gray-600 capitalize">{category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span className="text-blue-800 text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transcript Tab */}
              {activeTab === 'transcript' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Conversation</h3>
                  {interview.conversationHistory && interview.conversationHistory.length > 0 ? (
                    <div className="space-y-6">
                      {interview.conversationHistory.map((exchange, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4">
                          <div className="mb-3">
                            <div className="font-medium text-gray-900 mb-2">
                              Question {index + 1}
                              {exchange.questionType && (
                                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {exchange.questionType}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {exchange.question}
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="font-medium text-gray-900 mb-2">Your Answer</div>
                            <div className="text-gray-700 bg-white border p-3 rounded-lg">
                              {exchange.answer || '[No response recorded]'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      No conversation transcript available
                    </div>
                  )}
                </div>
              )}

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {interview.finalReport ? (
                    <>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Assessment Summary</h3>
                        <div className="prose max-w-none">
                          <p className="text-gray-700">{interview.finalReport.summary}</p>
                        </div>
                      </div>

                      {interview.finalReport.detailedInsights && interview.finalReport.detailedInsights.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Insights</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {interview.finalReport.detailedInsights.map((insight: any, index: number) => (
                              <div key={index} className={`p-4 rounded-lg border ${
                                insight.type === 'strength' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                              }`}>
                                <div className="flex items-center mb-2">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${
                                    insight.type === 'strength' ? 'bg-green-500' : 'bg-yellow-500'
                                  }`}></span>
                                  <span className="font-medium text-gray-900">{insight.category}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{insight.finding}</p>
                                {insight.actionItem && (
                                  <p className="text-xs text-gray-600 italic">💡 {insight.actionItem}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {interview.detailedScores && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Score Breakdown</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(interview.detailedScores).map(([dimension, score]: [string, any]) => (
                              <div key={dimension} className="bg-gray-50 p-4 rounded-lg">
                                <div className={`text-lg font-semibold ${getScoreColor(score)}`}>{score}/100</div>
                                <div className="text-sm text-gray-600 capitalize">{dimension.replace(/([A-Z])/g, ' $1').trim()}</div>
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${score}%`,
                                        backgroundColor: score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      Analysis not yet available for this interview
                    </div>
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
