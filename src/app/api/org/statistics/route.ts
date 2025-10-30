import { NextRequest, NextResponse } from 'next/server';
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/org/statistics
 * Fetches real-time statistics for organization dashboard
 * Returns: student count, interview metrics, avg scores
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await ensureFirebaseAdmin();
    
    // Verify token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user profile
    const userDoc = await adminDb().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orgId = userData.orgId;
    if (!orgId) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Fetch statistics in parallel
    const [studentsSnapshot, interviewsSnapshot, orgUsersSnapshot] = await Promise.all([
      // Total students
      adminDb()
        .collection('orgStudents')
        .where('orgId', '==', orgId)
        .count()
        .get(),
      
      // All interviews for this org
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .get(),
      
      // Active org users
      adminDb()
        .collection('users')
        .where('orgId', '==', orgId)
        .count()
        .get(),
    ]);

    // Count students
    const totalStudents = studentsSnapshot.data().count;

    // Process interviews
    const interviews = interviewsSnapshot.docs;
    const totalInterviews = interviews.length;

    // Calculate average score from interviews that have finalScore
    const scoredInterviews = interviews.filter((doc) => {
      const data = doc.data();
      return typeof data.finalScore === 'number' && data.finalScore >= 0;
    });

    let avgScore = 0;
    if (scoredInterviews.length > 0) {
      const totalScore = scoredInterviews.reduce((sum, doc) => {
        return sum + (doc.data().finalScore || 0);
      }, 0);
      avgScore = Math.round(totalScore / scoredInterviews.length);
    }

    // Get recent interviews (last 5)
    const recentInterviews = interviews
      .slice(0, 5)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          candidateName: data.candidateName || 'Unknown',
          date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          score: data.finalScore || 0,
          status: data.status || 'completed',
        };
      });

    // Active users count
    const activeUsers = orgUsersSnapshot.data().count;

    return NextResponse.json({
      success: true,
      statistics: {
        totalStudents,
        totalInterviews,
        avgScore,
        activeUsers,
        recentInterviews,
      },
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    
    if (error?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
