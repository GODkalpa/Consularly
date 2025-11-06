import { NextRequest, NextResponse } from 'next/server';
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/profile/setup
 * Updates user profile with interview country and student profile
 * Uses Firebase Admin SDK to bypass security rules for newly created users
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the user
    await ensureFirebaseAdmin();
    const auth = adminAuth();
    const db = adminDb();

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get the request body
    const { interviewCountry, studentProfile } = await req.json();

    // Validate input
    if (!interviewCountry || !['usa', 'uk', 'france'].includes(interviewCountry)) {
      return NextResponse.json(
        { error: 'Invalid interview country. Must be usa, uk, or france' },
        { status: 400 }
      );
    }

    // Build the update object
    const updates: any = {
      interviewCountry,
      updatedAt: new Date().toISOString(),
    };

    // Only add student profile for USA
    if (interviewCountry === 'usa' && studentProfile) {
      updates.studentProfile = {
        ...studentProfile,
        profileCompleted: true,
      };
    }

    // Update user document (bypasses security rules)
    await db.collection('users').doc(uid).update(updates);

    return NextResponse.json({
      success: true,
      message: 'Profile setup completed successfully',
    });

  } catch (error: any) {
    console.error('[profile/setup] Error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Session expired. Please sign in again' },
        { status: 401 }
      );
    }

    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
