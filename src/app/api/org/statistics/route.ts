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

    // Fetch statistics in parallel - optimized queries
    const [studentsSnapshot, totalInterviewsSnapshot, recentInterviewsSnapshot, orgUsersSnapshot] = await Promise.all([
      // Total students
      adminDb()
        .collection('orgStudents')
        .where('orgId', '==', orgId)
        .count()
        .get(),
      
      // Total interviews count (efficient count aggregation)
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .count()
        .get(),
      
      // Only fetch 5 most recent interviews (not all)
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .orderBy('createdAt', 'desc')
        .limit(5)
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
    const totalInterviews = totalInterviewsSnapshot.data().count;

    // Process only recent interviews for display
    const recentInterviewDocs = recentInterviewsSnapshot.docs;

    // Calculate average score efficiently from recent interviews + a sample query
    // For better accuracy, fetch scored interviews separately with limit
    const scoredInterviewsSnapshot = await adminDb()
      .collection('interviews')
      .where('orgId', '==', orgId)
      .where('finalScore', '>=', 0)
      .limit(50)
      .get();
    
    let avgScore = 0;
    if (!scoredInterviewsSnapshot.empty) {
      const totalScore = scoredInterviewsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().finalScore || 0);
      }, 0);
      avgScore = Math.round(totalScore / scoredInterviewsSnapshot.docs.length);
    }
    
    // Extract unique student IDs from recent interviews
    const studentIds = [...new Set(
      recentInterviewDocs
        .map(doc => doc.data().userId)
        .filter((id): id is string => !!id)
    )];
    
    // Batch fetch all students efficiently - Firestore allows up to 10 in one query using 'in'
    const studentNameMap = new Map<string, string>();
    
    if (studentIds.length > 0) {
      // Split into chunks of 10 (Firestore 'in' query limit)
      const chunkSize = 10;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        const chunk = studentIds.slice(i, i + chunkSize);
        const studentsSnapshot = await adminDb()
          .collection('orgStudents')
          .where('__name__', 'in', chunk)
          .get();
        
        studentsSnapshot.forEach(doc => {
          const data = doc.data();
          const name = data?.name || data?.fullName || 'Unknown';
          studentNameMap.set(doc.id, name);
        });
      }
    }
    
    // Map interviews with student names
    const recentInterviews = recentInterviewDocs.map((doc) => {
      const data = doc.data();
      const studentId = data.userId;
      const candidateName = studentId ? (studentNameMap.get(studentId) || 'Unknown') : 'Unknown';
      
      return {
        id: doc.id,
        candidateName,
        date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        score: data.finalScore || 0,
        status: data.status || 'completed',
      };
    });

    // Active users count
    const activeUsers = orgUsersSnapshot.data().count;

    const response = NextResponse.json({
      success: true,
      statistics: {
        totalStudents,
        totalInterviews,
        avgScore,
        activeUsers,
        recentInterviews,
      },
    });
    
    // Add caching headers - cache for 30 seconds, allow stale data for 60s while revalidating
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
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
