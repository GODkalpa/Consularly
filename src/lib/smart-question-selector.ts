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
    degreeLevel?: 'undergraduate' | 'graduate' | 'doctorate' | 'other'; // For degree-specific filtering
    programName?: string;
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
  priorityCategory?: string; // Topic focus: prioritize questions from this category
  targetDifficulty?: 'easy' | 'medium' | 'hard' | 'expert'; // Preferred difficulty level
  difficultyDistribution?: { easy: number; medium: number; hard: number }; // % distribution from mode
  categoryRequirements?: Array<{ category: string; minQuestions: number; maxQuestions: number }>; // From mode config
}

interface QuestionResult {
  question: string;
  type: 'bank' | 'followup';
  questionId?: string;
  reasoning?: string;
  semanticCluster?: string; // Track cluster to prevent repetition
}

/**
 * Semantic clusters for detecting questions with same essence
 * Expanded to 15 clusters for comprehensive coverage
 */
const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  // Core clusters (original 7)
  return_intent: ['return', 'come back', 'go back', 'plans after', 'after graduation', 'after studies', 'after completing', 'when graduation', 'post-graduation'],
  finance_sponsor: ['sponsor', 'pay', 'fund', 'finance', 'cost', 'tuition', 'afford', 'expenses', 'funding', 'financial'],
  failure_grades: ['fail', 'backlog', 'poor grades', 'low gpa', 'reject', 'arrear', 'bad marks', 'academic issues'],
  us_relatives: ['relatives', 'family', 'friends in us', 'uncle', 'aunt', 'cousin', 'connections in us', 'family in america'],
  university_choice: ['why this university', 'why choose', 'selected this', 'picked this', 'university decision', 'this school'],
  study_reason: ['why study', 'why us', 'why america', 'reason for studying', 'why abroad', 'why not home country'],
  career_plans: ['career', 'job plans', 'work plans', 'professional goals', 'career goals', 'future job'],
  
  // New clusters (8 additional)
  university_ranking: ['ranking', 'reputation', 'prestige', 'tier', 'top university', 'best school', 'famous university'],
  multiple_universities: ['how many universities', 'applied to', 'other schools', 'rejected by', 'acceptance rate', 'multiple admits'],
  semester_timing: ['semester', 'fall', 'spring', 'intake', 'when start', 'academic calendar', 'term beginning'],
  living_arrangements: ['where live', 'accommodation', 'housing', 'dormitory', 'on campus', 'off campus', 'residence'],
  test_scores: ['gre', 'toefl', 'ielts', 'sat', 'test score', 'exam result', 'standardized test'],
  work_experience: ['work experience', 'previous job', 'employment', 'current job', 'years working', 'professional background'],
  loan_details: ['loan', 'education loan', 'borrowed', 'debt', 'repayment', 'interest rate', 'bank loan'],
  ties_home_country: ['ties', 'property', 'assets', 'obligations', 'roots', 'connections home', 'family business', 'land'],
};

/**
 * Get semantic cluster for a question
 */
