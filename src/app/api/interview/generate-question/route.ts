import { NextRequest, NextResponse } from 'next/server';
import { LLMQuestionService, QuestionGenerationRequest } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    const body: QuestionGenerationRequest = await request.json();

    // Validate required fields
    if (!body.interviewContext) {
      return NextResponse.json(
        { error: 'Interview context is required' },
        { status: 400 }
      );
    }

    const { visaType, studentProfile, currentQuestionNumber } = body.interviewContext;

    if (!visaType || !studentProfile || currentQuestionNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields in interview context' },
        { status: 400 }
      );
    }

    // Initialize the LLM service
    const llmService = new LLMQuestionService();

    // Generate the question
    const response = await llmService.generateQuestion(body);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in generate-question API:', error);
    
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        { error: 'LLM service not configured. Please set OPENROUTER_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Interview Question Generation API',
    endpoints: {
      POST: '/api/interview/generate-question',
      description: 'Generate dynamic interview questions based on student responses'
    },
    requiredFields: {
      interviewContext: {
        visaType: 'F1 | B1/B2 | H1B | other',
        studentProfile: {
          name: 'string',
          country: 'string',
          intendedUniversity: 'string (optional)',
          fieldOfStudy: 'string (optional)',
          previousEducation: 'string (optional)'
        },
        currentQuestionNumber: 'number',
        conversationHistory: 'Array<{question: string, answer: string, timestamp: string}>'
      },
      previousQuestion: 'string (optional)',
      studentAnswer: 'string (optional)'
    }
  });
}
