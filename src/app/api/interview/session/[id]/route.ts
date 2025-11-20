import { NextRequest, NextResponse } from 'next/server';
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/interview/session/[id]
 * 
 * Retrieves interview session initialization data from Firestore.
 * This endpoint serves as a fallback when localStorage is unavailable or empty.
 * 
 * Authentication: Required (Firebase ID token in Authorization header)
 * Authorization: User must own the interview or be part of the same organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('[Session Retrieval] Fetching session:', sessionId);

    // Initialize Firebase Admin
    await ensureFirebaseAdmin();

    // Get and verify authentication token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      console.warn('[Session Retrieval] No auth token provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = await adminAuth().verifyIdToken(token);
    const userId = decoded.uid;
    console.log('[Session Retrieval] Authenticated user:', userId);

    // Fetch interview from Firestore
    const interviewDoc = await adminDb().collection('interviews').doc(sessionId).get();

    if (!interviewDoc.exists) {
      console.warn('[Session Retrieval] Interview not found:', sessionId);
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    const interview = interviewDoc.data();
    console.log('[Session Retrieval] Interview found:', {
      id: sessionId,
      userId: interview?.userId,
      orgId: interview?.orgId,
      status: interview?.status
    });

    // Authorization check: verify user has access to this interview
    const isOwner = interview?.userId === userId;
    let isOrgMember = false;
    let isStudent = false;

    // Check if user is a student in the same org
    if (interview?.orgId) {
      const studentQuery = await adminDb()
        .collection('orgStudents')
        .where('firebaseUid', '==', userId)
        .where('orgId', '==', interview.orgId)
        .limit(1)
        .get();
      
      if (!studentQuery.empty) {
        isStudent = true;
        isOrgMember = true;
      }
    }

    // Check if user is an org member
    if (interview?.orgId && !isOrgMember) {
      const userDoc = await adminDb().collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        isOrgMember = userData?.orgId === interview.orgId;
      }
    }

    if (!isOwner && !isOrgMember) {
      console.warn('[Session Retrieval] Unauthorized access attempt:', {
        userId,
        interviewUserId: interview?.userId,
        interviewOrgId: interview?.orgId
      });
      return NextResponse.json(
        { error: 'You do not have permission to access this interview' },
        { status: 403 }
      );
    }

    // Reconstruct session initialization payload
    const sessionState = interview?.sessionState || {};
    const firstQuestion = interview?.firstQuestion || {
      question: 'Tell me about yourself and why you want to study abroad.',
      questionType: 'personal_background',
      difficulty: 'easy'
    };

    const route = interview?.route || 'usa_f1';
    const studentName = interview?.studentName || 'Student';
    const orgId = interview?.orgId || '';
    
    // Determine scope based on interview type
    const scope = interview?.orgId ? 'org' : 'user';

    // Build API session object matching the format expected by InterviewRunner
    const apiSession = {
      id: sessionId,
      userId: interview?.userId || userId,
      visaType: interview?.route || 'usa_f1',
      route: route,
      studentProfile: {
        name: studentName,
        // Add other profile fields if available
      },
      conversationHistory: sessionState.conversationHistory || [],
      currentQuestionIndex: sessionState.currentQuestionIndex || 0,
      score: interview?.score || 0,
      startTime: interview?.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
      endTime: interview?.endTime?.toDate?.()?.toISOString() || null,
      sessionMemory: interview?.sessionMemory || null,
      difficulty: interview?.difficulty || 'medium'
    };

    const payload = {
      apiSession,
      firstQuestion,
      route,
      studentName,
      firestoreInterviewId: sessionId,
      scope,
      orgId
    };

    console.log('[Session Retrieval] Returning session data:', {
      sessionId,
      route,
      scope,
      hasOrgId: !!orgId
    });

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('[Session Retrieval] Error:', error);
    
    // Handle specific error types
    if (error?.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Authentication token expired. Please sign in again.' },
        { status: 401 }
      );
    }
    
    if (error?.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
