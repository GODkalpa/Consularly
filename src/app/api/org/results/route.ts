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

    // Fetch interviews for each student
    const results = await Promise.all(
      targetStudents.map(async (student) => {
        try {
          let query = adminDb()
            .collection('interviews')
            .where('orgId', '==', orgId)
            .where('userId', '==', student.id)

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

              // Apply time filter in memory (since we can't combine multiple where clauses efficiently)
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
        } catch (err) {
          console.error(`Error fetching interviews for student ${student.id}:`, err)
          return {
            student,
            interviews: [],
            stats: {
              totalInterviews: 0,
              completedInterviews: 0,
              averageScore: null,
              latestScore: null,
            },
          }
        }
      })
    )

    // Sort by total interviews (most active first)
    results.sort((a, b) => b.stats.totalInterviews - a.stats.totalInterviews)

    return NextResponse.json({ results })
  } catch (e: any) {
    console.error('[api/org/results] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
