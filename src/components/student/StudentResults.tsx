"use client"

import { useEffect, useState, useMemo } from 'react'
import { auth, firebaseEnabled } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, TrendingUp, Calendar, Clock, FileText, Play, BarChart3, Target, CheckCircle, AlertTriangle, XCircle, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface StudentInterview {
  id: string
  status: string
  score: number | null
  route: string | null
  startTime: string | null
  endTime: string | null
  duration: number | null
  finalReport: any
  feedback: string | null
  questions: any[]
  answers: any[]
}

interface StudentStats {
  total: number
  completed: number
  averageScore: number | null
  highestScore: number | null
  latestScore: number | null
  improvement: number
}

export function StudentResults() {
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<StudentInterview[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [timeRange, setTimeRange] = useState<'all' | '90d' | '30d' | '7d'>('all')
  const [routeFilter, setRouteFilter] = useState<string>('all')
  const [expandedInterviews, setExpandedInterviews] = useState<Set<string>>(new Set())

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

        const res = await fetch(`/api/student/results?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error('API Error:', res.status, errorText)
          throw new Error(`Failed to fetch results: ${res.status} - ${errorText}`)
        }
        const data = await res.json()
        setInterviews(data.interviews || [])
        setStats(data.statistics || null)
      } catch (err) {
        console.error('Failed to load results:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [timeRange, routeFilter])

  // Get available routes for filter
  const routeOptions = useMemo(() => {
    const routes = new Set<string>()
    interviews.forEach((iv) => {
      if (iv.route) routes.add(iv.route)
    })
    return Array.from(routes)
  }, [interviews])

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
      case 'in_progress': return <Clock className="h-4 w-4 text-orange-500" />
      case 'expired': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <XCircle className="h-4 w-4 text-red-500" />
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

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A'
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

  const toggleInterview = (interviewId: string) => {
    setExpandedInterviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(interviewId)) {
        newSet.delete(interviewId)
      } else {
        newSet.add(interviewId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Interview Results</CardTitle>
            <CardDescription>Loading your interview history...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <span className="animate-pulse">Loading results...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const defaultStats = {
    total: 0,
    completed: 0,
    averageScore: null,
    highestScore: null,
    latestScore: null,
    improvement: 0
  }
  const currentStats = stats || defaultStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Interview Results</h1>
        <p className="text-muted-foreground mt-1">Track your progress and performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Interviews</p>
                <div className="text-3xl font-bold">{currentStats.total}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <div className="text-3xl font-bold">{currentStats.completed}</div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                <div className="text-3xl font-bold">
                  {currentStats.averageScore ? `${(currentStats.averageScore / 10).toFixed(1)}/10` : '—'}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Best Score</p>
                <div className="text-3xl font-bold">
                  {currentStats.highestScore ? `${(currentStats.highestScore / 10).toFixed(1)}/10` : '—'}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-full sm:w-[160px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Visa type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visa types</SelectItem>
                {routeOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {getRouteDisplay(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Table */}
          {interviews.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No interviews found</p>
              <p className="text-sm">Start your first interview to see results here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <Collapsible
                  key={interview.id}
                  open={expandedInterviews.has(interview.id)}
                  onOpenChange={(open) => {
                    setExpandedInterviews(prev => {
                      const newSet = new Set(prev)
                      if (open) {
                        newSet.add(interview.id)
                      } else {
                        newSet.delete(interview.id)
                      }
                      return newSet
                    })
                  }}
                >
                  <Card className="border">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedInterviews.has(interview.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex items-center gap-3">
                              {getStatusIcon(interview.status)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{getRouteDisplay(interview.route)}</span>
                                  {getStatusBadge(interview.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(interview.startTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(interview.score)}`}>
                                {interview.score ? `${Math.round(interview.score)}%` : '—'}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Duration: {formatDuration(interview.duration)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20">
                        <div className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Details</TableHead>
                                <TableHead>Performance</TableHead>
                                <TableHead>Questions</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="font-medium">Interview #{interview.id.slice(-8)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Started: {formatDate(interview.startTime)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Ended: {formatDate(interview.endTime)}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className={`text-lg font-bold ${getScoreColor(interview.score)}`}>
                                      {interview.score ? `${Math.round(interview.score)}%` : 'Not scored'}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Duration: {formatDuration(interview.duration)}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {interview.questions?.length || 0} answered
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {interview.answers?.length || 0} responses recorded
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {interview.status === 'completed' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => window.open(`/report/${interview.id}`, '_blank')}
                                      >
                                        <FileText className="h-4 w-4 mr-1" />
                                        View Report
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          
                          {interview.feedback && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <h4 className="text-sm font-medium mb-2 text-blue-900">AI Feedback</h4>
                              <p className="text-sm text-blue-700">{interview.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
