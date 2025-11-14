import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/student/results
// Returns interview results for the authenticated student
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const firebaseUid = decoded.uid

    // Find student record by Firebase UID (same pattern as profile route)
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get()

    if (studentQuery.empty) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 403 })
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id
    const orgId = studentData?.orgId

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found for student' }, { status: 403 })
    }

    // Get URL params for filtering
    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') // '7d', '30d', '90d', 'all'
    const routeFilter = searchParams.get('route') // 'usa_f1', 'uk_student', etc.

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

    // Fetch interviews for this student
    let query = adminDb()
      .collection('interviews')
      .where('orgId', '==', orgId)
      .where('userId', '==', studentId)

    // Apply route filter
    if (routeFilter && routeFilter !== 'all') {
      query = query.where('route', '==', routeFilter) as any
    }

    const interviewsSnap = await query.get()

    const interviews = interviewsSnap.docs
      .map((d) => {
        const data = d.data()
        const startTime = data?.startTime?.toDate?.() ?? null
        const endTime = data?.endTime?.toDate?.() ?? null

        // Apply time filter in memory
        if (cutoffDate && startTime && startTime < cutoffDate) {
          return null
        }

        return {
          id: d.id,
          status: data?.status || 'unknown',
          score: typeof data?.score === 'number' ? Math.round(data.score) : null,
          route: data?.route || null,
          startTime: startTime ? startTime.toISOString() : null,
          endTime: endTime ? endTime.toISOString() : null,
          finalReport: data?.finalReport || null,
          duration: data?.duration || null,
          feedback: data?.feedback || null,
          questions: data?.questions || [],
          answers: data?.answers || [],
        }
      })
      .filter((iv) => iv !== null)
      .sort((a, b) => {
        const aTime = a?.startTime ? new Date(a.startTime).getTime() : 0
        const bTime = b?.startTime ? new Date(b.startTime).getTime() : 0
        return bTime - aTime // Most recent first
      })

    // Calculate stats for this student
    const completedInterviews = interviews.filter((iv) => iv.status === 'completed')
    const scores = completedInterviews
      .map((iv) => iv.score)
      .filter((s): s is number => typeof s === 'number')
    
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null
    
    const highestScore = scores.length > 0 ? Math.max(...scores) : null
    const latestScore = scores.length > 0 ? scores[0] : null
    
    // Calculate improvement (compare latest vs average of older interviews)
    const olderScores = scores.slice(1)
    const improvement = scores.length > 1 && olderScores.length > 0
      ? scores[0] - Math.round(olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length)
      : 0

    const statistics = {
      total: interviews.length,
      completed: completedInterviews.length,
      averageScore: avgScore,
      highestScore,
      latestScore,
      improvement,
    }

    return NextResponse.json({ 
      interviews,
      statistics,
      student: {
        id: studentId,
        name: studentData?.name || 'Student',
        email: studentData?.email || '',
        orgId,
      }
    })
  } catch (e: any) {
    console.error('[api/student/results] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
