// F1 fallbacks are inlined below; UK pool is imported
import type { InterviewRoute } from './interview-routes'
import { UK_QUESTION_POOL } from './uk-questions-data'
import { F1_VISA_QUESTIONS } from './f1-questions-data'

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

export class LLMQuestionService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  async generateQuestion(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'Visa Mock Interview System'
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'openai/gpt-3.5-turbo', // Configurable model
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request.interviewContext.route)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content;

      if (!generatedContent) {
        throw new Error('No content generated from LLM');
      }

      return this.parseResponse(generatedContent);
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback to predefined questions if API fails
      return this.getFallbackQuestion(request);
    }
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
- University: ${studentProfile.intendedUniversity || 'Not specified'}
- Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
- Previous Education: ${studentProfile.previousEducation || 'Not specified'}

Interview Progress: Question ${currentQuestionNumber}`

    const headerUS = `Generate the next visa interview question for a ${visaType} visa applicant.

Student Profile:
- Name: ${studentProfile.name}
- Country: ${studentProfile.country}
- University: ${studentProfile.intendedUniversity || 'Not specified'}
- Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
- Previous Education: ${studentProfile.previousEducation || 'Not specified'}

Interview Progress: Question ${currentQuestionNumber}`

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

    if (conversationHistory.length > 0) {
      prompt += `\n\nConversation History:`;
      conversationHistory.forEach((exchange, index) => {
        prompt += `\nQ${index + 1}: ${exchange.question}`;
        prompt += `\nA${index + 1}: ${exchange.answer}`;
      });
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
