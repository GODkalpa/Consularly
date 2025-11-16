"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  ArrowLeft, 
  FileText, 
  BarChart3, 
  Trophy, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

interface InterviewReport {
  id: string
  studentName: string
  studentEmail: string
  route: string
  startTime: string
  endTime: string
  status: string
  score: number
  finalReport: {
    decision: 'accepted' | 'rejected' | 'borderline'
    overall: number
    dimensions: Record<string, number>
    summary: string
    detailedInsights: Array<{
      category: string
      type: 'strength' | 'weakness'
      finding: string
      example?: string
      actionItem: string
    }>
    strengths: string[]
    weaknesses: string[]
  }
  orgName?: string
  orgLogo?: string
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const interviewId = params.id as string
  
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [interviewId])

  const fetchReport = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        router.push('/signin')
        return
      }

      const token = await user.getIdToken()
      const response = await fetch(`/api/report/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }

      const data = await response.json()
      setReport(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch(`/api/report/${interviewId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-report-${interviewId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Report Not Found</h2>
            <p className="text-sm text-muted-foreground">{error || 'The interview report could not be loaded.'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRouteDisplay = (route: string) => {
    switch (route) {
      case 'usa_f1': return 'USA F1 Visa'
      case 'uk_student': return 'UK Student Visa'
      case 'france_ema': return 'France EMA'
      case 'france_icn': return 'France ICN'
      default: return route
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 p-6" id="report-content">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={downloadPDF} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>

        {/* Report Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                {report.orgLogo && (
                  <div className="relative h-12 w-32 mb-4">
                    <Image src={report.orgLogo} alt={report.orgName || 'Organization'} fill className="object-contain object-left" />
                  </div>
                )}
                <h1 className="text-3xl font-bold">Interview Performance Report</h1>
                <p className="text-muted-foreground">
                  {report.studentName} • {getRouteDisplay(report.route)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed on {new Date(report.endTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`text-lg px-4 py-2 ${
                  report.finalReport.decision === 'accepted' ? 'bg-green-500 hover:bg-green-600' :
                  report.finalReport.decision === 'rejected' ? 'bg-red-500 hover:bg-red-600' :
                  'bg-yellow-500 hover:bg-yellow-600'
                } text-white`}>
                  {report.finalReport.decision.charAt(0).toUpperCase() + report.finalReport.decision.slice(1)}
                </Badge>
                <div className="text-4xl font-bold mt-2">{report.finalReport.overall}%</div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.finalReport.summary}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Scores */}
        {report.finalReport.dimensions && Object.keys(report.finalReport.dimensions).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.finalReport.dimensions).map(([category, score]: [string, any]) => (
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
            </CardContent>
          </Card>
        )}

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          {report.finalReport.strengths && report.finalReport.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Trophy className="h-5 w-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.finalReport.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-900">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {report.finalReport.weaknesses && report.finalReport.weaknesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Target className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.finalReport.weaknesses.map((weakness: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-orange-900">{weakness}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Insights */}
        {report.finalReport.detailedInsights && report.finalReport.detailedInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="h-5 w-5" />
                Detailed Analysis & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.finalReport.detailedInsights.map((insight: any, index: number) => (
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
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p>This report was generated by AI analysis and should be used as a guide for interview preparation.</p>
            <p className="mt-2">Report ID: {report.id}</p>
            {report.orgName && <p className="mt-1">© {new Date().getFullYear()} {report.orgName}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
