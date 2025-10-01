/**
 * Smart Question Selector
 * Intelligently selects questions from the bank and generates contextual follow-ups
 * Route-aware with UK and USA specific logic
 */

import {
  InterviewRoute,
  LLMUseCase,
  selectLLMProvider,
  callLLMProvider,
  logProviderSelection,
} from './llm-provider-selector';

interface Question {
  id: string;
  route: 'usa_f1' | 'uk_student' | 'both';
  category: 'financial' | 'academic' | 'intent' | 'personal' | 'post_study';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  keywords: string[];
  followUpTriggers: string[];
}

interface QuestionBank {
  questions: Question[];
}

interface StudentContext {
  route: InterviewRoute;
  profile: {
    name: string;
    university?: string;
    course?: string;
    degree?: string;
  };
  history: Array<{
    question: string;
    answer: string;
  }>;
  askedQuestionIds: string[];
  detectedRedFlags: string[];
  categoryCoverage: Record<string, number>;
}

interface QuestionResult {
  question: string;
  type: 'bank' | 'followup';
  questionId?: string;
  reasoning?: string;
}

export class SmartQuestionSelector {
  private questionBank: QuestionBank;
  private ukFollowUpPatterns = [
    {
      pattern: /business|management|marketing|finance modules?/i,
      trigger: (answer: string) => !(/specific|module name|[A-Z]{4}\s?\d{3,4}|e\.g\.|such as/i.test(answer)),
      followUp: "You mentioned business modules. Can you tell me the specific module names or codes you'll be studying?"
    },
    {
      pattern: /sufficient|enough|covered|funds?|money|pay/i,
      trigger: (answer: string) => !(/£18,?000|18000|eighteen thousand/i.test(answer)),
      followUp: "You mentioned having sufficient funds. Can you specify the exact maintenance requirement amount for your course duration?"
    },
    {
      pattern: /accommodation|housing|living|residence/i,
      trigger: (answer: string) => !(/£\d+|week|month|specific|address|arranged/i.test(answer)),
      followUp: "Can you provide more details about your accommodation arrangements, including the weekly or monthly cost?"
    },
    {
      pattern: /agent|consultant|agency|representative/i,
      trigger: (answer: string) => /told|said|suggested|recommended|helped|guided/i.test(answer),
      followUp: "I see you mentioned an agent or consultant. Can you explain what independent research you did about the university and course?"
    },
    {
      pattern: /work|job|employment|earn/i,
      trigger: (answer: string) => !(/20 hours?|part[- ]?time|limit|restriction/i.test(answer)),
      followUp: "You mentioned working while studying. Are you aware of the work hour restrictions for international students in the UK?"
    },
    {
      pattern: /university|chose|selected|picked/i,
      trigger: (answer: string) => /good|best|top|ranked|prestigious/i.test(answer) && answer.length < 100,
      followUp: "You mentioned the university's reputation. Can you be more specific about what research you did comparing different universities for your course?"
    },
    {
      pattern: /course|program|degree/i,
      trigger: (answer: string) => answer.split(' ').length < 20 && !/because|specific|research|module|career/i.test(answer),
      followUp: "Can you elaborate more on why you chose this specific course and how it aligns with your career goals?"
    },
    {
      pattern: /bank|statement|savings|deposit/i,
      trigger: (answer: string) => !(/28[- ]?day|consecutive|period|rule/i.test(answer)),
      followUp: "Regarding your financial documents, are you aware of the 28-day rule for bank statements?"
    },
  ];

  private usaFollowUpPatterns = [
    {
      pattern: /parents?|father|mother|family/i,
      trigger: (answer: string) => /will pay|paying|support|fund/i.test(answer) && !(/\$\d+|dollar|USD|thousand/i.test(answer)),
      followUp: "You mentioned your parents will pay for your education. Can you specify the exact dollar amount they will be contributing?"
    },
    {
      pattern: /sponsor|funding|finance/i,
      trigger: (answer: string) => !/occupation|job|business|profession|income/i.test(answer),
      followUp: "Can you tell me more about your sponsor's occupation and how they'll be funding your education?"
    },
    {
      pattern: /scholarship|award|grant/i,
      trigger: (answer: string) => !(/\$\d+|amount|percentage|full|partial/i.test(answer)),
      followUp: "You mentioned a scholarship. Can you specify the exact amount or percentage of tuition it covers?"
    },
    {
      pattern: /dream|passion|world[- ]?class|best|pursue|opportunity/i,
      trigger: (answer: string) => /(fulfill|achieve) (my )?dream|(world[- ]?class|best) (education|university)/i.test(answer),
      followUp: "Can you give me more specific, practical reasons for choosing this university beyond general statements?"
    },
    {
      pattern: /return|come back|go back|plans?/i,
      trigger: (answer: string) => /maybe|thinking|might|probably|planning|considering/i.test(answer),
      followUp: "You seem uncertain about returning to Nepal. Can you describe concrete plans or commitments that tie you to Nepal after graduation?"
    },
    {
      pattern: /major|degree|study|course/i,
      trigger: (answer: string) => answer.split(' ').length < 15 && !/because|specific|career|interest|experience/i.test(answer),
      followUp: "Can you elaborate more on your specific academic interests and how they relate to your career goals in Nepal?"
    },
  ];

