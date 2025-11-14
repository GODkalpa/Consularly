"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, Calendar, User, FileText, Download } from "lucide-react"

interface InterviewDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview: {
    id: string
    status: string
    score: number | null
    route: string | null
    startTime: string | null
    endTime: string | null
    finalReport?: any
  }
  student: {
    name: string
    email: string
  }
}

export function InterviewDetailsModal({ 
  open, 
  onOpenChange, 
  interview, 
  student 
}: InterviewDetailsModalProps) {
  const getRouteDisplay = (route: string | null) => {
    switch (route) {
      case 'usa_f1': return 'USA F1 Visa'
      case 'uk_student': return 'UK Student Visa'
      case 'france_ema': return 'France EMA'
      case 'france_icn': return 'France ICN'
      default: return route || 'Interview'
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = () => {
    if (!interview.startTime || !interview.endTime) return 'N/A'
    const start = new Date(interview.startTime).getTime()
    const end = new Date(interview.endTime).getTime()
    const duration = end - start
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleDownloadReport = () => {
    // Create a comprehensive report
    const reportData = {
      student: {
        name: student.name,
        email: student.email
      },
      interview: {
        id: interview.id,
        type: getRouteDisplay(interview.route),
        status: interview.status,
        score: interview.score,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: calculateDuration()
      },
      report: interview.finalReport
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${student.name.replace(/\s+/g, '_')}_interview_${interview.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            Interview Details - {student.name}
          </DialogTitle>
          <DialogDescription>
            Detailed view of the interview performance and results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interview Type</p>
                    <p className="font-semibold">{getRouteDisplay(interview.route)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className={`font-semibold text-lg ${getScoreColor(interview.score)}`}>
                      {interview.score ? `${(interview.score / 10).toFixed(1)}/10` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{calculateDuration()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status and Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(interview.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Student</label>
                  <div className="mt-1">
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                  <p className="mt-1">{formatDate(interview.startTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Time</label>
                  <p className="mt-1">{formatDate(interview.endTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive Performance Report */}
          {interview.status === 'completed' && interview.finalReport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comprehensive Performance Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <p className="text-sm text-muted-foreground mt-1">Overall Performance Score</p>
                </div>

                {/* AI Summary */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    AI Performance Summary
                  </h4>
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm leading-relaxed">{interview.finalReport.summary}</p>
                  </div>
                </div>

                {/* Dimension Scores */}
                {interview.finalReport.dimensions && Object.keys(interview.finalReport.dimensions).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-600" />
                      Performance Dimensions
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

                {/* Strengths and Weaknesses Side by Side */}
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
                            <div className="h-2 w-2 bg-green-500 rounded-full mt-2 shrink-0" />
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
                        <User className="h-5 w-5" />
                        Areas for Improvement
                      </h4>
                      <div className="space-y-2">
                        {interview.finalReport.weaknesses.map((weakness: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                            <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 shrink-0" />
                            <p className="text-sm text-orange-900">{weakness}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed Insights with Action Items */}
                {interview.finalReport.detailedInsights && interview.finalReport.detailedInsights.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2 text-blue-700">
                      <Calendar className="h-5 w-5" />
                      Detailed Analysis & Recommendations
                    </h4>
                    <div className="space-y-4">
                      {interview.finalReport.detailedInsights.map((insight: any, index: number) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          insight.type === 'strength' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              insight.type === 'strength' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {insight.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              insight.type === 'strength' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
                            }`}>
                              {insight.type === 'strength' ? 'Strength' : 'Improvement Needed'}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-2">{insight.finding}</p>
                          {insight.example && (
                            <p className="text-xs text-muted-foreground mb-3 italic bg-white p-2 rounded">
                              💬 Example: {insight.example}
                            </p>
                          )}
                          <div className="text-sm font-medium text-blue-800 bg-blue-100 p-3 rounded-lg">
                            <span className="font-semibold">💡 Recommended Action:</span> {insight.actionItem}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
