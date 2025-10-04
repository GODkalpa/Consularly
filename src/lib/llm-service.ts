// F1 fallbacks are inlined below; UK pool is imported
import type { InterviewRoute } from './interview-routes'
import { UK_QUESTION_POOL } from './uk-questions-data'
import { F1_VISA_QUESTIONS } from './f1-questions-data'
import { SmartQuestionSelector, loadQuestionBank } from './smart-question-selector'
import type { InterviewRoute as LLMRoute } from './llm-provider-selector'

interface QuestionGenerationRequest {
  previousQuestion?: string;
  studentAnswer?: string;
  interviewContext: {
    visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
    route?: InterviewRoute; // usa_f1 | uk_student
    studentProfile: {
      name: string;
      country: string;
      intendedUniversity?: string;
      fieldOfStudy?: string;
      previousEducation?: string;
      degreeLevel?: 'undergraduate' | 'graduate' | 'doctorate' | 'other';
      programName?: string;
      universityName?: string;
      programLength?: string;
      programCost?: string;
    };
    currentQuestionNumber: number;
    conversationHistory: Array<{
      question: string;
      answer: string;
      timestamp: string;
    }>;
  };
}

interface QuestionGenerationResponse {
  question: string;
  questionType: 'academic' | 'financial' | 'intent' | 'background' | 'follow-up';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswerLength: 'short' | 'medium' | 'long';
  tips?: string;
}

// PERFORMANCE FIX: Cache question selector globally to avoid repeated loads
let cachedQuestionSelector: SmartQuestionSelector | null = null;
let initPromise: Promise<void> | null = null;

async function getOrInitializeQuestionSelector(): Promise<SmartQuestionSelector | null> {
  if (cachedQuestionSelector) {
    return cachedQuestionSelector;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const questionBank = await loadQuestionBank();
        cachedQuestionSelector = new SmartQuestionSelector(questionBank);
        console.log('[Question Service] Initialized with cached smart question selector');
      } catch (error) {
        console.error('[Question Service] Failed to initialize smart selector:', error);
        // Will fall back to legacy method
      }
    })();
  }

  await initPromise;
  return cachedQuestionSelector;
}

export class LLMQuestionService {
  private questionSelector: SmartQuestionSelector | null = null;

  constructor() {
    // Use cached selector instead of creating new instance
    this.initialize();
  }

  private async initialize() {
    this.questionSelector = await getOrInitializeQuestionSelector();
  }

  async generateQuestion(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    // Wait for initialization (now uses cached selector)
    if (!this.questionSelector) {
      this.questionSelector = await getOrInitializeQuestionSelector();
    }

    const route = request.interviewContext.route || 'usa_f1';
    const { studentProfile, conversationHistory, currentQuestionNumber } = request.interviewContext;

    // Try smart question selector first
    if (this.questionSelector) {
      try {
        // Build category coverage from conversation history
        const categoryCoverage: Record<string, number> = {};
        conversationHistory.forEach(h => {
          const question = h.question.toLowerCase();
          if (/financ|fund|cost|sponsor|pay|tuition|£|\$/i.test(question)) categoryCoverage['financial'] = (categoryCoverage['financial'] || 0) + 1;
          else if (/course|university|study|major|degree|program/i.test(question)) categoryCoverage['academic'] = (categoryCoverage['academic'] || 0) + 1;
          else if (/return|plan|after|future|career/i.test(question)) categoryCoverage['post_study'] = (categoryCoverage['post_study'] || 0) + 1;
          else if (/accommodation|housing|living/i.test(question)) categoryCoverage['intent'] = (categoryCoverage['intent'] || 0) + 1;
          else categoryCoverage['personal'] = (categoryCoverage['personal'] || 0) + 1;
        });

        const context = {
          route: route as LLMRoute,
          profile: {
            name: studentProfile.name,
            university: studentProfile.intendedUniversity,
            course: studentProfile.fieldOfStudy,
            degree: studentProfile.previousEducation,
          },
          history: conversationHistory.map(h => ({
            question: h.question,
            answer: h.answer,
          })),
          askedQuestionIds: [], // We don't track IDs in current system, but selector will avoid repeats
          detectedRedFlags: this.detectRedFlags(conversationHistory),
          categoryCoverage,
        };

        const result = await this.questionSelector.selectNextQuestion(context);
        
        console.log(`[Question Service] ${result.type} question selected:`, result.reasoning);

        return {
          question: result.question,
          questionType: this.inferQuestionType(result.question),
          difficulty: 'medium',
          expectedAnswerLength: 'medium',
          tips: result.reasoning,
        };
      } catch (error) {
        console.error('[Question Service] Smart selector failed, using fallback:', error);
      }
    }

    // Legacy fallback
    return this.getFallbackQuestion(request);
  }

