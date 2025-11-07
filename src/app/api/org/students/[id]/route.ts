import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/org/students/[id]
// Body: { name?: string, email?: string, interviewCountry?: string, studentProfile?: object }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const orgId = (callerSnap.data() as any)?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const id = params.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const studentRef = adminDb().collection('orgStudents').doc(id)
    const studentSnap = await studentRef.get()
    if (!studentSnap.exists) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    if ((studentSnap.data() as any)?.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    const body = await req.json()
    const updates: any = { updatedAt: FieldValue.serverTimestamp() }
    if (typeof body.name === 'string') updates.name = String(body.name).trim()
    if (typeof body.email === 'string') updates.email = String(body.email).trim()
    if (body.interviewCountry) updates.interviewCountry = body.interviewCountry
    if (body.studentProfile !== undefined) updates.studentProfile = body.studentProfile

    await studentRef.update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/org/students/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/org/students/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const orgId = (callerSnap.data() as any)?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const id = params.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const studentRef = adminDb().collection('orgStudents').doc(id)
    const studentSnap = await studentRef.get()
    if (!studentSnap.exists) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    if ((studentSnap.data() as any)?.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    await studentRef.delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/org/students/[id]] DELETE error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
