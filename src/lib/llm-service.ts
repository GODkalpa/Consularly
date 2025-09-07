import { F1_VISA_QUESTIONS, getQuestionsByCategory, mapQuestionTypeToF1Category } from './f1-questions-data';

interface QuestionGenerationRequest {
  previousQuestion?: string;
  studentAnswer?: string;
  interviewContext: {
    visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
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
              content: this.getSystemPrompt()
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

  private getSystemPrompt(): string {
    return `You are an expert F1 visa interview officer simulator for the US Embassy. Your role is to conduct realistic mock visa interviews based on actual F1 visa questions asked to Nepali students.

Key Guidelines:
1. Generate questions that mirror real F1 visa interview patterns
2. Base follow-up questions on the student's previous answers to probe deeper
3. Test academic preparedness, financial capability, genuine intent, and ties to home country
4. Vary question difficulty and probe inconsistencies or vague responses
5. Focus on these core areas:
   - Study Plans: Why US? Why this major? Academic background?
   - University Choice: Why this university? Application process? Rejections?
   - Academic Capability: Test scores, GPA, English proficiency, past failures?
   - Financial Status: Sponsorship, income, expenses, scholarships, loans?
   - Post-graduation Plans: Return plans, career goals, US ties, settlement intent?

Real F1 Question Examples:
- "Why do you want to study in the US?"
- "How many schools rejected you? Can you list those schools?"
- "What is your sponsor's annual income?"
- "What is the guarantee that you will come back to Nepal?"
- "Do you have any relatives in the US who can sponsor you?"
- "Why can't you continue your education in your home country?"
- "On your bank statement we can see large deposits—please explain."

Response Format:
Return your response as a JSON object with these fields:
{
  "question": "The interview question to ask (make it sound like a real visa officer)",
  "questionType": "academic|financial|intent|background|follow-up",
  "difficulty": "easy|medium|hard",
  "expectedAnswerLength": "short|medium|long",
  "tips": "Optional guidance for the student"
}

Make questions direct, challenging, and authentic to real F1 visa interviews.`;
  }

  private buildPrompt(request: QuestionGenerationRequest): string {
    const { interviewContext, previousQuestion, studentAnswer } = request;
    const { visaType, studentProfile, currentQuestionNumber, conversationHistory } = interviewContext;

    let prompt = `Generate the next visa interview question for a ${visaType} visa applicant.

Student Profile:
- Name: ${studentProfile.name}
- Country: ${studentProfile.country}
- University: ${studentProfile.intendedUniversity || 'Not specified'}
- Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
- Previous Education: ${studentProfile.previousEducation || 'Not specified'}

Interview Progress: Question ${currentQuestionNumber}`;

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
      
      // Suggest question categories based on conversation history
      const coveredTopics = conversationHistory.map(h => h.question.toLowerCase());
      const needsFinancial = !coveredTopics.some(q => q.includes('sponsor') || q.includes('pay') || q.includes('cost'));
      const needsIntent = !coveredTopics.some(q => q.includes('return') || q.includes('plan') || q.includes('after'));
      const needsAcademic = !coveredTopics.some(q => q.includes('score') || q.includes('gpa') || q.includes('grade'));
      
      if (needsFinancial && currentQuestionNumber > 2) {
        prompt += `\n- Consider asking about financial capability if not covered yet`;
      }
      if (needsIntent && currentQuestionNumber > 4) {
        prompt += `\n- Consider asking about post-graduation plans and return intent`;
      }
      if (needsAcademic && currentQuestionNumber > 1) {
        prompt += `\n- Consider asking about academic qualifications if not covered`;
      }
    } else {
      // First question or starting new topic - follow real F1 interview flow
      const questionFlow = [
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
    const { currentQuestionNumber, conversationHistory } = request.interviewContext;
    
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