export function getSemanticCluster(question: string): string | null {
  const q = question.toLowerCase();
  for (const [cluster, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
    if (keywords.some(kw => q.includes(kw))) {
      return cluster;
    }
  }
  return null;
}

/**
 * Check if a question is appropriate for the student's degree level (USA F1 only)
 * Returns false if the question should be filtered out
 */
function isQuestionAppropriateForDegreeLevel(
  question: string,
  degreeLevel?: 'undergraduate' | 'graduate' | 'doctorate' | 'other'
): boolean {
  if (!degreeLevel) return true; // No filtering if degree level unknown
  
  const q = question.toLowerCase();
  
  // Questions that should ONLY be asked to graduate/doctorate students (about their PAST bachelor's)
  const graduateOnlyPatterns = [
    /what is your undergraduate degree/i,
    /in what year did you get your bachelor'?s degree/i,
    /what year did you graduate.*undergraduate/i,
    /tell me about your bachelor'?s degree/i,
    /undergraduate projects/i,
    /during your undergraduate/i,
    /you already have a master'?s.*why.*mba|ms/i, // Only for those who ALREADY have master's
  ];
  
  // For UNDERGRADUATE students: Filter OUT questions about past bachelor's
  if (degreeLevel === 'undergraduate') {
    for (const pattern of graduateOnlyPatterns) {
      if (pattern.test(q)) {
        console.log(`[Question Filter] Filtering OUT for undergrad: "${question.substring(0, 60)}..."`);
        return false; // Don't ask undergrads about their "undergraduate degree"
      }
    }
  }
  
  // Questions that should ONLY be asked to PhD students
  const phdOnlyPatterns = [
    /publish.*papers/i,
    /research proposal/i,
    /advisor/i,
    /dissertation/i,
    /thesis defense/i,
    /do you plan to do a phd after/i,
  ];
  
  // For non-PhD students: Filter OUT PhD-specific questions
  if (degreeLevel !== 'doctorate') {
    for (const pattern of phdOnlyPatterns) {
      if (pattern.test(q)) {
        // Exception: "Do you plan to do a PhD after your master's?" is OK for Master's students
        if (degreeLevel === 'graduate' && /do you plan to do a phd/i.test(q)) {
          return true;
        }
        console.log(`[Question Filter] Filtering OUT non-PhD question: "${question.substring(0, 60)}..."`);
        return false;
      }
    }
  }
  
  return true; // Question is appropriate
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
  
  // Degree level flags for question filtering
  const isUndergraduate = profile.degreeLevel === 'undergraduate';
  const isGraduate = profile.degreeLevel === 'graduate';
  const isDoctorate = profile.degreeLevel === 'doctorate';
  
  return {
    has_failures: /fail|backlog|arrear|poor.*grade|low.*gpa/i.test(allAnswers + profileStr),
    has_us_relatives: /relative|uncle|aunt|cousin|friend.*(in|living|stay).*(us|usa|america|united states)/i.test(allAnswers),
    has_scholarship: /scholarship|grant|award|stipend/i.test(allAnswers + profileStr),
    low_gpa: /gpa.*(2\.|1\.)|low.*gpa|poor.*grade/i.test(allAnswers + profileStr),
    has_work_experience: /work|job|employee|experience.*(year|month)/i.test(allAnswers + profileStr),
    mentioned_return_plans: /return|come back|go back|plan.*after/i.test(allAnswers),
    // Degree level context flags
    is_undergraduate: isUndergraduate,
    is_graduate: isGraduate,
    is_doctorate: isDoctorate,
    has_completed_bachelors: isGraduate || isDoctorate, // Master's/PhD students have bachelor's
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
        // CRITICAL FIX: Track semantic cluster for follow-ups too
        const cluster = getSemanticCluster(followUp);
        
        // CRITICAL FIX: Generate a synthetic questionId for follow-ups to enable tracking
        // Format: FOLLOWUP_<route>_<step>_<timestamp>
        const followUpId = `FOLLOWUP_${context.route}_${context.history.length + 1}_${Date.now()}`;
        
        return {
          question: followUp,
          type: 'followup',
          questionId: followUpId, // ✅ Now follow-ups have IDs too
          reasoning: 'Detected incomplete or vague answer requiring clarification',
          semanticCluster: cluster || undefined,
        };
      }
    }

    // Select from question bank using LLM
    const bankQuestion = await this.selectFromBank(context);
    
    // CRITICAL FIX: Add semantic cluster to bank question result
    const cluster = getSemanticCluster(bankQuestion.question);
    return {
      ...bankQuestion,
      semanticCluster: cluster || undefined,
    };
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
    
    // CRITICAL FIX: Trust passed askedClusters array, only rebuild as fallback
    // The session tracking is authoritative - don't rebuild from history
    if (!context.askedClusters || context.askedClusters.length === 0) {
      context.askedClusters = context.history
        .map(h => getSemanticCluster(h.question))
        .filter((c): c is string => c !== null);
      console.log(`[Question Selector] Rebuilt ${context.askedClusters.length} clusters from history (fallback)`);
    } else {
      console.log(`[Question Selector] Using ${context.askedClusters.length} tracked clusters from session`);
    }
    
    // CRITICAL FIX: Filter out FOLLOWUP_* IDs from askedQuestionIds before filtering bank questions
    // Follow-up IDs are synthetic and won't match bank question IDs
    const bankAskedIds = context.askedQuestionIds.filter(id => !id.startsWith('FOLLOWUP_'));
    
    // Filter questions by route
    let availableQuestions = this.questionBank.questions.filter(
      (q) => q.route === context.route || q.route === 'both'
    ).filter(
      (q) => !bankAskedIds.includes(q.id)
    );
    
    console.log(`[Question Selector] Initial pool: ${availableQuestions.length} questions (filtered by route and asked IDs: ${bankAskedIds.length})`);

    // UK ROUTE: Fixed first question for every interview
    // Ensure "Which visa Application Centre... (city + centre)" is always asked once at the start
    if (context.route === 'uk_student' && context.history.length === 0) {
      const fixedFirst = availableQuestions.find((q) => q.id === 'UK_001');
      if (fixedFirst) {
        console.log(`[Question Selector] UK fixed first question: ${fixedFirst.id}`);
        return {
          question: fixedFirst.question,
          type: 'bank',
          questionId: fixedFirst.id,
          reasoning: 'UK fixed first question: visa application centre (city + centre)',
        };
      }
    }
    
    // CRITICAL FIX: More lenient cluster filtering - only block if cluster was asked in last 3 questions
    // This prevents over-filtering while still avoiding immediate repetition
    const recentClusters = context.askedClusters.slice(-3); // Only last 3 clusters
    availableQuestions = availableQuestions.filter((q) => {
      const cluster = getSemanticCluster(q.question);
      if (cluster && recentClusters.includes(cluster)) {
        console.log(`[Question Selector] Skipping ${q.id} - cluster '${cluster}' recently covered`);
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
    
    // CRITICAL: Filter by degree level appropriateness for USA F1
    if (context.route === 'usa_f1') {
      availableQuestions = availableQuestions.filter((q) => {
        const isAppropriate = isQuestionAppropriateForDegreeLevel(q.question, context.profile.degreeLevel);
        if (!isAppropriate) {
          console.log(`[Question Selector] Degree filter: Skipping ${q.id} for ${context.profile.degreeLevel || 'unknown'} student`);
        }
        return isAppropriate;
      });
    }
    
    // Filter by category requirements (enforce max questions per category)
    if (context.categoryRequirements) {
      availableQuestions = availableQuestions.filter((q) => {
        const requirement = context.categoryRequirements!.find(r => r.category === q.category);
        if (requirement) {
          const currentCount = context.categoryCoverage[q.category] || 0;
          if (currentCount >= requirement.maxQuestions) {
            console.log(`[Question Selector] Category limit: Skipping ${q.id} - ${q.category} has reached max (${currentCount}/${requirement.maxQuestions})`);
            return false;
          }
        }
        return true;
      });
    }
    
    // Apply difficulty distribution filtering
    if (context.difficultyDistribution || context.targetDifficulty) {
      const totalAsked = context.history.length;
      
      // If specific difficulty is set, prefer that
      if (context.targetDifficulty) {
        console.log(`[Question Selector] Difficulty filter: Targeting ${context.targetDifficulty} questions`);
        
        // Filter to target difficulty first, but keep others as backup
        const targetQuestions = availableQuestions.filter(q => q.difficulty === context.targetDifficulty);
        if (targetQuestions.length > 0) {
          availableQuestions = targetQuestions;
        }
      } 
      // Otherwise use distribution percentages (for progressive difficulty)
      else if (context.difficultyDistribution && totalAsked < 10) {
        const dist = context.difficultyDistribution;
        
        // Calculate which difficulty to prioritize based on progress
        let targetDiff: 'easy' | 'medium' | 'hard' = 'easy';
        if (totalAsked < 3) {
          // Early questions: favor easy (60% easy, 30% medium, 10% hard)
          targetDiff = Math.random() < 0.6 ? 'easy' : (Math.random() < 0.75 ? 'medium' : 'hard');
        } else if (totalAsked < 6) {
          // Mid questions: balanced (30% easy, 50% medium, 20% hard)
          targetDiff = Math.random() < 0.3 ? 'easy' : (Math.random() < 0.625 ? 'medium' : 'hard');
        } else {
          // Late questions: favor hard (20% easy, 40% medium, 40% hard)
          targetDiff = Math.random() < 0.2 ? 'easy' : (Math.random() < 0.5 ? 'medium' : 'hard');
        }
        
        console.log(`[Question Selector] Difficulty distribution: Question ${totalAsked + 1} targeting ${targetDiff}`);
        
        // Filter to target difficulty, keep others as backup
        const targetQuestions = availableQuestions.filter(q => q.difficulty === targetDiff);
        if (targetQuestions.length > 0) {
          availableQuestions = targetQuestions;
        }
      }
    }

    if (availableQuestions.length === 0) {
      return {
        question: "Is there anything else you'd like to share about your plans?",
        type: 'bank',
        reasoning: 'No more questions available in bank',
      };
    }

    // PERFORMANCE OPTIMIZATION: Use LLM selection for intelligent question picking
    // Claude Haiku 4.5 or Groq provide fast (<500ms) and smart question selection
    // Rule-based is instant but less adaptive
    const shouldUseLLM = true; // Enable LLM for all routes (fast models only)
    
    if (shouldUseLLM) {
      // Try LLM selection for USA F1 (adaptive questioning)
      try {
        const selected = await this.selectWithLLM(context, availableQuestions);
        if (selected) {
          return selected;
        }
      } catch (error) {
        console.warn('[Question Selector] LLM selection failed, using rule-based fallback:', error);
      }
    } else {
      console.log(`[Question Selector] Skipping LLM selection for ${context.route} - using fast rule-based selection`);
    }

    // Fallback to rule-based selection (or primary for UK/France)
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

    // CRITICAL FIX: Show ALL available questions to LLM (not just first 20)
    // The LLM needs to see all options to make a valid selection
    const questionSummaries = pool.map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      preview: q.question.substring(0, 80),
    }));
    
    console.log(`[Question Selector] LLM pool size: ${pool.length}, showing all ${questionSummaries.length} questions to LLM`);

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
    
    // Build degree level summary for USA F1
    const degreeLevelInfo = context.route === 'usa_f1' && context.profile.degreeLevel
      ? `\nDegree Level: ${context.profile.degreeLevel} (${context.profile.programName || 'program not specified'})`
      : '';

    // Build topic focus hint
    const topicFocusHint = context.priorityCategory 
      ? `\n- TOPIC FOCUS: Prioritize ${context.priorityCategory} questions (70% preference)` 
      : '';
    
    // Build difficulty preference hint
    const difficultyHint = context.targetDifficulty 
      ? `\n- DIFFICULTY TARGET: Prefer ${context.targetDifficulty} difficulty questions`
      : context.difficultyDistribution
        ? `\n- DIFFICULTY DISTRIBUTION: Progressive difficulty - early questions easier, later questions harder`
        : '';

    const systemPrompt = `You are an expert visa interview question selector. Your task is to select the most relevant next question from a question bank.${degreeLevelInfo}

${routeGuidance}

Current interview state:
- Questions asked: ${context.history.length}
- Category coverage: ${coverageStatus || 'none yet'}
- ${clustersSummary}
- Detected red flags: ${context.detectedRedFlags.join(', ') || 'none'}
- Student profile: ${context.profile.course || 'unknown'} at ${context.profile.university || 'unknown'}
- Context available: ${contextSummary}${topicFocusHint}${difficultyHint}

CRITICAL ANTI-REPETITION RULES:
1. NEVER select a question that is semantically similar to already-asked questions
   - "return/come back/plans after" = SAME topic
   - "sponsor/pay/fund" = SAME topic
   - Check the "Already covered semantic topics" list above
2. NEVER ask about failures/backlogs/poor grades unless context shows: has_failures or low_gpa
3. NEVER ask assumption-based questions without evidence in profile or answers
4. If uncertain about context appropriateness, choose a general question instead

CRITICAL DEGREE-LEVEL FILTERING RULES (USA F1 ONLY):
${context.route === 'usa_f1' ? `
- Student's degree level: ${context.profile.degreeLevel || 'not specified'}
- UNDERGRADUATE students: Ask about high school background, basic career goals, why US education
- GRADUATE (Master's) students: Ask about their COMPLETED bachelor's degree, career advancement, specialization
- DOCTORATE (PhD) students: Ask about research proposals, advisor fit, publications, academic career goals
- NEVER ask "What is your undergraduate degree?" to undergrad students about their CURRENT program
- NEVER ask bachelor's-level questions to Master's/PhD students about their CURRENT studies
- Questions about bachelor's degree are appropriate ONLY as PAST education context for grad students
` : ''}

Selection criteria (in priority order):
1. Avoid semantic clusters already covered
2. ${context.priorityCategory ? `PRIORITIZE ${context.priorityCategory} category questions (topic focus mode active)` : 'Balance category coverage'}
3. Only select questions appropriate for available context
4. ${context.targetDifficulty ? `Prefer ${context.targetDifficulty} difficulty level` : 'Progressive difficulty (start easy, increase gradually)'}
5. Match student profile relevance
6. Follow up on red flags if detected

CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON, nothing else
- NO explanatory text before or after the JSON
- NO HTML tags, NO markdown, NO formatting
- Just the raw JSON object: {"questionId": "selected_id", "reasoning": "brief explanation"}`;

    const userPrompt = `Available questions (${pool.length} total in pool, showing first ${questionSummaries.length}):
${JSON.stringify(questionSummaries, null, 2)}

IMPORTANT: You MUST select a question ID from the list above. Do not invent question IDs.

Recent conversation context:
${context.history.slice(-2).map((h) => `Q: ${h.question.substring(0, 100)}\nA: ${h.answer.substring(0, 150)}`).join('\n\n')}

Select the best next question ID from the available questions above and return ONLY the JSON object with no additional text.
Format: {"questionId": "UK_XXX", "reasoning": "brief explanation"}`;

    try {
      // Timeout for LLM response; fallback to rule-based if slow
      const timeoutMs = 20000; // 20s timeout for MegaLLM (allows time for JSON mode response)
      const response = await Promise.race([
        callLLMProvider(config, systemPrompt, userPrompt, 0.3, 8192),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('LLM selection timeout')), timeoutMs)),
      ]);

      let parsed: any;
      try {
        parsed = JSON.parse(response.content);
      } catch (parseError) {
        console.error('[Question Selector] Failed to parse LLM JSON response:', parseError, 'raw=', response.content);
        return null;
      }

      const result = parsed && typeof parsed === 'object' ? parsed : null;
      if (!result || typeof result.questionId !== 'string') {
        console.error('[Question Selector] Invalid LLM response shape, expected { questionId, ... } but got:', result, 'raw=', response.content);
        return null;
      }

      // CRITICAL FIX: Search in the full available pool, not just the stage-filtered pool
      // The LLM may select from availableQuestions (already filtered by clusters/context)
      let selectedQuestion = availableQuestions.find((q) => q.id === result.questionId);
      
      if (selectedQuestion) {
        // CRITICAL FIX: Double-check this question wasn't already asked (extra safety)
        const alreadyAsked = context.history.some(h => {
          const historyId = (h as any).questionId;
          return historyId === selectedQuestion!.id;
        });
        
        if (alreadyAsked) {
          console.error(`[Question Selector] ❌ LLM selected already-asked question: ${selectedQuestion.id}`);
          console.error(`[Question Selector] This should not happen - falling back to rule-based`);
          return null;
        }
        
        console.log(`[Question Selector] ✅ LLM SUCCESS - path=llm route=${context.route} step=${context.history.length + 1} id=${selectedQuestion.id}`);
        return {
          question: selectedQuestion.question,
          type: 'bank',
          questionId: selectedQuestion.id,
          reasoning: result.reasoning,
        };
      } else {
        // LLM returned an invalid ID (already asked or filtered out)
        console.error(`[Question Selector] ❌ LLM FAILURE - Invalid question ID: ${result.questionId}`);
        console.error(`[Question Selector] Available pool size: ${availableQuestions.length} questions`);
        console.error(`[Question Selector] Pool IDs: ${availableQuestions.map(q => q.id).join(', ')}`);
        console.error(`[Question Selector] Asked IDs: ${context.askedQuestionIds.join(', ')}`);
        console.error(`[Question Selector] LLM reasoning: ${result.reasoning}`);
        return null;
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
    // CRITICAL FIX: Add session-based seeding to prevent same question selection
    const hashString = (s: string): number => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
      }
      return Math.abs(h);
    };
    
    // Create a stable seed from the first question asked (or current step)
    const sessionSeed = context.history.length > 0 
      ? context.history[0].question 
      : `step_${context.history.length}`;
    const stepSeed = `${sessionSeed}_${context.history.length}`;

    // Topic Focus: If priorityCategory is set, prefer questions from that category (70% of the time)
    if (context.priorityCategory) {
      const topicQuestions = availableQuestions.filter(q => q.category === context.priorityCategory);
      if (topicQuestions.length > 0) {
        // CRITICAL FIX: Use seeded selection instead of Math.random()
        const idx = hashString(stepSeed + '_topic') % topicQuestions.length;
        const selected = topicQuestions[idx];
        console.log(`[Question Selector] path=rule route=${context.route} id=${selected.id} reason=topic-focus:${context.priorityCategory}`);
        return {
          question: selected.question,
          type: 'bank',
          questionId: selected.id,
          reasoning: `Topic focus: ${context.priorityCategory}`,
        };
      }
    }

    // USA: strictly follow Nepal F1 stage flow (with category requirement awareness)
    if (context.route === 'usa_f1') {
      const step = context.history.length + 1;
      const stage = this.getUsaStage(step);
      let pool = this.filterUsaQuestionsByStage(availableQuestions, stage);
      const stagePool = pool.length ? pool : availableQuestions;
      
      // If category requirements exist and a category is below minimum, prioritize it
      if (context.categoryRequirements) {
        const belowMin = context.categoryRequirements.find(req => {
          const count = context.categoryCoverage[req.category] || 0;
          return count < req.minQuestions;
        });
        
        if (belowMin) {
          const categoryPool = stagePool.filter(q => q.category === belowMin.category);
          if (categoryPool.length > 0) {
            pool = categoryPool;
            console.log(`[Question Selector] USA F1: Prioritizing ${belowMin.category} to meet minimum (${context.categoryCoverage[belowMin.category] || 0}/${belowMin.minQuestions})`);
          }
        }
      }
      
      // Seed selection using earliest available stable signal; vary across sessions when empty
      const seedBase = context.history[0]?.question || `${Date.now()}`;
      const seededIndex = pool.length > 0 ? hashString(seedBase) % pool.length : 0;
      // Prefer non-hard, but start from seeded index to introduce variety
      let selected = pool[seededIndex] || pool[0] || availableQuestions[0];
      if (selected?.difficulty === 'hard') {
        const nonHard = pool.find((q) => q.difficulty !== 'hard');
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

    // UK, France, and others: least-covered-category heuristic (with minimum requirement awareness)
    const categories: Array<'financial' | 'academic' | 'intent' | 'personal' | 'post_study'> = 
      ['financial', 'academic', 'intent', 'personal', 'post_study'];
    
    // If category requirements exist, prioritize categories below their minimum
    let leastCoveredCategory: string = categories[0];
    
    if (context.categoryRequirements) {
      // Find categories that haven't met minimum requirement yet
      const belowMin = context.categoryRequirements.find(req => {
        const count = context.categoryCoverage[req.category] || 0;
        return count < req.minQuestions;
      });
      
      if (belowMin) {
        leastCoveredCategory = belowMin.category;
        console.log(`[Question Selector] Category requirement: ${leastCoveredCategory} needs ${belowMin.minQuestions - (context.categoryCoverage[belowMin.category] || 0)} more questions to meet minimum`);
      } else {
        // All minimums met, find least covered
        leastCoveredCategory = categories.reduce((min, cat) => {
          const count = context.categoryCoverage[cat] || 0;
          const minCount = context.categoryCoverage[min] || 0;
          return count < minCount ? cat : min;
        });
      }
    } else {
      // No requirements, just find least covered
      leastCoveredCategory = categories.reduce((min, cat) => {
        const count = context.categoryCoverage[cat] || 0;
        const minCount = context.categoryCoverage[min] || 0;
        return count < minCount ? cat : min;
      });
    }
    
    const categoryQuestions = availableQuestions.filter((q) => q.category === leastCoveredCategory);
    
    // CRITICAL FIX: Use seeded selection instead of always picking first question
    // This prevents the same question from being selected repeatedly
    if (categoryQuestions.length === 0) {
      // No questions in this category, pick from any available
      if (availableQuestions.length === 0) {
        console.error(`[Question Selector] No available questions! This should not happen.`);
        return {
          question: "Is there anything else you'd like to share about your plans?",
          type: 'bank',
          reasoning: 'Emergency fallback - no questions available',
          questionId: `EMERGENCY_${Date.now()}`,
        };
      }
      const idx = hashString(stepSeed + '_any') % availableQuestions.length;
      const selected = availableQuestions[idx];
      console.log(`[Question Selector] path=rule route=${context.route} step=${context.history.length + 1} id=${selected.id} reason=any_available`);
      return {
        question: selected.question,
        type: 'bank',
        questionId: selected.id,
        reasoning: `Rule-based: selected from available questions`,
      };
    }
    
    // Prefer non-hard questions, but use seeded selection for variety
    const nonHardQuestions = categoryQuestions.filter((q) => q.difficulty !== 'hard');
    const pool = nonHardQuestions.length > 0 ? nonHardQuestions : categoryQuestions;
    
    const idx = hashString(stepSeed + '_category') % pool.length;
    const selected = pool[idx];
    
    // CRITICAL FIX: Final safety check - ensure this question wasn't already asked
    const alreadyAsked = context.history.some(h => {
      const historyId = (h as any).questionId;
      return historyId === selected.id;
    });
    
    if (alreadyAsked) {
      console.error(`[Question Selector] ⚠️ Rule-based selected already-asked question: ${selected.id}`);
      // Try to find an alternative
      const alternatives = pool.filter(q => !context.history.some(h => (h as any).questionId === q.id));
      if (alternatives.length > 0) {
        const altIdx = hashString(stepSeed + '_alt') % alternatives.length;
        const alternative = alternatives[altIdx];
        console.log(`[Question Selector] ✅ Using alternative: ${alternative.id}`);
        return {
          question: alternative.question,
          type: 'bank',
          questionId: alternative.id,
          reasoning: `Rule-based (alternative): selected from least covered category (${leastCoveredCategory})`,
        };
      }
    }
    
    const routeLabel = context.route === 'uk_student' ? 'UK' : 
                       context.route === 'france_ema' ? 'France EMA' :
                       context.route === 'france_icn' ? 'France ICN' : 'general';
    if (selected) {
      console.log(`[Question Selector] path=rule route=${context.route} step=${context.history.length + 1} id=${selected.id} reason=least_covered:${leastCoveredCategory} (${idx}/${pool.length})`);
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
      const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.5, 4096);
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
