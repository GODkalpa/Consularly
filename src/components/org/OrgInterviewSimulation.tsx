'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Play, RotateCcw, Save, AlertCircle, User, Globe, Settings, Target, TrendingUp, Lightbulb, BookOpen, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
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
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription'
import InterviewStage from '@/components/interview/InterviewStage'
import { TranscriptionResult } from '@/lib/assemblyai-service'
import { mapQuestionTypeToCategory, defaultVisaTypeForRoute, type InterviewRoute, routeDisplayName } from '@/lib/interview-routes'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import { scorePerformance } from '@/lib/performance-scoring'
import type { InterviewMode, DifficultyLevel, PracticeTopic } from '@/lib/interview-modes'
import type { OfficerPersona } from '@/lib/officer-personas'
// Using secure API routes instead of direct client Firestore writes

interface InterviewQuestion {
  question: string
  category: string
}

interface UISession {
  id: string
  studentId: string
  studentName: string
  startTime: Date
  currentQuestionIndex: number
  questions: InterviewQuestion[]
  responses: Array<{
    question: string
    transcription: string
    analysis?: {
      score: number
      feedback: string
      suggestions: string[]
      bodyScore?: number
      perf?: {
        overall: number
        categories: { content: number; bodyLanguage: number; speech: number }
      }
    }
    timestamp: Date
  }>
  status: 'preparing' | 'active' | 'paused' | 'completed'
}

interface OrgInterviewSimulationProps {
  initialStudentId?: string
  initialStudentName?: string
}

