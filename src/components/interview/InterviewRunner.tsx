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
  // Track last ASR confidence from transcript segments
  const lastASRConfidenceRef = useRef<number | undefined>(undefined)
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
    }
  }, [])

  // Preflight permission request in the interview tab: ask for camera and mic access
  // without starting any recording until the user clicks Start Interview.
  // Attempt immediately on mount so the browser shows the prompt right away.
  useEffect(() => {
    if (preflightRef.current) return
    preflightRef.current = true
    requestPermissions()
  }, [requestPermissions])

  // Also attempt after session is loaded and we are in preparing state.
  useEffect(() => {
    if (!session || session.status !== 'preparing' || permissionsReady) return
    requestPermissions()
  }, [session, permissionsReady, requestPermissions])

  // If the tab wasn’t focused when opened, retry once when it becomes visible
  useEffect(() => {
    if (!session || session.status !== 'preparing' || permissionsReady) return
    const handler = () => {
      if (document.visibilityState === 'visible' && !permissionsReady) {
        requestPermissions()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [session, permissionsReady, requestPermissions])

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
    if (session.route === 'uk_student') startPhase('prep', 30)
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
              bodyLanguage: bodyScore || undefined,
              assemblyConfidence: lastASRConfidenceRef.current,
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
        } catch {}
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
      // UK flow: new question => 30s prep again
      if (session.route === 'uk_student') startPhase('prep', 30)
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
    // Track last ASR confidence
    if (typeof t.confidence === 'number') {
      lastASRConfidenceRef.current = t.confidence
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
    // Non-UK: finalize immediately on a completed segment (existing behavior)
    processingRef.current = true
    await processAnswer(t.text.trim())
  }

  const computeFinalReport = async (finalApiSession: any) => {
    try {
      const res = await fetch('/api/interview/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: session?.route,
          studentProfile: finalApiSession.studentProfile,
          conversationHistory: finalApiSession.conversationHistory,
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
  const bodyScoreValue = Math.round((bodyScore?.overallScore ?? 0))
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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Permission overlay to ensure browser prompt appears first */}
      {!permissionsReady && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="max-w-sm w-full mx-4">
            <CardHeader>
              <CardTitle>Allow Camera & Microphone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Please click <span className="font-medium">Allow</span> in the browser prompt. If you don’t see it, click the button below to trigger it.</p>
              {permError && <div className="text-xs text-destructive/80">{permError}</div>}
              <Button className="w-full" onClick={requestPermissions}><Play className="h-4 w-4 mr-2" /> Allow Camera & Mic</Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Header & Session Stats */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/10 via-background to-background p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{session.route === 'uk_student' ? 'UK Pre-CAS' : 'Interview'}</Badge>
            <Badge variant="outline">{session.studentName}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Progress {progressPct}%</Badge>
            {phaseLabel && (
              <Badge variant={phase === 'prep' ? 'secondary' : 'default'}>
                {phaseLabel}: {secondsRemaining}s
              </Badge>
            )}
            <Badge variant="outline">Body {bodyScoreValue}/100</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 2xl:col-span-8">
          <InterviewStage
            running={session.status === 'active'}
            preview={permissionsReady && session.status === 'preparing'}
            questionCategory={session.status === 'preparing' ? '' : (currentQuestion?.category || '')}
            questionText={currentQuestion?.question || ''}
            currentTranscript={currentTranscript}
            onScore={setBodyScore}
            startedAt={session.startTime}
            statusBadge={session.status === 'active' ? 'Live' : 'Preparing'}
            candidateName={session.studentName}
            questionIndex={session.currentQuestionIndex}
            questionTotal={session.route === 'uk_student' ? 16 : session.questions.length}
            phase={phase ?? undefined}
            secondsRemaining={phase ? secondsRemaining : undefined}
            onStartAnswer={session.route === 'uk_student' ? startAnswerNow : undefined}
            onStopAndNext={session.route === 'uk_student' ? finalizeAnswer : undefined}
            showCaptions={false}
            showQuestionOverlay={false}
            showBodyBadge={false}
          />
        </div>
        <div className="lg:col-span-4 2xl:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Current Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.status !== 'preparing' ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{currentQuestion?.category}</Badge>
                    <Badge variant="outline">Q{session.currentQuestionIndex + 1}{session.route === 'uk_student' ? '/16' : ''}</Badge>
                  </div>
                  <div className="text-xl lg:text-2xl font-medium leading-snug">{currentQuestion?.question}</div>
                </>
              ) : (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  The first question will appear after you click <span className="font-medium">Start Interview</span>.
                </div>
              )}
              {session.route === 'uk_student' && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {phase === 'prep' && (
                    <div>Prep time active. Microphone is off. You have <span className="font-medium">{secondsRemaining}s</span> to prepare.</div>
                  )}
                  {phase === 'answer' && (
                    <div>Answer time active. Transcription is running. You have <span className="font-medium">{secondsRemaining}s</span> remaining.</div>
                  )}
                  {session.status === 'preparing' && (
                    <div>Camera preview and mic check are enabled so you can verify they work. Nothing is recorded until you click <span className="font-medium">Start Interview</span>.</div>
                  )}
                </div>
              )}
              <Separator className="my-2" />
              {session.status === 'preparing' ? (
                <div className="space-y-2">
                  {!permissionsReady && (
                    <div className="space-y-2">
                      <Button variant="secondary" className="w-full" onClick={requestPermissions}>Allow Camera & Mic</Button>
                      {permError ? (
                        <div className="text-xs text-destructive/80">{permError}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Click to allow browser permissions before starting.</div>
                      )}
                    </div>
                  )}
                  {permissionsReady && (
                    <div className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-medium">Mic Check</div>
                        <div className="text-muted-foreground">{Math.round((micLevel || 0) * 100)}%</div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded">
                        <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.round((micLevel || 0) * 100))}%` }} />
                      </div>
                      {micError && <div className="text-xs text-destructive/80">{micError}</div>}
                      <div className="text-[10px] text-muted-foreground">Speak to see the bar move. This is only a preview and isn’t recorded.</div>
                    </div>
                  )}
                  <Button className="w-full" onClick={beginInterview}><Play className="h-4 w-4 mr-2" /> Start Interview</Button>
                </div>
              ) : session.route === 'uk_student' && phase === 'prep' ? (
                <Button className="w-full" onClick={startAnswerNow}><Play className="h-4 w-4 mr-2" /> Start Answer</Button>
              ) : session.route === 'uk_student' && phase === 'answer' ? (
                <Button className="w-full" onClick={finalizeAnswer}><Square className="h-4 w-4 mr-2" /> Stop & Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm md:text-base text-muted-foreground">Maintain eye contact, speak clearly, and keep answers concise. For UK pre-CAS, you get 30s to prepare and 30s to answer each question.</p>
            </CardContent>
          </Card>
        </div>
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
          running={session.status === 'active' && (session.route !== 'uk_student' || phase === 'answer')}
          resetKey={resetKey}
        />
      </div>
    </div>
  )
}