  constructor(questionBank: QuestionBank) {
    this.questionBank = questionBank;
  }

  /**
   * Select the next question (from bank or as follow-up)
   */
  async selectNextQuestion(context: StudentContext): Promise<QuestionResult> {
    // Check if we need a follow-up based on the last answer
    if (context.history.length > 0) {
      const lastInteraction = context.history[context.history.length - 1];
      const followUp = this.detectFollowUpNeed(context.route, lastInteraction.answer);
      
      if (followUp) {
        return {
          question: followUp,
          type: 'followup',
          reasoning: 'Detected incomplete or vague answer requiring clarification',
        };
      }
    }

    // Select from question bank using LLM
    const bankQuestion = await this.selectFromBank(context);
    return bankQuestion;
  }

  /**
   * Detect if a follow-up question is needed based on route-specific patterns
   */
  private detectFollowUpNeed(route: InterviewRoute, answer: string): string | null {
    const patterns = route === 'uk_student' ? this.ukFollowUpPatterns : this.usaFollowUpPatterns;

    for (const { pattern, trigger, followUp } of patterns) {
      if (pattern.test(answer) && trigger(answer)) {
        return followUp;
      }
    }

    return null;
  }

  /**
   * Select question from bank using LLM intelligence
   */
  private async selectFromBank(context: StudentContext): Promise<QuestionResult> {
    // Filter questions by route
    const availableQuestions = this.questionBank.questions.filter(
      (q) => q.route === context.route || q.route === 'both'
    ).filter(
      (q) => !context.askedQuestionIds.includes(q.id)
    );

    if (availableQuestions.length === 0) {
      return {
        question: "Is there anything else you'd like to share about your plans?",
        type: 'bank',
        reasoning: 'No more questions available in bank',
      };
    }

    // Try LLM selection
    try {
      const selected = await this.selectWithLLM(context, availableQuestions);
      if (selected) {
        return selected;
      }
    } catch (error) {
      console.warn('[Question Selector] LLM selection failed, using rule-based fallback:', error);
    }

    // Fallback to rule-based selection
    return this.selectRuleBased(context, availableQuestions);
  }

  /**
   * Use LLM to intelligently select next question
   */
  private async selectWithLLM(
    context: StudentContext,
    availableQuestions: Question[]
  ): Promise<QuestionResult | null> {
    const config = selectLLMProvider(context.route, 'question_selection');
    if (!config) return null;

    logProviderSelection(context.route, 'question_selection', config);

    // Build route-specific guidance
    const routeGuidance = context.route === 'uk_student'
      ? 'UK Student Visa priorities: course module specificity, £18,000 maintenance requirement, 28-day rule awareness, agent dependency detection, work hour compliance (20h/week), accommodation costs in £/week.'
      : 'USA F1 Visa priorities: specific dollar amounts for funding, Nepal ties and return intent, detect coached language (dreams, world-class), sponsor occupation details, concrete post-graduation plans.';

    // Category coverage status
    const coverageStatus = Object.entries(context.categoryCoverage)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');

    // Question summaries (first 20 for context window)
    const questionSummaries = availableQuestions.slice(0, 20).map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      preview: q.question.substring(0, 80),
    }));

    const systemPrompt = `You are an expert visa interview question selector. Your task is to select the most relevant next question from a question bank.

${routeGuidance}

Current interview state:
- Questions asked: ${context.history.length}
- Category coverage: ${coverageStatus || 'none yet'}
- Detected red flags: ${context.detectedRedFlags.join(', ') || 'none'}
- Student profile: ${context.profile.course || 'unknown'} at ${context.profile.university || 'unknown'}

Selection criteria (in priority order):
1. Cover under-represented categories first (financial, academic, intent, personal, post_study)
2. Match student profile relevance
3. Progressive difficulty (start easy, increase gradually)
4. Follow up on red flags if detected

Return JSON: {"questionId": "selected_id", "reasoning": "brief explanation"}`;

    const userPrompt = `Available questions (${availableQuestions.length} total, showing first 20):
${JSON.stringify(questionSummaries, null, 2)}

Recent conversation context:
${context.history.slice(-2).map((h) => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n')}

Select the best next question ID.`;

    try {
      const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.3, 500);
      const result = JSON.parse(response.content);
      
      const selectedQuestion = availableQuestions.find((q) => q.id === result.questionId);
      if (selectedQuestion) {
        return {
          question: selectedQuestion.question,
          type: 'bank',
          questionId: selectedQuestion.id,
          reasoning: result.reasoning,
        };
      }
    } catch (error) {
      console.error('[Question Selector] LLM selection error:', error);
    }

    return null;
  }

  /**
   * Rule-based fallback selection
   */
  private selectRuleBased(context: StudentContext, availableQuestions: Question[]): QuestionResult {
    // Find least covered category
    const categories: Array<'financial' | 'academic' | 'intent' | 'personal' | 'post_study'> = 
      ['financial', 'academic', 'intent', 'personal', 'post_study'];
    
    const leastCoveredCategory = categories.reduce((min, cat) => {
      const count = context.categoryCoverage[cat] || 0;
      const minCount = context.categoryCoverage[min] || 0;
      return count < minCount ? cat : min;
    });

    // Filter by least covered category
    const categoryQuestions = availableQuestions.filter(
      (q) => q.category === leastCoveredCategory
    );

    // Pick first easy/medium question from that category
    const selected = categoryQuestions.find((q) => q.difficulty !== 'hard') || categoryQuestions[0] || availableQuestions[0];

    return {
      question: selected.question,
      type: 'bank',
      questionId: selected.id,
      reasoning: `Rule-based: selected from least covered category (${leastCoveredCategory})`,
    };
  }

  /**
   * Generate a contextual follow-up using LLM (advanced feature)
   */
  async generateContextualFollowUp(
    route: InterviewRoute,
    question: string,
    answer: string
  ): Promise<string | null> {
    const config = selectLLMProvider(route, 'question_selection');
    if (!config) return null;

    const routeGuidance = route === 'uk_student'
      ? 'Probe for: specific module names, £18,000 amount, 28-day rule, independent research (not agent-told), 20-hour work limit, specific accommodation costs.'
      : 'Probe for: exact dollar amounts, sponsor occupation, concrete Nepal ties, authentic reasoning (avoid coached phrases), specific return plans.';

    const systemPrompt = `You are a visa interview officer. The candidate gave a vague or incomplete answer. Generate a targeted follow-up question to probe deeper.

${routeGuidance}

Keep it conversational and direct. Return JSON: {"followUp": "your question here"}`;

    const userPrompt = `Original question: "${question}"
Candidate answer: "${answer}"

Generate a follow-up question.`;

    try {
      const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.5, 200);
      const result = JSON.parse(response.content);
      return result.followUp || null;
    } catch (error) {
      console.error('[Question Selector] Follow-up generation error:', error);
      return null;
    }
  }
}

