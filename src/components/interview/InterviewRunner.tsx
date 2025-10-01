"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, ChevronRight, Loader2, Play, Square } from 'lucide-react'
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription'
import { useMicLevel } from '@/hooks/use-mic-level'
import type { TranscriptionResult } from '@/lib/assemblyai-service'
import { mapQuestionTypeToCategory, type InterviewRoute } from '@/lib/interview-routes'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import { motion, AnimatePresence } from 'motion/react'

// Dynamically import the heavy InterviewStage (TensorFlow/MediaPipe) client-only to reduce initial bundle size
const InterviewStage = dynamic(() => import('@/components/interview/InterviewStage'), { ssr: false })

interface UIQuestion { question: string; category: string }
interface UISession {
  id: string
  studentName: string
  route: InterviewRoute
  startTime: Date
  currentQuestionIndex: number
  questions: UIQuestion[]
  responses: Array<{ question: string; transcription: string; timestamp: Date }>
  status: 'preparing' | 'active' | 'completed'
}

export default function InterviewRunner() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<UISession | null>(null)
  const [apiSession, setApiSession] = useState<any | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [bodyScore, setBodyScore] = useState<BodyLanguageScore | null>(null)
  const [phase, setPhase] = useState<'prep' | 'answer' | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0)
  const phaseTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const processingRef = useRef<boolean>(false)
  const [resetKey, setResetKey] = useState(0)
  const answerBufferRef = useRef<string>('')
  // Track ASR confidence from transcript segments (per-segment and aggregated)
  const asrConfidencesRef = useRef<number[]>([])
  const captureBodyScoreRef = useRef<(() => BodyLanguageScore | null) | null>(null)
  // Per-answer combined performance results (includes body language)
  const [perfList, setPerfList] = useState<Array<{ overall: number; categories: { content: number; speech: number; bodyLanguage: number } }>>([])
  const [finalReport, setFinalReport] = useState<null | {
    decision: 'accepted' | 'rejected' | 'borderline'
    overall: number
    dimensions: Record<string, number>
    summary: string
    recommendations: string[]
  }>(null)
  const preflightRef = useRef<boolean>(false)
  const permissionRequestingRef = useRef<boolean>(false)
  const [permissionsReady, setPermissionsReady] = useState<boolean>(false)
  const [permError, setPermError] = useState<string | null>(null)
  const { running: micRunning, level: micLevel, error: micError, start: startMic, stop: stopMic } = useMicLevel()

  // load initial payload from sessionStorage seeded by the starter page
  useEffect(() => {
    try {
      if (!id) return
      const key = `interview:init:${id}`
      // Prefer sessionStorage (same-tab), but support cross-tab via localStorage fallback
      let raw = sessionStorage.getItem(key)
      if (!raw) {
        const fromLocal = localStorage.getItem(key)
        if (fromLocal) {
          try { sessionStorage.setItem(key, fromLocal) } catch {}
          try { localStorage.removeItem(key) } catch {}
          raw = fromLocal
        }
      }
      if (!raw) { setLoading(false); return }
      const init = JSON.parse(raw)
      // expected: { apiSession, firstQuestion, route, studentName }
      const firstQ = init.firstQuestion
      const route: InterviewRoute = init.route
      const uiFirst: UIQuestion = { question: firstQ.question, category: mapQuestionTypeToCategory(route, firstQ.questionType) }
      const s: UISession = {
        id: init.apiSession.id,
        studentName: init.studentName,
        route,
        startTime: new Date(),
        currentQuestionIndex: 0,
        questions: [uiFirst],
        responses: [],
        status: 'preparing',
      }
      // seed apiSession with first question in history
      const seeded = {
        ...init.apiSession,
        conversationHistory: [
          ...init.apiSession.conversationHistory,
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
      setSession(s)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  // Helper to explicitly request permissions (can be called automatically and via button)
  const requestPermissions = useCallback(async () => {
    // Prevent concurrent permission requests (causes race conditions and browser freezes)
    if (permissionRequestingRef.current || permissionsReady) {
      return permissionsReady
    }
    permissionRequestingRef.current = true
    
    try {
      setPermError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      try { stream.getTracks().forEach((t) => t.stop()) } catch {}
      setPermissionsReady(true)
      return true
    } catch (e: any) {
      const name = e?.name || 'Error'
      const msg = e?.message || String(e)
      setPermError(`${name}: ${msg}`)
      setPermissionsReady(false)
      return false
    } finally {
      permissionRequestingRef.current = false
    }
  }, [permissionsReady])

  // Preflight permission request in the interview tab: ask for camera and mic access
  // without starting any recording until the user clicks Start Interview.
  // Single unified permission request on mount with debounce protection.
  useEffect(() => {
    if (preflightRef.current || loading) return
    preflightRef.current = true
    // Small delay to let page render first, then request permissions
    const timer = setTimeout(() => {
      requestPermissions()
    }, 100)
    return () => clearTimeout(timer)
  }, [requestPermissions, loading])

  // Retry once when tab becomes visible (only if not already requested successfully)
  useEffect(() => {
    if (permissionsReady) return
    const handler = () => {
      if (document.visibilityState === 'visible' && !permissionsReady && !permissionRequestingRef.current) {
        requestPermissions()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [permissionsReady, requestPermissions])

  // Start microphone level preview while preparing (after permissions granted); stop otherwise
  useEffect(() => {
    if (!session) return
    if (session.status === 'preparing' && permissionsReady) {
      if (!micRunning) startMic()
    } else {
      if (micRunning) stopMic()
    }
  }, [session, permissionsReady, micRunning, startMic, stopMic])

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    }
  }, [])

  const startPhase = (p: 'prep' | 'answer', durationSec: number) => {
    if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    setPhase(p)
    setSecondsRemaining(durationSec)
    if (p === 'prep') setCurrentTranscript('')
    if (p === 'answer') {
      answerBufferRef.current = ''
      setCurrentTranscript('')
      // Clear ASR confidence buffer for new answer
      asrConfidencesRef.current = []
    }
    countdownTimerRef.current = window.setInterval(() => {
      setSecondsRemaining((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    phaseTimerRef.current = window.setTimeout(() => {
      if (p === 'prep') {
        setPhase('answer')
        setSecondsRemaining(30)
        setResetKey((k) => k + 1)
        answerBufferRef.current = ''
        setCurrentTranscript('')
        startPhase('answer', 30)
      } else {
        finalizeAnswer()
      }
    }, durationSec * 1000)
  }

  const beginInterview = async () => {
    if (!session) return
    if (!permissionsReady) {
      const ok = await requestPermissions()
      if (!ok) return
    }
    setSession((prev) => (prev ? { ...prev, status: 'active', startTime: new Date() } : prev))
    if (session.route === 'uk_student') {
      startPhase('prep', 30)
    } else if (session.route === 'usa_f1') {
      // USA F1: 40s soft cap per question with 30s warning
      startUSF1QuestionTimer()
    }
  }

  const startUSF1QuestionTimer = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    setSecondsRemaining(40) // 40s soft cap per MVP config
    countdownTimerRef.current = window.setInterval(() => {
      setSecondsRemaining((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
  }

  const startAnswerNow = () => {
    if (session?.route !== 'uk_student') return
    if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    setPhase('answer')
    setSecondsRemaining(30)
    setResetKey((k) => k + 1)
    answerBufferRef.current = ''
    setCurrentTranscript('')
    startPhase('answer', 30)
  }

  const finalizeAnswer = async () => {
    if (processingRef.current) return
    processingRef.current = true
    if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    const text = currentTranscript.trim()
    await processAnswer(text.length >= 1 ? text : '[No response]')
  }

  const processAnswer = async (transcriptText: string) => {
    if (!session || session.status !== 'active' || !apiSession) return
    try {
      // Stop timers
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
      
      // CRITICAL FIX: Capture body language score at the exact moment of answer finalization
      const capturedBodyScore = captureBodyScoreRef.current ? captureBodyScoreRef.current() : null
      
      // Calculate average ASR confidence across all segments for this answer
      const avgConfidence = asrConfidencesRef.current.length > 0
        ? asrConfidencesRef.current.reduce((sum, c) => sum + c, 0) / asrConfidencesRef.current.length
        : undefined
      
      console.log('📊 Scoring answer:', {
        transcriptLength: transcriptText.length,
        bodyScoreCaptured: !!capturedBodyScore,
        bodyScoreOverall: capturedBodyScore ? Math.round(capturedBodyScore.overallScore) : 'N/A',
        avgASRConfidence: avgConfidence ? Math.round(avgConfidence * 100) + '%' : 'N/A',
        confidenceSegments: asrConfidencesRef.current.length,
      })
      
      // Kick off combined scoring (content + speech + body) in parallel
      const currentQText = session.questions[session.currentQuestionIndex]?.question || ''
      const scoringPromise = (async () => {
        try {
          const ic = {
            visaType: apiSession.visaType,
            route: session.route,
            studentProfile: apiSession.studentProfile,
            conversationHistory: apiSession.conversationHistory.map((h: any) => ({ question: h.question, answer: h.answer, timestamp: h.timestamp }))
          }
          const resScore = await fetch('/api/interview/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: currentQText,
              answer: transcriptText,
              bodyLanguage: capturedBodyScore || undefined,
              assemblyConfidence: avgConfidence,
              interviewContext: ic,
            })
          })
          if (resScore.ok) {
            const data = await resScore.json()
            if (typeof data?.overall === 'number' && data?.categories) {
              setPerfList((prev) => [...prev, { overall: Math.round(data.overall), categories: {
                content: Math.round(data.categories.content ?? 0),
                speech: Math.round(data.categories.speech ?? 0),
                bodyLanguage: Math.round(data.categories.bodyLanguage ?? 0),
              }}])
            }
          }
        } catch (err) {
          console.error('❌ Scoring API failed:', err)
        }
      })()

      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', sessionId: apiSession.id, session: apiSession, answer: transcriptText })
      })
      if (!res.ok) throw new Error('Failed to process answer')
      const data = await res.json()
      const updated = data.session
      setApiSession(updated)
      // push response to UI list
      setSession((prev) => prev ? {
        ...prev,
        responses: [...prev.responses, { question: prev.questions[prev.currentQuestionIndex].question, transcription: transcriptText, timestamp: new Date() }],
      } : prev)
      setCurrentTranscript('')
      answerBufferRef.current = ''

      if (data.isComplete) {
        // compute final report
        await computeFinalReport(updated)
        setSession((prev) => prev ? { ...prev, status: 'completed' } : prev)
        // Ensure scoring promise settles before showing final aggregate (non-blocking UI will update when ready)
        try { await scoringPromise } catch {}
        return
      }

      const nextQ = data.question
      const uiQ: UIQuestion = { question: nextQ.question, category: mapQuestionTypeToCategory(session.route, nextQ.questionType) }
      setSession((prev) => prev ? {
        ...prev,
        questions: [...prev.questions, uiQ],
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      } : prev)
      // Clear ASR confidence buffer for next answer
      asrConfidencesRef.current = []
      
      // UK flow: new question => 30s prep again
      if (session.route === 'uk_student') {
        startPhase('prep', 30)
      } else if (session.route === 'usa_f1') {
        // USA F1: restart 40s timer for next question
        startUSF1QuestionTimer()
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      processingRef.current = false
      setResetKey((k) => k + 1)
    }
  }

  const handleTranscriptComplete = async (t: TranscriptionResult) => {
    if (!session || session.status !== 'active') return
    
    // CRITICAL FIX: Track ASR confidence for ALL segments (accumulate for averaging)
    if (typeof t.confidence === 'number' && t.confidence > 0) {
      asrConfidencesRef.current.push(t.confidence)
      console.log('🎤 ASR confidence:', Math.round(t.confidence * 100) + '%', `(${asrConfidencesRef.current.length} segments)`)
    }
    
    // UK: Do NOT auto-finalize on a transcript segment.
    // Accumulate text only during the answer window; finalize via timer or Stop & Next.
    if (session.route === 'uk_student') {
      if (phase !== 'answer') return
      const text = t.text.trim()
      if (text) {
        answerBufferRef.current = answerBufferRef.current ? `${answerBufferRef.current} ${text}` : text
        // Keep UI showing buffered + live partials (handled in onTranscriptUpdate)
        setCurrentTranscript(answerBufferRef.current)
      }
      return
    }
    // USA F1: Accumulate transcript but don't auto-finalize (wait for manual Next or timer)
    if (session.route === 'usa_f1') {
      const text = t.text.trim()
      if (text) {
        answerBufferRef.current = answerBufferRef.current ? `${answerBufferRef.current} ${text}` : text
        setCurrentTranscript(answerBufferRef.current)
      }
      return
    }
    // Other routes: finalize immediately on a completed segment (legacy behavior)
    processingRef.current = true
    await processAnswer(t.text.trim())
  }

  const computeFinalReport = async (finalApiSession: any) => {
    try {
      // CRITICAL FIX: Pass per-answer scores to final evaluation for consistency
      const res = await fetch('/api/interview/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: session?.route,
          studentProfile: finalApiSession.studentProfile,
          conversationHistory: finalApiSession.conversationHistory,
          perAnswerScores: perfList,  // Include detailed per-answer scoring data
        })
      })
      if (res.ok) {
        const data = await res.json()
        setFinalReport(data)
      } else {
        setFinalReport({
          decision: 'borderline',
          overall: 60,
          dimensions: { communication: 60, credibility: 60 },
          summary: 'Final AI evaluation unavailable. This is a heuristic fallback based on response lengths and consistency.',
          recommendations: ['Add more concrete details (numbers, evidence).', 'Clarify financial maintenance and accommodation arrangements.']
        })
      }
    } catch (e) {
      setFinalReport({
        decision: 'borderline',
        overall: 60,
        dimensions: { communication: 60, credibility: 60 },
        summary: 'Final AI evaluation failed. Showing fallback.',
        recommendations: ['Add more concrete details (numbers, evidence).', 'Clarify financial maintenance and accommodation arrangements.']
      })
    }
  }

  const currentQuestion = session?.questions[session.currentQuestionIndex]
  const progressPct = useMemo(() => {
    if (!session) return 0
    if (session.status === 'preparing') return 0
    const total = session.route === 'uk_student' ? 16 : session.questions.length
    return Math.round(((session.currentQuestionIndex + 1) / total) * 100)
  }, [session])
  const phaseLabel = phase ? (phase === 'prep' ? 'Prep' : 'Answer') : null

  // Aggregate combined performance across answers (shown on completion)
  const combinedAggregate = useMemo(() => {
    if (!perfList.length) return null
    const sum = perfList.reduce((acc, s) => {
      acc.overall += s.overall
      acc.content += s.categories.content
      acc.speech += s.categories.speech
      acc.body += s.categories.bodyLanguage
      return acc
    }, { overall: 0, content: 0, speech: 0, body: 0 })
    const n = perfList.length
    return {
      overall: Math.round(sum.overall / n),
      categories: {
        content: Math.round(sum.content / n),
        speech: Math.round(sum.speech / n),
        bodyLanguage: Math.round(sum.body / n),
      }
    }
  }, [perfList])

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-sm text-muted-foreground">Loading interview...</div>
        </div>
      </div>
    )
  }

  if (!session || !apiSession) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center space-y-4">
        <h2 className="text-2xl font-semibold">Interview Not Initialized</h2>
        <p className="text-muted-foreground">Go back and start a new interview session from the dashboard.</p>
        <Button onClick={() => router.push('/admin')}>Back to Admin</Button>
      </div>
    )
  }

  if (session.status === 'completed') {
    return (
      <div className="container py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> Interview Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {finalReport ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={finalReport.decision === 'accepted' ? 'default' : finalReport.decision === 'rejected' ? 'destructive' : 'secondary'}>
                    Decision: {finalReport.decision}
                  </Badge>
                  <Badge variant="outline">Overall {finalReport.overall}/100</Badge>
                </div>
                {combinedAggregate && (
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium mb-2">Combined Performance (content + speech + body)</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Overall {combinedAggregate.overall}/100</Badge>
                      <Badge variant="secondary">Content {combinedAggregate.categories.content}/100</Badge>
                      <Badge variant="secondary">Speech {combinedAggregate.categories.speech}/100</Badge>
                      <Badge variant="secondary">Body {combinedAggregate.categories.bodyLanguage}/100</Badge>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{finalReport.summary}</p>
                {Object.keys(finalReport.dimensions).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(finalReport.dimensions).map(([k, v]) => (
                      <div key={k} className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{k}</div>
                        <div className="text-lg font-medium">{Math.round(v as number)}/100</div>
                      </div>
                    ))}
                  </div>
                )}
                {finalReport.recommendations?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Recommendations</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {finalReport.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2"><span>•</span><span>{r}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="pt-2">
                  <Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Generating final report…</div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Permission overlay - Modern centered modal */}
      {!permissionsReady && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-lg flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card className="max-w-md w-full border-2 shadow-2xl">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">🎥</span>
                </div>
                <CardTitle className="text-2xl">Camera & Microphone Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">We need access to your camera and microphone to conduct the interview. <br/><span className="font-semibold text-foreground">Please click &ldquo;Allow&rdquo; when your browser asks for permission.</span></p>
                {permError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive font-medium">{permError}</p>
                  </div>
                )}
                <Button size="lg" className="w-full" onClick={requestPermissions}>
                  <Play className="h-5 w-5 mr-2" /> Grant Permissions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Split Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Question/Statement Section (30%) */}
        <div className="lg:w-[30%] bg-white dark:bg-gray-50 flex items-center justify-center p-8 lg:p-12">
          <div className="max-w-2xl w-full space-y-6">
            {session.status !== 'preparing' ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={session.currentQuestionIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-medium mb-2">
                    {session.route === 'uk_student' ? 'UK Pre-CAS Interview' : 'USA F1 Interview'} • Question {session.currentQuestionIndex + 1}{session.route === 'uk_student' ? ' of 16' : ''}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-900 leading-snug">
                    {currentQuestion?.question}
                  </h1>
                  {session.route === 'uk_student' && phase && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-100 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 dark:text-gray-800 leading-relaxed flex items-start gap-2">
                        {phase === 'prep' ? (
                          <>
                            <span className="text-lg flex-shrink-0">⏱️</span>
                            <div>
                              <span className="font-semibold block text-gray-900 mb-1">Preparation Time</span>
                              <span className="text-gray-600">You have <span className="font-bold text-blue-600">{secondsRemaining} seconds</span> to review the question silently.</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-lg flex-shrink-0">🎙️</span>
                            <div>
                              <span className="font-semibold block text-gray-900 mb-1">Recording Your Answer</span>
                              <span className="text-gray-600">Speak clearly. <span className="font-bold text-blue-600">{secondsRemaining} seconds</span> remaining.</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {session.route === 'usa_f1' && session.status === 'active' && typeof secondsRemaining === 'number' && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-100 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 dark:text-gray-800 leading-relaxed flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">⏱️</span>
                        <div>
                          <span className="font-semibold block text-gray-900 mb-1">Time Remaining</span>
                          <span className="text-gray-600">You have <span className="font-bold text-blue-600">{Math.max(0, secondsRemaining)} seconds</span>. Click <span className="font-semibold">Next Question</span> when ready.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-medium mb-2">
                  {session.route === 'uk_student' ? 'UK Pre-CAS Interview' : 'USA F1 Interview'}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-900 leading-snug">
                  Welcome, {session.studentName}
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-700 leading-relaxed">
                  Please ensure your camera and microphone are working correctly. Click <span className="font-semibold text-gray-900">Start Interview</span> when you&apos;re ready to begin.
                </p>
                {permissionsReady && micRunning && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-100 rounded-lg border border-green-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-green-900 flex items-center gap-2">
                        <span>🎤</span>
                        <span>Microphone Level</span>
                      </div>
                      <div className="text-sm font-bold text-green-900">{Math.round((micLevel || 0) * 100)}%</div>
                    </div>
                    <div className="h-3 w-full bg-green-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-3 bg-green-600 rounded-full" 
                        animate={{ width: `${Math.min(100, Math.round((micLevel || 0) * 100))}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-green-700">Speak to test your microphone (not recorded)</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - Video Section with Blue Gradient (70%) */}
        <div className="lg:w-[70%] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden flex items-center justify-center p-8">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-8 w-32 h-32 grid grid-cols-8 gap-1 opacity-30">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
            ))}
          </div>
          
          <div className="relative z-10 w-full max-w-3xl aspect-video">
            <InterviewStage
              running={session.status === 'active'}
              preview={permissionsReady && session.status === 'preparing'}
              questionCategory={session.status === 'preparing' ? '' : (currentQuestion?.category || '')}
              questionText={''}
              currentTranscript={currentTranscript}
              onScore={setBodyScore}
              captureScoreRef={captureBodyScoreRef}
              startedAt={session.startTime}
              statusBadge={session.status === 'active' ? 'Live' : 'Preparing'}
              candidateName={session.studentName}
              questionIndex={session.currentQuestionIndex}
              questionTotal={session.route === 'uk_student' ? 16 : session.questions.length}
              phase={phase ?? undefined}
              secondsRemaining={session.route === 'usa_f1' || phase ? secondsRemaining : undefined}
              onStartAnswer={session.route === 'uk_student' ? startAnswerNow : undefined}
              onStopAndNext={session.route === 'uk_student' ? finalizeAnswer : undefined}
              onNext={session.route === 'usa_f1' && session.status === 'active' ? (() => {
                const text = currentTranscript.trim()
                processAnswer(text.length >= 1 ? text : '[No response]')
              }) : undefined}
              showCaptions={false}
              showQuestionOverlay={false}
              showBodyBadge={false}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Button (Bottom Center) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="text-xs text-gray-600 dark:text-gray-400">Progress</div>
              <div className="text-sm font-semibold">{progressPct}%</div>
            </div>
            {session.status === 'preparing' && !permissionsReady && (
              <Button size="lg" className="px-8 h-12 text-base font-semibold" onClick={requestPermissions}>
                <Play className="h-5 w-5 mr-2" /> Allow Camera & Microphone
              </Button>
            )}
            {session.status === 'preparing' && permissionsReady && (
              <Button size="lg" className="px-8 h-12 text-base font-semibold" onClick={beginInterview}>
                <Play className="h-5 w-5 mr-2" /> Start Interview
              </Button>
            )}
            {session.route === 'uk_student' && phase === 'prep' && (
              <Button size="lg" className="px-8 h-12 text-base font-semibold" onClick={startAnswerNow}>
                <Play className="h-5 w-5 mr-2" /> Start Answer
              </Button>
            )}
            {session.route === 'uk_student' && phase === 'answer' && (
              <Button size="lg" className="px-8 h-12 text-base font-semibold" onClick={finalizeAnswer}>
                <Square className="h-4 w-4 mr-2" /> Stop & Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {session.route === 'usa_f1' && session.status === 'active' && (
              <Button 
                size="lg" 
                className="px-8 h-12 text-base font-semibold" 
                onClick={() => {
                  const text = currentTranscript.trim()
                  processAnswer(text.length >= 1 ? text : '[No response]')
                }} 
                disabled={processingRef.current}
              >
                {processingRef.current ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>Next Question <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <div className="hidden">
        <AssemblyAITranscription
          onTranscriptComplete={handleTranscriptComplete}
          onTranscriptUpdate={(t) => {
            if (session.status !== 'active') return
            if (session.route === 'uk_student') {
              if (phase !== 'answer') return
              const combined = answerBufferRef.current ? `${answerBufferRef.current} ${t}` : t
              setCurrentTranscript(combined)
            } else {
              setCurrentTranscript(t)
            }
          }}
          showControls={false}
          showTranscripts={false}
          running={session.status === 'active' && (session.route === 'usa_f1' || (session.route === 'uk_student' && phase === 'answer'))}
          resetKey={resetKey}
        />
      </div>
    </div>
  )
}
