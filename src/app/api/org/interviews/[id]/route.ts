import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/org/interviews/[id]
// Body: { status?: 'scheduled'|'in_progress'|'completed'|'cancelled', endTime?: string ISO, score?: number, scoreDetails?: Partial<{communication:number;technical:number;confidence:number;overall:number}> }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const interviewId = params.id
    if (!interviewId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Load caller and interview to enforce same-org access
    const [callerSnap, interviewSnap] = await Promise.all([
      adminDb().collection('users').doc(callerUid).get(),
      adminDb().collection('interviews').doc(interviewId).get(),
    ])

    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    if (!interviewSnap.exists) return NextResponse.json({ error: 'Interview not found' }, { status: 404 })

    const caller = callerSnap.data() as { orgId?: string; role?: string } | undefined
    const interview = interviewSnap.data() as { orgId?: string } | undefined

    if (!caller?.orgId || caller.orgId !== interview?.orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    const body = await req.json()
    const updates: any = { updatedAt: FieldValue.serverTimestamp() }

    if (body.status) updates.status = String(body.status)
    if (body.endTime) updates.endTime = new Date(String(body.endTime))
    if (typeof body.score === 'number') updates.score = Number(body.score)
    if (body.scoreDetails && typeof body.scoreDetails === 'object') {
      updates.scoreDetails = {
        communication: Number(body.scoreDetails.communication ?? interviewSnap.get('scoreDetails.communication') ?? 0),
        technical: Number(body.scoreDetails.technical ?? interviewSnap.get('scoreDetails.technical') ?? 0),
        confidence: Number(body.scoreDetails.confidence ?? interviewSnap.get('scoreDetails.confidence') ?? 0),
        overall: Number(body.scoreDetails.overall ?? interviewSnap.get('scoreDetails.overall') ?? 0),
      }
    }

    await adminDb().collection('interviews').doc(interviewId).update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/org/interviews/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