/**
 * Load question bank from JSON file or return default
 */
export async function loadQuestionBank(): Promise<QuestionBank> {
  try {
    // Try to load from JSON file
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const bankPath = path.join(process.cwd(), 'src', 'data', 'question-bank.json');
    const data = await fs.readFile(bankPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('[Question Bank] Failed to load question-bank.json, using defaults');
    return getDefaultQuestionBank();
  }
}

/**
 * Get default question bank (fallback if file doesn't exist)
 */
function getDefaultQuestionBank(): QuestionBank {
  return {
    questions: [
      // USA questions
      {
        id: 'USA_FIN_001',
        route: 'usa_f1',
        category: 'financial',
        difficulty: 'easy',
        question: 'How will you finance your education in the United States?',
        keywords: ['finance', 'sponsor', 'funding', 'cost', 'scholarship'],
        followUpTriggers: ['parents will pay', 'sufficient', 'covered'],
      },
      {
        id: 'USA_ACD_001',
        route: 'usa_f1',
        category: 'academic',
        difficulty: 'easy',
        question: 'Why do you want to study in the US?',
        keywords: ['study', 'education', 'reason', 'motivation'],
        followUpTriggers: ['dream', 'best', 'world-class'],
      },
      {
        id: 'USA_INT_001',
        route: 'usa_f1',
        category: 'intent',
        difficulty: 'medium',
        question: 'Do you plan to return to Nepal after completing your studies?',
        keywords: ['return', 'Nepal', 'plans', 'future'],
        followUpTriggers: ['maybe', 'thinking', 'probably'],
      },
      // UK questions
      {
        id: 'UK_FIN_001',
        route: 'uk_student',
        category: 'financial',
        difficulty: 'easy',
        question: 'What is the total cost of your education, including tuition and living expenses?',
        keywords: ['cost', 'tuition', 'living', '£18000', 'maintenance'],
        followUpTriggers: ['sufficient', 'enough', 'covered'],
      },
      {
        id: 'UK_ACD_001',
        route: 'uk_student',
        category: 'academic',
        difficulty: 'easy',
        question: 'Why did you choose this specific university and course?',
        keywords: ['university', 'course', 'choice', 'reason'],
        followUpTriggers: ['good', 'best', 'ranked'],
      },
      {
        id: 'UK_INT_001',
        route: 'uk_student',
        category: 'intent',
        difficulty: 'medium',
        question: 'Do you know the rules for international students working in the UK?',
        keywords: ['work', 'rules', 'hours', 'employment'],
        followUpTriggers: ['yes', 'allowed', 'can work'],
      },
      // Shared questions
      {
        id: 'BOTH_ACD_001',
        route: 'both',
        category: 'academic',
        difficulty: 'medium',
        question: 'Why did you choose this specific field of study?',
        keywords: ['field', 'major', 'program', 'career'],
        followUpTriggers: ['passion', 'interest'],
      },
    ],
  };
}
