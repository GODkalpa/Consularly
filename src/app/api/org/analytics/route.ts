import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/org/analytics
// Returns aggregated interview analytics for the caller's organization
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

    const caller = callerSnap.data() as { orgId?: string } | undefined
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const qSnap = await adminDb()
      .collection('interviews')
      .where('orgId', '==', orgId)
      .get()

    const interviews = qSnap.docs.map((d) => d.data() as any)

    const totalInterviews = interviews.length
    const completed = interviews.filter((i) => i?.status === 'completed')
    const averageScore = completed.length > 0
      ? completed.reduce((sum, i) => sum + (typeof i.score === 'number' ? i.score : 0), 0) / completed.length
      : 0

    const completionRate = totalInterviews > 0 ? (completed.length / totalInterviews) * 100 : 0

    const averageDuration = completed.length > 0
      ? completed.reduce((sum, i) => sum + (typeof i.duration === 'number' ? i.duration : 0), 0) / completed.length
      : 0

    const scoreDistribution = {
      excellent: completed.filter((i) => (i?.score ?? 0) >= 90).length,
      good: completed.filter((i) => (i?.score ?? 0) >= 80 && (i?.score ?? 0) < 90).length,
      average: completed.filter((i) => (i?.score ?? 0) >= 70 && (i?.score ?? 0) < 80).length,
      needsImprovement: completed.filter((i) => (i?.score ?? 0) < 70).length,
    }

    const analytics = {
      totalInterviews,
      averageScore,
      completionRate,
      averageDuration,
      scoreDistribution,
      trendsOverTime: [] as Array<{ date: string; count: number; averageScore: number }>,
    }

    return NextResponse.json({ analytics })
  } catch (e: any) {
    console.error('[api/org/analytics] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
