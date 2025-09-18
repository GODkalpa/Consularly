import { BodyLanguageScore } from './body-language-scoring';
import { InterviewSession } from './interview-simulation';

export interface AIScoringRequest {
  question: string;
  answer: string;
  interviewContext: {
    visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
    studentProfile: InterviewSession['studentProfile'];
    conversationHistory: Array<{ question: string; answer: string; timestamp: string }>;
  };
}

export interface AIScoringRubric {
  communication: number; // 0-100
  relevance: number; // 0-100
  specificity: number; // 0-100
  consistency: number; // 0-100
  academicPreparedness: number; // 0-100
  financialCapability: number; // 0-100
  intentToReturn: number; // 0-100
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
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  async scoreAnswer(req: AIScoringRequest): Promise<AIScoringLLMResponse> {
    const prompt = this.buildPrompt(req);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Visa Mock Interview Scoring',
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content as string | undefined;
    if (!content) throw new Error('No content from LLM');

    return this.parseResponse(content);
  }

  private getSystemPrompt(): string {
    return `You are an expert US Embassy Nepal F1 visa officer and evaluator. Your task is to fairly and consistently score the APPLICANT'S LATEST ANSWER using a strict rubric aligned to real F1 interview practice in Nepal.
- Be unbiased and focus only on evidence in the student's answer and the interview context.
- Penalize vague, generic, or inconsistent answers.
- Highlight any red flags (e.g., unclear funding, weak return intent, contradictions).
- Keep the scoring conservative but fair.
Return STRICT JSON only with the schema described in Response Format. No extra commentary.`;
  }

  private buildPrompt(req: AIScoringRequest): string {
    const { question, answer, interviewContext } = req;
    const { visaType, studentProfile, conversationHistory } = interviewContext;

    const history = conversationHistory
      .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
      .join('\n');

    return `Interview Context:
Visa Type: ${visaType}
Student: ${studentProfile.name} (${studentProfile.country})
University: ${studentProfile.intendedUniversity || 'Not specified'}
Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
Previous Education: ${studentProfile.previousEducation || 'Not specified'}

Conversation History (prior turns):
${history || '(none)'}

Current Question:
${question}

Student's Latest Answer:
${answer}

Rubric Dimensions (0-100 each):
- communication: structure, clarity, and coherence of the answer
- relevance: how directly it addresses the current question
- specificity: concrete details, numbers, names, evidence
- consistency: aligns with earlier answers, no contradictions
- academicPreparedness: indicates credible academic fit, scores, background
- financialCapability: funding clarity, source credibility, sufficiency
- intentToReturn: credible ties to Nepal and plans after graduation

Compute contentScore (0-100) as a weighted blend:
- 30% communication
- 20% relevance
- 20% specificity
- 10% consistency
- 10% academicPreparedness
- 10% financialCapability
- 0% intentToReturn (include in rubric but do not add to contentScore if question is non-intent; if the current question is about intent, cap its influence to 10% total)

Response Format (STRICT JSON):
{
  "rubric": {
    "communication": number,
    "relevance": number,
    "specificity": number,
    "consistency": number,
    "academicPreparedness": number,
    "financialCapability": number,
    "intentToReturn": number
  },
  "summary": string,
  "recommendations": string[],
  "redFlags": string[],
  "contentScore": number
}`;
  }

  private parseResponse(content: string): AIScoringLLMResponse {
    try {
      const parsed = JSON.parse(content);
      const rubric = parsed.rubric || {};
      const clamp = (n: any) => Math.max(0, Math.min(100, Number(n) || 0));
      const safe: AIScoringLLMResponse = {
        rubric: {
          communication: clamp(rubric.communication),
          relevance: clamp(rubric.relevance),
          specificity: clamp(rubric.specificity),
          consistency: clamp(rubric.consistency),
          academicPreparedness: clamp(rubric.academicPreparedness),
          financialCapability: clamp(rubric.financialCapability),
          intentToReturn: clamp(rubric.intentToReturn),
        },
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
