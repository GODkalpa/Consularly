import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// GET /api/org/students
// Returns database-only students in caller's organization with minimal fields and completed interviews count
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

    // Fetch org-scoped database-only students from top-level collection 'orgStudents'
    const studsSnap = await adminDb()
      .collection('orgStudents')
      .where('orgId', '==', orgId)
      .get()

    const students = studsSnap.docs.map((d) => {
      const data = d.data() as any
      const createdAt: Date | undefined = data?.createdAt?.toDate?.() ?? (data?.createdAt ? new Date(data.createdAt) : undefined)
      const lastActive: Date | undefined = data?.lastActiveAt ? new Date(data.lastActiveAt) : (data?.updatedAt?.toDate?.() ?? createdAt)
      return {
        id: d.id,
        name: data?.name || data?.displayName || 'Unknown',
        email: data?.email || '',
        lastActive: lastActive ? lastActive.toISOString() : null,
        studentProfile: data?.studentProfile || null,
      }
    })

    // Compute completed interview counts per student (simple N requests)
    const withCounts = await Promise.all(students.map(async (s) => {
      try {
        const snap = await adminDb()
          .collection('interviews')
          .where('orgId', '==', orgId)
          .where('userId', '==', s.id)
          .where('status', '==', 'completed')
          .get()
        return { ...s, interviewsCompleted: snap.size }
      } catch {
        return { ...s, interviewsCompleted: 0 }
      }
    }))

    return NextResponse.json({ students: withCounts })
  } catch (e: any) {
    console.error('[api/org/students] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// POST /api/org/students
// Body: { name: string, email?: string, studentProfile?: {...} }
// Creates a database-only student record scoped to the caller's organization
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

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { orgId?: string }
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const body = await req.json()
    const name = String(body?.name || '').trim()
    const email = body?.email ? String(body.email).trim() : ''
    const studentProfile = body?.studentProfile || null
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const studentData: any = {
      orgId,
      name,
      email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Include student profile if provided
    if (studentProfile) {
      studentData.studentProfile = studentProfile
    }

    const docRef = await adminDb().collection('orgStudents').add(studentData)

    return NextResponse.json({ id: docRef.id }, { status: 201 })
  } catch (e: any) {
    console.error('[api/org/students] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
