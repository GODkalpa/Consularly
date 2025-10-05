import { BodyLanguageScore } from './body-language-scoring';
import { InterviewSession } from './interview-simulation';
import type { InterviewRoute } from './interview-routes'
import type { F1SessionMemory } from './f1-mvp-session-memory'
import { checkContradiction } from './f1-mvp-session-memory'
import { selectLLMProvider, callLLMProvider, logProviderSelection } from './llm-provider-selector';

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

    try {
      const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.3, 1500);
      const parsed = this.parseResponse(response.content);
      
      // DEBUG: Log if contentScore is suspiciously low
      if (parsed.contentScore < 20) {
        console.warn('🚨 [LLM Scorer] Very low contentScore detected:', {
          contentScore: parsed.contentScore,
          answerLength: req.answer.length,
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
    
    const specificity = hasSpecificAmount ? 75 : hasVagueTerms ? 35 : 50;
    const communication = wordCount > 10 && wordCount < 100 ? 65 : wordCount <= 10 ? 40 : 55;
    const relevance = wordCount > 5 ? 60 : 30;
    
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
      return `You are a STRICT UK Home Office credibility evaluator with 15+ years of pre-CAS interview experience. You've assessed thousands of international student applications and can instantly detect coached answers, agent dependency, and insufficient course knowledge.

SCORING PHILOSOPHY - BE EXTREMELY STRICT:
- START at 50/100 (neutral baseline) and adjust based on CONCRETE EVIDENCE
- DEMAND specifics: exact amounts (£18,000+), specific modules (3+ by name), actual accommodation details (location, £X/month)
- HEAVILY PENALIZE vague answers: "good university", "sufficient funds", "I researched online"
- PUNISH contradictions between current and previous answers (track session memory)
- FLAG red flags immediately (auto-reduce scores by 20-40 points)

CRITICAL UK RED FLAGS (instant score reduction):
1. **Course Knowledge Gaps**: Cannot name 3+ specific modules from course syllabus (not generic "business modules")
2. **Financial Vagueness**: Doesn't mention £18,000+ maintenance requirement OR 28-day bank balance rule
3. **Work Visa Confusion**: Doesn't know 20 hours/week limit during term, or confuses Student vs Graduate route
4. **Accommodation Ignorance**: No specific plan ("I'll find somewhere" vs "Student halls in City X, £120/week booked")
5. **Agent Dependency**: References agent heavily without showing independent research (red flag for genuine student test)
6. **University Choice Weakness**: Only cites ranking/reputation, cannot explain why THIS course fits THEIR background
7. **Compliance Ignorance**: Doesn't understand CAS requirements, ATAS if needed, or attendance monitoring
8. **Contradictions**: Changes amounts, course details, or plans between answers

STRICT SCORING BENCHMARKS (UK Pre-CAS Standards):
- **90-100**: Exceptional - Names 4+ specific modules, exact maintenance amount (£18,600 in Lloyds for 32 days), concrete accommodation (Student Castle Manchester, £145/week confirmed), understands 20h work limit, clear course-career link
- **70-89**: Good - 2-3 modules named, knows £18k+ rule, has general accommodation plan, understands work restrictions
- **50-69**: Borderline - Vague on 1-2 areas, some coached language, missing specific evidence (likely refusal)
- **30-49**: Weak - Multiple red flags, agent-led answers, cannot explain course fit (refusal likely)
- **0-29**: Very weak - No course knowledge, financial ignorance, incoherent (automatic refusal)

REAL CONSEQUENCES:
- UK student visa refusal rate is ~35% (be harsh but fair)
- Credibility interviews were introduced to catch non-genuine students
- Officers look for: independent research, course knowledge depth, financial clarity, compliance awareness

CRITICAL: Check if answer contradicts session memory facts. If student said "£18,000" earlier but now says "£15,000", FLAG major contradiction and reduce consistency score to 20-30.

Return ONLY strict JSON - no commentary outside JSON structure.`;
    }
    
    return `You are a STRICT US Embassy Nepal F1 visa officer with 10+ years of interview experience. You've seen thousands of cases and can instantly spot red flags, vague answers, and coached responses.

SCORING PHILOSOPHY - BE VERY STRICT:
- START at 50/100 (neutral baseline) and adjust based on evidence
- DEMAND concrete specifics: dollar amounts, sponsor names, job titles, company names, degree programs
- HEAVILY PENALIZE vague/coached answers: "I will gain knowledge", "good opportunities", "quality education"
- PUNISH contradictions vs. previous answers (session memory tracking)
- FLAG common Nepal F1 red flags immediately

COMMON NEPAL F1 RED FLAGS (automatically reduce scores):
1. **Financial vagueness**: Says "my father will sponsor" WITHOUT amount, occupation, income proof
2. **Coached language**: Generic phrases like "pursue my dreams", "world-class education", "cutting-edge"
3. **No return intent**: Weak ties to Nepal, mentions relatives in US, vague career plans
4. **Academic mismatch**: Can't explain why THIS program at THIS university (not just rankings)
5. **Contradictions**: Changes financial amounts, sponsor, or career plans between answers
6. **Unrealistic plans**: Says "return to Nepal" but describes US-only career path

STRICT SCORING BENCHMARKS:
- **90-100**: Exceptional - specific amounts ($45,000/year), named sponsor (father: civil engineer, Rs. 8M/year), concrete career plan (return to TCS Nepal office as ML engineer), consistent across all answers
- **70-89**: Good - some specifics, minor gaps, mostly clear
- **50-69**: Borderline - vague on 1-2 key areas, coached language, missing evidence
- **30-49**: Weak - multiple red flags, contradictions, evasive answers
- **0-29**: Very weak - major red flags, incoherent, likely visa rejection

CRITICAL: Check if answer contradicts session memory facts. If student said "$40k tuition" earlier but now says "$50k", FLAG major contradiction and reduce consistency score to 20-30.

Return ONLY strict JSON - no extra commentary.`;
  }

  private buildPrompt(req: AIScoringRequest): string {
    const { question, answer, interviewContext, sessionMemory } = req;
    const { visaType, route, studentProfile, conversationHistory } = interviewContext;

    // PERFORMANCE FIX: Only include recent conversation history for consistency checking
    const recentHistory = conversationHistory.slice(-2); // Last 2 Q&A pairs are sufficient
    const history = recentHistory
      .map((h, i) => {
        const actualIndex = conversationHistory.length - recentHistory.length + i;
        return `Q${actualIndex + 1}: ${h.question}\nA${actualIndex + 1}: ${h.answer.slice(0, 150)}`; // Limit to 150 chars
      })
      .join('\n\n');

    // Build session memory context for contradiction checking
    let memoryContext = '';
    if (sessionMemory) {
      const facts: string[] = [];
      if (sessionMemory.total_cost) facts.push(`Total cost: $${sessionMemory.total_cost.toLocaleString()}`);
      if (sessionMemory.sponsor) facts.push(`Sponsor: ${sessionMemory.sponsor}`);
      if (sessionMemory.scholarship_amount) facts.push(`Scholarship: $${sessionMemory.scholarship_amount.toLocaleString()}`);
      if (sessionMemory.loan_amount) facts.push(`Loan: $${sessionMemory.loan_amount.toLocaleString()}`);
      if (sessionMemory.sponsor_occupation) facts.push(`Sponsor occupation: ${sessionMemory.sponsor_occupation}`);
      if (sessionMemory.post_study_role) facts.push(`Career plan: ${sessionMemory.post_study_role}`);
      if (sessionMemory.target_country) facts.push(`Return destination: ${sessionMemory.target_country}`);
      if (sessionMemory.relatives_us) facts.push(`Has relatives in US: YES (RED FLAG)`);
      
      if (facts.length > 0) {
        memoryContext = `\n\nSESSION MEMORY (Facts from previous answers - CHECK FOR CONTRADICTIONS):
${facts.map(f => `  - ${f}`).join('\n')}

⚠️ If current answer contradicts these facts (e.g., different amounts, different sponsor, different plans), SEVERELY PENALIZE consistency score (20-40 range).`;
      }
    }

    // Check for contradiction in current answer
    const contradictionLevel = sessionMemory ? checkContradiction(sessionMemory, answer) : 'none';
    const contradictionWarning = contradictionLevel !== 'none' 
      ? `\n\n🚨 CONTRADICTION DETECTED: ${contradictionLevel.toUpperCase()} inconsistency with session memory. Reduce consistency score to ${contradictionLevel === 'major' ? '20-30' : '40-50'}.`
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

SCORING RUBRIC (Score 0-100 for each dimension):

UK-SPECIFIC RUBRIC ADJUSTMENTS:
- Replace academicPreparedness → courseAndUniversityFit (must name modules, explain fit)
- Replace financialCapability → financialRequirement (£18k+ maintenance, 28-day rule)
- Replace intentToReturn → complianceAndIntent (work rules + post-study plans)

FOR UK STUDENT VISA (uk_student route):
1. **communication** (0-100): 
   - Structure, clarity, coherence, confidence (not scripted/coached)
   - Penalty: -30 for rambling, -25 for heavy agent-scripted language, -40 for incoherent
   - Bonus: +10 for natural, confident answers showing genuine understanding

2. **relevance** (0-100):
   - Does it DIRECTLY answer the question asked?
   - Penalty: -50 for tangential answers, -70 for completely off-topic, -30 for evasive non-answers

3. **specificity** (0-100):
   - Concrete details: amounts (£18,000+), module names (3+), accommodation (location, £X/week)
   - Examples: "£18,600 in bank for 28+ days", "Data Analytics, Machine Learning, AI Ethics modules", "Student accommodation in City X, £130/week pre-booked"
   - Penalty: -70 for generic phrases ("good university", "sufficient funds"), -85 for complete vagueness

4. **consistency** (0-100):
   - Aligns with session memory facts (financial amounts, course details, plans)
   - Penalty: -75 for major contradictions (>20% difference in amounts), -45 for minor inconsistencies (>10%)
   - If no session memory yet, score 65 (neutral UK baseline)

5. **courseAndUniversityFit** (0-100):
   - Can name 3+ specific modules from syllabus (not generic categories)
   - Explains WHY this course fits their background and career goals (not just ranking)
   - Shows independent research (faculty, facilities, course structure)
   - Penalty: -65 for no module names, -55 for only citing ranking/reputation, -40 for agent-led generic answer

6. **financialRequirement** (0-100):
   - SPECIFIC maintenance amount (£18,000+ for London, varies by location)
   - Understands 28-day bank balance rule
   - Clear tuition + living cost breakdown
   - Penalty: -70 for "sufficient funds" without amounts, -60 for no 28-day rule mention, -80 for total financial ignorance

7. **complianceAndIntent** (0-100):
   - Understands 20 hours/week work limit during term
   - Knows CAS requirements, attendance rules, ATAS if applicable
   - Clear post-study plans (return home or Graduate Route understanding)
   - Penalty: -65 for work rule confusion, -50 for CAS/compliance ignorance, -40 for vague post-study intent

FOR USA F1 VISA (usa_f1 route):
1. **communication** (0-100): 
   - Structure, clarity, coherence
   - Penalty: -30 for rambling, -20 for filler words, -40 for incoherent
   - Bonus: +10 for crisp 1-2 sentence answers with substance

2. **relevance** (0-100):
   - Does it DIRECTLY answer the question asked?
   - Penalty: -50 for tangential answers, -70 for completely off-topic

3. **specificity** (0-100):
   - Concrete details: numbers, names, amounts, dates
   - Examples: "$45,000/year", "father: civil engineer at XYZ Co.", "MS in Computer Science at Stanford"
   - Penalty: -60 for generic phrases ("good opportunities", "quality education"), -80 for pure vagueness

4. **consistency** (0-100):
   - Aligns with session memory facts (see above)
   - Penalty: -70 for major contradictions, -40 for minor inconsistencies
   - If no session memory yet, score 70 (neutral baseline)

5. **academicPreparedness** (0-100):
   - Can explain WHY this program, THIS university (not just "it's ranked high")
   - Links to background and career goals
   - Penalty: -50 for generic "world-class faculty", -70 for no clear academic rationale

6. **financialCapability** (0-100):
   - SPECIFIC amounts, sponsor name, occupation, income
   - Penalty: -60 for "sufficient funds" without numbers, -80 for no financial detail

7. **intentToReturn** (0-100):
   - Concrete ties to home country: family business, job offer, property
   - Penalty: -70 for vague "I will return", -90 if mentions relatives in US with no strong Nepal ties

---

COMPUTE contentScore (0-100):

FOR UK STUDENT VISA (uk_student route):
contentScore = (0.20 × communication) + (0.15 × relevance) + (0.25 × specificity) + (0.15 × consistency) + (0.15 × courseAndUniversityFit) + (0.10 × financialRequirement)

Note: complianceAndIntent affects the rubric but has reduced weight in contentScore (evaluated more heavily in final decision).

FOR USA F1 VISA (usa_f1 route):
contentScore = (0.25 × communication) + (0.20 × relevance) + (0.25 × specificity) + (0.15 × consistency) + (0.10 × academicPreparedness) + (0.05 × financialCapability)

Note: intentToReturn affects the rubric but has 0% weight in contentScore (only evaluated in final session summary).

---

OUTPUT FORMAT (STRICT JSON - no markdown, no extra text):

FOR UK STUDENT VISA (uk_student route):
{
  "rubric": {
    "communication": <number 0-100>,
    "relevance": <number 0-100>,
    "specificity": <number 0-100>,
    "consistency": <number 0-100>,
    "courseAndUniversityFit": <number 0-100>,
    "financialRequirement": <number 0-100>,
    "complianceAndIntent": <number 0-100>
  },
  "summary": "<2-3 sentence harsh UK pre-CAS evaluation>",
  "recommendations": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "redFlags": ["<UK-specific red flag 1 if any>", "<UK-specific red flag 2 if any>"],
  "contentScore": <number 0-100 computed via UK formula>
}

FOR USA F1 VISA (usa_f1 route):
{
  "rubric": {
    "communication": <number 0-100>,
    "relevance": <number 0-100>,
    "specificity": <number 0-100>,
    "consistency": <number 0-100>,
    "academicPreparedness": <number 0-100>,
    "financialCapability": <number 0-100>,
    "intentToReturn": <number 0-100>
  },
  "summary": "<2-3 sentence harsh but fair evaluation>",
  "recommendations": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "redFlags": ["<red flag 1 if any>", "<red flag 2 if any>"],
  "contentScore": <number 0-100 computed via USA formula>
}`;
  }

  private parseResponse(content: string): AIScoringLLMResponse {
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
      
      const safe: AIScoringLLMResponse = {
        rubric: safeRubric,
        summary: String(parsed.summary || '').slice(0, 800),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 8) : [],
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.slice(0, 8) : [],
        contentScore: clamp(parsed.contentScore),
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
