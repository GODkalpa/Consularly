/**
 * Interview Simulation Component for Admin Dashboard
 * Integrates F1 visa questions with AssemblyAI real-time transcription
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  Pause, 
  RotateCcw, 
  Save, 
  FileText,
  Clock,
  User,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription';
import { BodyLanguageTracker } from '@/components/vision/BodyLanguageTracker';
import { TranscriptionResult } from '@/lib/assemblyai-service';
import { F1_VISA_QUESTIONS, F1QuestionCategory } from '@/lib/f1-questions-data';

interface InterviewQuestion {
  question: string;
  category: string;
}

interface InterviewSession {
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
    };
    timestamp: Date;
  }>;
  status: 'preparing' | 'active' | 'paused' | 'completed';
}

export function InterviewSimulation() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentName, setStudentName] = useState('');

  // Initialize new interview session
  const startNewSession = async () => {
    if (!studentName.trim()) return;

    // Convert F1_VISA_QUESTIONS to flat array of questions
    const allQuestions: InterviewQuestion[] = [];
    F1_VISA_QUESTIONS.forEach(category => {
      category.questions.forEach(question => {
        allQuestions.push({
          question,
          category: category.category
        });
      });
    });

    // Select first 10 questions from different categories
    const selectedQuestions = allQuestions.slice(0, 10);

    const newSession: InterviewSession = {
      id: `interview_${Date.now()}`,
      studentName: studentName.trim(),
      startTime: new Date(),
      currentQuestionIndex: 0,
      questions: selectedQuestions,
      responses: [],
      status: 'active'
    };

    setSession(newSession);
    setCurrentTranscript('');
  };

  // Handle transcript completion
  const handleTranscriptComplete = async (transcript: TranscriptionResult) => {
    if (!session || session.status !== 'active') return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const transcriptText = transcript.text.trim();

    if (transcriptText.length < 10) return; // Ignore very short responses

    setIsAnalyzing(true);

    try {
      // Simple analysis (you can enhance this later with LLM integration)
      const wordCount = transcriptText.split(' ').length;
      const analysis = {
        score: Math.min(10, Math.max(1, Math.floor(wordCount / 5) + Math.floor(transcript.confidence * 5))),
        feedback: wordCount > 20 ? "Good detailed response!" : "Try to provide more details in your answer.",
        suggestions: wordCount < 15 ? ["Elaborate more on your answer", "Provide specific examples"] : ["Great response length"]
      };

      // Add response to session
      const newResponse = {
        question: currentQuestion.question,
        transcription: transcriptText,
        analysis,
        timestamp: new Date()
      };

      setSession(prev => prev ? {
        ...prev,
        responses: [...prev.responses, newResponse]
      } : null);

      setCurrentTranscript('');
    } catch (error) {
      console.error('Failed to analyze response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Move to next question
  const nextQuestion = async () => {
    if (!session) return;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      } : null);
    } else {
      // Interview completed
      setSession(prev => prev ? {
        ...prev,
        status: 'completed'
      } : null);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Interview Control */}
          <div className="space-y-4">
            {/* Session Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {session.studentName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {Math.round((Date.now() - session.startTime.getTime()) / 60000)}m
                    </span>
                  </div>
                </CardTitle>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Current Question */}
            {currentQuestion && session.status !== 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Current Question
                  </CardTitle>
                  <Badge variant="outline">{currentQuestion.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed mb-4">{currentQuestion.question}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={togglePause}
                      variant={session.status === 'active' ? 'secondary' : 'default'}
                    >
                      {session.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={nextQuestion}
                      disabled={session.status !== 'active' || isAnalyzing}
                    >
                      Next Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Control Buttons */}
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
          </div>

          {/* Right Column - Transcription and Analysis */}
          <div className="space-y-4">
            {/* Real-time Transcription */}
            <AssemblyAITranscription
              onTranscriptComplete={handleTranscriptComplete}
              onTranscriptUpdate={setCurrentTranscript}
              showControls={session.status === 'active'}
              showTranscripts={true}
            />

            {/* Live Body Language Tracker */}
            <BodyLanguageTracker width={640} height={480} />

            {/* Response Analysis */}
            {session.responses.length > 0 && (
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
                                <Badge variant={response.analysis.score >= 7 ? 'default' : 'secondary'}>
                                  {response.analysis.score}/10
                                </Badge>
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
          </div>
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