  private detectRedFlags(history: Array<{ question: string; answer: string }>): string[] {
    const flags: string[] = [];
    const allAnswers = history.map(h => h.answer.toLowerCase()).join(' ');
    
    if (/(agent|consultant).*?(told|said|helped|chose)/i.test(allAnswers)) flags.push('agent_dependency');
    if (!/£\s*1[8-9],?\d{3}|\$\s*[2-9]\d,?\d{3}/i.test(allAnswers)) flags.push('no_specific_amounts');
    if (/(maybe|probably|thinking|might).*?(return|go back)/i.test(allAnswers)) flags.push('weak_return_intent');
    if (/(dream|world-class|best|pursue)/i.test(allAnswers)) flags.push('coached_language');
    
    return flags;
  }

  private inferQuestionType(question: string): 'academic' | 'financial' | 'intent' | 'background' | 'follow-up' {
    const q = question.toLowerCase();
    if (/financ|fund|cost|sponsor|pay|tuition|£|\$/i.test(q)) return 'financial';
    if (/course|university|study|major|degree|module/i.test(q)) return 'academic';
    if (/return|plan|after|future|career|post/i.test(q)) return 'intent';
    if (/why|background|previous|experience/i.test(q)) return 'background';
    return 'follow-up';
  }

  private getSystemPrompt(route?: InterviewRoute): string {
    if (route === 'uk_student') {
      return `You are an expert UK university credibility (pre-CAS) interviewer. Conduct realistic pre-CAS style interviews to assess genuine student intent, course and university fit, financial requirements (28-day funds and maintenance), accommodation planning, compliance history, and post-study intentions.

Key Guidelines (UK pre-CAS):
1. Ask concise, officer-like questions specific to UK study route
2. Probe details from the student's previous answers; avoid repetition
3. Cover: Genuine student intent → Course & University fit → Financial requirement → Accommodation/logistics → Compliance & credibility → Post-study intent
4. If the previous answer is vague, demand specifics (numbers, names, timelines)
5. Challenge inconsistencies (e.g., agent selection, gaps, visa refusals)
6. Keep one question at a time (no multi-part unless clarifying)

STRICT BANK SELECTION RULE:
- You MUST pick EXACTLY ONE question from the fixed UK question bank that the user message will provide.
- Do NOT invent or rephrase questions; return the chosen bank question text verbatim.
- Do NOT repeat any previously asked bank question.

Response Format:
{
  "question": string,
  "questionType": "academic|financial|intent|background|follow-up",
  "difficulty": "easy|medium|hard",
  "expectedAnswerLength": "short|medium|long",
  "tips": string (optional)
}`
    }
    return `You are an expert F1 visa interview officer simulator for the US Embassy in Nepal. Your role is to conduct realistic, adaptive mock visa interviews by intelligently selecting from a bank of actual F1 questions and crafting relevant follow-ups.

CRITICAL RULES:
1. **Question Selection**: Choose questions from the provided question bank that fit the current interview flow and student's previous answers
2. **Contextual Follow-ups**: Generate follow-ups that directly reference specific details (or missing details) from the student's last answer
3. **Self-Consistency Testing**: Track facts mentioned by the student (costs, sponsors, roles) and probe contradictions
4. **Natural Flow**: Start broad (Study Plans → University Choice), then dive into specifics (Academic Capability → Financial Status → Post-graduation Plans)
5. **No Repetition**: Never repeat a question already asked; if revisiting a topic, probe a different angle or clarify contradictions
6. **Officer-Like Tone**: Be direct, concise, and challenging like a real visa officer

ADAPTIVE LOGIC:
- If previous answer was **vague** (<50 chars or no specifics): Demand concrete details (numbers, names, evidence)
- If previous answer was **detailed**: Challenge consistency, probe deeper implications
- If previous answer mentioned **numbers**: Track them; if new numbers conflict, ask for clarification
- If previous answer mentioned **sponsors/funding**: Remember source; probe sufficiency and evidence
- If previous answer mentioned **US ties**: Probe intent to return and home country ties
- If financial questions lack numbers: Follow up with "Can you be more specific? Give me an amount."

INTERVIEW FLOW PATTERN (8-10 questions total):
1. **Study Plans** (Q1-2): Why US? Why this major/program?
2. **University Choice** (Q3): Why this university specifically? Application process?
3. **Academic Capability** (Q4): Test scores, GPA, or academic background?
4. **Financial Status** (Q5-6): Total cost? Sponsorship? Source of funds?
5. **Post-graduation Plans** (Q7-8): Career plans? Return intent? Home ties?
6. **Follow-ups** (as needed): Clarify vague/contradictory answers

Question Bank Categories:
- Study plans, University choice, Academic capability, Financial status, Post-graduation plans, Additional/General

Response Format (STRICT JSON):
{
  "question": "Selected question from bank OR contextual follow-up",
  "questionType": "academic|financial|intent|background|follow-up",
  "difficulty": "easy|medium|hard",
  "expectedAnswerLength": "short|medium|long",
  "tips": "Optional guidance"
}

Make every question purposeful, adaptive, and officer-authentic.`;
  }

