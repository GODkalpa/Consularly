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
  askedClusters?: string[]; // Track semantic clusters already covered
  contextFlags?: Record<string, boolean>; // Context availability for questions
}

interface QuestionResult {
  question: string;
  type: 'bank' | 'followup';
  questionId?: string;
  reasoning?: string;
}

/**
 * Semantic clusters for detecting questions with same essence
 */
const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  return_intent: ['return', 'come back', 'go back', 'plans after', 'after graduation', 'after studies', 'after completing'],
  finance_sponsor: ['sponsor', 'pay', 'fund', 'finance', 'cost', 'tuition', 'afford', 'expenses'],
  failure_grades: ['fail', 'backlog', 'poor grades', 'low gpa', 'reject', 'arrear', 'bad marks'],
  us_relatives: ['relatives', 'family', 'friends in us', 'uncle', 'aunt', 'cousin'],
  university_choice: ['why this university', 'why choose', 'selected this', 'picked this'],
  study_reason: ['why study', 'why us', 'why america', 'reason for studying'],
  career_plans: ['career', 'job plans', 'work plans', 'professional goals'],
};

/**
 * Get semantic cluster for a question
 */
function getSemanticCluster(question: string): string | null {
  const q = question.toLowerCase();
  for (const [cluster, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
    if (keywords.some(kw => q.includes(kw))) {
      return cluster;
    }
  }
  return null;
}

/**
 * Build context flags from profile and conversation history
 */
function buildContextFlags(
  profile: StudentContext['profile'],
  history: Array<{ question: string; answer: string }>
): Record<string, boolean> {
  const allAnswers = history.map(h => h.answer).join(' ').toLowerCase();
  const profileStr = JSON.stringify(profile).toLowerCase();
  
  return {
    has_failures: /fail|backlog|arrear|poor.*grade|low.*gpa/i.test(allAnswers + profileStr),
    has_us_relatives: /relative|uncle|aunt|cousin|friend.*(in|living|stay).*(us|usa|america|united states)/i.test(allAnswers),
    has_scholarship: /scholarship|grant|award|stipend/i.test(allAnswers + profileStr),
    low_gpa: /gpa.*(2\.|1\.)|low.*gpa|poor.*grade/i.test(allAnswers + profileStr),
    has_work_experience: /work|job|employee|experience.*(year|month)/i.test(allAnswers + profileStr),
    mentioned_return_plans: /return|come back|go back|plan.*after/i.test(allAnswers),
  };
}

export class SmartQuestionSelector {
  private questionBank: QuestionBank;
  
  private franceFollowUpPatterns = [
    {
      pattern: /course|programme|program/i,
      trigger: (answer: string) => !(/duration|length|years?|months?|\d+/i.test(answer)),
      followUp: "Can you specify the exact duration of your course?"
    },
    {
      pattern: /tuition|fees?|cost/i,
      trigger: (answer: string) => !(/€|euro|amount|\d+/i.test(answer)),
      followUp: "Can you provide the exact tuition fee amount for your programme?"
    },
    {
      pattern: /career|objectives?|goals?/i,
      trigger: (answer: string) => answer.split(' ').length < 20 && !/specific|role|position|industry/i.test(answer),
      followUp: "Can you be more specific about your career objectives and the role you're targeting?"
    },
    {
      pattern: /chose|choose|selected/i,
      trigger: (answer: string) => /good|best|top|ranked|reputation/i.test(answer) && answer.length < 100,
      followUp: "Beyond the reputation, what specific features of the programme attracted you?"
    },
    {
      pattern: /sponsor|financing|paying/i,
      trigger: (answer: string) => !(/parent|family|loan|scholarship|savings/i.test(answer)),
      followUp: "Who specifically will be sponsoring your studies? What is their relationship to you?"
    },
    {
      pattern: /work|job|employment/i,
      trigger: (answer: string) => /yes|maybe|plan/i.test(answer) && !(/hours?|part[- ]?time|rules/i.test(answer)),
      followUp: "Are you aware of the work regulations for international students in France?"
    },
    {
      pattern: /background|experience|education/i,
      trigger: (answer: string) => answer.split(' ').length < 25 && !(/degree|university|years?|graduated/i.test(answer)),
      followUp: "Can you provide more details about your academic qualifications and when you completed them?"
    }
  ];
  
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
    // Education loan specifics
    {
      pattern: /loan|education loan|bank loan/i,
      trigger: (answer: string) => /loan/i.test(answer) && !/(approved|sanctioned|\$\d+|interest|rate|tenure|emi|amount)/i.test(answer),
      followUp: "You mentioned an education loan. Is it approved? What is the sanctioned amount, interest rate, and repayment plan?"
    },
    // Large deposits in statements
    {
      pattern: /deposit|lump sum|recently deposited|bank statement/i,
      trigger: (answer: string) => /(deposit|lump sum|recent)/i.test(answer) && !/(salary|business income|sale deed|gift deed|inheritance|evidence)/i.test(answer),
      followUp: "There are large recent deposits in your bank statements. Can you explain the source with evidence (salary, business revenue, sale deed, or gift deed)?"
    },
    // Family business clarity
    {
      pattern: /business|family business|shop|company|factory/i,
      trigger: (answer: string) => /business|company|factory|shop/i.test(answer) && !/(annual (income|revenue)|turnover|tax returns?|profit)/i.test(answer),
      followUp: "You said your family runs a business. What is the annual revenue and what do the tax returns show for the last year?"
    },
    // Relatives in the US
    {
      pattern: /uncle|aunt|cousin|relative|friend in (the )?US|usa/i,
      trigger: (answer: string) => /(uncle|aunt|cousin|relative|friend)/i.test(answer) && !/(financial support|sponsor|no support)/i.test(answer),
      followUp: "You mentioned relatives/friends in the US. Are they providing any financial support? If not, clarify your independent funding."
    },
  ];

  constructor(questionBank: QuestionBank) {
    this.questionBank = questionBank;
  }

  /**
   * Nepal F1 (USA) stage flow helpers
   */
  private getUsaStage(step: number): 'study_plans' | 'university_choice' | 'academic_capability' | 'financial' | 'post_study' {
    if (step <= 2) return 'study_plans';
    if (step === 3) return 'university_choice';
    if (step === 4) return 'academic_capability';
    if (step <= 6) return 'financial';
    return 'post_study';
  }

  private getUsaStageLabel(stage: ReturnType<SmartQuestionSelector['getUsaStage']>): string {
    switch (stage) {
      case 'study_plans': return 'Study Plans (why US, why this major/program)';
      case 'university_choice': return 'University Choice specifics';
      case 'academic_capability': return 'Academic Capability (scores/GPA/background)';
      case 'financial': return 'Financial Status (costs, sponsors, sources)';
      case 'post_study': return 'Post-graduation Plans and Return Intent';
    }
  }

  private filterUsaQuestionsByStage(available: Question[], stage: ReturnType<SmartQuestionSelector['getUsaStage']>): Question[] {
    const has = (q: Question, k: string) => q.keywords?.includes(k);
    const any = (q: Question, keys: string[]) => keys.some(k => has(q, k));
    const none = (q: Question, keys: string[]) => !any(q, keys);
    const qText = (q: Question) => q.question.toLowerCase();

    switch (stage) {
      case 'study_plans':
        // Academic, introductory motivation questions; exclude university- and score-specific items
        return available.filter(q =>
          (q.route === 'usa_f1' || q.route === 'both') &&
          q.category === 'academic' &&
          any(q, ['study', 'major', 'degree']) &&
          none(q, ['university', 'school', 'test', 'scores', 'gpa'])
        );
      case 'university_choice':
        // Why this university, city, professors, admits/rejects
        return available.filter(q =>
          (q.route === 'usa_f1' || q.route === 'both') &&
          q.category === 'academic' &&
          any(q, ['university', 'school'])
        );
      case 'academic_capability':
        // Scores/GPA/marksheet/backlogs
        return available.filter(q =>
          (q.route === 'usa_f1' || q.route === 'both') &&
          q.category === 'academic' &&
          (any(q, ['test', 'scores', 'gpa']) || /marksheet|fail|backlog/i.test(qText(q)))
        );
      case 'financial':
        return available.filter(q =>
          (q.route === 'usa_f1' || q.route === 'both') && q.category === 'financial'
        );
      case 'post_study':
        // Prefer post_study category; allow intent with return/ties semantics
        const post = available.filter(q => (q.route === 'usa_f1' || q.route === 'both') && q.category === 'post_study');
        if (post.length) return post;
        return available.filter(q =>
          (q.route === 'usa_f1' || q.route === 'both') &&
          q.category === 'intent' && any(q, ['return', 'plans', 'future'])
        );
    }
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
    let patterns;
    if (route === 'uk_student') {
      patterns = this.ukFollowUpPatterns;
    } else if (route === 'france_ema' || route === 'france_icn') {
      patterns = this.franceFollowUpPatterns;
    } else {
      patterns = this.usaFollowUpPatterns;
    }

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
    // Build context flags if not provided
    if (!context.contextFlags) {
      context.contextFlags = buildContextFlags(context.profile, context.history);
    }
    
    // Build asked clusters if not provided
    if (!context.askedClusters) {
      context.askedClusters = context.history
        .map(h => getSemanticCluster(h.question))
        .filter((c): c is string => c !== null);
    }
    
    // Filter questions by route
    let availableQuestions = this.questionBank.questions.filter(
      (q) => q.route === context.route || q.route === 'both'
    ).filter(
      (q) => !context.askedQuestionIds.includes(q.id)
    );
    
    // Filter by semantic clusters (don't ask questions from already-covered clusters)
    availableQuestions = availableQuestions.filter((q) => {
      const cluster = getSemanticCluster(q.question);
      if (cluster && context.askedClusters!.includes(cluster)) {
        console.log(`[Question Selector] Skipping ${q.id} - cluster '${cluster}' already covered`);
        return false;
      }
      return true;
    });
    
    // Filter by context requirements (if question has requiresContext, check flags)
    availableQuestions = availableQuestions.filter((q) => {
      const qAny = q as any;
      if (qAny.requiresContext && Array.isArray(qAny.requiresContext)) {
        const hasRequiredContext = qAny.requiresContext.some((ctx: string) => 
          context.contextFlags![ctx] === true
        );
        if (!hasRequiredContext) {
          console.log(`[Question Selector] Skipping ${q.id} - missing required context: ${qAny.requiresContext.join(', ')}`);
          return false;
        }
      }
      return true;
    });

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

    // Build route-specific guidance with STRICT Nepal F1 stage gating
    const step = context.history.length + 1;
    const stage = context.route === 'usa_f1' ? this.getUsaStage(step) : null;
    const stageLabel = stage ? this.getUsaStageLabel(stage) : '';
    const usaFlowHint = stage
      ? `STRICT Nepal F1 flow at step ${step}: ${stageLabel}. Do not jump ahead; stay within this stage.`
      : '';

    // Restrict the candidate pool to stage-appropriate questions for USA
    const stagePool = context.route === 'usa_f1' ? this.filterUsaQuestionsByStage(availableQuestions, this.getUsaStage(step)) : availableQuestions;
    const pool = stagePool.length ? stagePool : availableQuestions;

    // Build route-specific guidance
    const routeGuidance = context.route === 'uk_student'
      ? 'UK Student Visa priorities: course module specificity, £18,000 maintenance requirement, 28-day rule awareness, agent dependency detection, work hour compliance (20h/week), accommodation costs in £/week.'
      : 'USA F1 Visa priorities: specific dollar amounts for funding, Nepal ties and return intent, detect coached language (dreams, world-class), sponsor occupation details, concrete post-graduation plans. ' + usaFlowHint;

    // Category coverage status
    const coverageStatus = Object.entries(context.categoryCoverage)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');

    // Question summaries (first 20 from the current pool)
    const questionSummaries = pool.slice(0, 20).map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      preview: q.question.substring(0, 80),
    }));

    // Build asked clusters summary
    const askedClusters = context.askedClusters || [];
    const clustersSummary = askedClusters.length > 0 
      ? `Already covered semantic topics: ${askedClusters.join(', ')}` 
      : 'No semantic topics covered yet';
    
    // Build context flags summary
    const contextSummary = context.contextFlags 
      ? Object.entries(context.contextFlags)
          .filter(([_, v]) => v)
          .map(([k]) => k)
          .join(', ') || 'none'
      : 'none';

    const systemPrompt = `You are an expert visa interview question selector. Your task is to select the most relevant next question from a question bank.

${routeGuidance}

Current interview state:
- Questions asked: ${context.history.length}
- Category coverage: ${coverageStatus || 'none yet'}
- ${clustersSummary}
- Detected red flags: ${context.detectedRedFlags.join(', ') || 'none'}
- Student profile: ${context.profile.course || 'unknown'} at ${context.profile.university || 'unknown'}
- Context available: ${contextSummary}

CRITICAL ANTI-REPETITION RULES:
1. NEVER select a question that is semantically similar to already-asked questions
   - "return/come back/plans after" = SAME topic
   - "sponsor/pay/fund" = SAME topic
   - Check the "Already covered semantic topics" list above
2. NEVER ask about failures/backlogs/poor grades unless context shows: has_failures or low_gpa
3. NEVER ask assumption-based questions without evidence in profile or answers
4. If uncertain about context appropriateness, choose a general question instead

Selection criteria (in priority order):
1. Avoid semantic clusters already covered
2. Only select questions appropriate for available context
3. Cover under-represented categories (financial, academic, intent, personal, post_study)
4. Match student profile relevance
5. Progressive difficulty (start easy, increase gradually)
6. Follow up on red flags if detected

Return JSON: {"questionId": "selected_id", "reasoning": "brief explanation"}`;

    const userPrompt = `Available questions (${pool.length} in current stage pool, showing first 20):
${JSON.stringify(questionSummaries, null, 2)}

Recent conversation context:
${context.history.slice(-2).map((h) => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n')}

Select the best next question ID.`;

    try {
      // Enforce a short timeout for snappy selection; fallback if slow
      const timeoutMs = 3000;
      const response = await Promise.race([
        callLLMProvider(config, systemPrompt, userPrompt, 0.3, 500),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('LLM selection timeout')), timeoutMs)),
      ]);
      const result = JSON.parse(response.content);
      // Enforce selection from the current pool first
      let selectedQuestion = pool.find((q) => q.id === result.questionId);
      if (!selectedQuestion) {
        selectedQuestion = availableQuestions.find((q) => q.id === result.questionId);
      }
      if (selectedQuestion) {
        console.log(`[Question Selector] path=llm route=${context.route} step=${context.history.length + 1} id=${selectedQuestion.id}`);
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
    // Simple deterministic string hash for seeded selection
    const hashString = (s: string): number => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
      }
      return Math.abs(h);
    };

    // USA: strictly follow Nepal F1 stage flow
    if (context.route === 'usa_f1') {
      const step = context.history.length + 1;
      const stage = this.getUsaStage(step);
      const pool = this.filterUsaQuestionsByStage(availableQuestions, stage);
      const stagePool = pool.length ? pool : availableQuestions;
      // Seed selection using earliest available stable signal; vary across sessions when empty
      const seedBase = context.history[0]?.question || `${Date.now()}`;
      const seededIndex = stagePool.length > 0 ? hashString(seedBase) % stagePool.length : 0;
      // Prefer non-hard, but start from seeded index to introduce variety
      let selected = stagePool[seededIndex] || stagePool[0] || availableQuestions[0];
      if (selected?.difficulty === 'hard') {
        const nonHard = stagePool.find((q) => q.difficulty !== 'hard');
        if (nonHard) selected = nonHard;
      }
      if (selected) {
        console.log(`[Question Selector] path=rule route=${context.route} step=${step} id=${selected.id} reason=stage:${this.getUsaStageLabel(stage)}`);
      }
      return {
        question: selected.question,
        type: 'bank',
        questionId: selected.id,
        reasoning: `Rule-based: Nepal F1 stage '${this.getUsaStageLabel(stage)}'`,
      };
    }

    // UK, France, and others: least-covered-category heuristic
    const categories: Array<'financial' | 'academic' | 'intent' | 'personal' | 'post_study'> = 
      ['financial', 'academic', 'intent', 'personal', 'post_study'];
    const leastCoveredCategory = categories.reduce((min, cat) => {
      const count = context.categoryCoverage[cat] || 0;
      const minCount = context.categoryCoverage[min] || 0;
      return count < minCount ? cat : min;
    });
    const categoryQuestions = availableQuestions.filter((q) => q.category === leastCoveredCategory);
    const selected = categoryQuestions.find((q) => q.difficulty !== 'hard') || categoryQuestions[0] || availableQuestions[0];
    
    const routeLabel = context.route === 'uk_student' ? 'UK' : 
                       context.route === 'france_ema' ? 'France EMA' :
                       context.route === 'france_icn' ? 'France ICN' : 'general';
    if (selected) {
      console.log(`[Question Selector] path=rule route=${context.route} step=${context.history.length + 1} id=${selected.id} reason=least_covered:${leastCoveredCategory}`);
    }
    return {
      question: selected.question,
      type: 'bank',
      questionId: selected.id,
      reasoning: `Rule-based (${routeLabel}): selected from least covered category (${leastCoveredCategory})`,
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
