"use client"

import { useEffect, useState, useMemo } from 'react'
import { auth, firebaseEnabled } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ExpandableInterviewCard } from '@/components/user/ExpandableInterviewCard'
import { ResultsTrendChart, type ResultsPoint } from '@/components/user/ResultsTrendChart'
import { Trophy, TrendingUp, Target, Search, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())

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

  const toggleStudent = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
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
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {overallStats.totalStudents}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">With interview history</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {overallStats.totalInterviews}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">Across all students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {overallStats.avgScore ?? '—'}/100
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Organization-wide</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="font-medium text-sm">Filter results</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-[240px]">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-9 pl-8"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All routes</SelectItem>
                  {routeOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Results */}
      {filteredResults.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search or filters' : 'No students have completed interviews yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => {
            const isExpanded = expandedStudents.has(result.student.id)
            const scoreSeries: ResultsPoint[] = result.interviews
              .filter((iv) => typeof iv.score === 'number' && iv.startTime)
              .map((iv) => ({
                date: iv.startTime!,
                score: iv.score!,
              }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            return (
              <Card key={result.student.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleStudent(result.student.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{result.student.name}</CardTitle>
                        {result.student.email && (
                          <span className="text-sm text-muted-foreground">{result.student.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Interviews:</span>
                          <Badge variant="secondary">{result.stats.totalInterviews}</Badge>
                        </div>
                        {result.stats.averageScore !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Avg Score:</span>
                            <Badge
                              className={
                                result.stats.averageScore >= 90
                                  ? 'bg-green-600'
                                  : result.stats.averageScore >= 80
                                  ? 'bg-green-500'
                                  : result.stats.averageScore >= 70
                                  ? 'bg-yellow-500'
                                  : result.stats.averageScore >= 60
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                              }
                            >
                              {result.stats.averageScore}/100
                            </Badge>
                          </div>
                        )}
                        {result.stats.latestScore !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Latest:</span>
                            <Badge
                              variant="outline"
                              className={
                                result.stats.latestScore >= 90
                                  ? 'border-green-600 text-green-600'
                                  : result.stats.latestScore >= 80
                                  ? 'border-green-500 text-green-500'
                                  : result.stats.latestScore >= 70
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-red-500 text-red-500'
                              }
                            >
                              {result.stats.latestScore}/100
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t pt-6">
                    {/* Student Profile Info */}
                    {result.student.studentProfile && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3">Student Profile</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {result.student.studentProfile.degreeLevel && (
                            <div>
                              <span className="text-muted-foreground">Degree Level:</span>{' '}
                              <span className="font-medium capitalize">
                                {result.student.studentProfile.degreeLevel}
                              </span>
                            </div>
                          )}
                          {result.student.studentProfile.programName && (
                            <div>
                              <span className="text-muted-foreground">Program:</span>{' '}
                              <span className="font-medium">{result.student.studentProfile.programName}</span>
                            </div>
                          )}
                          {result.student.studentProfile.universityName && (
                            <div>
                              <span className="text-muted-foreground">University:</span>{' '}
                              <span className="font-medium">{result.student.studentProfile.universityName}</span>
                            </div>
                          )}
                          {result.student.studentProfile.fieldOfStudy && (
                            <div>
                              <span className="text-muted-foreground">Field:</span>{' '}
                              <span className="font-medium">{result.student.studentProfile.fieldOfStudy}</span>
                            </div>
                          )}
                          {result.student.studentProfile.programLength && (
                            <div>
                              <span className="text-muted-foreground">Duration:</span>{' '}
                              <span className="font-medium">{result.student.studentProfile.programLength}</span>
                            </div>
                          )}
                          {result.student.studentProfile.programCost && (
                            <div>
                              <span className="text-muted-foreground">Cost:</span>{' '}
                              <span className="font-medium">{result.student.studentProfile.programCost}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Score Trend Chart */}
                    {scoreSeries.length > 0 && (
                      <ResultsTrendChart
                        data={scoreSeries}
                        title={`${result.student.name}'s Score Trend`}
                        description="Performance over time"
                        height={220}
                      />
                    )}

                    {/* Interview History */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Interview History</h4>
                      {result.interviews.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No interviews in selected period.</p>
                      ) : (
                        <div className="space-y-4">
                          {result.interviews.map((interview) => {
                            // Convert to format expected by ExpandableInterviewCard
                            const interviewWithId = {
                              id: interview.id,
                              status: interview.status,
                              score: interview.score || 0,
                              route: interview.route,
                              startTime: interview.startTime
                                ? { toDate: () => new Date(interview.startTime!) }
                                : null,
                              endTime: interview.endTime ? { toDate: () => new Date(interview.endTime!) } : null,
                              finalReport: interview.finalReport,
                            } as any

                            return <ExpandableInterviewCard key={interview.id} interview={interviewWithId} />
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
