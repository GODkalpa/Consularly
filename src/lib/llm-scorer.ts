import { InterviewSession } from './interview-simulation';
import type { InterviewRoute } from './interview-routes'
import type { F1SessionMemory } from './f1-mvp-session-memory'
import { checkContradiction } from './f1-mvp-session-memory'
import { selectLLMProvider, callLLMProvider, logProviderSelection } from './llm-provider-selector';
import { 
  validateAndCorrectScore, 
  detectAllZeroRubric, 
  type UKRubricScores 
} from './uk-score-validator';

export interface AIScoringRequest {
  question: string;
  answer: string;
  interviewContext: {
    visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
    route?: InterviewRoute; // usa_f1 | uk_student
    studentProfile: InterviewSession['studentProfile'];
    conversationHistory: Array<{ question: string; answer: string; timestamp: string }>;
  };
  sessionMemory?: F1SessionMemory; // Session consistency tracking
}

export interface AIScoringRubric {
  communication: number; // 0-100
  relevance: number; // 0-100
  specificity: number; // 0-100
  consistency: number; // 0-100
  // USA F1 specific
  academicPreparedness?: number; // 0-100
  financialCapability?: number; // 0-100
  intentToReturn?: number; // 0-100
  // UK Student specific
  courseAndUniversityFit?: number; // 0-100
  financialRequirement?: number; // 0-100
  complianceAndIntent?: number; // 0-100
}

export interface AIScoringLLMResponse {
  rubric: AIScoringRubric;
  summary: string;
  recommendations: string[];
  redFlags: string[];
  contentScore: number; // 0-100
}

export interface CombinedScoreResponse extends AIScoringLLMResponse {
  speechScore: number; // 0-100
  bodyScore: number; // 0-100
  overall: number; // 0-100
  weights: { content: number; speech: number; bodyLanguage: number };
}

export class LLMScoringService {
  constructor() {
    // Provider selection now handled by llm-provider-selector
  }

