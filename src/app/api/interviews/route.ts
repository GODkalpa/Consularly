import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// POST /api/interviews
// Create interview for signup users (not org members)
// Body: { interviewType?: 'visa'|'job'|'academic', scheduledTime?: string ISO, duration?: number, route?: string }
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

    // Load caller profile
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { role?: string; orgId?: string; quotaLimit?: number; quotaUsed?: number } | undefined

    // This endpoint is for signup users WITHOUT an organization
    if (caller?.orgId) {
      return NextResponse.json({ 
        error: 'Organization members should use /api/org/interviews' 
      }, { status: 400 })
    }

    const body = await req.json()
    const interviewType = (body.interviewType || 'visa') as 'visa'|'job'|'academic'
    const duration = Number(body.duration || 30)
    const route = body.route ? String(body.route) : undefined

    // Check user quota (for signup users)
    const quotaLimit = caller?.quotaLimit ?? 0
    const quotaUsed = caller?.quotaUsed ?? 0

    // Reject if quota is 0 (no quota assigned) or if quota exceeded
    if (quotaLimit === 0 || quotaUsed >= quotaLimit) {
      return NextResponse.json({ 
        error: 'Quota exceeded', 
        message: quotaLimit === 0 
          ? 'No interview quota assigned. Contact support for more interviews.'
          : `You have reached your monthly quota limit of ${quotaLimit} interviews. Contact support for more interviews.`,
        quotaLimit,
        quotaUsed
      }, { status: 403 })
    }

    // Create interview document
    const interviewDoc = await adminDb().collection('interviews').add({
      userId: callerUid,
      orgId: '', // No org for signup users
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
      university: route?.startsWith('france_') ? route.split('_')[1] : undefined,
      duration,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Increment user quota usage
    await adminDb().collection('users').doc(callerUid).update({
      quotaUsed: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    })

    return NextResponse.json({ id: interviewDoc.id }, { status: 201 })
  } catch (e: any) {
    console.error('[api/interviews] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
