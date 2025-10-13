'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Play, User, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { defaultVisaTypeForRoute, type InterviewRoute, routeDisplayName } from '@/lib/interview-routes'
import { auth } from '@/lib/firebase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function UserInterviewSimulation() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [route, setRoute] = useState<InterviewRoute>('usa_f1')
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)
  const [quotaMessage, setQuotaMessage] = useState('')

  // Auto-derived candidate name from profile; no manual input needed
  const candidateName = useMemo(() => {
    const n = (userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || '').trim()
    return n
  }, [userProfile?.displayName, user?.displayName, user?.email])

  const startNewSession = async () => {
    if (!candidateName) return

    // Open interview tab IMMEDIATELY (before API call) to avoid popup blocker
    const interviewWindow = window.open('about:blank', '_blank')
    if (!interviewWindow) {
      console.error('Failed to open new window. Please allow popups for this site.')
      return
    }
    
    try {
      // Write a professional loading state to the new tab
      interviewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Starting Interview...</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
              }
              .container {
                text-align: center;
                animation: fadeIn 0.5s ease-out;
              }
              .icon-wrapper {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto 32px;
              }
              .icon {
                font-size: 64px;
                animation: bounce 2s ease-in-out infinite;
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
              }
              .pulse-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
                height: 100%;
                border: 3px solid rgba(255,255,255,0.4);
                border-radius: 50%;
                animation: pulse 2s ease-out infinite;
              }
              .pulse-ring:nth-child(2) { animation-delay: 0.5s; }
              .pulse-ring:nth-child(3) { animation-delay: 1s; }
              h1 {
                font-size: 32px;
                font-weight: 700;
                color: white;
                margin-bottom: 12px;
                letter-spacing: -0.5px;
              }
              .subtitle {
                font-size: 18px;
                color: rgba(255,255,255,0.9);
                margin-bottom: 40px;
                font-weight: 500;
              }
              .progress-bar {
                width: 280px;
                height: 6px;
                background: rgba(255,255,255,0.2);
                border-radius: 10px;
                overflow: hidden;
                margin: 0 auto;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
              }
              .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%);
                border-radius: 10px;
                animation: progress 2s ease-in-out infinite;
                box-shadow: 0 0 10px rgba(255,255,255,0.5);
              }
              .dots {
                margin-top: 24px;
                color: rgba(255,255,255,0.8);
                font-size: 14px;
              }
              .dots::after {
                content: '';
                animation: dots 1.5s steps(4, end) infinite;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes pulse {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
              }
              @keyframes progress {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
              }
              @keyframes dots {
                0%, 20% { content: ''; }
                40% { content: '.'; }
                60% { content: '..'; }
                80%, 100% { content: '...'; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon-wrapper">
                <div class="pulse-ring"></div>
                <div class="pulse-ring"></div>
                <div class="pulse-ring"></div>
                <div class="icon">🎯</div>
              </div>
              <h1>Starting Your Interview</h1>
              <p class="subtitle">Preparing your personalized session</p>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <div class="dots">Loading</div>
            </div>
          </body>
        </html>
      `)
      interviewWindow.document.close()
    } catch (e) {
      console.warn('[Interview] Could not write to window:', e)
    }

    try {
      // Get auth token for quota validation (force refresh) and add diagnostics
      console.log('[User Interview] Preparing to call /api/interview/session')
      const token = await auth.currentUser?.getIdToken(true)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('[User Interview] Auth token present, headers set')
      } else {
        console.warn('[User Interview] No auth token available. Proceeding without Authorization header')
      }

      // Build enriched student profile for personalized question selection
      const sp = (userProfile as any)?.studentProfile || {}
      const studentProfilePayload = {
        name: candidateName,
        country: 'Nepal',
        degreeLevel: sp.degreeLevel || undefined,
        programName: sp.programName || undefined,
        universityName: sp.universityName || sp.intendedUniversity || undefined,
        programLength: sp.programLength || undefined,
        programCost: sp.programCost || undefined,
        fieldOfStudy: sp.fieldOfStudy || sp.intendedMajor || undefined,
        previousEducation: sp.previousEducation || undefined,
      }

      console.log('[User Interview] Calling /api/interview/session with route:', route)
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'start',
          userId: user?.uid || 'guest',
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: studentProfilePayload
        })
      })

      console.log('[User Interview] /api/interview/session status:', res.status)
      if (!res.ok) {
        let error: any = {}
        try { error = await res.json() } catch {}
        console.error('[User Interview] Failed to start session:', res.status, error)
        // Close the loading window on error
        if (interviewWindow) {
          try { interviewWindow.close() } catch {}
        }
        if (error.error === 'Quota exceeded') {
          setQuotaMessage(error.message || 'Contact support for more interviews.')
          setShowQuotaDialog(true)
          return
        }
        throw new Error(error.error || `Failed to start session: ${res.status}`)
      }

      const data = await res.json()
      console.log('[User Interview] Session API responded successfully')
      const apiSess = data.session
      const firstQ = data.question
      const firestoreInterviewId: string | undefined = data.interviewId
      console.log('[User Interview] Created interview:', firestoreInterviewId)

      // Seed the API session with the first question
      const seededApiSession = {
        ...apiSess,
        conversationHistory: [
          ...apiSess.conversationHistory,
          {
            question: firstQ.question,
            answer: '',
            timestamp: new Date().toISOString(),
            questionType: firstQ.questionType,
            difficulty: firstQ.difficulty,
          }
        ]
      }

      // Store in localStorage (works cross-tab)
      const key = `interview:init:${apiSess.id}`
      const payload = JSON.stringify({
        apiSession: seededApiSession,
        firstQuestion: firstQ,
        route,
        studentName: candidateName,
        firestoreInterviewId: firestoreInterviewId || null,
        scope: 'user',
      })
      
      localStorage.setItem(key, payload)
      console.log('[Interview] Session data stored in localStorage:', key)

      // Build URL with session ID
      const url = `${window.location.origin}/interview/${apiSess.id}`
      console.log('[Interview] Navigating to:', url)
      
      // Navigate the pre-opened window to the interview page
      console.log('[Interview] Window object:', interviewWindow)
      console.log('[Interview] Window closed?', interviewWindow?.closed)
      
      try {
        interviewWindow.location.href = url
        console.log('[Interview] Navigation initiated successfully')
      } catch (navError) {
        console.error('[Interview] Navigation error:', navError)
        throw navError
      }
    } catch (e) {
      console.error('Failed to start interview:', e)
      // Close the loading window on error
      if (interviewWindow) {
        try { interviewWindow.close() } catch {}
      }
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Start New Interview Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Candidate</Label>
              <div className="h-10 px-3 flex items-center rounded-md bg-muted/40 border text-sm">
                {candidateName || '—'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <Select value={route} onValueChange={(v) => setRoute(v as InterviewRoute)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select interview country/route' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='usa_f1'>{routeDisplayName.usa_f1}</SelectItem>
                  <SelectItem value='uk_student'>{routeDisplayName.uk_student}</SelectItem>
                  <SelectItem value='france_ema'>{routeDisplayName.france_ema}</SelectItem>
                  <SelectItem value='france_icn'>{routeDisplayName.france_icn}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={startNewSession}
              disabled={!candidateName}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <AlertDialogTitle>Quota Limit Reached</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              {quotaMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
