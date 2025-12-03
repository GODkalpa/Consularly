import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/org/students/[id]
// Body: { name?: string, email?: string, interviewCountry?: string, studentProfile?: object }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
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
// Permanently deletes student from Firestore AND Firebase Auth
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFirebaseAdmin()
    
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })

    const decodedToken = await adminAuth().verifyIdToken(token)
    const callerUid = decodedToken.uid

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const orgId = (callerSnap.data() as any)?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const studentRef = adminDb().collection('orgStudents').doc(id)
    const studentSnap = await studentRef.get()
    if (!studentSnap.exists) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    
    const studentData = studentSnap.data() as any
    if (studentData?.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    // Get the Firebase Auth UID if the student has set up their account
    const firebaseUid = studentData?.firebaseUid
    const studentEmail = studentData?.email

    // Delete the Firestore document first
    await studentRef.delete()
    console.log(`[Student Delete] Deleted Firestore document for student ${id}`)

    // Delete Firebase Auth user if exists
    if (firebaseUid) {
      try {
        await adminAuth().deleteUser(firebaseUid)
        console.log(`[Student Delete] Deleted Firebase Auth user ${firebaseUid}`)
      } catch (authError: any) {
        // User might not exist in Auth (e.g., never completed setup)
        if (authError.code !== 'auth/user-not-found') {
          console.warn(`[Student Delete] Failed to delete Auth user ${firebaseUid}:`, authError.message)
        }
      }
    } else if (studentEmail) {
      // Try to find and delete by email if no firebaseUid stored
      try {
        const userRecord = await adminAuth().getUserByEmail(studentEmail)
        await adminAuth().deleteUser(userRecord.uid)
        console.log(`[Student Delete] Deleted Firebase Auth user by email ${studentEmail}`)
      } catch (authError: any) {
        // User might not exist in Auth
        if (authError.code !== 'auth/user-not-found') {
          console.warn(`[Student Delete] Failed to delete Auth user by email ${studentEmail}:`, authError.message)
        }
      }
    }

    // Also delete any related user document in 'users' collection
    if (firebaseUid) {
      try {
        const userDocRef = adminDb().collection('users').doc(firebaseUid)
        const userDoc = await userDocRef.get()
        if (userDoc.exists) {
          await userDocRef.delete()
          console.log(`[Student Delete] Deleted users collection document for ${firebaseUid}`)
        }
      } catch (e) {
        console.warn(`[Student Delete] Failed to delete users document:`, e)
      }
    }

    return NextResponse.json({ ok: true, deleted: { firestore: true, auth: !!firebaseUid || !!studentEmail } })
  } catch (e: any) {
    console.error('[api/org/students/[id]] DELETE error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
