import { NextRequest, NextResponse } from 'next/server';
import { InterviewSimulationService, InterviewSession } from '@/lib/interview-simulation';
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin';

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

        // Check quota for signup users (not org members)
        try {
          await ensureFirebaseAdmin();
          const authHeader = request.headers.get('authorization') || '';
          const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
          
          if (token) {
            // Validate the token and check quota
            const decoded = await adminAuth().verifyIdToken(token);
            const callerUid = decoded.uid;
            
            // Load caller profile
            const callerSnap = await adminDb().collection('users').doc(callerUid).get();
            if (callerSnap.exists) {
              const caller = callerSnap.data() as { role?: string; orgId?: string; quotaLimit?: number; quotaUsed?: number } | undefined;
              
              // Only check quota for signup users (those without orgId)
              // Org members' quota is checked in /api/org/interviews before reaching here
              if (!caller?.orgId) {
                const quotaLimit = caller?.quotaLimit ?? 0;
                const quotaUsed = caller?.quotaUsed ?? 0;
                
                // Reject if quota is 0 (no quota assigned) or if quota exceeded
                if (quotaLimit === 0 || quotaUsed >= quotaLimit) {
                  return NextResponse.json({ 
                    error: 'Quota exceeded', 
                    message: quotaLimit === 0 
                      ? 'No interview quota assigned. Contact support for more interviews.'
                      : `You have reached your interview quota limit of ${quotaLimit} interviews. Contact support for more interviews.`,
                    quotaLimit,
                    quotaUsed
                  }, { status: 403 });
                }

                // Create interview record and increment quota for signup users
                await adminDb().collection('interviews').add({
                  userId: callerUid,
                  orgId: '',
                  startTime: FieldValue.serverTimestamp(),
                  endTime: null,
                  status: 'scheduled',
                  score: 0,
                  scoreDetails: {
                    communication: 0,
                    technical: 0,
                    confidence: 0,
                    overall: 0,
                  },
                  interviewType: 'visa',
                  route,
                  duration: 30,
                  createdAt: FieldValue.serverTimestamp(),
                  updatedAt: FieldValue.serverTimestamp(),
                });

                // Increment user quota usage
                await adminDb().collection('users').doc(callerUid).update({
                  quotaUsed: FieldValue.increment(1),
                  updatedAt: FieldValue.serverTimestamp()
                });
              }
            }
          }
        } catch (quotaError: any) {
          // If it's a quota error, return it to the client
          if (quotaError?.message?.includes('Quota exceeded') || quotaError?.status === 403) {
            return NextResponse.json({ 
              error: 'Quota exceeded',
              message: quotaError.message || 'Contact support for more interviews.'
            }, { status: 403 });
          }
          // Log other errors but continue (backward compatibility for non-Firebase setups)
          console.warn('[quota check]', quotaError);
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
