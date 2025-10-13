/**
 * Interview Simulation Component for Admin Dashboard
 * Integrates F1 visa questions with AssemblyAI real-time transcription
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  RotateCcw, 
  Save, 
  TrendingUp,
  CheckCircle,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription';
import { InterviewStage } from '@/components/interview/InterviewStage';
import { TranscriptionResult } from '@/lib/assemblyai-service';
import { mapQuestionTypeToCategory, defaultVisaTypeForRoute, type InterviewRoute, routeDisplayName } from '@/lib/interview-routes';
import type { BodyLanguageScore } from '@/lib/body-language-scoring';
import { useAuth } from '@/contexts/AuthContext';
import type { InterviewSession as ApiInterviewSession, QuestionGenerationResponse } from '@/lib/interview-simulation';
import { scorePerformance } from '@/lib/performance-scoring';
import { auth } from '@/lib/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InterviewQuestion {
  question: string;
  category: string;
}

interface UISession {
  id: string;
  studentName: string;
  startTime: Date;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  responses: Array<{
    question: string;
    transcription: string;
    analysis?: {
      score: number;
      feedback: string;
      suggestions: string[];
      bodyScore?: number;
      perf?: {
        overall: number;
        categories: { content: number; bodyLanguage: number; speech: number };
      };

    };
    timestamp: Date;
  }>;
  status: 'preparing' | 'active' | 'paused' | 'completed';
}

export function InterviewSimulation() {
  const { user } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<UISession | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [route, setRoute] = useState<InterviewRoute>('usa_f1');
  const [resetKey, setResetKey] = useState(0);
  const [studentProfile, setStudentProfile] = useState({
    degreeLevel: '' as 'undergraduate' | 'graduate' | 'doctorate' | 'other' | '',
    programName: '',
    universityName: '',
    programLength: '',
    programCost: '',
  });
  const [bodyScore, setBodyScore] = useState<BodyLanguageScore | null>(null);
  
  // DEBUG: Log whenever body score is updated
  const handleBodyScoreUpdate = useCallback((score: BodyLanguageScore) => {
    console.log('📥 [InterviewSimulation] Received body language score update:', {
      overall: Math.round(score.overallScore),
      posture: Math.round(score.posture.score),
      gestures: Math.round(score.gestures.score),
      expressions: Math.round(score.expressions.score),
    });
    setBodyScore(score);
    console.log('✅ [InterviewSimulation] bodyScore state updated');
  }, []);
  const [lastAnsweredIndex, setLastAnsweredIndex] = useState<number>(-1);
  const [showInsights, setShowInsights] = useState(false);
  const [apiSession, setApiSession] = useState<ApiInterviewSession | null>(null);
  const [currentLLMQuestion, setCurrentLLMQuestion] = useState<QuestionGenerationResponse | null>(null);
  const TARGET_QUESTIONS = 8; // default; UK completion handled server-side at 16
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [firestoreInterviewId, setFirestoreInterviewId] = useState<string | null>(null);

  // Timers and activity tracking
  const questionTimerRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  // UK-specific per-question phase timers
  const [phase, setPhase] = useState<'prep' | 'answer' | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const phaseTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Accumulates UK answer text across multiple final segments
  const answerBufferRef = useRef<string>('');

  const clearTimers = () => {
    if (questionTimerRef.current) {
      window.clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const clearPhaseTimers = useCallback(() => {
    if (phaseTimerRef.current) { window.clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null }
    if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current); countdownTimerRef.current = null }
    if (timerRafRef.current) { cancelAnimationFrame(timerRafRef.current); timerRafRef.current = null }
  }, []);

  const finalizeAnswer = () => {
    if (processingRef.current) return;
    processingRef.current = true;
    clearPhaseTimers();
    const text = currentTranscript.trim();
    processAnswer(text.length >= 1 ? text : '[No response]');
  };

  // PERFORMANCE FIX: Use RAF-based timer for smooth updates
  const timerStartTimeRef = useRef<number>(0);
  const timerDurationRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  
  const updateTimer = useCallback(() => {
    const elapsed = (performance.now() - timerStartTimeRef.current) / 1000;
    const remaining = Math.max(0, timerDurationRef.current - elapsed);
    const roundedRemaining = Math.ceil(remaining);
    
    setSecondsRemaining(roundedRemaining);
    
    if (remaining > 0.1) {
      timerRafRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (phase === 'prep') {
        setPhase('answer');
        timerStartTimeRef.current = performance.now();
        timerDurationRef.current = 30;
        setResetKey((k) => k + 1);
        answerBufferRef.current = '';
        setCurrentTranscript('');
        timerRafRef.current = requestAnimationFrame(updateTimer);
      } else {
        finalizeAnswer();
      }
    }
  }, [phase]);

  const startPhase = useCallback((p: 'prep' | 'answer', durationSec: number) => {
    clearPhaseTimers();
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    
    setPhase(p);
    setSecondsRemaining(durationSec);
    if (p === 'prep') {
      setCurrentTranscript('');
    }
    if (p === 'answer') {
      answerBufferRef.current = '';
      setCurrentTranscript('');
    }
    
    timerStartTimeRef.current = performance.now();
    timerDurationRef.current = durationSec;
    timerRafRef.current = requestAnimationFrame(updateTimer);
  }, [updateTimer]);

  // UK: allow user to start the answer window early by clicking Start during prep
  const startAnswerNow = () => {
    if (route !== 'uk_student') return;
    clearPhaseTimers();
    setPhase('answer');
    setSecondsRemaining(30);
    setResetKey((k) => k + 1);
    answerBufferRef.current = '';
    setCurrentTranscript('');
    startPhase('answer', 30);
  };

  const armTimers = () => {
    if (route === 'uk_student') return; // UK uses phase timers
    clearTimers();
    // Max 15s per question
    questionTimerRef.current = window.setTimeout(() => {
      if (processingRef.current) return;
      // Time up: finalize with whatever has been spoken so far
      processingRef.current = true;
      const text = currentTranscript.trim();
      processAnswer(text.length >= 1 ? text : '[No response]');
    }, 15000);

    // Silence detection: 3s of no transcript updates
    lastActivityAtRef.current = Date.now();
    const setSilence = () => {
      if (processingRef.current) return;
      const since = Date.now() - lastActivityAtRef.current;
      if (since >= 3000) {
        processingRef.current = true;
        const text = currentTranscript.trim();
        processAnswer(text.length >= 1 ? text : '[No response]');
        return;
      }
      // Re-arm until 3s elapse
      silenceTimerRef.current = window.setTimeout(setSilence, 300 - Math.min(300, since));
    };
    silenceTimerRef.current = window.setTimeout(setSilence, 3000);
  };

  // Initialize new AI-driven interview session
  const startNewSession = async () => {
    if (!studentName.trim()) {
      setStartError('Please enter student name');
      return;
    }
    if (!studentProfile.degreeLevel) {
      setStartError('Please select degree level');
      return;
    }
    if (!studentProfile.programName.trim()) {
      setStartError('Please enter program name');
      return;
    }
    if (!studentProfile.universityName.trim()) {
      setStartError('Please enter university name');
      return;
    }
    if (!studentProfile.programLength.trim()) {
      setStartError('Please enter program length');
      return;
    }
    if (!studentProfile.programCost.trim()) {
      setStartError('Please enter program cost');
      return;
    }
    if (isStarting) return; // Prevent double-click

    setIsStarting(true);
    setStartError(null);

    // Open interview tab IMMEDIATELY (before API call) to avoid popup blocker
    const interviewWindow = window.open('about:blank', '_blank');
    if (!interviewWindow) {
      setStartError('Failed to open new window. Please allow popups for this site.');
      setIsStarting(false);
      return;
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
      `);
      interviewWindow.document.close();
    } catch (e) {
      console.warn('[Interview] Could not write to window:', e);
    }

    try {
      // Get auth token for quota validation
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'start',
          userId: user?.uid || 'guest',
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: {
            name: studentName.trim(),
            country: 'Nepal',
            degreeLevel: studentProfile.degreeLevel,
            programName: studentProfile.programName.trim(),
            universityName: studentProfile.universityName.trim(),
            programLength: studentProfile.programLength.trim(),
            programCost: studentProfile.programCost.trim(),
          }
        })
      });

      if (!res.ok) {
        const error = await res.json();
        // Close the loading window on error
        if (interviewWindow) {
          try { interviewWindow.close(); } catch {}
        }
        if (error.error === 'Quota exceeded') {
          setQuotaMessage(error.message || 'Contact support for more interviews.');
          setShowQuotaDialog(true);
          setIsStarting(false);
          return;
        }
        throw new Error(error.error || `Failed to start session: ${res.status}`);
      }

      const data = await res.json();
      const apiSess: ApiInterviewSession = data.session;
      const firstQ: QuestionGenerationResponse = data.question;
      const interviewId: string | undefined = data.interviewId;

      // Store Firestore interview ID if returned
      if (interviewId) {
        setFirestoreInterviewId(interviewId);
        console.log('[Admin Interview] Firestore interview created:', interviewId);
      }

      // Seed the API session with the first question so answers attach correctly
      const seededApiSession: ApiInterviewSession = {
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
      };
      setApiSession(seededApiSession);
      setCurrentLLMQuestion(firstQ);

      // Store init payload for interview page
      const key = `interview:init:${apiSess.id}`;
      const payload = JSON.stringify({
        apiSession: seededApiSession,
        firstQuestion: firstQ,
        route,
        studentName: studentName.trim(),
        firestoreInterviewId: firestoreInterviewId || null,
        scope: 'user', // Admins create interviews as regular users for testing
      });
      
      // Store in localStorage (works cross-tab)
      localStorage.setItem(key, payload);
      console.log('[Admin Interview] Session data stored in localStorage:', key, 'firestoreInterviewId:', firestoreInterviewId);

      // Build URL with session ID
      const url = `${window.location.origin}/interview/${apiSess.id}`;
      console.log('[Interview] Navigating to:', url);
      
      // Navigate the pre-opened window to the interview page
      console.log('[Interview] Window object:', interviewWindow);
      console.log('[Interview] Window closed?', interviewWindow?.closed);
      
      try {
        interviewWindow.location.href = url;
        console.log('[Interview] Navigation initiated successfully');
      } catch (navError) {
        console.error('[Interview] Navigation error:', navError);
        throw navError;
      }
    } catch (e) {
      console.error('Failed to start interview:', e);
      // Close the loading window on error
      if (interviewWindow) {
        try { interviewWindow.close(); } catch {}
      }
      setStartError(
        e instanceof Error 
          ? e.message 
          : 'Failed to start interview session. Please check your internet connection and try again.'
      );
    } finally {
      setIsStarting(false);
    }
  };

  // Common answer processor used by timers and final segments
  const processAnswer = async (transcriptText: string, confidence?: number) => {
    if (!session || session.status !== 'active') return;
    if (session.currentQuestionIndex === lastAnsweredIndex) return;

    setIsAnalyzing(true);
    clearTimers();
    try {
      const currentQuestion = session.questions[session.currentQuestionIndex];

      // DEBUG: Log body language capture status
      if (!bodyScore) {
        console.warn('⚠️ [InterviewSimulation] No body language score available when scoring answer');
      } else {
        console.log('✅ [InterviewSimulation] Body language score captured:', {
          overall: Math.round(bodyScore.overallScore),
          posture: Math.round(bodyScore.posture.score),
          gestures: Math.round(bodyScore.gestures.score),
          expressions: Math.round(bodyScore.expressions.score),
        });
      }

      const body = bodyScore || {
        posture: { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 70 },
        gestures: { left: 'unknown', right: 'unknown', confidence: 0, score: 65 },
        expressions: { eyeContactScore: 60, smileScore: 55, confidence: 0.5, score: 58 },
        overallScore: 60,
        feedback: []
      } as BodyLanguageScore;

      // Combine local heuristics with AI scoring service (fallback to heuristics if AI unavailable)
      const perf = scorePerformance({
        transcript: transcriptText,
        body,
        assemblyConfidence: typeof confidence === 'number' ? confidence : undefined
      });

      let combinedOverall = perf.overall;
      let combinedCategories = perf.categories;
      let aiFeedback: string | null = null;
      let aiSuggestions: string[] | null = null;

      try {
        const ic = apiSession ? {
          visaType: apiSession.visaType,
          route: (apiSession as any).route || route,
          studentProfile: apiSession.studentProfile,
          conversationHistory: apiSession.conversationHistory.map(h => ({
            question: h.question,
            answer: h.answer,
            timestamp: h.timestamp,
          }))
        } : {
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: { name: session.studentName, country: 'Nepal' },
          conversationHistory: [] as Array<{ question: string; answer: string; timestamp: string }>
        };

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
          })
        });
        if (res.ok) {
          const data = await res.json();
          combinedOverall = data.overall ?? combinedOverall;
          combinedCategories = data.categories ?? combinedCategories;
          aiFeedback = data.summary || null;
          aiSuggestions = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 3) : null;
        }
      } catch (e) {
        // Ignore AI errors, rely on heuristics
      }

      const score10 = Math.min(10, Math.max(1, Math.round((combinedOverall) / 10)));
      const fallbackFeedback = [
        ...perf.details.content.notes,
        ...perf.details.speech.notes,
        ...body.feedback
      ].slice(0, 3).join(' ');
      const fallbackSuggestions: string[] = [];
      if (perf.details.content.accuracyScore < 60) fallbackSuggestions.push('Address all parts of the question with specific examples.');
      if (perf.details.speech.fillerRate > 0.05) fallbackSuggestions.push('Reduce filler words and slow down slightly.');
      if ((bodyScore?.overallScore ?? body.overallScore) < 65) fallbackSuggestions.push('Maintain eye contact and sit upright.');

      const analysis = {
        score: score10,
        feedback: (aiFeedback || fallbackFeedback) || 'Good effort. Aim for clearer structure and specific details.',
        suggestions: (aiSuggestions && aiSuggestions.length ? aiSuggestions : (fallbackSuggestions.length ? fallbackSuggestions : ['Provide concrete numbers or evidence where possible.'])),
        bodyScore: bodyScore?.overallScore,
        perf: { overall: combinedOverall, categories: combinedCategories }
      };

      const newResponse = {
        question: currentQuestion.question,
        transcription: transcriptText,
        analysis,
        timestamp: new Date()
      };
      setSession(prev => prev ? { ...prev, responses: [...prev.responses, newResponse] } : null);
      setCurrentTranscript('');
      setLastAnsweredIndex(session.currentQuestionIndex);

      if (apiSession) {
        const res = await fetch('/api/interview/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'answer',
            sessionId: apiSession.id,
            session: apiSession,
            answer: transcriptText
          })
        });

        if (res.ok) {
          const data = await res.json();
          const updated: ApiInterviewSession = data.session;
          setApiSession(updated);

          if (data.isComplete) {
            setSession(prev => prev ? { ...prev, status: 'completed' } : prev);
          } else if (data.question) {
            const nextQ: QuestionGenerationResponse = data.question;
            setCurrentLLMQuestion(nextQ);
            const uiQ: InterviewQuestion = {
              question: nextQ.question,
              category: mapQuestionTypeToCategory(route, nextQ.questionType)
            };
            setSession(prev => prev ? {
              ...prev,
              questions: [...prev.questions, uiQ],
              currentQuestionIndex: prev.currentQuestionIndex + 1
            } : prev);
            if (route === 'uk_student') {
              startPhase('prep', 30);
            }
          }
        } else {
          console.error('Failed to process answer:', res.status);
        }
      }
    } catch (error) {
      console.error('Failed to analyze/process response:', error);
    } finally {
      setIsAnalyzing(false);
      setResetKey((k) => k + 1);
      processingRef.current = false;
      // Arm timers for the next question (if any) unless UK uses phase timers
      if (route !== 'uk_student') {
        setTimeout(() => {
          if (session && session.status === 'active') armTimers();
        }, 0);
      }
    }
  };

  // Handle transcript completion -> finalize immediately
  const handleTranscriptComplete = async (transcript: TranscriptionResult) => {
    if (!session || session.status !== 'active') return;
    const transcriptText = transcript.text.trim();
    if (transcriptText.length < 1) return;
    if (session.currentQuestionIndex === lastAnsweredIndex) return;
    if (route === 'uk_student') {
      // Do not finalize early; accumulate during answer window only.
      if (phase !== 'answer') return;
      answerBufferRef.current = answerBufferRef.current ? `${answerBufferRef.current} ${transcriptText}` : transcriptText;
      setCurrentTranscript(answerBufferRef.current);
      return;
    }
    processingRef.current = true;
    await processAnswer(transcriptText, transcript.confidence);
  };

  // Wrap transcript updates to reset silence timer
  const handleTranscriptUpdate = (text: string) => {
    setCurrentTranscript(text);
    lastActivityAtRef.current = Date.now();
  };

  // Skip to next question (requests a new LLM question without using the answer)
  const nextQuestion = async () => {
    if (!session || !apiSession) return;
    try {
      clearTimers();
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          sessionId: apiSession.id,
          session: apiSession,
          answer: '[SKIPPED]'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updated: ApiInterviewSession = data.session;
        setApiSession(updated);
        if (data.isComplete) {
          setSession(prev => prev ? { ...prev, status: 'completed' } : prev);
        } else if (data.question) {
          const nextQ: QuestionGenerationResponse = data.question;
          setCurrentLLMQuestion(nextQ);
          const uiQ: InterviewQuestion = {
            question: nextQ.question,
            category: mapQuestionTypeToCategory(route, nextQ.questionType)
          };
          setSession(prev => prev ? {
            ...prev,
            questions: [...prev.questions, uiQ],
            currentQuestionIndex: prev.currentQuestionIndex + 1
          } : prev);
          setResetKey((k) => k + 1);
          armTimers();
        }
      }
    } catch (e) {
      console.error('Failed to skip to next question:', e);
    }
  };

  // Confirm and start the interview (mic + camera start on user gesture)
  const beginInterview = () => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : prev);
    // Arm timers for the first question after state update
    if (route === 'uk_student') {
      startPhase('prep', 30);
    } else {
      setTimeout(() => { armTimers(); }, 0);
    }
  };

  // Pause/Resume removed for UK and general flows; no toggle to avoid accidental pauses

  // Reset interview
  const resetInterview = () => {
    setSession(null);
    setCurrentTranscript('');
    setStudentName('');
    setStudentProfile({
      degreeLevel: '',
      programName: '',
      universityName: '',
      programLength: '',
      programCost: '',
    });
    setStartError(null);
    clearTimers();
    processingRef.current = false;
    clearPhaseTimers();
    setPhase(null);
    setSecondsRemaining(0);
  };

  // Save interview session
  const saveSession = async () => {
    if (!session) return;

    try {
      // Here you would typically save to your database
      console.log('Saving interview session:', session);
      
      // For now, just download as JSON
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview_${session.studentName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const currentQuestion = session?.questions[session.currentQuestionIndex];
  const progress = session ? ((session.currentQuestionIndex + 1) / session.questions.length) * 100 : 0;

  // Arm timers when question changes
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    armTimers();
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentQuestionIndex, session?.status]);

  // Aggregate final scores for completed session
  const finalAggregate = useMemo(() => {
    if (!session || session.status !== 'completed' || session.responses.length === 0) return null;
    const valid = session.responses.filter(r => !!r.analysis);
    if (!valid.length) return null;
    const sum = valid.reduce((acc, r) => {
      const a = r.analysis!;
      const cat = a.perf?.categories;
      return {
        overall: acc.overall + (a.perf?.overall ?? a.score * 10),
        content: acc.content + (cat?.content ?? a.score * 10),
        speech: acc.speech + (cat?.speech ?? a.score * 10),
        body: acc.body + (a.bodyScore ?? 0)
      };
    }, { overall: 0, content: 0, speech: 0, body: 0 });
    const n = valid.length;
    return {
      overall: Math.round(sum.overall / n),
      content: Math.round(sum.content / n),
      speech: Math.round(sum.speech / n),
      body: Math.round(sum.body / n)
    };
  }, [session]);

  // Update Firestore interview record when completed
  useEffect(() => {
    if (!firestoreInterviewId) return;
    if (session?.status === 'completed' && finalAggregate) {
      // Map our categories into the generic ScoreDetails
      const scoreDetails = {
        communication: finalAggregate.content,
        technical: finalAggregate.speech,
        confidence: finalAggregate.body,
        overall: finalAggregate.overall,
      };

      (async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          if (!token) return;

          // Use the general /api/interviews endpoint for admin users
          const res = await fetch(`/api/interviews/${firestoreInterviewId}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
              status: 'completed',
              endTime: new Date().toISOString(),
              score: finalAggregate.overall,
              scoreDetails,
            })
          });

          if (res.ok) {
            console.log('[Admin Interview] Firestore record updated with final scores');
          } else {
            console.error('[Admin Interview] Failed to update Firestore record:', await res.text());
          }
        } catch (e) {
          console.error('[Admin Interview] Error updating Firestore:', e);
        }
      })();
    }
  }, [session?.status, finalAggregate, firestoreInterviewId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">F1 Visa Mock Interview</h2>
          <p className="text-muted-foreground">Real-time speech transcription and analysis</p>
        </div>
        {session && (
          <div className="flex items-center gap-2">
            <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
            <Badge variant="outline">
              Question {session.currentQuestionIndex + 1} of {session.questions.length}
            </Badge>
          </div>
        )}
      </div>

      {!session ? (
        // Setup Phase
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Start New Interview Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm">Basic Information</h3>
              <div className="space-y-2">
                <Label htmlFor="studentName">Student Name <span className="text-destructive">*</span></Label>
                <Input
                  id="studentName"
                  placeholder="Enter student's full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Country <span className="text-destructive">*</span></Label>
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
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Program Information</h3>
              <div className="space-y-2">
                <Label>Degree Level <span className="text-destructive">*</span></Label>
                <Select
                  value={studentProfile.degreeLevel}
                  onValueChange={(value) => setStudentProfile(prev => ({ ...prev, degreeLevel: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate (Bachelor&apos;s)</SelectItem>
                    <SelectItem value="graduate">Graduate (Master&apos;s)</SelectItem>
                    <SelectItem value="doctorate">Doctorate (PhD)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program Name <span className="text-destructive">*</span></Label>
                <Input 
                  value={studentProfile.programName} 
                  onChange={(e) => setStudentProfile(prev => ({ ...prev, programName: e.target.value }))} 
                  placeholder="e.g., Master's in Computer Science" 
                />
              </div>
              <div className="space-y-2">
                <Label>University Name <span className="text-destructive">*</span></Label>
                <Input 
                  value={studentProfile.universityName} 
                  onChange={(e) => setStudentProfile(prev => ({ ...prev, universityName: e.target.value }))} 
                  placeholder="e.g., Stanford University" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program Length <span className="text-destructive">*</span></Label>
                  <Input 
                    value={studentProfile.programLength} 
                    onChange={(e) => setStudentProfile(prev => ({ ...prev, programLength: e.target.value }))} 
                    placeholder="e.g., 2 years" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Cost <span className="text-destructive">*</span></Label>
                  <Input 
                    value={studentProfile.programCost} 
                    onChange={(e) => setStudentProfile(prev => ({ ...prev, programCost: e.target.value }))} 
                    placeholder="e.g., $50,000" 
                  />
                </div>
              </div>
            </div>
            {startError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-destructive mb-1">Failed to Start Interview</div>
                    <div className="text-xs text-destructive/80">{startError}</div>
                  </div>
                </div>
              </div>
            )}
            <Button 
              onClick={startNewSession}
              disabled={!studentName.trim() || isStarting}
              className="w-full"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Interview Phase
        <div className="space-y-6">
          {/* Pre-start confirmation */}
          {session.status === 'preparing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Ready to start the interview?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  When you click Start Interview, your microphone and camera will turn on, the first question will be shown, and live transcription will begin.
                </p>
                <Button onClick={beginInterview} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Unified Interview Stage (video + overlays + controls) - visible only after start */}
          {currentQuestion && session.status !== 'preparing' && (
            <InterviewStage
              running={session.status === 'active'}
              questionCategory={currentQuestion.category}
              questionText={currentQuestion.question}
              currentTranscript={currentTranscript}
              onScore={handleBodyScoreUpdate}
              onNext={session.status === 'active' && route !== 'uk_student' ? nextQuestion : undefined}
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

          {/* Insights toggle */}
          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={() => setShowInsights((v) => !v)}>
              {showInsights ? 'Hide Insights' : 'Show Insights'}
            </Button>
          </div>

          {/* Interview Completed */}
            {session.status === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Interview Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Great job! The mock interview has been completed.</p>
                  {finalAggregate && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Overall</div>
                        <div className="text-xl font-semibold">{finalAggregate.overall}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Content</div>
                        <div className="text-lg">{finalAggregate.content}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Speech</div>
                        <div className="text-lg">{finalAggregate.speech}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Body</div>
                        <div className="text-lg">{finalAggregate.body}/100</div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={saveSession}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Session
                    </Button>
                    <Button onClick={resetInterview} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      New Interview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Hidden transcription runner (feeds live captions + triggers completion) */}
          <div className="hidden">
            <AssemblyAITranscription
            onTranscriptComplete={handleTranscriptComplete}
            onTranscriptUpdate={(t) => {
                if (route === 'uk_student') {
                  if (phase !== 'answer') return;
                  const combined = answerBufferRef.current ? `${answerBufferRef.current} ${t}` : t;
                  handleTranscriptUpdate(combined);
                } else {
                  handleTranscriptUpdate(t);
                }
              }}
            showControls={false}
            showTranscripts={false}
            running={session.status === 'active' && (route !== 'uk_student' || phase === 'answer')}
            resetKey={resetKey}
          />
          </div>

          {/* Analysis */}
            {/* Response Analysis */}
            {showInsights && session.responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Response Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="latest" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="latest">Latest Response</TabsTrigger>
                      <TabsTrigger value="all">All Responses</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="latest" className="space-y-4">
                      {session.responses.length > 0 && (
                        <div className="space-y-3">
                          {(() => {
                            const latest = session.responses[session.responses.length - 1];
                            return (
                              <div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  Q: {latest.question}
                                </div>
                                <div className="p-3 bg-muted rounded-md mb-3">
                                  <p className="text-sm">{latest.transcription}</p>
                                </div>
                                {latest.analysis && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">Score:</span>
                                      <Badge variant={latest.analysis.score >= 7 ? 'default' : 'secondary'}>
                                        {latest.analysis.score}/10
                                      </Badge>
                                    </div>
                                    {typeof latest.analysis.bodyScore === 'number' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Body:</span>
                                        <Badge variant={(latest.analysis.bodyScore ?? 0) >= 70 ? 'default' : 'secondary'}>
                                          {Math.round(latest.analysis.bodyScore ?? 0)}/100
                                        </Badge>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-sm font-medium">Feedback:</span>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {latest.analysis.feedback}
                                      </p>
                                    </div>
                                    {latest.analysis.suggestions.length > 0 && (
                                      <div>
                                        <span className="text-sm font-medium">Suggestions:</span>
                                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                                          {latest.analysis.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                              <span>•</span>
                                              <span>{suggestion}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="all" className="space-y-4">
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {session.responses.map((response, index) => (
                          <div key={index} className="border rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Response {index + 1}</span>
                              {response.analysis && (
                                <div className="flex items-center gap-2">
                                  <Badge variant={response.analysis.score >= 7 ? 'default' : 'secondary'}>
                                    {response.analysis.score}/10
                                  </Badge>
                                  {typeof response.analysis.bodyScore === 'number' && (
                                    <Badge variant={(response.analysis.bodyScore ?? 0) >= 70 ? 'default' : 'secondary'}>
                                      Body {Math.round(response.analysis.bodyScore ?? 0)}/100
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {response.transcription}
                            </p>
                            {response.analysis && (
                              <p className="text-xs text-muted-foreground">
                                {response.analysis.feedback}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          {/* Footer Controls */}
          {showInsights && (
            <div className="flex gap-2">
              <Button onClick={resetInterview} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveSession} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Analysis Loading */}
      {isAnalyzing && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Analyzing response...</span>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}

export default InterviewSimulation;
