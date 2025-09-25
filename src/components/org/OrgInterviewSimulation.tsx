'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Play, RotateCcw, Save, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { auth, firebaseEnabled } from '@/lib/firebase'
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription'
import { InterviewStage } from '@/components/interview/InterviewStage'
import { TranscriptionResult } from '@/lib/assemblyai-service'
import { mapQuestionTypeToCategory, defaultVisaTypeForRoute, type InterviewRoute, routeDisplayName } from '@/lib/interview-routes'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import { scorePerformance } from '@/lib/performance-scoring'
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
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([])
  const [studentId, setStudentId] = useState<string>(initialStudentId || '')
  const [studentName, setStudentName] = useState<string>(initialStudentName || '')
  const [route, setRoute] = useState<InterviewRoute>('usa_f1')

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

  // Timers
  const questionTimerRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<number | null>(null)
  const lastActivityAtRef = useRef<number>(0)
  const processingRef = useRef<boolean>(false)

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
          const list = (data.students || []).map((s: any) => ({ id: s.id, name: s.name }))
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

  const clearTimers = () => {
    if (questionTimerRef.current) { window.clearTimeout(questionTimerRef.current); questionTimerRef.current = null }
    if (silenceTimerRef.current) { window.clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
  }

  const clearPhaseTimers = () => {
    if (phaseTimerRef.current) { window.clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null }
    if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current); countdownTimerRef.current = null }
  }

  const finalizeAnswer = () => {
    if (processingRef.current) return
    processingRef.current = true
    clearPhaseTimers()
    const text = currentTranscript.trim()
    processAnswer(text.length >= 1 ? text : '[No response]')
  }

  const startPhase = (p: 'prep' | 'answer', durationSec: number) => {
    clearPhaseTimers()
    setPhase(p)
    setSecondsRemaining(durationSec)
    if (p === 'prep') {
      setCurrentTranscript('')
    }
    if (p === 'answer') {
      answerBufferRef.current = ''
      setCurrentTranscript('')
    }
    countdownTimerRef.current = window.setInterval(() => {
      setSecondsRemaining((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    phaseTimerRef.current = window.setTimeout(() => {
      if (p === 'prep') {
        // Switch to answer window
        setPhase('answer')
        setSecondsRemaining(30)
        // reset transcription stream
        setResetKey((k) => k + 1)
        answerBufferRef.current = ''
        setCurrentTranscript('')
        startPhase('answer', 30)
      } else {
        finalizeAnswer()
      }
    }, durationSec * 1000)
  }

  // UK: allow early start of answer during prep
  const startAnswerNow = () => {
    if (route !== 'uk_student') return
    clearPhaseTimers()
    setPhase('answer')
    setSecondsRemaining(30)
    setResetKey((k) => k + 1)
    answerBufferRef.current = ''
    setCurrentTranscript('')
    startPhase('answer', 30)
  }

  const armTimers = () => {
    if (route === 'uk_student') return // UK uses phase timers instead
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

    try {
      // Create interview via server API (enforces same-org)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')
      const createRes = await fetch('/api/org/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId, interviewType: 'visa', scheduledTime: new Date().toISOString(), duration: 30, route })
      })
      if (!createRes.ok) throw new Error(`Create interview failed: ${createRes.status}`)
      const created = await createRes.json()
      setFirestoreInterviewId(created.id as string)

      // Start LLM session
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId: studentId,
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: { name: studentName, country: 'Nepal' }
        })
      })
      if (!res.ok) throw new Error(`Failed to start session: ${res.status}`)
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

      // Redirect to dedicated interview page with init payload
      try {
        const key = `interview:init:${apiSess.id}`
        const payload = JSON.stringify({
          apiSession: seeded,
          firstQuestion: firstQ,
          route,
          studentName: studentName.trim(),
        })
        try { sessionStorage.setItem(key, payload) } catch {}
        try { localStorage.setItem(key, payload) } catch {}
      } catch {}
      // Open in a NEW TAB as requested
      try {
        const url = `/interview/${apiSess.id}`
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {
        router.push(`/interview/${apiSess.id}`)
      }
      return
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
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
    if (route === 'uk_student') {
      // Start with 30s preparation time (mic off), then 30s answer window
      startPhase('prep', 30)
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

      let combinedOverall = perf.overall
      let combinedCategories = perf.categories
      let aiFeedback: string | null = null
      let aiSuggestions: string[] | null = null

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
          }),
        })
        if (res.ok) {
          const data = await res.json()
          combinedOverall = data.overall ?? combinedOverall
          combinedCategories = data.categories ?? combinedCategories
          aiFeedback = data.summary || null
          aiSuggestions = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 3) : null
        }
      } catch {}

      const score10 = Math.min(10, Math.max(1, Math.round(combinedOverall / 10)))
      const fallbackFeedback = [
        ...perf.details.content.notes,
        ...perf.details.speech.notes,
        ...body.feedback,
      ].slice(0, 3).join(' ')
      const fallbackSuggestions: string[] = []
      if (perf.details.content.accuracyScore < 60) fallbackSuggestions.push('Address all parts of the question with specific examples.')
      if (perf.details.speech.fillerRate > 0.05) fallbackSuggestions.push('Reduce filler words and slow down slightly.')
      if ((bodyScore?.overallScore ?? body.overallScore) < 65) fallbackSuggestions.push('Maintain eye contact and sit upright.')

      const analysis = {
        score: score10,
        feedback: (aiFeedback || fallbackFeedback) || 'Good effort. Aim for clearer structure and specific details.',
        suggestions: (aiSuggestions && aiSuggestions.length ? aiSuggestions : (fallbackSuggestions.length ? fallbackSuggestions : ['Provide concrete numbers or evidence where possible.'])),
        bodyScore: bodyScore?.overallScore,
        perf: { overall: combinedOverall, categories: combinedCategories },
      }

      const newResponse = {
        question: currentQuestion.question,
        transcription: transcriptText,
        analysis,
        timestamp: new Date(),
      }

      setSession((prev) => (prev ? { ...prev, responses: [...prev.responses, newResponse] } : prev))
      setCurrentTranscript('')
      setLastAnsweredIndex(session.currentQuestionIndex)

      if (apiSession) {
        const res = await fetch('/api/interview/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            if (route === 'uk_student') {
              startPhase('prep', 30)
            }
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to analyze/process response:', e)
    } finally {
      setIsAnalyzing(false)
      setResetKey((k) => k + 1)
      processingRef.current = false
      if (route !== 'uk_student') {
        setTimeout(() => { if (session && session.status === 'active') armTimers() }, 0)
      }
    }
  }

  const handleTranscriptComplete = async (transcript: TranscriptionResult) => {
    if (!session || session.status !== 'active') return
    const transcriptText = transcript.text.trim()
    if (transcriptText.length < 1) return
    if (session.currentQuestionIndex === lastAnsweredIndex) return
    if (route === 'uk_student') {
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
    <div className='space-y-6'>
      {!session && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' /> Select Student
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder='Pick a student from your organization' />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Country</Label>
              <Select value={route} onValueChange={(v) => setRoute(v as InterviewRoute)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select interview country/route' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='usa_f1'>{routeDisplayName.usa_f1}</SelectItem>
                  <SelectItem value='uk_student'>{routeDisplayName.uk_student}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startNewSession} disabled={!studentId} className='w-full'>
              <Play className='h-4 w-4 mr-2' /> New Interview Session
            </Button>
          </CardContent>
        </Card>
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
              onNext={session.status === 'active' && route !== 'uk_student' ? () => {/* skip handled by timers */} : undefined}
              startedAt={session.startTime}
              statusBadge={session.status === 'active' ? 'Live' : session.status === 'paused' ? 'Paused' : 'Completed'}
              candidateName={session.studentName}
              questionIndex={session.currentQuestionIndex}
              questionTotal={route === 'uk_student' ? 16 : session.questions.length}
              phase={phase ?? undefined}
              secondsRemaining={phase ? secondsRemaining : undefined}
              onStartAnswer={route === 'uk_student' ? startAnswerNow : undefined}
              onStopAndNext={route === 'uk_student' ? finalizeAnswer : undefined}
            />
          )}

          <div className='hidden'>
            <AssemblyAITranscription
              onTranscriptComplete={handleTranscriptComplete}
              onTranscriptUpdate={(t) => {
                if (!session || session.status !== 'active') return
                if (route === 'uk_student') {
                  if (phase !== 'answer') return
                  const combined = answerBufferRef.current ? `${answerBufferRef.current} ${t}` : t
                  setCurrentTranscript(combined)
                } else {
                  setCurrentTranscript(t)
                }
                lastActivityAtRef.current = Date.now()
              }}
              showControls={false}
              showTranscripts={false}
              running={session.status === 'active' && (route !== 'uk_student' || phase === 'answer')}
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
    </div>
  )
}

export default OrgInterviewSimulation
