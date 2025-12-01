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

  private heuristicFallback(req: AIScoringRequest): AIScoringLLMResponse {
    // Simple heuristic scoring when LLM is unavailable
    const answer = req.answer.toLowerCase();
    const wordCount = answer.split(/\s+/).length;

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

SCORING PHILOSOPHY - BALANCED AND FAIR:
- START at 65/100 (baseline) for any substantive response that attempts to answer the question
- REWARD good answers: Add points for specific details, UK terminology, concrete examples
- MODERATE penalties: Maximum penalty is -40 points per dimension (not -70 or -85)
- SEMANTIC understanding: If the answer addresses the question's intent, give credit even if terminology is imperfect
- NON-NATIVE speakers: Prioritize substance over style. Grammar errors should NOT reduce scores if meaning is clear
- ASR TOLERANCE: This is transcribed speech. Numbers/names may be misheard. If a value seems wrong but phonetically similar to correct, assume transcription error and DO NOT PENALIZE.

BONUS POINTS (add to baseline):
- +10 for specific amounts (£18,000+, exact tuition figures, weekly rent)
- +10 for naming 2+ specific course modules
- +5 for UK-specific terminology (28-day rule, CAS, Graduate Route, 20h/week)
- +10 for concrete examples from personal experience
- +5 for clear course-career connection

PENALTIES (maximum -40 per issue):
- -30 for completely vague answers ("good university", "sufficient funds")
- -40 for completely off-topic or incoherent responses
- -25 for heavy reliance on agent without independent knowledge
- -30 for major contradictions with previous answers

SCORING BENCHMARKS:
- **85-100**: Excellent - Specific details, UK terminology, clear understanding
- **70-84**: Good - Addresses question with reasonable detail, minor gaps acceptable
- **55-69**: Acceptable - Basic answer, lacks some specifics but shows understanding
- **40-54**: Needs work - Vague or missing key information
- **0-39**: Weak - Off-topic, incoherent, or major red flags

IMPORTANT: For FACTUAL questions (visa center location, university name, etc.), correct answers score 80+ regardless of brevity.

Return ONLY strict JSON - no commentary outside JSON structure.`;
    }

    return `You are a FAIR BUT THOROUGH US Embassy Nepal F1 visa officer with 10+ years of interview experience. You've seen thousands of cases and can spot red flags, vague answers, and coached responses.

SCORING PHILOSOPHY - BE FAIR BUT THOROUGH:
- START at 70/100 (good baseline) and adjust up or down based on SUBSTANCE
- VALUE concrete specifics: dollar amounts, sponsor names, job titles, company names, degree programs. REWARD students who provide them.
- CRITICAL: Evaluate RELEVANCE based on SEMANTIC UNDERSTANDING. If the answer addresses the core of the question, give good marks even if terminology is imperfect.
- CONTEXT: Applicant is a non-native English speaker (Nepal). PRIORITIZE substance over style. Grammar/vocabulary errors should NOT reduce scores if meaning is clear.
- Reduce points for vague/coached answers: "I will gain knowledge", "good opportunities" - but don't fail students for this alone.
- Watch for contradictions vs. previous answers (session memory tracking) - this is a red flag
- Identify common Nepal F1 red flags but don't over-penalize minor issues
- ASR WARNING: This is a spoken interview transcribed by AI. Numbers (e.g., "123" vs "1023") or names might be misheard. If a number seems nonsensical but sounds similar to a correct one, assume it's a transcription error and DO NOT PENALIZE. Focus on the intent and context.

3. **Memorized scripts**: "I have always wanted to study in the US since my childhood" (without specific reasons)

SCORING RULES:
- If answer is factually correct but brief (e.g. "VFS Kathmandu"), score 80-90. DO NOT PENALIZE BREVITY FOR FACTS.
- If answer is vague ("good education"), score 40-50.
- If answer is completely irrelevant, score 10-20.

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

STUDENT'S ANSWER TO SCORE:
    A: ${answer}${contradictionWarning}

    ---

      SCORING RUBRIC(Score 0 - 100 for each dimension):

        UK / FRANCE - SPECIFIC RUBRIC ADJUSTMENTS:
    - Replace academicPreparedness → courseAndUniversityFit(must name modules, explain fit)
      - Replace financialCapability → financialRequirement(£/€ amount, financial evidence)
        - Replace intentToReturn → complianceAndIntent(work rules + post - study plans)

FOR UK STUDENT VISA(uk_student route) AND FRANCE STUDENT VISA(france_ema, france_icn routes):
    1. ** communication ** (0 - 100): Start at 65, adjust based on clarity
      - Bonus: +10 for natural, confident delivery; +5 for well-structured response
      - Penalty: -25 for rambling, -30 for incoherent (MAX -40)

    2. ** relevance ** (0 - 100): Start at 65, adjust based on how well answer addresses question
      - Bonus: +15 for directly addressing all parts of question
      - Penalty: -30 for tangential, -40 for completely off-topic (MAX -40)

    3. ** specificity ** (0 - 100): Start at 65, adjust based on concrete details
      - Bonus: +10 for specific amounts (£18,000+), +10 for module names, +5 for dates/locations
      - Penalty: -30 for generic phrases, -40 for complete vagueness (MAX -40)

    4. ** consistency ** (0 - 100): Start at 70 (no prior context = benefit of doubt)
      - Penalty: -40 for major contradictions, -25 for minor inconsistencies (MAX -40)

    5. ** courseAndUniversityFit ** (0 - 100): Start at 65
      - Bonus: +10 for naming 2+ modules, +10 for explaining course-career fit, +5 for faculty/facility knowledge
      - Penalty: -30 for only citing ranking, -35 for no course knowledge (MAX -40)

    6. ** financialRequirement ** (0 - 100): Start at 65
      - Bonus: +10 for specific maintenance amount, +10 for 28-day rule mention, +5 for cost breakdown
      - Penalty: -30 for "sufficient funds" without amounts, -35 for financial ignorance (MAX -40)

    7. ** complianceAndIntent ** (0 - 100): Start at 65
      - Bonus: +10 for 20h/week work rule, +5 for CAS knowledge, +10 for clear post-study plans
      - Penalty: -30 for work rule confusion, -25 for vague intent (MAX -40)

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
