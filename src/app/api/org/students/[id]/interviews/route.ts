import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/org/students/[id]/interviews
// Returns all interviews for a specific student in the caller's organization
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const studentId = params.id
    if (!studentId) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 })
    }

    // Load caller and student to enforce same-org access
    const [callerSnap, studentSnap] = await Promise.all([
      adminDb().collection('users').doc(callerUid).get(),
      adminDb().collection('orgStudents').doc(studentId).get(),
    ])

    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const caller = callerSnap.data() as { orgId?: string }
    const student = studentSnap.data() as { orgId?: string }

    if (!caller?.orgId || caller.orgId !== student?.orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    // Fetch all interviews for this student
    const interviewsSnap = await adminDb()
      .collection('interviews')
      .where('orgId', '==', caller.orgId)
      .where('userId', '==', studentId)
      .orderBy('startTime', 'desc')
      .get()

    const interviews = interviewsSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        status: data?.status || 'unknown',
        score: typeof data?.score === 'number' ? Math.round(data.score) : null,
        route: data?.route || null,
        startTime: data?.startTime || null,
        endTime: data?.endTime || null,
        finalReport: data?.finalReport || null,
        scoreDetails: data?.scoreDetails || null,
        perAnswerScores: data?.perAnswerScores || [],
        completedQuestions: data?.completedQuestions || 0,
        conversationHistory: data?.conversationHistory || [],
      }
    })

    return NextResponse.json({ interviews })
  } catch (e: any) {
    console.error('[api/org/students/[id]/interviews] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
