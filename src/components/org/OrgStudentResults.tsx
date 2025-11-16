"use client"

import { useEffect, useState, useMemo } from 'react'
import { auth, firebaseEnabled } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, TrendingUp, Target, Search, Users, Eye, Download, FileText, BarChart3, CheckCircle, AlertTriangle, Calendar, ChevronDown, ChevronRight, Folder, FolderOpen, ArrowLeft } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InterviewDetailsModal } from '@/components/org/InterviewDetailsModal'

interface StudentResult {
  student: {
    id: string
    name: string
    email: string
    studentProfile: any
  }
  interviews: Array<{
    id: string
    status: string
    score: number | null
    route: string | null
    startTime: string | null
    endTime: string | null
    finalReport: any
  }>
  stats: {
    totalInterviews: number
    completedInterviews: number
    averageScore: number | null
    latestScore: number | null
  }
}

export function OrgStudentResults() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<StudentResult[]>([])
  const [timeRange, setTimeRange] = useState<'all' | '90d' | '30d' | '7d'>('all')
  const [routeFilter, setRouteFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null)
  const [expandedInterviews, setExpandedInterviews] = useState<Set<string>>(new Set())
  const [selectedInterview, setSelectedInterview] = useState<{interview: any, student: any} | null>(null)

  useEffect(() => {
    async function fetchResults() {
      if (!firebaseEnabled) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const token = await auth.currentUser?.getIdToken()
        if (!token) throw new Error('Not authenticated')

        const params = new URLSearchParams()
        if (timeRange !== 'all') params.set('timeRange', timeRange)
        if (routeFilter !== 'all') params.set('route', routeFilter)

        const res = await fetch(`/api/org/results?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Failed to fetch results')
        const data = await res.json()
        setResults(data.results || [])
      } catch (err) {
        console.error('Failed to load results:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [timeRange, routeFilter])

  // Filter by search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results
    const term = searchTerm.toLowerCase()
    return results.filter(
      (r) =>
        r.student.name.toLowerCase().includes(term) ||
        r.student.email.toLowerCase().includes(term)
    )
  }, [results, searchTerm])

  // Compute available routes for filter
  const routeOptions = useMemo(() => {
    const routes = new Set<string>()
    results.forEach((r) =>
      r.interviews.forEach((iv) => {
        if (iv.route) routes.add(iv.route)
      })
    )
    return Array.from(routes)
  }, [results])

  const openStudentFolder = (student: StudentResult) => {
    setSelectedStudent(student)
    setExpandedInterviews(new Set())
  }

  const closeStudentFolder = () => {
    setSelectedStudent(null)
    setExpandedInterviews(new Set())
  }

  const toggleInterview = (interviewId: string) => {
    setExpandedInterviews((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(interviewId)) {
        newSet.delete(interviewId)
      } else {
        newSet.add(interviewId)
      }
      return newSet
    })
  }

  const getRouteDisplay = (route: string | null) => {
    switch (route) {
      case 'usa_f1': return 'USA F1 Visa'
      case 'uk_student': return 'UK Student Visa'
      case 'france_ema': return 'France EMA'
      case 'france_icn': return 'France ICN'
      default: return route || 'Interview'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Trophy className="h-4 w-4 text-orange-500" />
      case 'expired': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">In Progress</Badge>
      case 'expired':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Expired</Badge>
      default:
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-green-500'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return 'N/A'
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const duration = end - start
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Overall stats across all students
  const overallStats = useMemo(() => {
    const totalInterviews = results.reduce((sum, r) => sum + r.stats.totalInterviews, 0)
    const allScores = results
      .flatMap((r) => r.interviews)
      .map((iv) => iv.score)
      .filter((s): s is number => typeof s === 'number')
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
        : null
    return { totalInterviews, avgScore, totalStudents: results.length }
  }, [results])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
            <CardDescription>Interview performance by student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <span className="animate-pulse">Loading results…</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Results</h1>
        <p className="text-muted-foreground mt-1">View student interview performance and analytics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                <div className="text-4xl font-bold">
                  {overallStats.totalStudents.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Interviews</p>
                <div className="text-4xl font-bold">
                  {overallStats.totalInterviews}
                </div>
              </div>
              <div className="p-3 bg-accent-100 rounded-lg">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                <div className="text-4xl font-bold">
                  {overallStats.avgScore ? `${(overallStats.avgScore / 10).toFixed(1)}/10` : '—'}
                </div>
              </div>
              <div className="p-3 bg-secondary-100 rounded-lg">
                <Trophy className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section with Filters */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Interview Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-10 pl-9"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={routeFilter} onValueChange={(v: any) => setRouteFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Visa type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visa types</SelectItem>
                {routeOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Windows Explorer Style View */}
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search or filters' : 'No students have completed interviews yet'}
              </p>
            </div>
          ) : selectedStudent ? (
            /* Inside Student Folder - Show Interviews */
            <div className="space-y-4">
              {/* Back Button */}
              <Button
                variant="outline"
                onClick={closeStudentFolder}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>

              {/* Student Info Header */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selectedStudent.student.name}</h2>
                  <p className="text-muted-foreground">{selectedStudent.student.email}</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{selectedStudent.stats.totalInterviews}</div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{selectedStudent.stats.completedInterviews}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  {selectedStudent.stats.averageScore !== null && (
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(selectedStudent.stats.averageScore)}`}>
                        {(selectedStudent.stats.averageScore / 10).toFixed(1)}/10
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interviews List */}
              <div className="space-y-3">
                {selectedStudent.interviews.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No interviews found for this student</p>
                  </div>
                ) : (
                  selectedStudent.interviews.map((interview) => (
                              <Card key={interview.id} className="border bg-white transition-all duration-200 hover:shadow-md">
                                <Collapsible open={expandedInterviews.has(interview.id)}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div 
                                        className="flex items-start gap-3 text-left flex-1 cursor-pointer" 
                                        onClick={() => toggleInterview(interview.id)}
                                      >
                                        {getStatusIcon(interview.status)}
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium">{getRouteDisplay(interview.route)}</span>
                                            {getStatusBadge(interview.status)}
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            <Calendar className="h-3 w-3 inline mr-1" />
                                            {formatDate(interview.startTime)}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-right">
                                        {interview.score !== null && (
                                          <div className="text-right">
                                            <div className={`text-2xl font-bold ${getScoreColor(interview.score)}`}>
                                              {interview.score}%
                                            </div>
                                            <p className="text-xs text-muted-foreground">Score</p>
                                          </div>
                                        )}
                                        <div className="text-right">
                                          <div className="font-medium">{formatDuration(interview.startTime, interview.endTime)}</div>
                                          <p className="text-xs text-muted-foreground">Duration</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {interview.status === 'completed' && interview.finalReport && (
                                            <>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async (e) => {
                                                  e.stopPropagation()
                                      try {
                                        const token = await auth.currentUser?.getIdToken()
                                        if (!token) return
                                        window.open(`/api/report/${interview.id}/pdf?token=${token}`, '_blank')
                                      } catch (err) {
                                        console.error('Failed to open PDF:', err)
                                      }
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View Report
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        const token = await auth.currentUser?.getIdToken()
                                        if (!token) return
                                        const response = await fetch(`/api/report/${interview.id}/pdf?token=${token}&download=true`)
                                        const blob = await response.blob()
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `${selectedStudent.student.name.replace(/\s+/g, '_')}_interview_report.html`
                                        document.body.appendChild(a)
                                        a.click()
                                        document.body.removeChild(a)
                                        URL.revokeObjectURL(url)
                                      } catch (err) {
                                        console.error('Failed to download PDF:', err)
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleInterview(interview.id)
                                }}
                                className="flex items-center justify-center h-8 w-8 hover:bg-muted rounded-md transition-colors"
                              >
                                {expandedInterviews.has(interview.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                                  
                                  <CollapsibleContent>
                                    <div className="border-t px-4 pb-4">
                                      {interview.status === 'completed' && interview.finalReport ? (
                                        <div className="pt-4 space-y-6">
                                          {/* Decision Header */}
                                          <div className="text-center p-6 rounded-xl" style={{
                                            backgroundColor: interview.finalReport.decision === 'accepted' ? '#f0fdf4' :
                                                            interview.finalReport.decision === 'rejected' ? '#fef2f2' : '#fefce8'
                                          }}>
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${
                                              interview.finalReport.decision === 'accepted' ? 'text-green-800 bg-green-100' :
                                              interview.finalReport.decision === 'rejected' ? 'text-red-800 bg-red-100' : 
                                              'text-yellow-800 bg-yellow-100'
                                            }`}>
                                              {interview.finalReport.decision === 'accepted' ? '✅ Likely Approved' :
                                               interview.finalReport.decision === 'rejected' ? '❌ Likely Rejected' : 
                                               '⚠️ Borderline Case'}
                                            </div>
                                            <div className="text-3xl font-bold mt-2">{interview.finalReport.overall}%</div>
                                            <p className="text-sm text-muted-foreground mt-1">AI Performance Evaluation</p>
                                          </div>

                                          {/* AI Summary */}
                                          <div className="space-y-3">
                                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                              <FileText className="h-5 w-5 text-blue-600" />
                                              Performance Summary
                                            </h4>
                                            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                              <p className="text-sm leading-relaxed">{interview.finalReport.summary}</p>
                                            </div>
                                          </div>

                                          {/* Dimension Scores */}
                                          {interview.finalReport.dimensions && Object.keys(interview.finalReport.dimensions).length > 0 && (
                                            <div className="space-y-3">
                                              <h4 className="font-semibold text-lg flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5 text-purple-600" />
                                                Performance Breakdown
                                              </h4>
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(interview.finalReport.dimensions).map(([category, score]: [string, any]) => (
                                                  <div key={category} className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <span className="text-sm font-medium capitalize">
                                                        {category.replace(/([A-Z])/g, ' $1').trim()}
                                                      </span>
                                                      <span className={`font-bold text-lg ${
                                                        score >= 80 ? 'text-green-600' :
                                                        score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                      }`}>
                                                        {score}%
                                                      </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                      <div 
                                                        className={`h-2 rounded-full ${
                                                          score >= 80 ? 'bg-green-500' :
                                                          score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${score}%` }}
                                                      />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Strengths and Weaknesses */}
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Strengths */}
                                            {interview.finalReport.strengths && interview.finalReport.strengths.length > 0 && (
                                              <div className="space-y-3">
                                                <h4 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                                                  <Trophy className="h-5 w-5" />
                                                  Key Strengths
                                                </h4>
                                                <div className="space-y-2">
                                                  {interview.finalReport.strengths.map((strength: string, index: number) => (
                                                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                                                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                                                      <p className="text-sm text-green-900">{strength}</p>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Areas for Improvement */}
                                            {interview.finalReport.weaknesses && interview.finalReport.weaknesses.length > 0 && (
                                              <div className="space-y-3">
                                                <h4 className="font-semibold text-lg flex items-center gap-2 text-orange-700">
                                                  <Target className="h-5 w-5" />
                                                  Areas for Improvement
                                                </h4>
                                                <div className="space-y-2">
                                                  {interview.finalReport.weaknesses.map((weakness: string, index: number) => (
                                                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                                                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                                                      <p className="text-sm text-orange-900">{weakness}</p>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Detailed Insights */}
                                          {interview.finalReport.detailedInsights && interview.finalReport.detailedInsights.length > 0 && (
                                            <div className="space-y-3">
                                              <h4 className="font-semibold text-lg flex items-center gap-2 text-blue-700">
                                                <TrendingUp className="h-5 w-5" />
                                                Detailed Analysis & Recommendations
                                              </h4>
                                              <div className="space-y-4">
                                                {interview.finalReport.detailedInsights.map((insight: any, index: number) => (
                                                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                                    insight.type === 'strength' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                                                  }`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                        insight.type === 'strength' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                      }`}>
                                                        {insight.category}
                                                      </span>
                                                      <span className={`text-xs px-2 py-1 rounded ${
                                                        insight.type === 'strength' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
                                                      }`}>
                                                        {insight.type === 'strength' ? 'Strength' : 'Needs Work'}
                                                      </span>
                                                    </div>
                                                    <p className="text-sm font-medium mb-2">{insight.finding}</p>
                                                    {insight.example && (
                                                      <p className="text-xs text-muted-foreground mb-2 italic">
                                                        Example: {insight.example}
                                                      </p>
                                                    )}
                                                    <div className="text-xs font-medium text-blue-800 bg-blue-100 p-2 rounded">
                                                      💡 Action: {insight.actionItem}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="pt-4">
                                          <p className="text-sm text-muted-foreground">
                                            {interview.status === 'in_progress' ? 'Interview in progress...' : 
                                             interview.status === 'expired' ? 'Interview session expired' :
                                             'Interview data not available'}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Grid View - Student Folders */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {filteredResults.map((result) => (
                <div
                  key={result.student.id}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 group"
                  onDoubleClick={() => openStudentFolder(result)}
                  onClick={() => openStudentFolder(result)}
                >
                  {/* Folder Icon */}
                  <div className="relative mb-2">
                    <Folder className="h-20 w-20 text-yellow-500 group-hover:text-yellow-600 transition-colors" fill="currentColor" />
                    {result.stats.completedInterviews > 0 && (
                      <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                        {result.stats.completedInterviews}
                      </div>
                    )}
                  </div>
                  
                  {/* Student Name */}
                  <div className="text-center w-full">
                    <p className="text-sm font-medium truncate px-1" title={result.student.name}>
                      {result.student.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.stats.totalInterviews} {result.stats.totalInterviews === 1 ? 'interview' : 'interviews'}
                    </p>
                    {result.stats.averageScore !== null && (
                      <p className={`text-xs font-semibold mt-1 ${getScoreColor(result.stats.averageScore)}`}>
                        Avg: {(result.stats.averageScore / 10).toFixed(1)}/10
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Details Modal */}
      {selectedInterview && (
        <InterviewDetailsModal
          open={!!selectedInterview}
          onOpenChange={(open) => !open && setSelectedInterview(null)}
          interview={selectedInterview.interview}
          student={selectedInterview.student}
        />
      )}
    </div>
  )
}
