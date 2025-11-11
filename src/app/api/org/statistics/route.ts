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

    const startTime = Date.now();

    // Extract unique student IDs BEFORE fetching - we'll fetch them in parallel
    // NOTE: We'll do this after getting recent interviews
    
    // Fetch ALL statistics in parallel - fully optimized queries
    const [
      studentsSnapshot, 
      totalInterviewsSnapshot, 
      recentInterviewsSnapshot, 
      orgUsersSnapshot,
      scoredInterviewsSnapshot // MOVED: Include scored interviews in the main Promise.all
    ] = await Promise.all([
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
      
      // OPTIMIZED: Fetch scored interviews in parallel with other queries
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .where('finalScore', '>=', 0)
        .limit(50)
        .get(),
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`[Statistics API] Main queries completed in ${queryTime}ms`);

    // Count students and interviews
    const totalStudents = studentsSnapshot.data().count;
    const totalInterviews = totalInterviewsSnapshot.data().count;
    const activeUsers = orgUsersSnapshot.data().count;

    // Process recent interviews for display
    const recentInterviewDocs = recentInterviewsSnapshot.docs;

    // Calculate average score
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
    
    // OPTIMIZED: Batch fetch all students in PARALLEL, not sequential
    const studentNameMap = new Map<string, string>();
    
    if (studentIds.length > 0) {
      const studentFetchStart = Date.now();
      // Split into chunks of 10 (Firestore 'in' query limit) and fetch in parallel
      const chunkSize = 10;
      const chunks: string[][] = [];
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        chunks.push(studentIds.slice(i, i + chunkSize));
      }
      
      // FIXED: Run all student queries in PARALLEL with Promise.all
      const studentSnapshots = await Promise.all(
        chunks.map(chunk => 
          adminDb()
            .collection('orgStudents')
            .where('__name__', 'in', chunk)
            .get()
        )
      );
      
      // Populate the name map
      studentSnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          const name = data?.name || data?.fullName || 'Unknown';
          studentNameMap.set(doc.id, name);
        });
      });
      
      const studentFetchTime = Date.now() - studentFetchStart;
      console.log(`[Statistics API] Student names fetched in ${studentFetchTime}ms (${studentIds.length} students)`);
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

    const totalTime = Date.now() - startTime;
    console.log(`[Statistics API] ✅ Total request completed in ${totalTime}ms`);
    console.log(`[Statistics API] 📊 Stats: ${totalStudents} students, ${totalInterviews} interviews, ${activeUsers} users`);

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
    
    // Add aggressive caching headers - cache for 30 seconds, allow stale data for 60s while revalidating
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
