"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, X } from 'lucide-react'
import { ExpandableInterviewCard } from '../user/ExpandableInterviewCard'
import { auth } from '@/lib/firebase'
import type { InterviewWithId } from '@/types/firestore'

interface StudentInterviewDetailsProps {
  studentId: string
  studentName: string
  isOpen: boolean
  onClose: () => void
}

export function StudentInterviewDetails({ studentId, studentName, isOpen, onClose }: StudentInterviewDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<InterviewWithId[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !studentId) return

    const fetchInterviews = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) {
          setError('Authentication required')
          setLoading(false)
          return
        }

        // Fetch interviews from Firestore for this student
        const response = await fetch(`/api/org/students/${studentId}/interviews`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch interviews')
        }

        const data = await response.json()
        setInterviews(data.interviews || [])
      } catch (err) {
        console.error('Error fetching student interviews:', err)
        setError('Failed to load student interviews')
      } finally {
        setLoading(false)
      }
    }

    fetchInterviews()
  }, [isOpen, studentId])

  const exportStudentReport = () => {
    // Create a comprehensive report as JSON
    const report = {
      student: studentName,
      studentId,
      generatedAt: new Date().toISOString(),
      totalInterviews: interviews.length,
      interviews: interviews.map(iv => ({
        date: iv.startTime,
        route: iv.route,
        score: iv.score,
        decision: iv.finalReport?.decision,
        summary: iv.finalReport?.summary,
        strengths: iv.finalReport?.strengths,
        weaknesses: iv.finalReport?.weaknesses,
        detailedInsights: iv.finalReport?.detailedInsights,
      }))
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${studentName.replace(/\s+/g, '_')}_interview_report_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const avgScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, iv) => sum + (iv.score || 0), 0) / interviews.length)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{studentName}&apos;s Interview History</DialogTitle>
              <DialogDescription>
                Complete performance history and detailed AI analysis
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {interviews.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportStudentReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No interviews found for this student.</p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{interviews.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgScore}/100</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {typeof interviews[0]?.score === 'number' ? `${interviews[0].score}/100` : '—'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Cards */}
            <div className="space-y-4">
              <h3 className="font-semibold">Interview History</h3>
              {interviews
                .sort((a, b) => {
                  const aTime = a.startTime?.toDate ? a.startTime.toDate().getTime() : 0
                  const bTime = b.startTime?.toDate ? b.startTime.toDate().getTime() : 0
                  return bTime - aTime
                })
                .map((interview) => (
                  <ExpandableInterviewCard key={interview.id} interview={interview as any} />
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

