import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// POST /api/org/interviews
// Body: { studentId: string, interviewType?: 'visa'|'job'|'academic', scheduledTime?: string ISO, duration?: number }
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile to get orgId
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerOrgId = caller?.orgId || ''
    if (!callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: caller has no organization' }, { status: 403 })
    }

    const body = await req.json()
    const studentId = String(body.studentId || '')
    const interviewType = (body.interviewType || 'visa') as 'visa'|'job'|'academic'
    const duration = Number(body.duration || 30)
    const scheduledTimeIso = body.scheduledTime ? String(body.scheduledTime) : null
    const route = body.route ? String(body.route) : undefined

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // Validate student belongs to same org (database-only student)
    const studentSnap = await adminDb().collection('orgStudents').doc(studentId).get()
    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    const student = studentSnap.data() as { orgId?: string } | undefined
    if ((student?.orgId || '') !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: student not in your organization' }, { status: 403 })
    }

    // Create interview document (server timestamps)
    const interviewDoc = await adminDb().collection('interviews').add({
      userId: studentId,
      orgId: callerOrgId,
      startTime: FieldValue.serverTimestamp(),
      endTime: null,
      status: 'scheduled',
      score: 0,
      scoreDetails: {
        communication: 0,
        technical: 0,
        confidence: 0,
        overall: 0,
      },
      interviewType,
      route,
      duration,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ id: interviewDoc.id }, { status: 201 })
  } catch (e: any) {
    console.error('[api/org/interviews] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
