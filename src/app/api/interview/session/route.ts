import { NextRequest, NextResponse } from 'next/server';
import { InterviewSimulationService, InterviewSession } from '@/lib/interview-simulation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, visaType, studentProfile, sessionId, answer, route } = body;

    // Build absolute origin for server-side fetches
    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const simulationService = new InterviewSimulationService(origin);

    switch (action) {
      case 'start':
        if (!userId || !visaType || !studentProfile) {
          return NextResponse.json(
            { error: 'Missing required fields: userId, visaType, studentProfile' },
            { status: 400 }
          );
        }

        const { session, firstQuestion } = await simulationService.startInterview(
          userId,
          visaType,
          studentProfile,
          route
        );

        return NextResponse.json({
          session,
          question: firstQuestion,
          message: 'Interview session started successfully'
        });

      case 'answer':
        if (!sessionId || !answer) {
          return NextResponse.json(
            { error: 'Missing required fields: sessionId, answer' },
            { status: 400 }
          );
        }

        // In a real app, you'd fetch the session from database
        // For now, we'll expect the session to be passed in the request
        const currentSession = body.session as InterviewSession;
        if (!currentSession) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }

        const { updatedSession, nextQuestion, isComplete } = await simulationService.processAnswer(
          currentSession,
          answer
        );

        if (isComplete) {
          const finalSession = simulationService.endInterview(updatedSession);
          return NextResponse.json({
            session: finalSession,
            isComplete: true,
            score: finalSession.score,
            message: 'Interview completed successfully'
          });
        }

        return NextResponse.json({
          session: updatedSession,
          question: nextQuestion,
          isComplete: false,
          message: 'Answer processed successfully'
        });

      case 'end':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing sessionId' },
            { status: 400 }
          );
        }

        const sessionToEnd = body.session as InterviewSession;
        if (!sessionToEnd) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }

        const endedSession = simulationService.endInterview(sessionToEnd);
        return NextResponse.json({
          session: endedSession,
          score: endedSession.score,
          message: 'Interview ended successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: start, answer, end' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in interview session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Interview Session Management API',
    endpoints: {
      POST: '/api/interview/session',
      description: 'Manage interview sessions'
    },
    actions: {
      start: {
        description: 'Start a new interview session',
        requiredFields: ['userId', 'visaType', 'studentProfile']
      },
      answer: {
        description: 'Process student answer and get next question',
        requiredFields: ['sessionId', 'answer', 'session']
      },
      end: {
        description: 'End an interview session and get final score',
        requiredFields: ['sessionId', 'session']
      }
    }
  });
}
