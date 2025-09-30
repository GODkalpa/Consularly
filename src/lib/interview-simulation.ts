import { QuestionGenerationRequest, QuestionGenerationResponse } from './llm-service';
import type { InterviewRoute } from './interview-routes'
import { UK_QUESTION_POOL, ukFallbackQuestionByIndex } from './uk-questions-data'
import { F1SessionMemory, updateMemory } from './f1-mvp-session-memory'

export interface InterviewSession {
  id: string;
  userId: string;
  visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
  route?: InterviewRoute; // usa_f1 | uk_student
  studentProfile: {
    name: string;
    country: string;
    intendedUniversity?: string;
    fieldOfStudy?: string;
    previousEducation?: string;
  };
  conversationHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
    questionType: string;
    difficulty: string;
  }>;
  currentQuestionNumber: number;
  status: 'active' | 'completed' | 'paused';
  startTime: string;
  endTime?: string;
  score?: {
    overall: number;
    communication: number;
    knowledge: number;
    confidence: number;
  };
  // F1 session memory for self-consistency tracking
  sessionMemory?: F1SessionMemory;
  // Track if using adaptive LLM flow (USA F1)
  useMVPFlow?: boolean;
}

export class InterviewSimulationService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  /**
   * Start a new interview session
   */
  async startInterview(
    userId: string,
    visaType: 'F1' | 'B1/B2' | 'H1B' | 'other',
    studentProfile: InterviewSession['studentProfile'],
    route?: InterviewRoute,
  ): Promise<{ session: InterviewSession; firstQuestion: QuestionGenerationResponse }> {
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enable session memory tracking for usa_f1 (for LLM self-consistency)
    const useMVPFlow = route === 'usa_f1';
    
    const session: InterviewSession = {
      id: sessionId,
      userId,
      visaType,
      route,
      studentProfile,
      conversationHistory: [],
      currentQuestionNumber: 1,
      status: 'active',
      startTime: new Date().toISOString(),
      sessionMemory: useMVPFlow ? {} : undefined, // Track facts for consistency
      useMVPFlow, // Using adaptive LLM with question bank
    };

    // Generate the first question (LLM with question bank for usa_f1)
    const firstQuestion = await this.generateNextQuestion(session);

    return { session, firstQuestion };
  }

  /**
   * Process student's answer and generate next question
   */
  async processAnswer(
    session: InterviewSession,
    answer: string
  ): Promise<{ 
    updatedSession: InterviewSession; 
    nextQuestion?: QuestionGenerationResponse;
    isComplete: boolean;
  }> {
    // Get the current question (last question asked)
    const currentQuestion = session.conversationHistory.length > 0 
      ? session.conversationHistory[session.conversationHistory.length - 1].question
      : "Welcome to your visa interview. Let's begin.";
    
    const currentQuestionType = session.conversationHistory.length > 0
      ? session.conversationHistory[session.conversationHistory.length - 1].questionType
      : 'background';

    // Add the answer to conversation history
    const updatedHistory = [...session.conversationHistory];
    if (session.conversationHistory.length > 0) {
      // Update the last question entry with the answer
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        answer,
        timestamp: new Date().toISOString()
      };
    }

    const updatedSession: InterviewSession = {
      ...session,
      conversationHistory: updatedHistory,
      currentQuestionNumber: session.currentQuestionNumber + 1
    };

    // Update session memory for MVP flow
    if (session.useMVPFlow && session.sessionMemory) {
      updatedSession.sessionMemory = updateMemory(session.sessionMemory, answer, currentQuestionType);
    }

    // Check if interview should end (default 8, UK route requires 16 questions)
    const targetQuestions = session.route === 'uk_student' ? 16 : 8;
    const isComplete = updatedSession.currentQuestionNumber > targetQuestions;

    if (isComplete) {
      updatedSession.status = 'completed';
      updatedSession.endTime = new Date().toISOString();
      return { updatedSession, isComplete: true };
    }

    // Generate next question based on the answer
    const nextQuestion = await this.generateNextQuestion(updatedSession, currentQuestion, answer);

    // Add the new question to history
    updatedSession.conversationHistory.push({
      question: nextQuestion.question,
      answer: '', // Will be filled when student responds
      timestamp: new Date().toISOString(),
      questionType: nextQuestion.questionType,
      difficulty: nextQuestion.difficulty
    });

    return { updatedSession, nextQuestion, isComplete: false };
  }

  /**
   * Generate the next question using the LLM API
   * USA F1 uses adaptive LLM with question bank selection from f1-questions-data.ts
   * UK uses strict bank selection from uk-questions-data.ts
   */
  private async generateNextQuestion(
    session: InterviewSession,
    previousQuestion?: string,
    studentAnswer?: string
  ): Promise<QuestionGenerationResponse> {
    
    const request: QuestionGenerationRequest = {
      previousQuestion,
      studentAnswer,
      interviewContext: {
        visaType: session.visaType,
        // country-specific route for prompt selection
        route: session.route,
        studentProfile: session.studentProfile,
        currentQuestionNumber: session.currentQuestionNumber,
        conversationHistory: session.conversationHistory.map(item => ({
          question: item.question,
          answer: item.answer,
          timestamp: item.timestamp
        }))
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/interview/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const next: QuestionGenerationResponse = await response.json();

      // Deduplicate: avoid repeating previously asked questions
      const normalize = (s: string) => s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation/symbols (ASCII-safe)
        .replace(/\s+/g, ' ')
        .trim();
      const asked = new Set(session.conversationHistory.map(h => normalize(h.question)));
      const candidate = normalize(next.question);
      // Enforce UK bank membership for UK route
      if (session.route === 'uk_student') {
        const bank = new Set(UK_QUESTION_POOL.map(q => normalize(q.question)));
        if (!bank.has(candidate) || asked.has(candidate)) {
          return this.getUniqueFallbackQuestion(session.currentQuestionNumber, asked, session.route);
        }
      }
      if (asked.has(candidate)) {
        // Fallback to a unique question
        return this.getUniqueFallbackQuestion(session.currentQuestionNumber, asked, session.route);
      }

      return next;
    } catch (error) {
      console.error('Error generating question:', error);
      // If API fails, pick a unique question from the UK bank when on UK route
      if (session.route === 'uk_student') {
        const normalize = (s: string) => s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const asked = new Set(session.conversationHistory.map(h => normalize(h.question)));
        return this.getUniqueFallbackQuestion(session.currentQuestionNumber, asked, session.route);
      }
      // Otherwise, use generic fallback rotation
      return this.getFallbackQuestion(session.currentQuestionNumber, session.route);
    }
  }

  /**
   * Get a fallback question if the API fails
   */
  private getFallbackQuestion(questionNumber: number, route?: InterviewRoute): QuestionGenerationResponse {
    if (route === 'uk_student') {
      const uk = ukFallbackQuestionByIndex(questionNumber)
      return {
        question: uk.question,
        questionType: uk.questionType,
        difficulty: uk.difficulty || 'medium',
        expectedAnswerLength: uk.expectedAnswerLength || 'medium',
      }
    }
    const fallbackQuestions = [
      {
        question: "Good morning. Please tell me about yourself and why you want to study in the United States.",
        questionType: 'background' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        question: "What is your intended major and why did you choose this field of study?",
        questionType: 'academic' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        question: "How will you finance your education in the United States?",
        questionType: 'financial' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        question: "Why did you choose this particular university over others?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        question: "What are your career plans after completing your studies?",
        questionType: 'intent' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        question: "What ties do you have to your home country that will ensure your return?",
        questionType: 'intent' as const,
        difficulty: 'hard' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        question: "How did you learn about this university and program?",
        questionType: 'academic' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        question: "Do you have any relatives or friends in the United States?",
        questionType: 'background' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      }
    ];

    const index = (questionNumber - 1) % fallbackQuestions.length;
    return fallbackQuestions[index];
  }

  /**
   * Get a unique fallback question that hasn't been asked yet
   */
  private getUniqueFallbackQuestion(
    questionNumber: number,
    askedNormalized: Set<string>,
    route?: InterviewRoute
  ): QuestionGenerationResponse {
    const normalized = (s: string) => s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const pool = route === 'uk_student' ?
      UK_QUESTION_POOL.map(q => ({
        question: q.question,
        questionType: q.questionType as 'academic' | 'financial' | 'intent' | 'background' | 'follow-up',
        difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
        expectedAnswerLength: (q.expectedAnswerLength || 'medium') as 'short' | 'medium' | 'long',
      }))
      : [
      {
        question: "Why do you want to study in the US?",
        questionType: 'background' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        question: "Why can't you continue your education in your home country?",
        questionType: 'background' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        question: "How many schools did you apply to? How many rejected you?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        question: "Why did you choose this particular university over others?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        question: "Who is sponsoring your education? What is their annual income?",
        questionType: 'financial' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        question: "How will you pay for your tuition and living expenses?",
        questionType: 'financial' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        question: "What are your GRE and TOEFL scores? Did you fail any subjects?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        question: "What are your plans after graduation? Do you plan to return to Nepal?",
        questionType: 'intent' as const,
        difficulty: 'hard' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        question: "What is the guarantee that you will come back to Nepal after your studies?",
        questionType: 'intent' as const,
        difficulty: 'hard' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        question: "Do you have any relatives or friends in the United States?",
        questionType: 'background' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      }
    ];

    // Choose a random not-yet-asked question for UK; otherwise fallback to default rotation
    if (route === 'uk_student') {
      const remaining = pool.filter(q => !askedNormalized.has(normalized(q.question)));
      if (remaining.length > 0) {
        const idx = Math.floor(Math.random() * remaining.length);
        return remaining[idx];
      }
    } else {
      for (const q of pool) {
        if (!askedNormalized.has(normalized(q.question))) return q;
      }
    }
    return this.getFallbackQuestion(questionNumber, route);
  }


  /**
   * Calculate interview score based on responses
   */
  calculateScore(session: InterviewSession): InterviewSession['score'] {
    const responses = session.conversationHistory.filter(item => item.answer.trim() !== '');
    
    if (responses.length === 0) {
      return { overall: 0, communication: 0, knowledge: 0, confidence: 0 };
    }

    // Simple scoring algorithm - in production, this could use NLP analysis
    let communicationScore = 0;
    let knowledgeScore = 0;
    let confidenceScore = 0;

    responses.forEach(response => {
      const answerLength = response.answer.length;
      const wordCount = response.answer.split(' ').length;

      // Communication score based on answer length and structure
      if (wordCount >= 20 && answerLength >= 100) {
        communicationScore += 20;
      } else if (wordCount >= 10) {
        communicationScore += 15;
      } else {
        communicationScore += 10;
      }

      // Knowledge score based on specific keywords and detail
      const knowledgeKeywords = ['university', 'degree', 'program', 'research', 'career', 'goals'];
      const keywordMatches = knowledgeKeywords.filter(keyword => 
        response.answer.toLowerCase().includes(keyword)
      ).length;
      knowledgeScore += Math.min(keywordMatches * 5, 20);

      // Confidence score based on definitive language
      const confidenceIndicators = ['will', 'plan to', 'definitely', 'certainly', 'committed'];
      const confidenceMatches = confidenceIndicators.filter(indicator =>
        response.answer.toLowerCase().includes(indicator)
      ).length;
      confidenceScore += Math.min(confidenceMatches * 4, 20);
    });

    // Normalize scores to 0-100 range
    const maxPossibleScore = responses.length * 20;
    communicationScore = Math.min((communicationScore / maxPossibleScore) * 100, 100);
    knowledgeScore = Math.min((knowledgeScore / maxPossibleScore) * 100, 100);
    confidenceScore = Math.min((confidenceScore / maxPossibleScore) * 100, 100);

    const overall = (communicationScore + knowledgeScore + confidenceScore) / 3;

    return {
      overall: Math.round(overall),
      communication: Math.round(communicationScore),
      knowledge: Math.round(knowledgeScore),
      confidence: Math.round(confidenceScore)
    };
  }

  /**
   * Pause an active interview
   */
  pauseInterview(session: InterviewSession): InterviewSession {
    return {
      ...session,
      status: 'paused'
    };
  }

  /**
   * Resume a paused interview
   */
  resumeInterview(session: InterviewSession): InterviewSession {
    return {
      ...session,
      status: 'active'
    };
  }

  /**
   * End an interview and calculate final score
   */
  endInterview(session: InterviewSession): InterviewSession {
    const score = this.calculateScore(session);
    
    return {
      ...session,
      status: 'completed',
      endTime: new Date().toISOString(),
      score
    };
  }
}

export type { QuestionGenerationResponse };