  async scoreAnswer(req: AIScoringRequest): Promise<AIScoringLLMResponse> {
    const route = req.interviewContext.route || 'usa_f1';
    const systemPrompt = this.getSystemPrompt(route);
    const userPrompt = this.buildPrompt(req);

    // Select provider based on route and use case
    const config = selectLLMProvider(route, 'answer_scoring');

    if (!config) {
      console.warn('[LLM Scorer] No provider available, using heuristic fallback');
      return this.heuristicFallback(req);
    }

    logProviderSelection(route, 'answer_scoring', config);

    // Calculate word count for validation
    const answerWordCount = req.answer.trim().split(/\s+/).filter(w => w.length > 0).length;

    try {
      const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.3, 8192);
      const parsed = this.parseResponse(response.content, route, answerWordCount);

      // DEBUG: Log if contentScore is suspiciously low
      if (parsed.contentScore < 20) {
        console.warn('🚨 [LLM Scorer] Very low contentScore detected:', {
          contentScore: parsed.contentScore,
          answerLength: req.answer.length,
          answerWordCount,
          answerPreview: req.answer.slice(0, 100),
          rubric: parsed.rubric,
          rawLLMResponse: response.content.slice(0, 500),
        });
      }

      return parsed;
    } catch (error) {
      console.error('[LLM Scorer] API error, using heuristic fallback:', error);
      return this.heuristicFallback(req);
    }
  }

  /**
   * Detect if a question expects a short factual answer
   * These questions should score 90+ for correct answers regardless of length
   */
  private isFactualQuestion(question: string): boolean {
    const factualPatterns = [
      /which.*visa.*application.*centre/i,
      /which.*visa.*center/i,
      /what.*university.*name/i,
      /what.*is.*your.*course/i,
      /have you.*received.*visa.*refusal/i,
      /how.*will.*course.*be.*assessed/i,
      /what.*is.*the.*level.*of.*your/i,
      /do you know.*rules.*for.*students/i,
      /what.*is.*your.*agent/i,
      /who.*is.*your.*agent/i,
    ];
    
    return factualPatterns.some(pattern => pattern.test(question));
  }

  private heuristicFallback(req: AIScoringRequest): AIScoringLLMResponse {
    // Simple heuristic scoring when LLM is unavailable
    const answer = req.answer.toLowerCase();
    const wordCount = answer.split(/\s+/).length;
    
    // Check if this is a factual question - give high score for any substantive answer
    const isFactual = this.isFactualQuestion(req.question);
    if (isFactual && wordCount >= 2) {
      return {
        rubric: {
          communication: 90,
          relevance: 95,
          specificity: 90,
          consistency: 90,
          academicPreparedness: 85,
          financialCapability: 85,
          intentToReturn: 85,
        },
        summary: 'Factual question answered correctly.',
        recommendations: [],
        redFlags: [],
        contentScore: 92,
      };
    }

    // Check for specific financial indicators
    const hasSpecificAmount = /\$\d+|£\d+|\d+,\d+/.test(answer);
    const hasVagueTerms = /(sufficient|enough|good|best|world-class|pursue|dream)/i.test(answer);
    // Check for proper nouns (capitalized words) which indicate specific entities (e.g. "VFS Kathmandu")
    const hasProperNouns = (answer.match(/[A-Z][a-z]+|[A-Z]{2,}/g) || []).length >= 1;

    const specificity = hasSpecificAmount ? 75 : (hasProperNouns ? 65 : (hasVagueTerms ? 35 : 50));
    // Don't penalize short answers if they have proper nouns (likely factual)
    const communication = wordCount > 10 && wordCount < 100 ? 65 : (wordCount <= 10 && hasProperNouns ? 70 : (wordCount <= 10 ? 40 : 55));
    const relevance = wordCount > 5 ? 60 : (hasProperNouns ? 80 : 30);

    return {
      rubric: {
        communication,
        relevance,
        specificity,
        consistency: 60,
        academicPreparedness: 55,
        financialCapability: hasSpecificAmount ? 70 : 45,
        intentToReturn: 55,
      },
      summary: 'Automated heuristic scoring (LLM unavailable). Scores are approximate.',
      recommendations: [
        hasSpecificAmount ? 'Good use of specific amounts' : 'Add specific dollar/pound amounts',
        'Provide more concrete details',
        'Ensure answer directly addresses the question',
      ],
      redFlags: hasVagueTerms ? ['Uses vague or coached language'] : [],
      contentScore: (communication + relevance + specificity) / 3,
    };
  }

  private getSystemPrompt(route?: InterviewRoute): string {
    if (route === 'uk_student') {
      return `You are a FAIR and BALANCED UK student visa officer conducting a credibility interview. Your goal is to accurately assess genuine students while being fair to well-prepared candidates.

SCORING PHILOSOPHY - ACCURATE AND FAIR:
- Score answers on their ACTUAL MERIT from 0-100. Do NOT artificially cap scores.
- A PERFECT answer that fully addresses the question with specific details SHOULD score 95-100.
- A GOOD answer with solid content and reasonable detail SHOULD score 80-94.
- SEMANTIC understanding: If the answer addresses the question's intent correctly, give full credit.
- NON-NATIVE speakers: Prioritize substance over style. Grammar errors should NOT reduce scores if meaning is clear.
- ASR TOLERANCE: This is transcribed speech. Numbers/names may be misheard. If a value seems wrong but phonetically similar to correct, assume transcription error and DO NOT PENALIZE.

SCORING SCALE (use the FULL range 0-100):
- **95-100**: Perfect - Comprehensive answer with specific details, UK terminology, demonstrates deep understanding
- **85-94**: Excellent - Strong answer with good specifics, addresses all parts of the question
- **75-84**: Good - Solid answer with reasonable detail, minor gaps acceptable
- **65-74**: Acceptable - Basic answer, addresses the question but lacks some specifics
- **50-64**: Needs improvement - Vague or missing key information
- **30-49**: Weak - Partially addresses question, significant gaps
- **0-29**: Poor - Off-topic, incoherent, or major red flags

WHAT MAKES A HIGH SCORE (85+):
- Directly answers the question asked
- Includes specific details (amounts, names, dates, locations)
- Uses UK-specific terminology when relevant (28-day rule, CAS, Graduate Route, 20h/week)
- Provides concrete examples from personal experience
- Shows clear understanding of the topic

WHAT REDUCES SCORES:
- Vague answers without specifics ("good university", "sufficient funds")
- Not addressing the actual question asked
- Major contradictions with previous answers
- Heavy reliance on agent without independent knowledge

CRITICAL - FACTUAL QUESTIONS (score 90-100 for correct answers regardless of length):
These questions expect SHORT, FACTUAL answers. Do NOT penalize brevity:
- "Which visa Application Centre will you use?" → Correct: "VFS Kathmandu" or "VFS New Delhi" = 95-100
- "What is your university name?" → Correct: "Coventry University" = 95-100
- "What is your course name?" → Correct: "MSc International Business" = 95-100
- "Have you received a visa refusal?" → Correct: "No" or "Yes, in 2020 for tourist visa" = 90-100
- "How will your course be assessed?" → Correct: "Exams and coursework" = 85-95

For factual questions, a 3-10 word correct answer is PERFECT. Do NOT expect elaboration.

Return ONLY strict JSON - no commentary outside JSON structure.`;
    }

    return `You are a FAIR BUT THOROUGH US Embassy Nepal F1 visa officer with 10+ years of interview experience. You've seen thousands of cases and can spot red flags, vague answers, and coached responses.

SCORING PHILOSOPHY - ACCURATE AND FAIR:
- Score answers on their ACTUAL MERIT from 0-100. Do NOT artificially cap scores.
- A PERFECT answer that fully addresses the question with specific details SHOULD score 95-100.
- A GOOD answer with solid content and reasonable detail SHOULD score 80-94.
- SEMANTIC understanding: If the answer addresses the question's intent correctly, give full credit.
- NON-NATIVE speakers: Prioritize substance over style. Grammar/vocabulary errors should NOT reduce scores if meaning is clear.
- ASR WARNING: This is transcribed speech. Numbers/names may be misheard. If a value seems wrong but phonetically similar to correct, assume transcription error and DO NOT PENALIZE.

SCORING SCALE (use the FULL range 0-100):
- **95-100**: Perfect - Comprehensive answer with specific details, demonstrates deep understanding
- **85-94**: Excellent - Strong answer with good specifics, addresses all parts of the question
- **75-84**: Good - Solid answer with reasonable detail, minor gaps acceptable
- **65-74**: Acceptable - Basic answer, addresses the question but lacks some specifics
- **50-64**: Needs improvement - Vague or missing key information
- **30-49**: Weak - Partially addresses question, significant gaps
- **0-29**: Poor - Off-topic, incoherent, or major red flags

WHAT MAKES A HIGH SCORE (85+):
- Directly answers the question asked
- Includes specific details (dollar amounts, sponsor names, job titles, company names)
- Provides concrete examples and evidence
- Shows clear understanding of the topic

WHAT REDUCES SCORES:
- Vague/coached answers: "I will gain knowledge", "good opportunities"
- Not addressing the actual question asked
- Major contradictions with previous answers
- Memorized scripts without specific reasons

IMPORTANT: For FACTUAL questions (visa center location, university name, etc.), correct answers score 90+ regardless of brevity.

Return ONLY strict JSON - no commentary outside JSON structure.`;
  }

  private buildPrompt(req: AIScoringRequest): string {
    const { question, answer, interviewContext, sessionMemory } = req;
    const { visaType, route, studentProfile, conversationHistory } = interviewContext;

    // PERFORMANCE FIX: Only include recent conversation history for consistency checking
    const recentHistory = conversationHistory.slice(-2); // Last 2 Q&A pairs are sufficient
    const history = recentHistory
      .map((h, i) => {
        const actualIndex = conversationHistory.length - recentHistory.length + i;
        return `Q${actualIndex + 1}: ${h.question} \nA${actualIndex + 1}: ${h.answer.slice(0, 150)} `; // Limit to 150 chars
      })
      .join('\n\n');

    // Build session memory context for contradiction checking
    let memoryContext = '';
    if (sessionMemory) {
      const facts: string[] = [];
      if (sessionMemory.total_cost) facts.push(`Total cost: $${sessionMemory.total_cost.toLocaleString()} `);
      if (sessionMemory.sponsor) facts.push(`Sponsor: ${sessionMemory.sponsor} `);
      if (sessionMemory.scholarship_amount) facts.push(`Scholarship: $${sessionMemory.scholarship_amount.toLocaleString()} `);
      if (sessionMemory.loan_amount) facts.push(`Loan: $${sessionMemory.loan_amount.toLocaleString()} `);
      if (sessionMemory.sponsor_occupation) facts.push(`Sponsor occupation: ${sessionMemory.sponsor_occupation} `);
      if (sessionMemory.post_study_role) facts.push(`Career plan: ${sessionMemory.post_study_role} `);
      if (sessionMemory.target_country) facts.push(`Return destination: ${sessionMemory.target_country} `);
      if (sessionMemory.relatives_us) facts.push(`Has relatives in US: YES(RED FLAG)`);

      if (facts.length > 0) {
        memoryContext = `\n\nSESSION MEMORY(Facts from previous answers - CHECK FOR CONTRADICTIONS):
${facts.map(f => `  - ${f}`).join('\n')}

⚠️ If current answer contradicts these facts(e.g., different amounts, different sponsor, different plans), SEVERELY PENALIZE consistency score(20 - 40 range).`;
      }
    }

    // Check for contradiction in current answer
    const contradictionLevel = sessionMemory ? checkContradiction(sessionMemory, answer) : 'none';
    const contradictionWarning = contradictionLevel !== 'none'
      ? `\n\n🚨 CONTRADICTION DETECTED: ${contradictionLevel.toUpperCase()} inconsistency with session memory.Reduce consistency score to ${contradictionLevel === 'major' ? '20-30' : '40-50'}.`
      : '';

    return `INTERVIEW CONTEXT:
Visa Type: ${visaType}${route ? ` | Route: ${route}` : ''}
    Student: ${studentProfile.name} from ${studentProfile.country}
    University: ${studentProfile.intendedUniversity || 'Not specified'}
Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
Previous Education: ${studentProfile.previousEducation || 'Not specified'}
${memoryContext}

PREVIOUS CONVERSATION:
${history || '(No previous questions)'}

CURRENT QUESTION BEING EVALUATED:
    Q: ${question}
    ${this.isFactualQuestion(question) ? '⚡ FACTUAL QUESTION - Score 90-100 for correct answer regardless of length' : ''}

STUDENT'S ANSWER TO SCORE:
    A: ${answer}${contradictionWarning}

    ---

      SCORING RUBRIC (Score 0-100 for each dimension based on ACTUAL MERIT):

UK/FRANCE DIMENSIONS:
1. **communication** (0-100): Clarity, structure, confidence
   - 90-100: Clear, well-structured, confident
   - 70-89: Good clarity, minor issues
   - 50-69: Understandable but needs improvement
   - <50: Unclear or incoherent

2. **relevance** (0-100): How well answer addresses the question
   - 90-100: Directly and fully addresses the question
   - 70-89: Addresses main points, minor gaps
   - 50-69: Partially relevant
   - <50: Off-topic or misses the point

3. **specificity** (0-100): Concrete details provided
   - 90-100: Specific amounts, names, dates, locations
   - 70-89: Good details, some specifics
   - 50-69: General but not vague
   - <50: Vague or generic

4. **consistency** (0-100): Alignment with previous answers
   - 90-100: Fully consistent
   - 70-89: Minor variations acceptable
   - 50-69: Some inconsistencies
   - <50: Major contradictions

5. **courseAndUniversityFit** (0-100): Knowledge of course/university
   - 90-100: Names modules, explains fit, shows research
   - 70-89: Good understanding, some specifics
   - 50-69: Basic knowledge
   - <50: No course knowledge

6. **financialRequirement** (0-100): Financial preparedness
   - 90-100: Specific amounts, 28-day rule, cost breakdown
   - 70-89: Good financial awareness
   - 50-69: Basic understanding
   - <50: Vague or no financial details

7. **complianceAndIntent** (0-100): Visa rules and post-study plans
   - 90-100: Knows 20h/week rule, CAS, clear plans
   - 70-89: Good compliance awareness
   - 50-69: Basic understanding
   - <50: Confusion or vague intent

FOR USA F1 VISA(usa_f1 route):
    1. ** communication ** (0 - 100):
    - Structure, clarity, coherence
      - Penalty: -30 for rambling, -20 for filler words, -40 for incoherent
        - Bonus: +10 for crisp 1 - 2 sentence answers with substance

2. ** relevance ** (0 - 100):
    - Does it DIRECTLY answer the question asked ?
      - Penalty : -50 for tangential answers, -70 for completely off - topic

3. ** specificity ** (0 - 100):
        - Concrete details: numbers, names, amounts, dates
          - Examples: "$45,000/year", "father: civil engineer at XYZ Co.", "MS in Computer Science at Stanford"
            - Penalty: -60 for generic phrases("good opportunities", "quality education"), -80 for pure vagueness

4. ** consistency ** (0 - 100):
              - Aligns with session memory facts(see above)
                - Penalty: -70 for major contradictions, -40 for minor inconsistencies
                  - If no session memory yet, score 70(neutral baseline)

    5. ** academicPreparedness ** (0 - 100):
    - Can explain WHY this program, THIS university(not just "it's ranked high")
      - Links to background and career goals
        - Penalty: -50 for generic "world-class faculty", -70 for no clear academic rationale

    6. ** financialCapability ** (0 - 100):
    - SPECIFIC amounts, sponsor name, occupation, income
      - Penalty: -60 for "sufficient funds" without numbers, -80 for no financial detail

7. ** intentToReturn ** (0 - 100):
    - Concrete ties to home country: family business, job offer, property
      - Penalty: -70 for vague "I will return", -90 if mentions relatives in US with no strong Nepal ties

    ---

      COMPUTE contentScore(0 - 100):

FOR UK STUDENT VISA(uk_student route) AND FRANCE STUDENT VISA(france_ema, france_icn routes):
    contentScore = (0.15 × communication) + (0.15 × relevance) + (0.20 × specificity) + (0.15 × consistency) + (0.15 × courseAndUniversityFit) + (0.10 × financialRequirement) + (0.10 × complianceAndIntent)

    EXCEPTION: For simple FACTUAL questions (e.g. "Where is the visa center?", "What is your university?"), if the answer is CORRECT, IGNORE the formula and assign a score of 85-100. Do not penalize for brevity on facts.

    Note: All 7 dimensions now contribute to contentScore with balanced weights (none exceeds 0.20).

FOR USA F1 VISA(usa_f1 route):
    contentScore = (0.25 × communication) + (0.20 × relevance) + (0.25 × specificity) + (0.15 × consistency) + (0.10 × academicPreparedness) + (0.05 × financialCapability)

    EXCEPTION: For simple FACTUAL questions (e.g. "Where is the visa center?", "What is your university?"), if the answer is CORRECT, IGNORE the formula and assign a score of 85-100. Do not penalize for brevity on facts.

    Note: intentToReturn affects the rubric but has 0 % weight in contentScore(only evaluated in final session summary).

---

      OUTPUT FORMAT(STRICT JSON - no markdown, no extra text):

FOR UK STUDENT VISA(uk_student route) AND FRANCE STUDENT VISA(france_ema, france_icn routes):
    {
      "rubric": {
        "communication": <number 0 - 100 >,
          "relevance": <number 0 - 100 >,
            "specificity": <number 0 - 100 >,
              "consistency": <number 0 - 100 >,
                "courseAndUniversityFit": <number 0 - 100 >,
                  "financialRequirement": <number 0 - 100 >,
                    "complianceAndIntent": <number 0 - 100 >
  },
      "summary": "<2-3 sentence harsh UK pre-CAS evaluation>",
        "recommendations": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
          "redFlags": ["<UK-specific red flag 1 if any>", "<UK-specific red flag 2 if any>"],
            "contentScore": <number 0 - 100 computed via UK formula >
}

FOR USA F1 VISA(usa_f1 route):
    {
      "rubric": {
        "communication": <number 0 - 100 >,
          "relevance": <number 0 - 100 >,
            "specificity": <number 0 - 100 >,
              "consistency": <number 0 - 100 >,
                "academicPreparedness": <number 0 - 100 >,
                  "financialCapability": <number 0 - 100 >,
                    "intentToReturn": <number 0 - 100 >
  },
      "summary": "<2-3 sentence harsh but fair evaluation>",
        "recommendations": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
          "redFlags": ["<red flag 1 if any>", "<red flag 2 if any>"],
            "contentScore": <number 0 - 100 computed via USA formula >
} `;
  }

  private parseResponse(content: string, route?: InterviewRoute, answerWordCount?: number): AIScoringLLMResponse {
    try {
      const parsed = JSON.parse(content);
      const rubric = parsed.rubric || {};
      const clamp = (n: any) => Math.max(0, Math.min(100, Number(n) || 0));

      // Build rubric dynamically based on which fields are present
      const safeRubric: AIScoringRubric = {
        communication: clamp(rubric.communication),
        relevance: clamp(rubric.relevance),
        specificity: clamp(rubric.specificity),
        consistency: clamp(rubric.consistency),
      };

      // Add USA F1 specific fields if present
      if (rubric.academicPreparedness !== undefined) {
        safeRubric.academicPreparedness = clamp(rubric.academicPreparedness);
      }
      if (rubric.financialCapability !== undefined) {
        safeRubric.financialCapability = clamp(rubric.financialCapability);
      }
      if (rubric.intentToReturn !== undefined) {
        safeRubric.intentToReturn = clamp(rubric.intentToReturn);
      }

      // Add UK Student specific fields if present
      if (rubric.courseAndUniversityFit !== undefined) {
        safeRubric.courseAndUniversityFit = clamp(rubric.courseAndUniversityFit);
      }
      if (rubric.financialRequirement !== undefined) {
        safeRubric.financialRequirement = clamp(rubric.financialRequirement);
      }
      if (rubric.complianceAndIntent !== undefined) {
        safeRubric.complianceAndIntent = clamp(rubric.complianceAndIntent);
      }

      let contentScore = clamp(parsed.contentScore);

      // UK Score Validation: Detect and correct zero-dimension pattern and other anomalies
      const isUKRoute = route === 'uk_student';
      if (isUKRoute && safeRubric.courseAndUniversityFit !== undefined) {
        const ukRubric: UKRubricScores = {
          communication: safeRubric.communication,
          relevance: safeRubric.relevance,
          specificity: safeRubric.specificity,
          consistency: safeRubric.consistency,
          courseAndUniversityFit: safeRubric.courseAndUniversityFit,
          financialRequirement: safeRubric.financialRequirement ?? 0,
          complianceAndIntent: safeRubric.complianceAndIntent ?? 0,
        };

        // Check for all-zero rubric (complete scoring failure)
        if (detectAllZeroRubric(ukRubric)) {
          console.warn('⚠️ [LLM Scorer] All-zero rubric detected, using heuristic fallback');
          // Return heuristic-based score for all-zero case
          const wordCount = answerWordCount ?? 0;
          const heuristicScore = wordCount > 10 ? 30 : 0; // Minimum floor if answer present
          return {
            rubric: safeRubric,
            summary: String(parsed.summary || 'All rubric dimensions returned 0. Using heuristic fallback.').slice(0, 800),
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 8) : ['Provide more detailed answers with specific examples.'],
            redFlags: ['Scoring anomaly: all dimensions returned 0'],
            contentScore: heuristicScore,
          };
        }

        // Validate and correct score
        const validation = validateAndCorrectScore(ukRubric, contentScore, answerWordCount ?? 0);
        
        if (!validation.isValid) {
          console.log('🔧 [LLM Scorer] Score correction applied:', {
            originalScore: validation.originalContentScore,
            correctedScore: validation.correctedContentScore,
            hasZeroDimensionPattern: validation.hasZeroDimensionPattern,
            excludedDimensions: validation.excludedDimensions,
            warnings: validation.warnings,
          });
          contentScore = validation.correctedContentScore;
        }
      }

      const safe: AIScoringLLMResponse = {
        rubric: safeRubric,
        summary: String(parsed.summary || '').slice(0, 800),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 8) : [],
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.slice(0, 8) : [],
        contentScore,
      };
      return safe;
    } catch (e) {
      // Fallback minimal response when parsing fails
      return {
        rubric: {
          communication: 50,
          relevance: 50,
          specificity: 40,
          consistency: 50,
          academicPreparedness: 50,
          financialCapability: 50,
          intentToReturn: 50,
        },
        summary: 'Automated fallback: unable to parse AI response. Using neutral baseline.',
        recommendations: ['Add specifics (numbers, names, evidence).', 'Directly answer the question asked.', 'Ensure consistency with prior answers.'],
        redFlags: [],
        contentScore: 50,
      };
    }
  }
}
