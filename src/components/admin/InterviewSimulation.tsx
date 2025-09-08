/**
 * Interview Simulation Component for Admin Dashboard
 * Integrates F1 visa questions with AssemblyAI real-time transcription
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  User
} from 'lucide-react';
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription';
import { InterviewStage } from '@/components/interview/InterviewStage';
import { TranscriptionResult } from '@/lib/assemblyai-service';
import { mapQuestionTypeToF1Category } from '@/lib/f1-questions-data';
import type { BodyLanguageScore } from '@/lib/body-language-scoring';
import { useAuth } from '@/contexts/AuthContext';
import type { InterviewSession as ApiInterviewSession, QuestionGenerationResponse } from '@/lib/interview-simulation';
import { scorePerformance } from '@/lib/performance-scoring';

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
  const [session, setSession] = useState<UISession | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [bodyScore, setBodyScore] = useState<BodyLanguageScore | null>(null);
  const [lastAnsweredIndex, setLastAnsweredIndex] = useState<number>(-1);
  const [showInsights, setShowInsights] = useState(false);
  const [apiSession, setApiSession] = useState<ApiInterviewSession | null>(null);
  const [currentLLMQuestion, setCurrentLLMQuestion] = useState<QuestionGenerationResponse | null>(null);
  const TARGET_QUESTIONS = 8;

  // Timers and activity tracking
  const questionTimerRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

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

  const armTimers = () => {
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
    if (!studentName.trim()) return;

    try {
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId: user?.uid || 'guest',
          visaType: 'F1',
          studentProfile: {
            name: studentName.trim(),
            country: 'Nepal'
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to start session: ${res.status}`);
      }

      const data = await res.json();
      const apiSess: ApiInterviewSession = data.session;
      const firstQ: QuestionGenerationResponse = data.question;

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

      const uiFirst: InterviewQuestion = {
        question: firstQ.question,
        category: mapQuestionTypeToF1Category(firstQ.questionType)
      };

      const newSession: UISession = {
        id: apiSess.id,
        studentName: studentName.trim(),
        startTime: new Date(),
        currentQuestionIndex: 0,
        questions: [uiFirst],
        responses: [],
        status: 'active'
      };

      setSession(newSession);
      setCurrentTranscript('');
      setBodyScore(null);
      setResetKey((k) => k + 1); // ensure clean transcript at start
      setLastAnsweredIndex(-1);
    } catch (e) {
      console.error(e);
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

      const body = bodyScore || {
        posture: { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 70 },
        gestures: { left: 'unknown', right: 'unknown', confidence: 0, score: 65 },
        expressions: { eyeContactScore: 60, smileScore: 55, confidence: 0.5, score: 58 },
        overallScore: 60,
        feedback: []
      } as BodyLanguageScore;

      const perf = scorePerformance({
        transcript: transcriptText,
        body,
        assemblyConfidence: typeof confidence === 'number' ? confidence : undefined
      });
      const score10 = Math.min(10, Math.max(1, Math.round(perf.overall / 10)));
      const feedback = [
        ...perf.details.content.notes,
        ...perf.details.speech.notes,
        ...body.feedback
      ].slice(0, 3).join(' ');
      const suggestions: string[] = [];
      if (perf.details.content.accuracyScore < 60) suggestions.push('Address all parts of the question with specific examples.');
      if (perf.details.speech.fillerRate > 0.05) suggestions.push('Reduce filler words and slow down slightly.');
      if ((bodyScore?.overallScore ?? body.overallScore) < 65) suggestions.push('Maintain eye contact and sit upright.');

      const analysis = {
        score: score10,
        feedback: feedback || 'Good effort. Aim for clearer structure and specific details.',
        suggestions: suggestions.length ? suggestions : ['Provide concrete numbers or evidence where possible.'],
        bodyScore: bodyScore?.overallScore,
        perf: { overall: perf.overall, categories: perf.categories }
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
              category: mapQuestionTypeToF1Category(nextQ.questionType)
            };
            setSession(prev => prev ? {
              ...prev,
              questions: [...prev.questions, uiQ],
              currentQuestionIndex: prev.currentQuestionIndex + 1
            } : prev);
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
      // Arm timers for the next question (if any)
      setTimeout(() => {
        if (session && session.status === 'active') armTimers();
      }, 0);
    }
  };

  // Handle transcript completion -> finalize immediately
  const handleTranscriptComplete = async (transcript: TranscriptionResult) => {
    if (!session || session.status !== 'active') return;
    const transcriptText = transcript.text.trim();
    if (transcriptText.length < 1) return;
    if (session.currentQuestionIndex === lastAnsweredIndex) return;
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
            category: mapQuestionTypeToF1Category(nextQ.questionType)
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

  // Pause/Resume interview
  const togglePause = () => {
    if (!session) return;

    setSession(prev => prev ? {
      ...prev,
      status: prev.status === 'active' ? 'paused' : 'active'
    } : null);
  };

  // Reset interview
  const resetInterview = () => {
    setSession(null);
    setCurrentTranscript('');
    setStudentName('');
    clearTimers();
    processingRef.current = false;
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                placeholder="Enter student's full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && studentName.trim()) {
                    startNewSession();
                  }
                }}
              />
            </div>
            <Button 
              onClick={startNewSession}
              disabled={!studentName.trim()}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Interview Phase
        <div className="space-y-6">
          {/* Unified Interview Stage (video + overlays + controls) */}
          {currentQuestion && (
            <InterviewStage
              running={session.status === 'active'}
              questionCategory={currentQuestion.category}
              questionText={currentQuestion.question}
              currentTranscript={currentTranscript}
              onScore={setBodyScore}
              onTogglePause={togglePause}
              onNext={session.status === 'active' ? nextQuestion : undefined}
              startedAt={session.startTime}
              statusBadge={session.status === 'active' ? 'Live' : session.status === 'paused' ? 'Paused' : 'Completed'}
              candidateName={session.studentName}
              questionIndex={session.currentQuestionIndex}
              questionTotal={session.questions.length}
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
              onTranscriptUpdate={handleTranscriptUpdate}
              showControls={false}
              showTranscripts={false}
              running={session.status === 'active'}
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
                                <div className="p-3 bg-gray-50 rounded-md mb-3">
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
    </div>
  );
}

export default InterviewSimulation;
