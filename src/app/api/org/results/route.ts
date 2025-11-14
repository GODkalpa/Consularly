import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/org/results
// Returns interview results grouped by student for the caller's organization
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { orgId?: string }
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    // Get URL params for filtering
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const timeRange = searchParams.get('timeRange') // '7d', '30d', '90d', 'all'
    const routeFilter = searchParams.get('route') // 'usa_f1', 'uk_student', etc.

    // Fetch students
    const studentsSnap = await adminDb()
      .collection('orgStudents')
      .where('orgId', '==', orgId)
      .get()

    const students = studentsSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data?.name || 'Unknown',
        email: data?.email || '',
        studentProfile: data?.studentProfile || null,
      }
    })

    // If specific student requested, filter
    const targetStudents = studentId
      ? students.filter((s) => s.id === studentId)
      : students

    // Calculate time cutoff
    let cutoffDate: Date | null = null
    if (timeRange && timeRange !== 'all') {
      const now = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : null
      if (days) {
        cutoffDate = new Date(now)
        cutoffDate.setDate(now.getDate() - days)
      }
    }

    // OPTIMIZED: Single query for all interviews, then group by student
    const fetchStart = Date.now()
    
    let interviewsQuery = adminDb()
      .collection('interviews')
      .where('orgId', '==', orgId)

    // Apply route filter to main query
    if (routeFilter && routeFilter !== 'all') {
      interviewsQuery = interviewsQuery.where('route', '==', routeFilter)
    }

    // Apply time filter if possible at query level
    if (cutoffDate) {
      interviewsQuery = interviewsQuery.where('startTime', '>=', cutoffDate)
    }

    // Fetch all interviews in a single query
    const allInterviewsSnap = await interviewsQuery.get()
    
    const fetchTime = Date.now() - fetchStart
    console.log(`[Results API] ✅ Fetched ${allInterviewsSnap.docs.length} interviews in ${fetchTime}ms`)

    // Group interviews by student ID
    const interviewsByStudent = new Map<string, any[]>()
    
    allInterviewsSnap.docs.forEach((doc) => {
      const data = doc.data()
      const userId = data.userId
      const startTime = data?.startTime?.toDate?.() ?? null
      const endTime = data?.endTime?.toDate?.() ?? null

      // Skip if no userId or doesn't match filter
      if (!userId) return
      
      // Apply additional time filtering if needed
      if (cutoffDate && startTime && startTime < cutoffDate) return

      const interview = {
        id: doc.id,
        status: data?.status || 'unknown',
        score: typeof data?.score === 'number' ? Math.round(data.score) : null,
        route: data?.route || null,
        startTime: startTime ? startTime.toISOString() : null,
        endTime: endTime ? endTime.toISOString() : null,
        finalReport: data?.finalReport || null,
        duration: data?.duration || null,
      }

      if (!interviewsByStudent.has(userId)) {
        interviewsByStudent.set(userId, [])
      }
      interviewsByStudent.get(userId)!.push(interview)
    })

    // Process results for each student
    const results = targetStudents.map((student) => {
      const interviews = interviewsByStudent.get(student.id) || []
      
      // Sort interviews by date (most recent first)
      interviews.sort((a, b) => {
        const aTime = a?.startTime ? new Date(a.startTime).getTime() : 0
        const bTime = b?.startTime ? new Date(b.startTime).getTime() : 0
        return bTime - aTime
      })

      // Calculate stats for this student
      const completedInterviews = interviews.filter((iv) => iv.status === 'completed')
      const scores = completedInterviews
        .map((iv) => iv.score)
        .filter((s): s is number => typeof s === 'number')
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : null
      const latestScore = scores.length > 0 ? scores[0] : null

      return {
        student,
        interviews,
        stats: {
          totalInterviews: interviews.length,
          completedInterviews: completedInterviews.length,
          averageScore: avgScore,
          latestScore,
        },
      }
    })

    // Sort by total interviews (most active first)
    results.sort((a, b) => b.stats.totalInterviews - a.stats.totalInterviews)

    const totalTime = Date.now() - fetchStart
    console.log(`[Results API] ✅ Total request completed in ${totalTime}ms`)

    const response = NextResponse.json({ results })
    
    // Add aggressive caching headers - cache for 2 minutes, allow stale data for 5 minutes while revalidating
    response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=300')
    
    return response
  } catch (e: any) {
    console.error('[api/org/results] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
