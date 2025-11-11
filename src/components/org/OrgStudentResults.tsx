"use client"

import { useEffect, useState, useMemo } from 'react'
import { auth, firebaseEnabled } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ExpandableInterviewCard } from '@/components/user/ExpandableInterviewCard'
import { ResultsTrendChart, type ResultsPoint } from '@/components/user/ResultsTrendChart'
import { Trophy, TrendingUp, Target, Search, Users, Eye, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

          {/* Results Table */}
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search or filters' : 'No students have completed interviews yet'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-xs uppercase text-gray-600">Student</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-gray-600">Visa Type</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-gray-600">Score</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.flatMap((result) => {
                    // For table view, we'll show one row per interview
                    return result.interviews.slice(0, 5).map((interview) => {
                      const scoreColor = interview.score && interview.score >= 90 ? 'text-green-600' :
                        interview.score && interview.score >= 80 ? 'text-green-500' :
                        interview.score && interview.score >= 70 ? 'text-yellow-600' :
                        interview.score && interview.score >= 60 ? 'text-orange-600' : 'text-red-600'
                      
                      const score10 = interview.score ? (interview.score / 10).toFixed(1) : '—'
                      
                      return (
                        <TableRow key={interview.id}>
                          <TableCell>
                            <div className="font-medium">{result.student.name}</div>
                            <div className="text-sm text-muted-foreground">{result.student.email}</div>
                          </TableCell>
                          <TableCell className="text-sm">{interview.route || 'F-1 Visa interview'}</TableCell>
                          <TableCell>
                            <span className={`font-semibold ${scoreColor}`}>{score10} /10</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {interview.startTime ? new Date(interview.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
