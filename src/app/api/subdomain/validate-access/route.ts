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
        console.log(`[Validate Access] Admin ${userId} granted access to org ${orgId}`);
        return NextResponse.json({ hasAccess: true });
      }

      // Check if user's orgId matches the requested orgId
      if (userData?.orgId === orgId) {
        console.log(`[Validate Access] User ${userId} belongs to org ${orgId}`);
        return NextResponse.json({ hasAccess: true });
      }
      
      // User belongs to different org - deny access
      console.log(`[Validate Access] User ${userId} belongs to org ${userData?.orgId}, not ${orgId}`);
      return NextResponse.json({ hasAccess: false });
    }

    // Check if user is a student in this organization
    const studentSnapshot = await adminDb()
      .collection('orgStudents')
      .where('firebaseUid', '==', userId)
      .where('orgId', '==', orgId)
      .limit(1)
      .get();

    if (!studentSnapshot.empty) {
      console.log(`[Validate Access] Student ${userId} belongs to org ${orgId}`);
      return NextResponse.json({ hasAccess: true });
    }

    // No access found
    console.log(`[Validate Access] No access found for user ${userId} to org ${orgId}`);
    return NextResponse.json({ hasAccess: false });
  } catch (error) {
    console.error('[Validate Access API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate access' },
      { status: 500 }
    );
  }
}
