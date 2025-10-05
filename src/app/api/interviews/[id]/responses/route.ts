import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// POST /api/interviews/[id]/responses
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    const interviewId = params.id
    if (!interviewId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) return NextResponse.json({ error: 'Interview not found' }, { status: 404 })

    const interview = interviewSnap.data() as { userId: string }
    if (interview.userId !== callerUid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const doc = {
      order: typeof body.order === 'number' ? body.order : FieldValue.increment(0),
      question: String(body.question || ''),
      answer: String(body.answer || ''),
      perf: body.perf && typeof body.perf === 'object' ? body.perf : null,
      bodyLanguageOverall: typeof body.bodyLanguageOverall === 'number' ? body.bodyLanguageOverall : null,
      asrConfidence: typeof body.asrConfidence === 'number' ? body.asrConfidence : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      timestamp: body.timestamp ? new Date(String(body.timestamp)) : FieldValue.serverTimestamp(),
    }

    const resRef = await adminDb().collection('interviews').doc(interviewId).collection('responses').add(doc)
    return NextResponse.json({ id: resRef.id }, { status: 201 })
  } catch (e: any) {
    console.error('[api/interviews/[id]/responses] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// GET /api/interviews/[id]/responses
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    const interviewId = params.id
    if (!interviewId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) return NextResponse.json({ error: 'Interview not found' }, { status: 404 })

    const interview = interviewSnap.data() as { userId: string }
    if (interview.userId !== callerUid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const snap = await adminDb().collection('interviews').doc(interviewId).collection('responses').orderBy('order', 'asc').get()
    const responses = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ responses })
  } catch (e: any) {
    console.error('[api/interviews/[id]/responses] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
