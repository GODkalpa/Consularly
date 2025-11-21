import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/subdomain/validate-access
 * 
 * Validate if a user has access to an organization
 * Used by middleware for access control
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, orgId } = body;

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'userId and orgId are required' },
        { status: 400 }
      );
    }

    // Check if user is a platform admin
    const userDoc = await adminDb().collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Platform admins can access any organization
      if (userData?.role === 'admin') {
        return NextResponse.json({ hasAccess: true });
      }

      // Check if user's orgId matches the requested orgId
      if (userData?.orgId === orgId) {
        return NextResponse.json({ hasAccess: true });
      }
    }

    // Check if user is a student in this organization
    const studentSnapshot = await adminDb()
      .collection('orgStudents')
      .where('firebaseUid', '==', userId)
      .where('orgId', '==', orgId)
      .limit(1)
      .get();

    if (!studentSnapshot.empty) {
      return NextResponse.json({ hasAccess: true });
    }

    // No access found
    return NextResponse.json({ hasAccess: false });
  } catch (error) {
    console.error('[Validate Access API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate access' },
      { status: 500 }
    );
  }
}