  private buildPrompt(request: QuestionGenerationRequest): string {
    const { interviewContext, previousQuestion, studentAnswer } = request;
    const { visaType, route, studentProfile, currentQuestionNumber, conversationHistory } = interviewContext;

    const isUK = route === 'uk_student'

    const headerUK = `Generate the next UK student (pre-CAS/credibility) interview question.

Student Profile:
- Name: ${studentProfile.name}
- Country: ${studentProfile.country}
- Degree Level: ${studentProfile.degreeLevel || 'Not specified'}
- Program: ${studentProfile.programName || 'Not specified'}
- University: ${studentProfile.universityName || studentProfile.intendedUniversity || 'Not specified'}
- Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
- Program Length: ${studentProfile.programLength || 'Not specified'}
- Total Cost: ${studentProfile.programCost || 'Not specified'}
- Previous Education: ${studentProfile.previousEducation || 'Not specified'}

Interview Progress: Question ${currentQuestionNumber}

IMPORTANT: Use the degree level (${studentProfile.degreeLevel || 'not specified'}) to tailor questions appropriately:
- For undergraduate: Focus on high school background, career exploration, foundational knowledge
- For graduate (Master's): Ask about undergraduate degree, research interests, specialization reasons, career advancement
- For doctorate (PhD): Emphasize research proposals, advisor fit, long-term academic goals, publications`

    const headerUS = `Generate the next visa interview question for a ${visaType} visa applicant.

Student Profile:
- Name: ${studentProfile.name}
- Country: ${studentProfile.country}
- Degree Level: ${studentProfile.degreeLevel || 'Not specified'}
- Program: ${studentProfile.programName || 'Not specified'}
- University: ${studentProfile.universityName || studentProfile.intendedUniversity || 'Not specified'}
- Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
- Program Length: ${studentProfile.programLength || 'Not specified'}
- Total Cost: ${studentProfile.programCost || 'Not specified'}
- Previous Education: ${studentProfile.previousEducation || 'Not specified'}

Interview Progress: Question ${currentQuestionNumber}

IMPORTANT: Use the degree level (${studentProfile.degreeLevel || 'not specified'}) and program details to tailor questions:
- For undergraduate: Questions should focus on basic career goals, high school background, why they need a US education
- For graduate (Master's): Ask about their existing degree, why further study is necessary, career advancement plans
- For doctorate (PhD): Emphasize research, why this specific program/advisor, post-completion plans
- Reference the specific program (${studentProfile.programName || 'their program'}) and cost (${studentProfile.programCost || 'program costs'}) in questions when relevant
- Use university name (${studentProfile.universityName || studentProfile.intendedUniversity || 'this university'}) to ask why they chose this specific institution`

    let prompt = isUK ? headerUK : headerUS;

    if (isUK) {
      // Provide a fixed bank for strict selection
      const bankLines = UK_QUESTION_POOL.map((q, i) => `- [${i + 1}] (${q.questionType}/${q.difficulty || 'medium'}) ${q.question}`).join('\n');
      prompt += `\n\nFixed UK Question Bank (choose one verbatim from below):\n${bankLines}`;
      prompt += `\n\nInstructions:\n- Choose a question that fits the current flow and the student's previous answers.\n- Return the selected question EXACTLY as it appears in the bank (no changes).\n- Do not repeat any previously asked bank question.`
    } else if (route === 'usa_f1') {
      // Provide F1 question bank for intelligent selection
      const f1BankByCategory = F1_VISA_QUESTIONS.map(cat => {
        const questions = cat.questions.map(q => `  • ${q}`).join('\n');
        return `**${cat.category}**\n${questions}`;
      }).join('\n\n');
      
      prompt += `\n\nF1 Question Bank (select appropriate questions from these categories):\n\n${f1BankByCategory}`;
      prompt += `\n\nInstructions:
- Select questions from the bank that match the current interview stage and flow
- You may adapt wording slightly to be more contextual, but keep the core question intent
- Generate contextual follow-ups based on the student's specific answer (reference details they mentioned or omitted)
- Do NOT repeat questions already asked
- Ensure smooth transitions between categories (Study Plans → University → Academic → Financial → Post-grad)`
    }

    // PERFORMANCE FIX: Only include recent conversation history (last 3 exchanges)
    // Full history is unnecessary and slows down LLM processing
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3); // Last 3 Q&A pairs
      prompt += `\n\nRecent Conversation History (last ${recentHistory.length} exchanges):`;
      recentHistory.forEach((exchange, index) => {
        const actualIndex = conversationHistory.length - recentHistory.length + index;
        prompt += `\nQ${actualIndex + 1}: ${exchange.question}`;
        prompt += `\nA${actualIndex + 1}: ${exchange.answer.slice(0, 200)}`; // Limit answer length to 200 chars
      });
      if (conversationHistory.length > 3) {
        prompt += `\n(${conversationHistory.length - 3} earlier exchanges omitted for efficiency)`;
      }
    }

    if (previousQuestion && studentAnswer) {
      prompt += `\n\nPrevious Question: ${previousQuestion}`;
      prompt += `\nStudent's Answer: ${studentAnswer}`;
      prompt += `\n\nAnalyze the student's answer and generate a follow-up question that:`;
      
      // Analyze answer quality and suggest follow-up strategy
      const answerLength = studentAnswer.length;
      const hasSpecificDetails = /\b(university|degree|program|research|project|score|GPA|income|sponsor|job|career)\b/i.test(studentAnswer);
      const seemsVague = answerLength < 50 || !hasSpecificDetails;
      
      if (seemsVague) {
        prompt += `\n- Probes for specific details (the answer was too vague)`;
        prompt += `\n- Asks for concrete examples, numbers, or evidence`;
        prompt += `\n- Tests if they really know what they're talking about`;
      } else {
        prompt += `\n- Builds on their detailed response with deeper questions`;
        prompt += `\n- Tests consistency with other aspects of their application`;
        prompt += `\n- Explores potential concerns or red flags`;
      }
      
      // Hard constraints
      prompt += `\n- MUST be clearly connected to the student's answer (reference a detail or missing detail)`;
      prompt += `\n- MUST NOT repeat any previously asked question verbatim`;
      prompt += `\n- If a topic was covered, only ask a targeted follow-up (no restating)`;

      // Suggest question categories based on conversation history
      const coveredTopics = conversationHistory.map(h => h.question.toLowerCase());
      const needsFinancial = isUK
        ? !coveredTopics.some(q => q.includes('fund') || q.includes('financial') || q.includes('maintenance'))
        : !coveredTopics.some(q => q.includes('sponsor') || q.includes('pay') || q.includes('cost'));
      const needsIntent = !coveredTopics.some(q => q.includes('return') || q.includes('plan') || q.includes('after'));
      const needsAcademic = isUK
        ? !coveredTopics.some(q => q.includes('course') || q.includes('module') || q.includes('university'))
        : !coveredTopics.some(q => q.includes('score') || q.includes('gpa') || q.includes('grade'));
      
      if (needsFinancial && currentQuestionNumber > 2) {
        prompt += `\n- Consider asking about financial capability if not covered yet`;
      }
      if (needsIntent && currentQuestionNumber > 4) {
        prompt += `\n- Consider asking about post-graduation plans and return intent`;
      }
      if (needsAcademic && currentQuestionNumber > 1) {
        prompt += isUK
          ? `\n- Consider asking about course & university fit if not covered`
          : `\n- Consider asking about academic qualifications if not covered`;
      }
      prompt += isUK
        ? `\n- Keep the UK flow in mind (Genuine Student → Course & University → Financial Requirement → Accommodation/Logistics → Compliance → Post-study Intent)\n- Select the next question ONLY from the provided bank and return it verbatim.`
        : `\n- Keep the overall pattern in mind (Study Plans → University → Academic → Financial → Intent)`;
    } else {
      // First question or starting new topic - follow country-specific flow
      const questionFlow = isUK
        ? [
            'Genuine student intent and background',
            'Course and University fit (why this course/university; alternatives)',
            'Financial requirement (funds, sources, 28-day requirement, maintenance)',
            'Accommodation and logistics (living plans, costs, city specifics)',
            'Compliance & credibility (agent involvement, refusals, gaps)',
            'Post-study intentions and ties'
          ]
        : [
            'Study plans: Why US? Why this major?',
            'University choice: Why this university? Application process?',
            'Academic capability: Test scores, GPA, academic background?',
            'Financial status: Sponsorship, income, expenses?',
            'Post-graduation plans: Return intent, career goals?',
            'Additional probing: Ties to US, family obligations?'
          ];

      const focusIndex = Math.min(currentQuestionNumber - 1, questionFlow.length - 1);
      prompt += `\n\nGenerate a question focusing on: ${questionFlow[focusIndex]}`;
      prompt += `\nQuestion ${currentQuestionNumber} - Make it direct and challenging like a real visa officer.`;
      prompt += `\nDo NOT repeat any previously asked question. Keep the flow coherent.`;
      if (isUK) {
        prompt += `\nSelect the question ONLY from the provided bank and return it verbatim.`;
      }
    }

    return prompt;
  }

  private parseResponse(content: string): QuestionGenerationResponse {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        question: parsed.question || content,
        questionType: parsed.questionType || 'follow-up',
        difficulty: parsed.difficulty || 'medium',
        expectedAnswerLength: parsed.expectedAnswerLength || 'medium',
        tips: parsed.tips
      };
    } catch {
      // If not valid JSON, treat as plain text question
      return {
        question: content.trim(),
        questionType: 'follow-up',
        difficulty: 'medium',
        expectedAnswerLength: 'medium'
      };
    }
  }

  private getFallbackQuestion(request: QuestionGenerationRequest): QuestionGenerationResponse {
    const { currentQuestionNumber, route } = request.interviewContext;
    
    if (route === 'uk_student') {
      const idx = (currentQuestionNumber - 1) % UK_QUESTION_POOL.length
      const uk = UK_QUESTION_POOL[idx]
      return {
        question: uk.question,
        questionType: uk.questionType,
        difficulty: uk.difficulty || 'medium',
        expectedAnswerLength: uk.expectedAnswerLength || 'medium',
      }
    }

    // Use real F1 visa questions from the database
    const realF1Questions = [
      // Study Plans
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
      // University Choice
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
      // Financial Status
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
      // Academic Capability
      {
        question: "What are your GRE and TOEFL scores? Did you fail any subjects?",
        questionType: 'academic' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      },
      // Post-graduation Plans
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
      // Additional/General
      {
        question: "Do you have any relatives or friends in the US?",
        questionType: 'follow-up' as const,
        difficulty: 'medium' as const,
        expectedAnswerLength: 'short' as const
      }
    ];

    const index = (currentQuestionNumber - 1) % realF1Questions.length;
    return realF1Questions[index];
  }
}

export type { QuestionGenerationRequest, QuestionGenerationResponse };