export function OrgInterviewSimulation({ initialStudentId, initialStudentName }: OrgInterviewSimulationProps) {
  const { userProfile } = useAuth()
  const orgId: string | undefined = (userProfile as any)?.orgId
  const router = useRouter()

  // Student selection
  const [students, setStudents] = useState<Array<{ id: string; name: string; interviewCountry?: 'usa' | 'uk' | 'france'; studentProfile?: any | null }>>([])
  const [studentId, setStudentId] = useState<string>(initialStudentId || '')
  const [studentName, setStudentName] = useState<string>(initialStudentName || '')
  const [route, setRoute] = useState<InterviewRoute>('usa_f1')
  
  // Interview mode configuration
  const [mode, setMode] = useState<InterviewMode>('standard')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium')
  const [persona, setPersona] = useState<OfficerPersona | undefined>(undefined)
  const [topic, setTopic] = useState<PracticeTopic | undefined>(undefined)

  // Interview session state
  const [session, setSession] = useState<UISession | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bodyScore, setBodyScore] = useState<BodyLanguageScore | null>(null)
  const [lastAnsweredIndex, setLastAnsweredIndex] = useState<number>(-1)
  const [showInsights, setShowInsights] = useState(false)
  const [apiSession, setApiSession] = useState<any | null>(null)
  const [currentLLMQuestion, setCurrentLLMQuestion] = useState<any | null>(null)
  const [firestoreInterviewId, setFirestoreInterviewId] = useState<string | null>(null)
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)
  const [quotaMessage, setQuotaMessage] = useState('')

  // Timers
  const questionTimerRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<number | null>(null)
  const lastActivityAtRef = useRef<number>(0)
  const processingRef = useRef<boolean>(false)
  // Throttle live transcript UI updates
  const lastTranscriptTsRef = useRef<number>(0)
  const lastTranscriptValRef = useRef<string>('')
  const transcriptDebounceRef = useRef<number | null>(null)

  // UK-specific per-question phase timers (30s prep + 30s answer)
  const [phase, setPhase] = useState<'prep' | 'answer' | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0)
  const phaseTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  // Accumulate UK answer text across multiple final segments
  const answerBufferRef = useRef<string>('')

  useEffect(() => {
    if (!firebaseEnabled || !orgId) return
    let canceled = false
    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) return
        const res = await fetch('/api/org/students', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!canceled && res.ok) {
          const list = (data.students || []).map((s: any) => ({ id: s.id, name: s.name, interviewCountry: s.interviewCountry, studentProfile: s.studentProfile || null }))
          setStudents(list)
          if (!initialStudentName && initialStudentId) {
            const match = list.find((s: any) => s.id === initialStudentId)
            if (match) setStudentName(match.name)
          }
        }
      } catch {}
    })()
    return () => { canceled = true }
  }, [orgId, initialStudentId, initialStudentName])

  // Auto-select route when student is selected based on their interviewCountry
  useEffect(() => {
    if (!studentId) return
    const student = students.find(s => s.id === studentId)
    if (!student?.interviewCountry) return
    
    // Map interviewCountry to InterviewRoute
    const countryToRoute: Record<string, InterviewRoute> = {
      'usa': 'usa_f1',
      'uk': 'uk_student',
      'france': 'france_ema' // Default to EMA for France
    }
    
    const mappedRoute = countryToRoute[student.interviewCountry]
    if (mappedRoute) {
      setRoute(mappedRoute)
    }
  }, [studentId, students])

  const clearTimers = () => {
    if (questionTimerRef.current) { window.clearTimeout(questionTimerRef.current); questionTimerRef.current = null }
    if (silenceTimerRef.current) { window.clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
  }

  const clearPhaseTimers = useCallback(() => {
    if (phaseTimerRef.current) { window.clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null }
    if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current); countdownTimerRef.current = null }
    if (timerRafRef.current) { cancelAnimationFrame(timerRafRef.current); timerRafRef.current = null }
  }, [])

  const finalizeAnswer = () => {
    if (processingRef.current) return
    processingRef.current = true
    clearPhaseTimers()
    const text = currentTranscript.trim()
    processAnswer(text.length >= 1 ? text : '[No response]')
  }

  // PERFORMANCE FIX: Use RAF-based timer for smooth updates
  const timerStartTimeRef = useRef<number>(0)
  const timerDurationRef = useRef<number>(0)
  const timerRafRef = useRef<number | null>(null)
  
  const updateTimer = useCallback(() => {
    const elapsed = (performance.now() - timerStartTimeRef.current) / 1000
    const remaining = Math.max(0, timerDurationRef.current - elapsed)
    const roundedRemaining = Math.ceil(remaining)
    
    setSecondsRemaining(roundedRemaining)
    
    if (remaining > 0.1) {
      timerRafRef.current = requestAnimationFrame(updateTimer)
    } else {
      if (phase === 'prep') {
        setPhase('answer')
        timerStartTimeRef.current = performance.now()
        timerDurationRef.current = 90
        setResetKey((k) => k + 1)
        answerBufferRef.current = ''
        setCurrentTranscript('')
        timerRafRef.current = requestAnimationFrame(updateTimer)
      } else {
        finalizeAnswer()
      }
    }
  }, [phase])

  const startPhase = useCallback((p: 'prep' | 'answer', durationSec: number) => {
    clearPhaseTimers()
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
    
    setPhase(p)
    setSecondsRemaining(durationSec)
    if (p === 'prep') {
      setCurrentTranscript('')
    }
    if (p === 'answer') {
      answerBufferRef.current = ''
      setCurrentTranscript('')
    }
    
    timerStartTimeRef.current = performance.now()
    timerDurationRef.current = durationSec
    timerRafRef.current = requestAnimationFrame(updateTimer)
  }, [updateTimer, clearPhaseTimers])

  // UK/France: allow early start of answer during prep
  const startAnswerNow = () => {
    if (route !== 'uk_student' && route !== 'france_ema' && route !== 'france_icn') return
    clearPhaseTimers()
    setPhase('answer')
    setSecondsRemaining(90)
    setResetKey((k) => k + 1)
    answerBufferRef.current = ''
    setCurrentTranscript('')
    startPhase('answer', 90)
  }

  const armTimers = () => {
    if (route === 'uk_student' || route === 'france_ema' || route === 'france_icn') return // UK/France use phase timers instead
    clearTimers()
    questionTimerRef.current = window.setTimeout(() => {
      if (processingRef.current) return
      processingRef.current = true
      const text = currentTranscript.trim()
      processAnswer(text.length >= 1 ? text : '[No response]')
    }, 15000)

    lastActivityAtRef.current = Date.now()
    const setSilence = () => {
      if (processingRef.current) return
      const since = Date.now() - lastActivityAtRef.current
      if (since >= 3000) {
        processingRef.current = true
        const text = currentTranscript.trim()
        processAnswer(text.length >= 1 ? text : '[No response]')
        return
      }
      silenceTimerRef.current = window.setTimeout(setSilence, 300 - Math.min(300, since))
    }
    silenceTimerRef.current = window.setTimeout(setSilence, 3000)
  }

  const startNewSession = async () => {
    if (!orgId || !studentId || !studentName.trim()) return

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
      // Create interview via server API (enforces same-org)
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        if (interviewWindow) {
          try { interviewWindow.close() } catch {}
        }
        throw new Error('Not authenticated')
      }
      const createRes = await fetch('/api/org/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId, interviewType: 'visa', scheduledTime: new Date().toISOString(), duration: 30, route })
      })
      if (!createRes.ok) {
        const error = await createRes.json()
        // Close the loading window on error
        if (interviewWindow) {
          try { interviewWindow.close() } catch {}
        }
        if (error.error === 'Quota exceeded') {
          setQuotaMessage(error.message || 'Your organization has reached its monthly interview quota. Please contact your administrator.')
          setShowQuotaDialog(true)
          return
        }
        throw new Error(error.error || `Create interview failed: ${createRes.status}`)
      }
      const created = await createRes.json()
      setFirestoreInterviewId(created.id as string)
      console.log('[Org Interview] Created interview:', created.id)

      // Start LLM session
      // Build enriched student profile for personalized question selection
      const selected = students.find((s) => s.id === studentId)
      const sp: any = selected?.studentProfile || {}
      const studentProfilePayload = {
        name: studentName.trim(),
        country: 'Nepal',
        degreeLevel: sp.degreeLevel || undefined,
        programName: sp.programName || undefined,
        universityName: sp.universityName || sp.intendedUniversity || undefined,
        programLength: sp.programLength || undefined,
        programCost: sp.programCost || undefined,
        fieldOfStudy: sp.fieldOfStudy || sp.intendedMajor || undefined,
        previousEducation: sp.previousEducation || undefined,
      }

      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'start',
          userId: studentId,
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: studentProfilePayload,
          firestoreInterviewId: created.id,  // Pass the interview ID we just created
          // NEW: Interview configuration
          mode,
          difficulty,
          officerPersona: persona,
          targetTopic: topic,
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
      setApiSession(seeded)
      setCurrentLLMQuestion(firstQ)

      // Store init payload for interview page
      const key = `interview:init:${apiSess.id}`
      const payload = JSON.stringify({
        apiSession: seeded,
        firstQuestion: firstQ,
        route,
        studentName: studentName.trim(),
        firestoreInterviewId: created.id,
        scope: 'org',
      })
      
      localStorage.setItem(key, payload)
      console.log('[Org Interview] Session data stored in localStorage:', key, 'firestoreInterviewId:', created.id)

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
      // eslint-disable-next-line no-console
      console.error(e)
      // Close the loading window on error
      if (interviewWindow) {
        try { interviewWindow.close() } catch {}
      }
    }
  }

  const beginInterview = async () => {
    if (!session || !firestoreInterviewId) return
    setSession((prev) => (prev ? { ...prev, status: 'active', startTime: new Date() } : prev))
    try {
      const token = await auth.currentUser?.getIdToken()
      if (token) {
        await fetch(`/api/org/interviews/${firestoreInterviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: 'in_progress' })
        })
      }
    } catch {}
    if (route === 'uk_student' || route === 'france_ema' || route === 'france_icn') {
      // UK: 15s prep, France: 30s prep
      const prepDuration = route === 'uk_student' ? 15 : 30
      startPhase('prep', prepDuration)
    } else {
      setTimeout(() => armTimers(), 0)
    }
  }

  const processAnswer = async (transcriptText: string, confidence?: number) => {
    if (!session || session.status !== 'active') return
    if (session.currentQuestionIndex === lastAnsweredIndex) return

    setIsAnalyzing(true)
    clearTimers()

    try {
      const currentQuestion = session.questions[session.currentQuestionIndex]
      const body = bodyScore || {
        posture: { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 70 },
        gestures: { left: 'unknown', right: 'unknown', confidence: 0, score: 65 },
        expressions: { eyeContactScore: 60, smileScore: 55, confidence: 0.5, score: 58 },
        overallScore: 60,
        feedback: [],
      } as BodyLanguageScore

      const perf = scorePerformance({ transcript: transcriptText, body, assemblyConfidence: typeof confidence === 'number' ? confidence : undefined })

      // Build immediate analysis (non-blocking) to keep UI snappy
      const baseOverall = perf.overall
      const baseCategories = perf.categories
      const score10 = Math.min(10, Math.max(1, Math.round(baseOverall / 10)))
      const fallbackFeedback = [
        ...perf.details.content.notes,
        ...perf.details.speech.notes,
        ...body.feedback,
      ].slice(0, 3).join(' ')
      const fallbackSuggestions: string[] = []
      if (perf.details.content.accuracyScore < 60) fallbackSuggestions.push('Address all parts of the question with specific examples.')
      if (perf.details.speech.fillerRate > 0.05) fallbackSuggestions.push('Reduce filler words and slow down slightly.')
      if ((bodyScore?.overallScore ?? body.overallScore) < 65) fallbackSuggestions.push('Maintain eye contact and sit upright.')

      const responseTimestamp = new Date()
      const newResponse = {
        question: currentQuestion.question,
        transcription: transcriptText,
        analysis: {
          score: score10,
          feedback: fallbackFeedback || 'Good effort. Aim for clearer structure and specific details.',
          suggestions: fallbackSuggestions.length ? fallbackSuggestions : ['Provide concrete numbers or evidence where possible.'],
          bodyScore: bodyScore?.overallScore,
          perf: { overall: baseOverall, categories: baseCategories },
        },
        timestamp: responseTimestamp,
      }

      setSession((prev) => (prev ? { ...prev, responses: [...prev.responses, newResponse] } : prev))
      setCurrentTranscript('')
      setLastAnsweredIndex(session.currentQuestionIndex)

      // Prepare requests in parallel: next question and AI scoring
      let nextPromise: Promise<void> | null = null
      if (apiSession) {
        nextPromise = (async () => {
          const token = await auth.currentUser?.getIdToken()
          const headers: any = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          
          const res = await fetch('/api/interview/session', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'answer',
              sessionId: apiSession.id,
              session: apiSession,
              answer: transcriptText,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            const updated = data.session
            setApiSession(updated)
            if (data.isComplete) {
              setSession((prev) => (prev ? { ...prev, status: 'completed' } : prev))
            } else if (data.question) {
              const nextQ = data.question
              setCurrentLLMQuestion(nextQ)
              const uiQ: InterviewQuestion = { question: nextQ.question, category: mapQuestionTypeToCategory(route, nextQ.questionType) }
              setSession((prev) => (prev ? { ...prev, questions: [...prev.questions, uiQ], currentQuestionIndex: prev.currentQuestionIndex + 1 } : prev))
              if (route === 'uk_student' || route === 'france_ema' || route === 'france_icn') {
                // UK: 15s prep, France: 30s prep
                const prepDuration = route === 'uk_student' ? 15 : 30
                startPhase('prep', prepDuration)
              }
            }
          }
          // Hide analyzing spinner as soon as next question is ready
          setIsAnalyzing(false)
        })()
      }

      // Fire scoring request in background; update the last response when it returns
      ;(async () => {
        try {
          const ic = apiSession ? {
            visaType: apiSession.visaType,
            route: (apiSession as any).route || route,
            studentProfile: apiSession.studentProfile,
            conversationHistory: apiSession.conversationHistory.map((h: any) => ({ question: h.question, answer: h.answer, timestamp: h.timestamp })),
          } : {
            visaType: defaultVisaTypeForRoute(route),
            route,
            studentProfile: { name: session.studentName, country: 'Nepal' },
            conversationHistory: [] as Array<{ question: string; answer: string; timestamp: string }>,
          }
          const res = await fetch('/api/interview/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: currentQuestion.question,
              answer: transcriptText,
              bodyLanguage: body,
              assemblyConfidence: typeof confidence === 'number' ? confidence : undefined,
              interviewContext: ic,
              sessionMemory: (apiSession as any)?.sessionMemory,
              // Pass difficulty for adjusted scoring
              difficulty: apiSession?.difficulty,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            setSession((prev) => {
              if (!prev) return prev
              const responses = prev.responses.map((r) => {
                if (r.timestamp && new Date(r.timestamp).getTime() === responseTimestamp.getTime()) {
                  const combinedOverall = data.overall ?? r.analysis?.perf?.overall ?? baseOverall
                  const combinedCategories = data.categories ?? r.analysis?.perf?.categories ?? baseCategories
                  const aiFeedback = data.summary || r.analysis?.feedback
                  const aiSuggestions = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 3) : r.analysis?.suggestions
                  const score10b = Math.min(10, Math.max(1, Math.round(combinedOverall / 10)))
                  return {
                    ...r,
                    analysis: {
                      score: score10b,
                      feedback: aiFeedback || r.analysis?.feedback,
                      suggestions: aiSuggestions && aiSuggestions.length ? aiSuggestions : (r.analysis?.suggestions || []),
                      bodyScore: r.analysis?.bodyScore,
                      perf: { overall: combinedOverall, categories: combinedCategories },
                    }
                  }
                }
                return r
              })
              return { ...prev, responses }
            })
          }
        } catch {}
      })()

      // If we started the next question request, await it to sequence timers/UI; else end analysis now
      if (nextPromise) {
        await nextPromise
      } else {
        setIsAnalyzing(false)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to analyze/process response:', e)
    } finally {
      setIsAnalyzing(false)
      setResetKey((k) => k + 1)
      processingRef.current = false
      if (route !== 'uk_student' && route !== 'france_ema' && route !== 'france_icn') {
        setTimeout(() => { if (session && session.status === 'active') armTimers() }, 0)
      }
    }
  }

  const handleTranscriptComplete = async (transcript: TranscriptionResult) => {
    if (!session || session.status !== 'active') return
    const transcriptText = transcript.text.trim()
    if (transcriptText.length < 1) return
    if (session.currentQuestionIndex === lastAnsweredIndex) return
    if (route === 'uk_student' || route === 'france_ema' || route === 'france_icn') {
      // Do not finalize early; accumulate only during the answer window
      if (phase !== 'answer') return
      answerBufferRef.current = answerBufferRef.current ? `${answerBufferRef.current} ${transcriptText}` : transcriptText
      setCurrentTranscript(answerBufferRef.current)
      return
    }
    processingRef.current = true
    await processAnswer(transcriptText, transcript.confidence)
  }

  const handleTranscriptUpdate = (text: string) => {
    setCurrentTranscript(text)
    lastActivityAtRef.current = Date.now()
  }

  const resetInterview = () => {
    setSession(null)
    setCurrentTranscript('')
    setBodyScore(null)
    setShowInsights(false)
    setResetKey((k) => k + 1)
    clearTimers()
    clearPhaseTimers()
    processingRef.current = false
    setPhase(null)
    setSecondsRemaining(0)
    // keep selected student
  }

  const saveSessionJson = async () => {
    if (!session) return
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview_${session.studentName}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const finalAggregate = useMemo(() => {
    if (!session || session.status !== 'completed' || session.responses.length === 0) return null
    const valid = session.responses.filter((r) => !!r.analysis)
    if (!valid.length) return null
    const sum = valid.reduce((acc, r) => {
      const a = r.analysis!
      const cat = a.perf?.categories
      return {
        overall: acc.overall + (a.perf?.overall ?? a.score * 10),
        content: acc.content + (cat?.content ?? a.score * 10),
        speech: acc.speech + (cat?.speech ?? a.score * 10),
        body: acc.body + (a.bodyScore ?? 0),
      }
    }, { overall: 0, content: 0, speech: 0, body: 0 })
    const n = valid.length
    return {
      overall: Math.round(sum.overall / n),
      content: Math.round(sum.content / n),
      speech: Math.round(sum.speech / n),
      body: Math.round(sum.body / n),
    }
  }, [session])

  useEffect(() => {
    if (!firestoreInterviewId) return
    if (session?.status === 'completed' && finalAggregate) {
      // Map our categories into the generic ScoreDetails
      const scoreDetails = {
        communication: finalAggregate.content,
        technical: finalAggregate.speech,
        confidence: finalAggregate.body,
        overall: finalAggregate.overall,
      }
      ;(async () => {
        try {
          const token = await auth.currentUser?.getIdToken()
          if (!token) return
          await fetch(`/api/org/interviews/${firestoreInterviewId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              status: 'completed',
              endTime: new Date().toISOString(),
              score: finalAggregate.overall,
              scoreDetails,
            })
          })
        } catch {}
      })()
    }
  }, [session?.status, finalAggregate, firestoreInterviewId])

  // Keep name in sync when student changes
  useEffect(() => {
    if (!studentId) return
    const s = students.find((x) => x.id === studentId)
    if (s) setStudentName(s.name)
  }, [studentId, students])

  if (!firebaseEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Firebase is not configured in this environment.</p>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = session?.questions[session.currentQuestionIndex]

  return (
    <div className='space-y-8'>
      {!session && (
        <>
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold">Interview Setup</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure your interview session parameters and launch when ready</p>
          </div>

          {/* Candidate Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Candidate Information</h3>
                  <p className="text-xs text-muted-foreground">Select student and interview destination</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Student Selection */}
                <div className="space-y-2">
                  <Label htmlFor="student-select" className="text-sm font-medium">
                    Student Name <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">Required</Badge>
                  </Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger id="student-select">
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length === 0 ? (
                        <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                          No students found. Add students first.
                        </div>
                      ) : (
                        students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!studentId && students.length > 0 && (
                    <p className="text-xs text-muted-foreground">Select the student who will be interviewed</p>
                  )}
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <Label htmlFor="country-select" className="text-sm font-medium flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Destination Country
                  </Label>
                  <Select 
                    value={route} 
                    onValueChange={(v) => setRoute(v as InterviewRoute)}
                    disabled={!!studentId && !!students.find(s => s.id === studentId)?.interviewCountry}
                  >
                    <SelectTrigger id="country-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='usa_f1'>🇺🇸 {routeDisplayName.usa_f1}</SelectItem>
                      <SelectItem value='uk_student'>🇬🇧 {routeDisplayName.uk_student}</SelectItem>
                      <SelectItem value='france_ema'>🇫🇷 {routeDisplayName.france_ema}</SelectItem>
                      <SelectItem value='france_icn'>🇫🇷 {routeDisplayName.france_icn}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {studentId && students.find(s => s.id === studentId)?.interviewCountry 
                      ? 'Country pre-assigned to this student'
                      : 'Interview questions will be tailored to this visa type'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Configuration - Only for USA F1 */}
          {route === 'usa_f1' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Interview Configuration</h3>
                    <p className="text-xs text-muted-foreground">Customize difficulty and format</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Interview Mode */}
                  <div className="space-y-2">
                    <Label htmlFor="mode-select" className="text-sm font-medium flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      Interview Mode
                    </Label>
                    <Select value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
                      <SelectTrigger id="mode-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">
                          <span className="font-medium">Practice</span>
                          <span className="text-xs text-muted-foreground ml-2">8 questions • 10 min</span>
                        </SelectItem>
                        <SelectItem value="standard">
                          <span className="font-medium">Standard</span>
                          <span className="text-xs text-muted-foreground ml-2">12 questions • 15 min</span>
                        </SelectItem>
                        <SelectItem value="comprehensive">
                          <span className="font-medium">Comprehensive</span>
                          <span className="text-xs text-muted-foreground ml-2">16 questions • 20 min</span>
                        </SelectItem>
                        <SelectItem value="stress_test">
                          <span className="font-medium">Stress Test</span>
                          <span className="text-xs text-muted-foreground ml-2">20 questions • 25 min</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {mode === 'practice' && 'Balanced session simulating a typical embassy interview experience'}
                      {mode === 'standard' && 'Balanced session simulating a typical embassy interview experience'}
                      {mode === 'comprehensive' && 'In-depth interview covering all aspects thoroughly with follow-ups'}
                      {mode === 'stress_test' && 'Challenging rapid-fire format designed to test composure under pressure'}
                    </p>
                  </div>

                  {/* Difficulty Level */}
                  <div className="space-y-2">
                    <Label htmlFor="difficulty-select" className="text-sm font-medium flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Difficulty Level
                    </Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                      <SelectTrigger id="difficulty-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">
                          <span className="font-medium">Beginner</span>
                          <span className="text-xs text-muted-foreground ml-2">60s/question • Patient officer</span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="font-medium">Intermediate</span>
                          <span className="text-xs text-muted-foreground ml-2">45s/question • Professional officer</span>
                        </SelectItem>
                        <SelectItem value="hard">
                          <span className="font-medium">Advanced</span>
                          <span className="text-xs text-muted-foreground ml-2">30s/question • Challenging</span>
                        </SelectItem>
                        <SelectItem value="expert">
                          <span className="font-medium">Master</span>
                          <span className="text-xs text-muted-foreground ml-2">25s/question • Maximum pressure</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Options */}
                  <div className="pt-4 border-t space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Officer Persona */}
                      <div className="space-y-2">
                        <Label htmlFor="persona-select" className="text-sm font-medium">
                          Officer Persona <span className="text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Select value={persona || 'auto'} onValueChange={(v) => setPersona(v === 'auto' ? undefined : v as OfficerPersona)}>
                          <SelectTrigger id="persona-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-select</SelectItem>
                            <SelectItem value="professional">Professional Officer</SelectItem>
                            <SelectItem value="skeptical">Skeptical Officer</SelectItem>
                            <SelectItem value="friendly">Friendly Officer</SelectItem>
                            <SelectItem value="strict">Strict Officer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Topic Focus (Only for Practice Mode) */}
                      {mode === 'practice' && (
                        <div className="space-y-2">
                          <Label htmlFor="topic-select" className="text-sm font-medium">
                            Topic Focus <span className="text-muted-foreground font-normal">(Optional)</span>
                          </Label>
                          <Select value={topic || 'balanced'} onValueChange={(v) => setTopic(v === 'balanced' ? undefined : v as PracticeTopic)}>
                            <SelectTrigger id="topic-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="balanced">Balanced Practice</SelectItem>
                              <SelectItem value="financial">Financial Capacity</SelectItem>
                              <SelectItem value="academic">Academic Background</SelectItem>
                              <SelectItem value="intent">Return Intent</SelectItem>
                              <SelectItem value="weak_areas">Weak Areas Practice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Button */}
          <Button 
            onClick={startNewSession} 
            disabled={!studentId} 
            className='w-full' 
            size='lg'
          >
            <Play className='h-4 w-4 mr-2' /> 
            Launch Interview Session
          </Button>
          
          {!studentId && students.length > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">Student selection required</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Please select a student from the dropdown above to continue</p>
              </div>
            </div>
          )}
        </>
      )}

      {session && (
        <div className='space-y-6'>
          {session.status === 'preparing' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Play className='h-4 w-4' /> Ready to start the interview?
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <p className='text-sm text-muted-foreground'>When you click Start Interview, your microphone and camera will turn on, the first question will be shown, and live transcription will begin.</p>
                <Button onClick={beginInterview} className='w-full'>
                  <Play className='h-4 w-4 mr-2' /> Start Interview
                </Button>
              </CardContent>
            </Card>
          )}

          {currentQuestion && session.status !== 'preparing' && (
            <InterviewStage
              running={session.status === 'active'}
              questionCategory={currentQuestion.category}
              questionText={currentQuestion.question}
              currentTranscript={currentTranscript}
              onScore={setBodyScore}
              onNext={session.status === 'active' && route !== 'uk_student' && route !== 'france_ema' && route !== 'france_icn' ? () => {/* skip handled by timers */} : undefined}
              startedAt={session.startTime}
              statusBadge={session.status === 'active' ? 'Live' : session.status === 'paused' ? 'Paused' : 'Completed'}
              candidateName={session.studentName}
              questionIndex={session.currentQuestionIndex}
              questionTotal={route === 'uk_student' || route === 'france_ema' || route === 'france_icn' ? 16 : session.questions.length}
              phase={phase ?? undefined}
              secondsRemaining={phase ? secondsRemaining : undefined}
              onStartAnswer={route === 'uk_student' || route === 'france_ema' || route === 'france_icn' ? startAnswerNow : undefined}
              onStopAndNext={route === 'uk_student' || route === 'france_ema' || route === 'france_icn' ? finalizeAnswer : undefined}
            />
          )}

          <div className='hidden'>
            <AssemblyAITranscription
            onTranscriptComplete={handleTranscriptComplete}
            onTranscriptUpdate={(t) => {
              if (!session || session.status !== 'active') return
              // Debounce UI updates to 100ms to reduce re-renders
              if (transcriptDebounceRef.current) {
                window.clearTimeout(transcriptDebounceRef.current)
              }
              transcriptDebounceRef.current = window.setTimeout(() => {
                if (route === 'uk_student' || route === 'france_ema' || route === 'france_icn') {
                  if (phase !== 'answer') return
                  const combined = answerBufferRef.current ? `${answerBufferRef.current} ${t}` : t
                  setCurrentTranscript(combined)
                } else {
                  setCurrentTranscript(t)
                }
                lastActivityAtRef.current = Date.now()
              }, 100)
            }}
            showControls={false}
            showTranscripts={false}
            running={session.status === 'active' && ((route !== 'uk_student' && route !== 'france_ema' && route !== 'france_icn') || phase === 'answer')}
            resetKey={resetKey}
          />
          </div>

          {/* Completed */}
          {session.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Completed</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {finalAggregate && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <div>
                      <div className='text-xs text-muted-foreground'>Overall</div>
                      <div className='text-xl font-semibold'>{finalAggregate.overall}/100</div>
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Content</div>
                      <div className='text-lg'>{finalAggregate.content}/100</div>
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Speech</div>
                      <div className='text-lg'>{finalAggregate.speech}/100</div>
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Body</div>
                      <div className='text-lg'>{finalAggregate.body}/100</div>
                    </div>
                  </div>
                )}
                <div className='flex gap-2'>
                  <Button onClick={saveSessionJson}><Save className='h-4 w-4 mr-2' /> Save Session</Button>
                  <Button onClick={resetInterview} variant='outline'><RotateCcw className='h-4 w-4 mr-2' /> New Interview</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights toggle and badges */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>{session.status}</Badge>
              <Badge variant='outline'>Question {session.currentQuestionIndex + 1} of {session.questions.length}</Badge>
            </div>
            <Button variant='outline' onClick={() => setShowInsights((v) => !v)}>
              {showInsights ? 'Hide Insights' : 'Show Insights'}
            </Button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <Card>
          <CardContent className='flex items-center justify-center py-8'>
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span>Analyzing response...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-6 w-6 text-destructive' />
              <AlertDialogTitle>Quota Limit Reached</AlertDialogTitle>
            </div>
            <AlertDialogDescription className='text-base pt-2'>
              {quotaMessage}
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

export default OrgInterviewSimulation
