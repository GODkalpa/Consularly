import { QuestionGenerationRequest, QuestionGenerationResponse } from './llm-service';
import type { InterviewRoute } from './interview-routes'
import { UK_QUESTION_POOL, ukFallbackQuestionByIndex } from './uk-questions-data'
import { F1_VISA_QUESTIONS, mapQuestionTypeToF1Category } from './f1-questions-data'
import { F1SessionMemory, updateMemory } from './f1-mvp-session-memory'
import { FranceUniversity, getFirstQuestionForUniversity, getRemainingQuestionsForUniversity, franceFallbackQuestionByIndex } from './france-questions-data'
import { getSemanticCluster } from './smart-question-selector'

export interface InterviewSession {
  id: string;
  userId: string;
  visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
  route?: InterviewRoute; // usa_f1 | uk_student | france_ema | france_icn
  university?: FranceUniversity; // For France routes only
  studentProfile: {
    name: string;
    country: string;
    intendedUniversity?: string;
    fieldOfStudy?: string;
    previousEducation?: string;
    // New profile fields for better question targeting
    degreeLevel?: 'undergraduate' | 'graduate' | 'doctorate' | 'other';
    programName?: string;
    universityName?: string;
    programLength?: string;
    programCost?: string;
  };
  conversationHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
    questionType: string;
    difficulty: string;
    questionId?: string; // CRITICAL FIX: Store question ID for reliable tracking
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
  totalQuestions?: number; // Total questions for this country
  answerTime?: number; // Seconds to answer each question
  prepTime?: number; // Seconds to prepare before answering (UK/France only)
  // CRITICAL FIX: Track semantic clusters to prevent repetition
  askedSemanticClusters?: string[]; // Clusters of questions already asked
  askedQuestionIds?: string[]; // IDs of questions from bank already asked
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
    route?: InterviewRoute
  ): Promise<{ session: InterviewSession; firstQuestion: QuestionGenerationResponse }> {
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enable session memory tracking for usa_f1 (for LLM self-consistency)
    const useMVPFlow = route === 'usa_f1';
    
    // Extract university for France routes
    const university: FranceUniversity | undefined = 
      route === 'france_ema' ? 'ema' : 
      route === 'france_icn' ? 'icn' : 
      undefined;
    
    // Import country configurations
    const { getCountryConfig } = await import('./interview-modes');
    
    // Determine interview configuration based on country/route
    const selectedRoute = route || 'usa_f1';
    const countryConfig = getCountryConfig(selectedRoute);
    const totalQuestions = countryConfig.questionCount;
    const answerTime = countryConfig.answerTime;
    const prepTime = countryConfig.prepTime;
    
    const session: InterviewSession = {
      id: sessionId,
      userId,
      visaType,
      route,
      university,
      studentProfile,
      conversationHistory: [],
      currentQuestionNumber: 1,
      status: 'active',
      startTime: new Date().toISOString(),
      sessionMemory: useMVPFlow ? {} : undefined, // Track facts for consistency
      useMVPFlow, // Using adaptive LLM with question bank
      totalQuestions,
      answerTime,
      prepTime,
      // CRITICAL FIX: Initialize cluster and question tracking
      askedSemanticClusters: [],
      askedQuestionIds: [],
    };

    // Generate the first question (LLM with question bank for usa_f1)
    const firstQuestion = await this.generateNextQuestion(session);
    
    // CRITICAL FIX: ALWAYS track first question's cluster and ID
    const cluster = firstQuestion.semanticCluster || null;
    const questionId = firstQuestion.questionId || `UNKNOWN_${Date.now()}`;
    
    session.askedSemanticClusters = cluster ? [cluster] : [];
    session.askedQuestionIds = [questionId];
    
    // CRITICAL FIX: Add first question to conversation history immediately
    // This ensures the questionId is tracked from the start
    session.conversationHistory.push({
      question: firstQuestion.question,
      answer: '', // Will be filled when student responds
      timestamp: new Date().toISOString(),
      questionType: firstQuestion.questionType,
      difficulty: firstQuestion.difficulty,
      questionId: questionId,
    });
    
    console.log(`[Session Init] First question - ID: ${questionId}, Cluster: ${cluster || 'none'}`);

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
    // The first question is now added to history in startInterview, so history should never be empty
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
      // The question was already added (either in startInterview or previous processAnswer)
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

    // Check if interview should end based on mode configuration (or route-specific defaults)
    const targetQuestions = session.totalQuestions || (session.route === 'uk_student' ? 16 : 8);
    const isComplete = updatedSession.currentQuestionNumber >= targetQuestions;
    
    console.log(`[Interview Progress] Question ${updatedSession.currentQuestionNumber}/${targetQuestions}`);

    if (isComplete) {
      updatedSession.status = 'completed';
      updatedSession.endTime = new Date().toISOString();
      return { updatedSession, isComplete: true };
    }

    // Generate next question based on the answer
    const nextQuestion = await this.generateNextQuestion(updatedSession, currentQuestion, answer);

    // CRITICAL FIX: ALWAYS track both cluster and ID - no conditional logic
    // This ensures tracking arrays stay in sync
    const cluster = nextQuestion.semanticCluster || null;
    const questionId = nextQuestion.questionId || `UNKNOWN_${Date.now()}`;
    
    // Update clusters array
    updatedSession.askedSemanticClusters = [
      ...(updatedSession.askedSemanticClusters || []),
      ...(cluster ? [cluster] : [])
    ];
    
    // Update question IDs array
    updatedSession.askedQuestionIds = [
      ...(updatedSession.askedQuestionIds || []),
      questionId
    ];
    
    console.log(`[Question Tracking] Added ID: ${questionId}, Cluster: ${cluster || 'none'} | Total IDs: ${updatedSession.askedQuestionIds.length}, Total Clusters: ${updatedSession.askedSemanticClusters.length}`);

    // Add the new question to history
    updatedSession.conversationHistory.push({
      question: nextQuestion.question,
      answer: '', // Will be filled when student responds
      timestamp: new Date().toISOString(),
      questionType: nextQuestion.questionType,
      difficulty: nextQuestion.difficulty,
      questionId: questionId, // CRITICAL FIX: Always store a valid ID
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
    
    // Log degree level for debugging
    if (session.route === 'usa_f1') {
      console.log(`[Interview Generation] USA F1 - Degree Level: ${session.studentProfile.degreeLevel || 'NOT SET'}, Program: ${session.studentProfile.programName || 'NOT SET'}`);
    }
    
    const request: QuestionGenerationRequest = {
      previousQuestion,
      studentAnswer,
      interviewContext: {
        visaType: session.visaType,
        // country-specific route for prompt selection
        route: session.route,
        studentProfile: session.studentProfile, // Includes degreeLevel, programName, etc.
        currentQuestionNumber: session.currentQuestionNumber,
        conversationHistory: session.conversationHistory.map(item => ({
          question: item.question,
          answer: item.answer,
          timestamp: item.timestamp
        })),
        // CRITICAL FIX: Pass tracked clusters and question IDs to prevent repetition
        askedSemanticClusters: session.askedSemanticClusters,
        askedQuestionIds: session.askedQuestionIds,
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
      
      // CRITICAL DEBUG: Log what the API returned
      console.log(`[API Response] Received questionId: ${next.questionId || 'UNDEFINED'}, question: "${next.question.substring(0, 60)}..."`);
      
      // CRITICAL FIX: Stricter duplicate detection before any other validation
      const isUnique = this.validateQuestionUniqueness(next.question, session.conversationHistory);
      if (!isUnique) {
        console.warn(`⚠️ [DUPLICATE BLOCKED] Question too similar to previous questions: "${next.question}"`);
        console.warn(`⚠️ Using fallback question instead`);
        return this.getFallbackQuestion(session.currentQuestionNumber, session.route, session.university);
      }
      
      // VALIDATION: Check if the generated question is appropriate for the degree level
      if (session.route === 'usa_f1' && session.studentProfile.degreeLevel) {
        const degreeLevel = session.studentProfile.degreeLevel;
        const q = next.question.toLowerCase();
        
        // Detect inappropriate questions for undergrads
        if (degreeLevel === 'undergraduate') {
          if (q.includes('undergraduate degree') || q.includes("bachelor's degree") || q.includes('undergraduate projects')) {
            console.warn(`⚠️ [DEGREE MISMATCH] Generated question for UNDERGRADUATE student asks about bachelor's degree: "${next.question}"`);
            console.warn(`⚠️ This should NOT happen. Student is pursuing undergraduate, not graduate.`);
          }
        }
        
        // Detect inappropriate questions for graduate students
        if (degreeLevel === 'graduate') {
          if (q.includes('high school') || q.includes('secondary school')) {
            console.warn(`⚠️ [DEGREE MISMATCH] Generated question for GRADUATE student asks about high school: "${next.question}"`);
            console.warn(`⚠️ Graduate students should be asked about their bachelor's degree, not high school.`);
          }
          if (q.includes('publish') || q.includes('conferences') || q.includes('dissertation')) {
            console.warn(`⚠️ [DEGREE MISMATCH] Generated PhD-level question for GRADUATE (Master's) student: "${next.question}"`);
          }
        }
        
        // Detect inappropriate questions for PhD students
        if (degreeLevel === 'doctorate') {
          if (q.includes('plan to do a phd') || q.includes('pursue a doctorate')) {
            console.warn(`⚠️ [DEGREE MISMATCH] Asked PhD student if they plan to do PhD: "${next.question}"`);
            console.warn(`⚠️ Student IS pursuing a PhD. This question is inappropriate.`);
          }
        }
      }

      // Helpers for de-duplication and flow gating
      const normalize = (s: string) => s
        .toLowerCase()
        .replace(/[“”"'’]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const STOP = new Set(['what','why','how','do','did','are','is','your','you','the','in','to','of','for','on','at','this','that','it','a','an','any','have','will','can'])
      const tokens = (s: string) => normalize(s).split(' ').filter(t => t && !STOP.has(t))
      const jaccard = (a: string[], b: string[]) => {
        const A = new Set(a), B = new Set(b)
        let inter = 0
        A.forEach((t) => { if (B.has(t)) inter++ })
        const union = A.size + B.size - inter
        return union === 0 ? 0 : inter / union
      }
      const askedList = session.conversationHistory.map(h => h.question)
      const askedNorm = askedList.map(q => ({ raw: q, norm: normalize(q), toks: tokens(q) }))
      const candNorm = normalize(next.question)
      const candToks = tokens(next.question)

      // UK route: Trust the LLM selection (it's already using the question bank)
      // CRITICAL FIX: Don't validate against UK_QUESTION_POOL here - it breaks questionId tracking
      // The smart question selector already ensures questions are from the bank
      if (session.route === 'uk_student') {
        // Just check for duplicates, don't validate against the pool
        const isDuplicate = askedNorm.some(a => a.norm === candNorm || jaccard(a.toks, candToks) >= 0.70)
        if (isDuplicate) {
          console.warn(`[UK Interview] Duplicate detected, using fallback`);
          const askedSet = new Set(askedNorm.map(a => a.norm))
          return this.getUniqueFallbackQuestion(session.currentQuestionNumber, askedSet, session.route)
        }
        // Return the LLM's question with its questionId intact
        return next
      }

      // France: Q1 is always fixed, Q2-10 use hybrid LLM selection from remaining questions
      if ((session.route === 'france_ema' || session.route === 'france_icn') && session.university) {
        // Question 1: Always use the fixed first question
        if (session.currentQuestionNumber === 1) {
          const firstQ = getFirstQuestionForUniversity(session.university)
          return {
            question: firstQ.question,
            questionType: firstQ.questionType,
            difficulty: firstQ.difficulty || 'medium',
            expectedAnswerLength: firstQ.expectedAnswerLength || 'medium',
            questionId: firstQ.id, // CRITICAL FIX: Include question ID for tracking
          }
        }

        // Questions 2-10: Use LLM selection from remaining questions with STRICT de-duplication (lowered threshold)
        const remainingPool = getRemainingQuestionsForUniversity(session.university)
        const bank = new Set(remainingPool.map(q => normalize(q.question)))
        const isDuplicate = askedNorm.some(a => a.norm === candNorm || jaccard(a.toks, candToks) >= 0.70)
        
        // Log if duplicate detected for debugging
        if (isDuplicate) {
          console.warn(`[France Interview] Duplicate question detected: "${next.question}". Using fallback.`)
        }
        if (!bank.has(candNorm)) {
          console.warn(`[France Interview] Question not in bank: "${next.question}". Using fallback.`)
        }
        
        if (!bank.has(candNorm) || isDuplicate) {
          const askedSet = new Set(askedNorm.map(a => a.norm))
          const fallback = this.getUniqueFallbackQuestion(session.currentQuestionNumber, askedSet, session.route, session.university)
          console.log(`[France Interview] Using fallback question: "${fallback.question}"`)
          return fallback
        }
        
        // Additional safety check: ensure this exact question hasn't been asked
        const exactMatch = session.conversationHistory.some(h => h.question === next.question)
        if (exactMatch) {
          console.warn(`[France Interview] EXACT match detected for: "${next.question}". Using fallback.`)
          const askedSet = new Set(askedNorm.map(a => a.norm))
          return this.getUniqueFallbackQuestion(session.currentQuestionNumber, askedSet, session.route, session.university)
        }
        
        return next
      }

      // USA F1: apply fuzzy de-duplication and category gating by question number (lowered threshold for better semantic dedup)
      const isNearDuplicate = askedNorm.some(a => a.norm === candNorm || jaccard(a.toks, candToks) >= 0.70)

      // Allowed flow by question number (Nepal F1 realistic pattern)
      const allowedTypesByIndex = (n: number): Array<'background'|'academic'|'financial'|'intent'|'follow-up'> => {
        if (n <= 2) return ['background','follow-up']
        if (n === 3) return ['academic','follow-up'] // University choice
        if (n === 4) return ['academic','follow-up'] // Academic capability
        if (n === 5 || n === 6) return ['financial','follow-up']
        return ['intent','follow-up'] // Q7+
      }
      const allowed = allowedTypesByIndex(session.currentQuestionNumber)
      const type = next.questionType || 'follow-up'

      if (!isNearDuplicate && allowed.includes(type as any)) {
        return next
      }

      // Build unique fallback from F1 bank constrained by allowed types
      const allowedF1Categories = new Set(
        allowed
          .filter(t => t !== 'follow-up')
          .map(t => mapQuestionTypeToF1Category(t))
      )
      const askedSet = new Set(askedNorm.map(a => a.norm))

      // Flatten candidates from allowed categories
      const candidates: string[] = []
      F1_VISA_QUESTIONS.forEach(cat => {
        if (allowedF1Categories.has(cat.category)) {
          cat.questions.forEach(q => candidates.push(q))
        }
      })
      // Filter out duplicates (lowered threshold for better semantic dedup)
      const remaining = candidates.filter(q => {
        const n = normalize(q)
        if (askedSet.has(n)) return false
        const t = tokens(q)
        return !askedNorm.some(a => jaccard(a.toks, t) >= 0.70)
      })
      if (remaining.length > 0) {
        // Choose by session-seeded index to vary across sessions but stay stable within a session
        const hashString = (s: string): number => {
          let h = 0
          for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
          return Math.abs(h)
        }
        const seed = `${session.id}:${session.currentQuestionNumber}`
        const idx = hashString(seed) % remaining.length
        const q = remaining[idx]
        // Map back to type: prefer the first allowed non-follow-up type for UI badge
        const preferred = allowed.find(t => t !== 'follow-up') || 'background'
        const qType: QuestionGenerationResponse['questionType'] = preferred as any
        console.log(`[InterviewSim] path=fallback route=${session.route || 'usa_f1'} step=${session.currentQuestionNumber} sel=session_seed idx=${idx}`)
        
        // CRITICAL FIX: Add semantic cluster tracking for fallback questions
        const semanticCluster = getSemanticCluster(q);
        
        // CRITICAL FIX: Generate a proper fallback ID instead of leaving it undefined
        const fallbackId = `F1_FALLBACK_${session.currentQuestionNumber}_${idx}`;
        
        return {
          question: q,
          questionType: qType,
          difficulty: 'medium',
          expectedAnswerLength: 'medium',
          semanticCluster: semanticCluster || undefined,
          questionId: fallbackId, // ✅ Now fallback questions have IDs too
        }
      }

      // As last resort, fall back to generic rotation while avoiding exact repeats
      const fb = this.getFallbackQuestion(session.currentQuestionNumber, session.route, session.university)
      console.log(`[InterviewSim] path=fallback-generic route=${session.route || 'usa_f1'} step=${session.currentQuestionNumber} text=${fb.question.slice(0,60)}`)
      return fb
    } catch (error) {
      console.error('Error generating question:', error);
      // If API fails, pick a unique question from the UK/France bank when on those routes
      if (session.route === 'uk_student' || session.route === 'france_ema' || session.route === 'france_icn') {
        const normalize = (s: string) => s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const asked = new Set(session.conversationHistory.map(h => normalize(h.question)));
        return this.getUniqueFallbackQuestion(session.currentQuestionNumber, asked, session.route, session.university);
      }
      // Otherwise, use generic fallback rotation
      return this.getFallbackQuestion(session.currentQuestionNumber, session.route, session.university);
    }
  }

  /**
   * CRITICAL FIX: Validate question uniqueness with stricter thresholds
   * Returns true if question is unique, false if it's too similar to previous questions
   */
  private validateQuestionUniqueness(
    question: string,
    conversationHistory: Array<{ question: string }>
  ): boolean {
    const normalize = (s: string) => s
      .toLowerCase()
      .replace(/["""'']/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const STOP = new Set(['what','why','how','do','did','are','is','your','you','the','in','to','of','for','on','at','this','that','it','a','an','any','have','will','can','be','with']);
    const tokens = (s: string) => normalize(s).split(' ').filter(t => t.length > 2 && !STOP.has(t));
    
    const jaccard = (a: string[], b: string[]) => {
      const A = new Set(a), B = new Set(b);
      let inter = 0;
      A.forEach((t) => { if (B.has(t)) inter++ });
      const union = A.size + B.size - inter;
      return union === 0 ? 0 : inter / union;
    };
    
    const candNorm = normalize(question);
    const candToks = tokens(question);
    
    for (const h of conversationHistory) {
      const histNorm = normalize(h.question);
      const histToks = tokens(h.question);
      
      // Exact match check
      if (candNorm === histNorm) {
        console.warn(`⚠️ [EXACT DUPLICATE] "${question}" === "${h.question}"`);
        return false;
      }
      
      // Semantic similarity check (stricter threshold: 60%)
      const similarity = jaccard(candToks, histToks);
      if (similarity >= 0.60) {
        console.warn(`⚠️ [SEMANTIC DUPLICATE] ${(similarity * 100).toFixed(0)}% similar:`);
        console.warn(`   New: "${question}"`);
        console.warn(`   Old: "${h.question}"`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get a fallback question if the API fails
   */
  private getFallbackQuestion(questionNumber: number, route?: InterviewRoute, university?: FranceUniversity): QuestionGenerationResponse {
    if (route === 'uk_student') {
      const uk = ukFallbackQuestionByIndex(questionNumber)
      return {
        question: uk.question,
        questionType: uk.questionType,
        difficulty: uk.difficulty || 'medium',
        expectedAnswerLength: uk.expectedAnswerLength || 'medium',
        questionId: uk.id, // CRITICAL FIX: Include question ID for tracking
      }
    }
    if ((route === 'france_ema' || route === 'france_icn') && university) {
      const fr = franceFallbackQuestionByIndex(questionNumber, university)
      return {
        question: fr.question,
        questionType: fr.questionType,
        difficulty: fr.difficulty || 'medium',
        expectedAnswerLength: fr.expectedAnswerLength || 'medium',
        questionId: fr.id, // CRITICAL FIX: Include question ID for tracking
      }
    }
    const fallbackQuestions = [
      {
        id: 'GENERIC_FB_001',
        question: "Good morning. Please tell me about yourself and why you want to study in the United States.",
        questionType: 'background' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        id: 'GENERIC_FB_002',
        question: "What is your intended major and why did you choose this field of study?",
        questionType: 'academic' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        id: 'GENERIC_FB_003',
        question: "How will you finance your education in the United States?",
        questionType: 'financial' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        id: 'GENERIC_FB_004',
        question: "Why did you choose this particular university over others?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        id: 'GENERIC_FB_005',
        question: "What are your career plans after completing your studies?",
        questionType: 'intent' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        id: 'GENERIC_FB_006',
        question: "What ties do you have to your home country that will ensure your return?",
        questionType: 'intent' as const,
        difficulty: 'hard' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        id: 'GENERIC_FB_007',
        question: "How did you learn about this university and program?",
        questionType: 'academic' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        id: 'GENERIC_FB_008',
        question: "Do you have any relatives or friends in the United States?",
        questionType: 'background' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      }
    ];

    const index = (questionNumber - 1) % fallbackQuestions.length;
    const selected = fallbackQuestions[index];
    return {
      ...selected,
      questionId: selected.id, // ✅ Now generic fallback questions have IDs too
    };
  }

  /**
   * Get a unique fallback question that hasn't been asked yet
   */
  private getUniqueFallbackQuestion(
    questionNumber: number,
    askedNormalized: Set<string>,
    route?: InterviewRoute,
    university?: FranceUniversity
  ): QuestionGenerationResponse {
    const normalized = (s: string) => s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // UK question pool
    if (route === 'uk_student') {
      const pool = UK_QUESTION_POOL.map(q => ({
        question: q.question,
        questionType: q.questionType as 'academic' | 'financial' | 'intent' | 'background' | 'follow-up',
        difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
        expectedAnswerLength: (q.expectedAnswerLength || 'medium') as 'short' | 'medium' | 'long',
        questionId: q.id, // CRITICAL FIX: Include question ID for tracking
      }));
      
      const available = pool.filter(q => !askedNormalized.has(normalized(q.question)));
      if (available.length > 0) {
        const idx = (questionNumber - 1) % available.length;
        return available[idx];
      }
      return pool[0];
    }
    
    // France question pool - STRICT no-duplicate guarantee
    if ((route === 'france_ema' || route === 'france_icn') && university) {
      const francePool = getRemainingQuestionsForUniversity(university);
      const pool = francePool.map(q => ({
        question: q.question,
        questionType: q.questionType as 'academic' | 'financial' | 'intent' | 'background' | 'follow-up',
        difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
        expectedAnswerLength: (q.expectedAnswerLength || 'medium') as 'short' | 'medium' | 'long',
        questionId: q.id, // CRITICAL FIX: Include question ID for tracking
      }));
      
      // Filter out already asked questions with strict matching
      const available = pool.filter(q => {
        const norm = normalized(q.question);
        return !askedNormalized.has(norm);
      });
      
      if (available.length > 0) {
        const idx = (questionNumber - 1) % available.length;
        console.log(`[France Fallback] ${available.length} questions available, selecting index ${idx}`);
        return available[idx];
      }
      
      // Should never reach here if we have 15/10 questions and only ask 10
      console.error(`[France Fallback] No available questions! This should not happen.`);
      
      // Last resort: return a question from pool even if duplicate (better than crash)
      return pool[questionNumber % pool.length];
    }
    
    // USA F1 and generic fallback
    const pool = [
      {
        id: 'USA_FB_001',
        question: "Why do you want to study in the US?",
        questionType: 'background' as const,
        difficulty: 'easy' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        id: 'USA_FB_002',
        question: "Why can't you continue your education in your home country?",
        questionType: 'background' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        id: 'USA_FB_003',
        question: "How many schools did you apply to? How many rejected you?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        id: 'USA_FB_004',
        question: "Why did you choose this particular university over others?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'medium' as const
      },
      {
        id: 'USA_FB_005',
        question: "Who is sponsoring your education? What is their annual income?",
        questionType: 'financial' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        id: 'USA_FB_006',
        question: "How will you pay for your tuition and living expenses?",
        questionType: 'financial' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        id: 'USA_FB_007',
        question: "What are your GRE and TOEFL scores? Did you fail any subjects?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      {
        id: 'USA_FB_008',
        question: "What are your plans after graduation? Do you plan to return to Nepal?",
        questionType: 'intent' as const,
        difficulty: 'hard' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        id: 'USA_FB_009',
        question: "What is the guarantee that you will come back to Nepal after your studies?",
        questionType: 'intent' as const,
        difficulty: 'hard' as const,
        expectedAnswerLength: 'long' as const
      },
      {
        id: 'USA_FB_010',
        question: "Do you have any relatives or friends in the United States?",
        questionType: 'background' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      }
    ];

    // USA F1 fallback: use default rotation, return first not-yet-asked question
    for (const q of pool) {
      if (!askedNormalized.has(normalized(q.question))) {
        return {
          ...q,
          questionId: q.id, // ✅ Now USA F1 fallback questions have IDs too
        };
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
