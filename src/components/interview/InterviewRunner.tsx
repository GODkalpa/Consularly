"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { InterviewStageProps } from '@/components/interview/InterviewStage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, ChevronRight, Loader2, Play, Square, Award, TrendingUp, Target, Lightbulb, MessageSquare, AlertCircle, Star, BookOpen, DollarSign, GraduationCap, Users, Eye } from 'lucide-react'
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription'
import { useMicLevel } from '@/hooks/use-mic-level'
import type { TranscriptionResult } from '@/lib/assemblyai-service'
import { mapQuestionTypeToCategory, type InterviewRoute } from '@/lib/interview-routes'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import { auth } from '@/lib/firebase'

// Dynamically import the heavy InterviewStage (TensorFlow/MediaPipe) client-only to reduce initial bundle size
const InterviewStage = dynamic<InterviewStageProps>(
  () => import('@/components/interview/InterviewStage').then((m) => m.InterviewStage),
  { ssr: false }
)

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

// Helper function to get interview display title
const getInterviewTitle = (route: InterviewRoute): string => {
  switch (route) {
    case 'usa_f1':
      return 'USA F1 Interview'
    case 'uk_student':
      return 'UK Pre-CAS Interview'
    case 'france_ema':
      return 'France EMA Interview'
    case 'france_icn':
      return 'France ICN Interview'
    default:
      return 'Interview'
  }
}

