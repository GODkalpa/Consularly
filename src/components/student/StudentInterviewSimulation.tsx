'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Play, AlertCircle, User, Target, Clock, BookOpen, CreditCard } from 'lucide-react'
import { useStudentAuth } from '@/contexts/StudentAuthContext'
import { auth, firebaseEnabled } from '@/lib/firebase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { defaultVisaTypeForRoute, type InterviewRoute } from '@/lib/interview-routes'

export function StudentInterviewSimulation() {
  const { student } = useStudentAuth()
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [creditMessage, setCreditMessage] = useState('')

  // Calculate route from student's assigned country
  const route = useMemo<InterviewRoute>(() => {
    if (!student?.interviewCountry) return 'usa_f1'
    
    const countryMap: Record<string, InterviewRoute> = {
      'usa': 'usa_f1',
      'uk': 'uk_student',
      'france': 'france_ema',
      'france_ema': 'france_ema',
      'france_icn': 'france_icn'
    }
    
    return countryMap[student.interviewCountry.toLowerCase()] || 'usa_f1'
  }, [student?.interviewCountry])

  const startNewSession = async () => {
    if (!student || student.creditsRemaining <= 0) {
      setCreditMessage('You have no interview credits remaining. Please contact your organization for more credits.')
      setShowCreditDialog(true)
      return
    }

    // Open interview tab IMMEDIATELY (before API call) to avoid popup blocker
    const interviewWindow = window.open('about:blank', '_blank')
    if (!interviewWindow) {
      console.error('Failed to open new window. Please allow popups for this site.')
      return
    }
    
    try {
      // Write a loading state to the new tab
      interviewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Starting Interview...</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                text-align: center;
              }
              .icon { font-size: 64px; margin-bottom: 20px; }
              h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; }
              p { font-size: 18px; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div>
              <div class="icon">🎯</div>
              <h1>Starting Your Interview</h1>
              <p>Preparing your personalized session</p>
            </div>
          </body>
        </html>
      `)
      interviewWindow.document.close()
    } catch (e) {
      console.warn('[Interview] Could not write to window:', e)
    }

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        if (interviewWindow) {
          try { interviewWindow.close() } catch {}
        }
        throw new Error('Not authenticated')
      }
      
      // Create interview
      const createRes = await fetch('/api/student/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ route })
      })
      
      if (!createRes.ok) {
        const error = await createRes.json()
        if (interviewWindow) {
          try { interviewWindow.close() } catch {}
        }
        setCreditMessage(error.message || 'Failed to start interview')
        setShowCreditDialog(true)
        return
      }
      
      const created = await createRes.json()
      console.log('[Student Interview] Created interview:', created.interview.id)

      // Start session
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'start',
          userId: student.id,
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: { 
            name: student.name, 
            country: 'Nepal',
            // Include all student profile data for better question targeting
            degreeLevel: student.studentProfile?.degreeLevel,
            programName: student.studentProfile?.programName,
            universityName: student.studentProfile?.universityName,
            programLength: student.studentProfile?.programLength,
            programCost: student.studentProfile?.programCost,
            fieldOfStudy: student.studentProfile?.fieldOfStudy,
            intendedMajor: student.studentProfile?.intendedMajor,
          },
          firestoreInterviewId: created.interview.id,
          mode: 'standard',
          difficulty: 'medium',
        })
      })
      
      if (!res.ok) {
        if (interviewWindow) {
          try { interviewWindow.close() } catch {}
        }
        throw new Error(`Failed to start session: ${res.status}`)
      }
      
      const data = await res.json()
      const apiSess = data.session
      const firstQ = data.question

      const seeded = {
        ...apiSess,
        conversationHistory: [
          ...apiSess.conversationHistory,
          {
            question: firstQ.question,
            answer: '',
            timestamp: new Date().toISOString(),
            questionType: firstQ.questionType,
            difficulty: firstQ.difficulty,
          },
        ],
      }

      // Store for interview page
      const key = `interview:init:${apiSess.id}`
      const payload = JSON.stringify({
        apiSession: seeded,
        firstQuestion: firstQ,
        route,
        studentName: student.name,
        firestoreInterviewId: created.interview.id,
        scope: 'user',
      })
      
      localStorage.setItem(key, payload)
      
      // Navigate to interview
      const url = `${window.location.origin}/interview/${apiSess.id}`
      interviewWindow.location.href = url
    } catch (e) {
      console.error(e)
      if (interviewWindow) {
        try { interviewWindow.close() } catch {}
      }
      setCreditMessage('Failed to start interview. Please try again.')
      setShowCreditDialog(true)
    }
  }

  if (!firebaseEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Firebase is not configured.</p>
        </CardContent>
      </Card>
    )
  }

  if (!student) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Please sign in to access interviews.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Interview Setup</h1>
        <p className="text-muted-foreground mt-1">Configure your interview session parameters and launch when ready</p>
      </div>

      {/* Candidate Information */}
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Candidate Information</h3>
              <p className="text-sm text-muted-foreground">Your assigned interview details</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Student Name <span className="text-red-500">*</span>
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium">{student.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">Pre-selected student account</p>
            </div>

            {/* Country Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Destination Country
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium">
                  {route === 'usa_f1' && '🇺🇸 USA F1 Student Visa'}
                  {route === 'uk_student' && '🇬🇧 UK Student Visa'}
                  {route === 'france_ema' && '🇫🇷 France EMA'}
                  {route === 'france_icn' && '🇫🇷 France ICN'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Country pre-assigned to this student
              </p>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Start Button */}
      <Button 
        onClick={startNewSession} 
        disabled={!student || student.creditsRemaining <= 0} 
        className='w-full bg-primary hover:bg-primary/90 h-12 text-base font-medium text-white' 
      >
        <Play className='h-5 w-5 mr-2' /> 
        Launch Interview Session
      </Button>
      
      {student.creditsRemaining <= 0 && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">No credits remaining</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">Contact your organization for more credits to start an interview</p>
          </div>
        </div>
      )}

      <AlertDialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Unable to Start Interview
            </AlertDialogTitle>
            <AlertDialogDescription>
              {creditMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