// Helper function to check if route uses UK-style prep/answer phases
const usesPhaseSystem = (route: InterviewRoute): boolean => {
  return route === 'uk_student' || route === 'france_ema' || route === 'france_icn'
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
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const answerBufferRef = useRef<string>('')
  // Track ASR confidence from transcript segments (per-segment and aggregated)
  const asrConfidencesRef = useRef<number[]>([])
  const [latestAsrConfidence, setLatestAsrConfidence] = useState<number | null>(null)
  const captureBodyScoreRef = useRef<(() => BodyLanguageScore | null) | null>(null)
  // Persist targets
  const firestoreInterviewIdRef = useRef<string | null>(null)
  const scopeRef = useRef<'org'|'user'|null>(null)
  // PERFORMANCE FIX: Debounce transcript updates to reduce re-renders (increased to 300ms)
  const transcriptDebounceRef = useRef<number | null>(null)
  // PERFORMANCE FIX: Use ref for phase to avoid timer callback recreation
  const phaseRef = useRef<'prep' | 'answer' | null>(null)
  // Per-answer combined performance results (includes body language)
  const [perfList, setPerfList] = useState<Array<{ overall: number; categories: { content: number; speech: number; bodyLanguage: number } }>>([])
  const [finalReport, setFinalReport] = useState<null | {
    decision: 'accepted' | 'rejected' | 'borderline'
    overall: number
    dimensions: Record<string, number>
    summary: string
    detailedInsights?: Array<{
      category: string
      type: 'strength' | 'weakness'
      finding: string
      example?: string
      actionItem: string
    }>
    strengths?: string[]
    weaknesses?: string[]
    recommendations: string[]
  }>(null)
  const preflightRef = useRef<boolean>(false)
  const permissionRequestingRef = useRef<boolean>(false)
  const [permissionsReady, setPermissionsReady] = useState<boolean>(false)
  const [permError, setPermError] = useState<string | null>(null)
  const { running: micRunning, level: micLevel, error: micError, start: startMic, stop: stopMic } = useMicLevel()

  // load initial payload from localStorage seeded by the starter page
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 5
    
    const loadSession = () => {
      try {
        if (!id) {
          console.error('[InterviewRunner] No ID provided')
          return
        }
        const key = `interview:init:${id}`
        console.log(`[InterviewRunner] Attempt ${retryCount + 1}/${maxRetries} - Looking for key:`, key)
        
        // Try localStorage first (cross-tab storage)
        const raw = localStorage.getItem(key)
        
        if (!raw) {
          // Retry if data not found yet (storage might be writing)
          retryCount++
          console.warn(`[InterviewRunner] Data not found, retry ${retryCount}/${maxRetries}`)
          if (retryCount < maxRetries) {
            setTimeout(loadSession, 200 * retryCount) // exponential backoff
            return
          }
          // Max retries reached, data not found
          console.error('[InterviewRunner] Interview session data not found in localStorage after retries')
          setLoading(false)
          return
        }
        
        console.log('[InterviewRunner] Session data found, parsing...')
        
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
        // Persist context
        if (init.firestoreInterviewId) {
          firestoreInterviewIdRef.current = String(init.firestoreInterviewId)
          console.log('[InterviewRunner] Set firestoreInterviewId:', firestoreInterviewIdRef.current)
        } else {
          firestoreInterviewIdRef.current = null
          console.warn('[InterviewRunner] No firestoreInterviewId in init data!')
        }
        if (init.scope === 'org' || init.scope === 'user') {
          scopeRef.current = init.scope
          console.log('[InterviewRunner] Set scope:', scopeRef.current)
        } else {
          scopeRef.current = null
          console.warn('[InterviewRunner] Invalid or missing scope!', init.scope)
        }
        console.log('[InterviewRunner] Session loaded successfully:', s.id)
        setLoading(false)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[InterviewRunner] Error loading interview session:', e)
        setLoading(false)
      }
    }
    
    loadSession()
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
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
    }
  }, [])

  // PERFORMANCE FIX: Use requestAnimationFrame for smooth timer updates instead of setInterval
  const timerStartTimeRef = useRef<number>(0)
  const timerDurationRef = useRef<number>(0)
  const timerRafRef = useRef<number | null>(null)
  const lastSecondsSentRef = useRef<number>(-1)
  const finalizeAnswerRef = useRef<(() => void) | null>(null)
  
  // PERFORMANCE FIX: Stable timer callback with NO dependencies to prevent recreation
  const updateTimer = useCallback(() => {
    const elapsed = (performance.now() - timerStartTimeRef.current) / 1000
    const remaining = Math.max(0, timerDurationRef.current - elapsed)
    const roundedRemaining = Math.ceil(remaining)
    
    if (roundedRemaining !== lastSecondsSentRef.current) {
      lastSecondsSentRef.current = roundedRemaining
      setSecondsRemaining(roundedRemaining)
    }
    
    if (remaining > 0.1) {
      // Continue timer updates
      timerRafRef.current = requestAnimationFrame(updateTimer)
    } else {
      // Timer completed - use ref-based phase to avoid callback recreation
      if (phaseRef.current === 'prep') {
        phaseRef.current = 'answer'
        setPhase('answer')
        timerStartTimeRef.current = performance.now()
        timerDurationRef.current = 30
        setResetKey((k) => k + 1)
        answerBufferRef.current = ''
        setCurrentTranscript('')
        timerRafRef.current = requestAnimationFrame(updateTimer)
      } else {
        // Use ref to call finalizeAnswer to avoid dependency
        finalizeAnswerRef.current?.()
      }
    }
  }, []) // NO dependencies - timer stays stable!

  const startPhase = useCallback((p: 'prep' | 'answer', durationSec: number) => {
    // Clear old timers
    if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
    
    // PERFORMANCE FIX: Update both state and ref to keep them in sync
    phaseRef.current = p
    setPhase(p)
    setSecondsRemaining(durationSec)
    if (p === 'prep') {
      setCurrentTranscript('')
      setLatestAsrConfidence(null) // Reset audio quality indicator
    }
    if (p === 'answer') {
      answerBufferRef.current = ''
      setCurrentTranscript('')
      // Clear ASR confidence buffer for new answer
      asrConfidencesRef.current = []
      setLatestAsrConfidence(null) // Reset audio quality indicator
    }
    
    // Start smooth RAF-based timer
    timerStartTimeRef.current = performance.now()
    timerDurationRef.current = durationSec
    lastSecondsSentRef.current = -1 // Reset to force immediate UI update
    timerRafRef.current = requestAnimationFrame(updateTimer)
  }, [updateTimer])

  const beginInterview = async () => {
    if (!session) return
    if (!permissionsReady) {
      const ok = await requestPermissions()
      if (!ok) return
    }
    setSession((prev) => (prev ? { ...prev, status: 'active', startTime: new Date() } : prev))
    // Mark interview as in_progress in Firestore if available
    try {
      const interviewId = firestoreInterviewIdRef.current
      const scope = scopeRef.current
      if (interviewId && scope) {
        const token = await auth.currentUser?.getIdToken()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const url = scope === 'org'
          ? `/api/org/interviews/${interviewId}`
          : `/api/interviews/${interviewId}`
        await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ status: 'in_progress' }) })
      }
    } catch {}
    if (session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') {
      startPhase('prep', 30)
    } else if (session.route === 'usa_f1') {
      // USA F1: 40s soft cap per question with 30s warning
      startUSF1QuestionTimer()
    }
  }

  const startUSF1QuestionTimer = useCallback(() => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
    
    // Clear ASR confidence for new question
    asrConfidencesRef.current = []
    setLatestAsrConfidence(null)
    
    // Use RAF-based timer for USA F1 as well
    timerStartTimeRef.current = performance.now()
    timerDurationRef.current = 40
    setSecondsRemaining(40)
    timerRafRef.current = requestAnimationFrame(updateTimer)
  }, [updateTimer])

  const startAnswerNow = useCallback(() => {
    const isUKorFrance = session?.route === 'uk_student' || session?.route === 'france_ema' || session?.route === 'france_icn'
    if (!isUKorFrance) return
    if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
    setResetKey((k) => k + 1)
    answerBufferRef.current = ''
    setCurrentTranscript('')
    startPhase('answer', 30)
  }, [session?.route, startPhase])

  // Define computeFinalReport first to avoid circular dependency
  const computeFinalReport = useCallback(async (finalApiSession: any) => {
    console.log('📄 Starting final report generation...', {
      route: session?.route,
      conversationLength: finalApiSession.conversationHistory?.length,
      perAnswerScoresCount: perfList?.length,
    })
    
    try {
      // CRITICAL FIX: Add 30-second timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Final report API timeout (30s) - using fallback')
        controller.abort()
      }, 30000)
      
      // CRITICAL FIX: Pass per-answer scores to final evaluation for consistency
      const res = await fetch('/api/interview/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: session?.route,
          studentProfile: finalApiSession.studentProfile,
          conversationHistory: finalApiSession.conversationHistory,
          perAnswerScores: perfList,  // Include detailed per-answer scoring data
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Final report generated successfully:', {
          decision: data.decision,
          overall: data.overall,
          dimensionsCount: Object.keys(data.dimensions || {}).length,
        })
        setFinalReport(data)
      } else {
        console.warn('⚠️ Final report API returned error:', res.status, res.statusText)
        const errorText = await res.text().catch(() => 'Unknown error')
        console.error('API Error details:', errorText)
        const fallbackReport = {
          decision: 'borderline' as const,
          overall: combinedAggregate?.overall || 60,
          dimensions: { communication: 60, credibility: 60 },
          summary: 'Final AI evaluation unavailable (API error ' + res.status + '). Using heuristic scoring based on per-answer analysis. Your performance scored an average of ' + (combinedAggregate?.overall || 60) + '/100 across all questions.',
          detailedInsights: [],
          strengths: [],
          weaknesses: ['Technical error prevented detailed AI analysis - API returned error ' + res.status],
          recommendations: ['Add more concrete details (numbers, evidence).', 'Clarify financial maintenance and accommodation arrangements.']
        }
        console.log('🔄 Setting fallback report due to API error:', fallbackReport)
        setFinalReport(fallbackReport)
      }
    } catch (e: any) {
      console.error('❌ Final report generation failed:', e?.name, e?.message)
      
      // CRITICAL: Provide fallback report so interview data is still saved
      const isTimeout = e?.name === 'AbortError'
      const fallbackReport = {
        decision: 'borderline' as const,
        overall: combinedAggregate?.overall || 60,
        dimensions: { communication: 60, credibility: 60 },
        summary: isTimeout 
          ? 'Final AI evaluation timed out after 30 seconds. Using heuristic scoring based on per-answer analysis. Your performance scored an average of ' + (combinedAggregate?.overall || 60) + '/100 across all questions.'
          : 'Final AI evaluation failed due to a technical error. Using heuristic scoring based on per-answer analysis.',
        detailedInsights: [],
        strengths: [],
        weaknesses: ['Technical error prevented detailed AI analysis - please contact support if this persists'],
        recommendations: ['Add more concrete details (numbers, evidence).', 'Clarify financial maintenance and accommodation arrangements.']
      }
      console.log('🔄 Setting fallback report due to error:', fallbackReport)
      setFinalReport(fallbackReport)
    }
  }, [session?.route, perfList, combinedAggregate])

  // Define processAnswer before finalizeAnswer to avoid initialization error
  const processAnswer = useCallback(async (transcriptText: string) => {
    if (!session || session.status !== 'active' || !apiSession) return
    try {
      // Stop timers
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
      
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
      
      // PERFORMANCE FIX: Run scoring and next question generation in PARALLEL
      // This cuts latency in half by not waiting for scoring to complete
      const currentQText = session.questions[session.currentQuestionIndex]?.question || ''
      const ic = {
        visaType: apiSession.visaType,
        route: session.route,
        studentProfile: apiSession.studentProfile,
        conversationHistory: apiSession.conversationHistory.map((h: any) => ({ question: h.question, answer: h.answer, timestamp: h.timestamp }))
      }
      
      // Persist helper and start both API calls simultaneously
      const orderValue = session.currentQuestionIndex + 1
      const words = transcriptText ? transcriptText.trim().split(/\s+/).filter(w => w.length > 0).length : 0
      const MIN_WORD_COUNT = 10 // Minimum words for a valid answer
      
      // CRITICAL FIX: If answer is too brief (< 10 words), give 0 for content/speech
      // This prevents gaming the system by clicking "Next" without speaking
      const isTooShort = words < MIN_WORD_COUNT
      const contentHeuristic = isTooShort ? 0 : Math.min(100, Math.round(words * 3))
      const speechHeuristic = isTooShort ? 0 : (typeof avgConfidence === 'number' ? Math.round(avgConfidence * 100) : 70)
      const bodyHeuristic = capturedBodyScore ? Math.round(capturedBodyScore.overallScore) : 0
      
      // Overall score with proper weights: 70% content, 20% speech, 10% body
      const perfFallback = {
        overall: Math.round(0.7 * contentHeuristic + 0.2 * speechHeuristic + 0.1 * bodyHeuristic),
        categories: { content: contentHeuristic, speech: speechHeuristic, bodyLanguage: bodyHeuristic }
      }
      
      if (isTooShort) {
        console.warn(`⚠️ [Fallback Scoring] Answer too brief (${words} words < ${MIN_WORD_COUNT} minimum) - using fallback: ${perfFallback.overall}/100`)
      }
      const persistResponse = async (
        orderParam: number,
        perfPayload: { overall: number; categories: { content: number; speech: number; bodyLanguage: number } }
      ) => {
        const interviewId = firestoreInterviewIdRef.current
        const scope = scopeRef.current
        if (!interviewId || !scope) return
        try {
          const token = await auth.currentUser?.getIdToken()
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          const url = scope === 'org'
            ? `/api/org/interviews/${interviewId}/responses`
            : `/api/interviews/${interviewId}/responses`
          await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              order: orderParam,
              question: currentQText,
              answer: transcriptText,
              perf: perfPayload,
              bodyLanguageOverall: capturedBodyScore?.overallScore ?? null,
              asrConfidence: typeof avgConfidence === 'number' ? Math.round(avgConfidence * 100) : null,
              timestamp: new Date().toISOString(),
            })
          })
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[InterviewRunner] Persist response failed', e)
        }
      }

      // Start both API calls simultaneously
      const [scoringPromise, nextQuestionPromise] = [
        fetch('/api/interview/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQText,
            answer: transcriptText,
            bodyLanguage: capturedBodyScore || undefined,
            assemblyConfidence: avgConfidence,
            interviewContext: ic,
            // Pass session memory to enhance contradiction detection and fair scoring
            sessionMemory: apiSession?.sessionMemory,
          })
        }).then(async (resScore) => {
          if (resScore.ok) {
            const data = await resScore.json()
            if (typeof data?.overall === 'number' && data?.categories) {
              const normalized = {
                overall: Math.round(data.overall),
                categories: {
                  content: Math.round(data.categories.content ?? 0),
                  speech: Math.round(data.categories.speech ?? 0),
                  bodyLanguage: Math.round(data.categories.bodyLanguage ?? 0),
                }
              }
              console.log('✅ Scoring API success - adding to perfList:', normalized)
              setPerfList((prev) => [...prev, normalized])
              await persistResponse(orderValue, normalized)
            } else {
              console.warn('⚠️ Invalid scoring response - using fallback')
              setPerfList((prev) => [...prev, perfFallback])
              await persistResponse(orderValue, perfFallback)
            }
          } else {
            console.warn('⚠️ Scoring API error - using fallback')
            setPerfList((prev) => [...prev, perfFallback])
            await persistResponse(orderValue, perfFallback)
          }
        }).catch(async err => { 
          console.error('❌ Scoring API failed:', err)
          setPerfList((prev) => [...prev, perfFallback])
          await persistResponse(orderValue, perfFallback)
        }),
        
        fetch('/api/interview/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'answer', sessionId: apiSession.id, session: apiSession, answer: transcriptText })
        })
      ]
      
      // Wait only for next question (scoring runs in background)
      const res = await nextQuestionPromise
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
        // compute final report - this will trigger setFinalReport
        await computeFinalReport(updated)
        // Wait for scoring to complete
        try { await scoringPromise } catch {}
        // Set session to completed - the finalization useEffect will wait for finalReport
        setSession((prev) => prev ? { ...prev, status: 'completed' } : prev)
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
      
      // UK/France flow: new question => 30s prep again
      if (session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') {
        startPhase('prep', 30)
      } else if (session.route === 'usa_f1') {
        // USA F1: restart 40s timer for next question
        startUSF1QuestionTimer()
      }
      
      // Scoring continues in background - no need to await
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      processingRef.current = false
      setResetKey((k) => k + 1)
    }
  }, [session, apiSession, startPhase, startUSF1QuestionTimer, computeFinalReport])

  const finalizeAnswer = useCallback(async () => {
    if (processingRef.current || isProcessingTranscript) return
    processingRef.current = true
    setIsProcessingTranscript(true)
    
    console.log('🎙️ [STT] Finalizing answer - starting 2.5s grace period for final transcript segments...')
    
    if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current)
    
    // CRITICAL FIX: Wait 2.5 seconds to allow AssemblyAI to finalize ALL transcript segments
    // This ensures we capture every single word spoken by the user
    const currentBufferBefore = answerBufferRef.current
    console.log(`🎙️ [STT] Buffer before grace period: "${currentBufferBefore}" (${currentBufferBefore.length} chars)`)
    
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // After grace period, capture the complete accumulated transcript
    const finalText = answerBufferRef.current.trim()
    console.log(`🎙️ [STT] Buffer after grace period: "${finalText}" (${finalText.length} chars)`)
    console.log(`🎙️ [STT] Words captured: ${finalText.split(/\s+/).filter(w => w.length > 0).length}`)
    
    setIsProcessingTranscript(false)
    await processAnswer(finalText.length >= 1 ? finalText : '[No response]')
  }, [isProcessingTranscript, processAnswer])
  
  // PERFORMANCE FIX: Keep finalizeAnswerRef in sync with finalizeAnswer
  useEffect(() => {
    finalizeAnswerRef.current = finalizeAnswer
  }, [finalizeAnswer])

  const handleTranscriptComplete = async (t: TranscriptionResult) => {
    if (!session || session.status !== 'active') return
    
    // CRITICAL FIX: Track ASR confidence for ALL segments (accumulate for averaging)
    if (typeof t.confidence === 'number' && t.confidence > 0) {
      asrConfidencesRef.current.push(t.confidence)
      setLatestAsrConfidence(t.confidence) // Update real-time audio quality indicator
      console.log('🎤 [STT] ASR confidence:', Math.round(t.confidence * 100) + '%', `(${asrConfidencesRef.current.length} segments)`)
    }
    
    const text = t.text.trim()
    if (!text) return
    
    // CRITICAL FIX: Accumulate ALL final transcript segments for ALL routes
    // This ensures we capture every single word spoken by the user
    console.log(`🎙️ [STT] Final segment received: "${text}" (${text.split(/\s+/).length} words)`)
    
    // Append to buffer (add space if buffer already has content)
    const newBuffer = answerBufferRef.current ? `${answerBufferRef.current} ${text}` : text
    answerBufferRef.current = newBuffer
    console.log(`🎙️ [STT] Buffer updated: "${newBuffer}" (${newBuffer.length} chars total)`)
    
    // UK/France: Only show transcript during answer phase
    if (session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') {
      if (phase !== 'answer') return
      setCurrentTranscript(answerBufferRef.current)
      return
    }
    
    // USA F1: Accumulate transcript and show immediately
    if (session.route === 'usa_f1') {
      setCurrentTranscript(answerBufferRef.current)
      return
    }
    
    // Other routes: legacy behavior (if any)
    setCurrentTranscript(answerBufferRef.current)
  }

  // PERFORMANCE FIX: Memoize expensive computations to prevent recalculation on every render
  const currentQuestion = useMemo(() => session?.questions[session.currentQuestionIndex], [session?.questions, session?.currentQuestionIndex])
  
  const progressPct = useMemo(() => {
    if (!session) return 0
    if (session.status === 'preparing') return 0
    const total = session.route === 'uk_student' ? 16 : (session.route === 'france_ema' || session.route === 'france_icn') ? 10 : session.questions.length
    return Math.round(((session.currentQuestionIndex + 1) / total) * 100)
  }, [session])
  
  const phaseLabel = useMemo(() => phase ? (phase === 'prep' ? 'Prep' : 'Answer') : null, [phase])
  
  // PERFORMANCE FIX: Memoize interview title to avoid recalculation
  const interviewTitle = useMemo(() => getInterviewTitle(session?.route || 'usa_f1'), [session?.route])

  // Aggregate combined performance across answers (shown on completion)
  const combinedAggregate = useMemo(() => {
    if (!perfList.length) {
      console.warn('⚠️ No per-answer scores available (perfList is empty)')
      return null
    }
    const sum = perfList.reduce((acc, s) => {
      acc.overall += s.overall
      acc.content += s.categories.content
      acc.speech += s.categories.speech
      acc.body += s.categories.bodyLanguage
      return acc
    }, { overall: 0, content: 0, speech: 0, body: 0 })
    const n = perfList.length
    const result = {
      overall: Math.round(sum.overall / n),
      categories: {
        content: Math.round(sum.content / n),
        speech: Math.round(sum.speech / n),
        bodyLanguage: Math.round(sum.body / n),
      }
    }
    console.log('📊 Combined aggregate scores calculated:', result)
    return result
  }, [perfList])

  // Finalize interview record in Firestore (user or org scope) when completed
  useEffect(() => {
    const interviewId = firestoreInterviewIdRef.current
    const scope = scopeRef.current
    
    console.log('[Finalize] useEffect triggered', { 
      interviewId, 
      scope, 
      sessionStatus: session?.status,
      hasScore: typeof finalReport?.overall === 'number',
      hasFinalReport: !!finalReport,
      hasCombinedAggregate: !!combinedAggregate
    })
    
    if (!interviewId || !scope) {
      console.warn('[Finalize] Skipping - missing interviewId or scope', { interviewId, scope })
      return
    }
    if (!session || session.status !== 'completed') {
      console.log('[Finalize] Skipping - session not completed', { status: session?.status })
      return
    }
    
    // CRITICAL FIX: Wait for finalReport to be ready before saving
    // This prevents saving incomplete data to Firestore
    if (!finalReport) {
      console.log('[Finalize] Skipping - waiting for finalReport to be ready')
      return
    }

    const score = typeof finalReport?.overall === 'number' ? Math.round(finalReport.overall)
      : (combinedAggregate ? combinedAggregate.overall : undefined)

    const scoreDetails = combinedAggregate ? {
      communication: combinedAggregate.categories.content,
      technical: combinedAggregate.categories.speech,
      confidence: combinedAggregate.categories.bodyLanguage,
      overall: combinedAggregate.overall,
    } : undefined

    ;(async () => {
      try {
        // Force refresh token to prevent expiration issues
        const token = await auth.currentUser?.getIdToken(true)
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const url = scope === 'org'
          ? `/api/org/interviews/${interviewId}`
          : `/api/interviews/${interviewId}`
        
        // Prepare conversation history from apiSession
        const conversationHistory = apiSession?.conversationHistory?.map((h: any) => ({
          question: h.question,
          answer: h.answer,
          timestamp: h.timestamp,
          questionType: h.questionType,
        })) || []
        
        const body: any = {
          status: 'completed',
          endTime: new Date().toISOString(),
        }
        if (typeof score === 'number') body.score = score
        if (scoreDetails) body.scoreDetails = scoreDetails
        if (finalReport) body.finalReport = finalReport
        if (perfList.length > 0) body.perAnswerScores = perfList
        if (perfList.length > 0) body.completedQuestions = perfList.length
        if (conversationHistory.length > 0) body.conversationHistory = conversationHistory
        
        console.log('[Finalize] Sending PATCH', { url, hasFinalReport: !!finalReport, perfListLength: perfList.length })
        const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) })
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('[Finalize] PATCH failed', { status: res.status, error: errorText })
          throw new Error(`PATCH failed: ${res.status} - ${errorText}`)
        }
        
        console.log('[Finalize] Successfully updated interview to completed')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[InterviewRunner] Finalize interview patch failed', e)
      }
    })()
  }, [session?.status, combinedAggregate, finalReport, perfList, apiSession])

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

  // Animated Score Card Component
  const ScoreCard: React.FC<{
    title: string
    score: number
    maxScore: number
    status: string
    icon: React.ReactNode
    delay?: number
    color: string
  }> = ({ title, score, maxScore, status, icon, delay = 0, color }) => {
    const count = useMotionValue(0)
    const rounded = useTransform(count, (latest) => Math.round(latest))
    const progressValue = useMotionValue(0)

    React.useEffect(() => {
      const valueAnimation = animate(count, score, {
        duration: 1.5,
        delay,
        ease: [0.43, 0.13, 0.23, 0.96],
      })

      const progressAnimation = animate(progressValue, (score / maxScore) * 100, {
        duration: 1.5,
        delay,
        ease: [0.43, 0.13, 0.23, 0.96],
      })

      return () => {
        valueAnimation.stop()
        progressAnimation.stop()
      }
    }, [score, maxScore, delay])

    const radius = 70
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = useTransform(
      progressValue,
      (v) => circumference - (v / 100) * circumference
    )

    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay }}
      >
        <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl rounded-full" style={{ backgroundColor: color }}></div>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div style={{ color }}>{icon}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative flex items-center justify-center">
              <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
                <circle cx="90" cy="90" r={radius} strokeWidth="10" fill="transparent" className="stroke-muted/20" strokeDasharray="6 10" strokeLinecap="round" />
                <motion.circle cx="90" cy="90" r={radius} strokeWidth="10" fill="transparent" stroke={color} strokeDasharray={`${circumference} ${circumference}`} strokeLinecap="round" style={{ strokeDashoffset }} />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <motion.span className="text-5xl font-bold tracking-tighter">{rounded}</motion.span>
                <p className="text-lg font-medium text-muted-foreground">/ {maxScore}</p>
              </div>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: `${color}20`, color }}>{status}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (session.status === 'completed') {
    // DEBUG: Log render state
    console.log('🎬 Rendering completion screen:', {
      hasFinalReport: !!finalReport,
      hasCombinedAggregate: !!combinedAggregate,
      perfListLength: perfList.length,
      finalReportOverall: finalReport?.overall,
      finalReportDecision: finalReport?.decision,
    })
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 mb-4"
            >
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Interview Complete!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Great work, {session.studentName}! Here&apos;s your comprehensive performance analysis
            </p>
            {finalReport && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-3 bg-card rounded-full px-6 py-3 border-2 shadow-lg"
              >
                <Badge className={`text-sm px-3 py-1 ${finalReport.decision === 'accepted' ? 'bg-green-500 hover:bg-green-600' : finalReport.decision === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`}>
                  {finalReport.decision.charAt(0).toUpperCase() + finalReport.decision.slice(1)}
                </Badge>
                <Separator orientation="vertical" className="h-6" />
                <div className="text-xl font-bold">{finalReport.overall}<span className="text-sm text-muted-foreground">/100</span></div>
              </motion.div>
            )}
          </motion.div>


          {/* Animated Score Cards with Circular Progress */}
          {finalReport ? (
            <>
              {/* Show per-answer score cards only if available */}
              {combinedAggregate && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ScoreCard
                    title="Overall Performance"
                    score={combinedAggregate.overall}
                    maxScore={100}
                    status={combinedAggregate.overall >= 80 ? "Excellent" : combinedAggregate.overall >= 60 ? "Good" : "Needs Improvement"}
                    icon={<Award className="h-5 w-5" />}
                    delay={0.4}
                    color="#4840A3"
                  />
                  <ScoreCard
                    title="Content Quality"
                    score={combinedAggregate.categories.content}
                    maxScore={100}
                    status={combinedAggregate.categories.content >= 80 ? "Strong" : combinedAggregate.categories.content >= 60 ? "Adequate" : "Developing"}
                    icon={<Target className="h-5 w-5" />}
                    delay={0.5}
                    color="#F9CD6A"
                  />
                  <ScoreCard
                    title="Communication"
                    score={Math.round((combinedAggregate.categories.speech + combinedAggregate.categories.bodyLanguage) / 2)}
                    maxScore={100}
                    status={Math.round((combinedAggregate.categories.speech + combinedAggregate.categories.bodyLanguage) / 2) >= 80 ? "Outstanding" : "Proficient"}
                    icon={<TrendingUp className="h-5 w-5" />}
                    delay={0.6}
                    color="#9CBBFC"
                  />
                </div>
              )}

              {/* AI Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      AI Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-base leading-relaxed text-foreground">{finalReport.summary}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Dimensions */}
              {Object.keys(finalReport.dimensions).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-accent" />
                        Detailed Dimension Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(finalReport.dimensions).map(([k, v], idx) => (
                          <motion.div
                            key={k}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 + idx * 0.1 }}
                            className="bg-gradient-to-br from-muted/50 to-transparent rounded-xl p-5 border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-semibold capitalize text-foreground">{k}</div>
                              <Badge variant="outline" className="text-base font-bold">
                                {Math.round(v as number)}
                              </Badge>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round(v as number)}%` }}
                                transition={{ duration: 0.8, delay: 1.0 + idx * 0.1 }}
                                className={`h-full rounded-full ${
                                  Math.round(v as number) >= 75 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                    : Math.round(v as number) >= 50 
                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Strengths and Weaknesses */}
              {(finalReport.strengths?.length > 0 || finalReport.weaknesses?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  {finalReport.strengths?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <Card className="border-2 shadow-lg border-green-500/20 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                        <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Star className="h-5 w-5" />
                            Key Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            {finalReport.strengths.map((strength, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0 + i * 0.1 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/30"
                              >
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm leading-relaxed text-foreground">{strength}</p>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Weaknesses */}
                  {finalReport.weaknesses?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <Card className="border-2 shadow-lg border-orange-500/20 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
                          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <AlertCircle className="h-5 w-5" />
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            {finalReport.weaknesses.map((weakness, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0 + i * 0.1 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/30"
                              >
                                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm leading-relaxed text-foreground">{weakness}</p>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Detailed Insights */}
              {finalReport.detailedInsights?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Card className="border-2 shadow-lg border-primary/20">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Detailed AI-Powered Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {finalReport.detailedInsights.map((insight, i) => {
                          const categoryIcon = {
                            'Content Quality': Target,
                            'Financial': DollarSign,
                            'Course': GraduationCap,
                            'Communication': MessageSquare,
                            'Body Language': Eye,
                            'Intent': Users,
                          }[insight.category] || BookOpen

                          const IconComponent = categoryIcon
                          const isStrength = insight.type === 'strength'

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.1 + i * 0.05 }}
                              className={`p-5 rounded-xl border-2 ${
                                isStrength
                                  ? 'bg-gradient-to-r from-green-50/80 to-green-50/30 dark:from-green-950/30 dark:to-green-950/10 border-green-500/20'
                                  : 'bg-gradient-to-r from-orange-50/80 to-orange-50/30 dark:from-orange-950/30 dark:to-orange-950/10 border-orange-500/20'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 p-2 rounded-lg ${
                                  isStrength ? 'bg-green-100 dark:bg-green-900/50' : 'bg-orange-100 dark:bg-orange-900/50'
                                }`}>
                                  <IconComponent className={`h-5 w-5 ${
                                    isStrength ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                                  }`} />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={isStrength ? 'default' : 'secondary'} className={`text-xs ${
                                      isStrength ? 'bg-green-600' : 'bg-orange-600'
                                    }`}>
                                      {insight.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {isStrength ? 'Strength' : 'Needs Work'}
                                    </Badge>
                                  </div>
                                  <p className="font-semibold text-sm text-foreground">{insight.finding}</p>
                                  {insight.example && (
                                    <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                                      &ldquo;{insight.example}&rdquo;
                                    </p>
                                  )}
                                  <div className="pt-2">
                                    <p className="text-sm text-foreground flex items-start gap-2">
                                      <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span><strong>Action:</strong> {insight.actionItem}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Legacy Recommendations (fallback if no detailed insights) */}
              {(!finalReport.detailedInsights || finalReport.detailedInsights.length === 0) && finalReport.recommendations?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Card className="border-2 shadow-lg border-secondary/20">
                    <CardHeader className="bg-gradient-to-r from-secondary/10 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-accent" />
                        AI-Powered Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {finalReport.recommendations.map((r, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 + i * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-secondary/5 to-transparent hover:from-secondary/10 transition-colors border border-transparent hover:border-secondary/20"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-base leading-relaxed text-foreground">{r}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="flex justify-center gap-4 pt-6"
              >
                <Button size="lg" onClick={() => router.push('/admin')} className="px-8 text-base">
                  Back to Dashboard
                </Button>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Generating Your Final Report</h3>
                <p className="text-muted-foreground">Our AI is analyzing your performance...</p>
              </div>
            </motion.div>
          )}
        </div>
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
                    {interviewTitle} • Question {session.currentQuestionIndex + 1}{session.route === 'uk_student' ? ' of 16' : (session.route === 'france_ema' || session.route === 'france_icn') ? ' of 10' : ''}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-900 leading-snug">
                    {currentQuestion?.question}
                  </h1>
                  {(session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') && phase && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-100 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 dark:text-gray-800 leading-relaxed flex items-start gap-2">
                        {phase === 'prep' ? (
                          <>
                            <span className="text-lg flex-shrink-0">⏱️</span>
                            <div>
                              <span className="font-semibold block text-gray-900 mb-1">Preparation Time</span>
                              <span className="text-gray-600">You have <span className="font-bold text-primary">{secondsRemaining} seconds</span> to review the question silently.</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-lg flex-shrink-0">🎙️</span>
                            <div>
                              <span className="font-semibold block text-gray-900 mb-1">Recording Your Answer</span>
                              <span className="text-gray-600">Speak clearly. <span className="font-bold text-primary">{secondsRemaining} seconds</span> remaining.</span>
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
                          <span className="text-gray-600">You have <span className="font-bold text-primary">{Math.max(0, secondsRemaining)} seconds</span>. Click <span className="font-semibold">Next Question</span> when ready.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-medium mb-2">
                  {interviewTitle}
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

        {/* Right Panel - Video Section with Brand Gradient (70%) */}
        <div className="lg:w-[70%] bg-gradient-to-br from-primary via-primary-700 to-primary-900 relative overflow-hidden flex items-center justify-center p-8">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-8 w-32 h-32 grid grid-cols-8 gap-1 opacity-30">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
            ))}
          </div>

          {/* Audio Quality Indicator */}
          {session.status === 'active' && latestAsrConfidence !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 z-20"
            >
              <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎤</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 font-medium">Audio Quality</span>
                    <Badge 
                      variant={
                        latestAsrConfidence >= 0.7 ? 'default' : 
                        latestAsrConfidence >= 0.5 ? 'secondary' : 
                        'destructive'
                      }
                      className="text-xs px-2 py-0 mt-0.5"
                    >
                      {latestAsrConfidence >= 0.7 ? 'Excellent' : 
                       latestAsrConfidence >= 0.5 ? 'Good' : 
                       'Poor'} ({Math.round(latestAsrConfidence * 100)}%)
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
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
              questionTotal={session.route === 'uk_student' ? 16 : (session.route === 'france_ema' || session.route === 'france_icn') ? 10 : session.questions.length}
              phase={phase ?? undefined}
              secondsRemaining={session.route === 'usa_f1' || phase ? secondsRemaining : undefined}
              onStartAnswer={(session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') ? startAnswerNow : undefined}
              onStopAndNext={(session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') ? finalizeAnswer : undefined}
              onNext={session.route === 'usa_f1' && session.status === 'active' ? finalizeAnswer : undefined}
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
            {(session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') && phase === 'prep' && (
              <Button size="lg" className="px-8 h-12 text-base font-semibold" onClick={startAnswerNow}>
                <Play className="h-5 w-5 mr-2" /> Start Answer
              </Button>
            )}
            {(session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') && phase === 'answer' && (
              <Button 
                size="lg" 
                className="px-8 h-12 text-base font-semibold" 
                onClick={finalizeAnswer}
                disabled={isProcessingTranscript}
              >
                {isProcessingTranscript ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing transcription...</>
                ) : (
                  <><Square className="h-4 w-4 mr-2" /> Stop & Next <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            )}
            {session.route === 'usa_f1' && session.status === 'active' && (
              <Button 
                size="lg" 
                className="px-8 h-12 text-base font-semibold" 
                onClick={finalizeAnswer}
                disabled={processingRef.current || isProcessingTranscript}
              >
                {isProcessingTranscript ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing transcription...</>
                ) : processingRef.current ? (
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
        {/* CRITICAL FIX: Separate connection from recording to eliminate STT startup delay
            UK/France Routes:
            - connected={true} during BOTH prep AND answer phases → WebSocket ready
            - running={true} ONLY during answer phase → Audio capture starts immediately
            
            USA F1 Route:
            - Both connected AND running when status is active
            
            This ensures UK/France capture the first word when user starts speaking
        */}
        <AssemblyAITranscription
          onTranscriptComplete={handleTranscriptComplete}
          onTranscriptUpdate={(t) => {
            if (session.status !== 'active') return
            
            // PERFORMANCE FIX: Debounce transcript updates to 300ms to reduce re-renders (70% reduction)
            if (transcriptDebounceRef.current) {
              window.clearTimeout(transcriptDebounceRef.current)
            }
            
            transcriptDebounceRef.current = window.setTimeout(() => {
              if (session.route === 'uk_student') {
                if (phase !== 'answer') return
                const combined = answerBufferRef.current ? `${answerBufferRef.current} ${t}` : t
                setCurrentTranscript(combined)
              } else {
                setCurrentTranscript(t)
              }
            }, 300)
          }}
          showControls={false}
          showTranscripts={false}
          connected={
            session.status === 'active' && 
            (session.route === 'usa_f1' || 
             session.route === 'uk_student' || 
             session.route === 'france_ema' || 
             session.route === 'france_icn')
          }
          running={
            session.status === 'active' && 
            (session.route === 'usa_f1' || 
             ((session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') && phase === 'answer'))
          }
          resetKey={resetKey}
        />
      </div>
    </div>
  )
}
