import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/admin/users/[id]
// Updates user profile, quota, and other settings. Admin-only.
// Body: { quotaLimit?: number, quotaUsed?: number, role?: 'user'|'admin', isActive?: boolean, displayName?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Check caller is admin
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerRole = callerData?.role
    const isAdmin = callerRole === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if user exists
    const userSnap = await adminDb().collection('users').doc(userId).get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const update: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Update quota fields (for individual signup users)
    if (typeof body.quotaLimit === 'number' && body.quotaLimit >= 0) {
      update.quotaLimit = body.quotaLimit
    }
    if (typeof body.quotaUsed === 'number' && body.quotaUsed >= 0) {
      update.quotaUsed = body.quotaUsed
    }

    // Update role
    if (body.role && ['user', 'admin'].includes(body.role)) {
      update.role = body.role
    }

    // Update active status
    if (typeof body.isActive === 'boolean') {
      update.isActive = body.isActive
    }

    // Update display name
    if (body.displayName && typeof body.displayName === 'string') {
      update.displayName = body.displayName.trim()
    }

    if (Object.keys(update).length === 1) {
      // Only updatedAt, nothing to update
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await adminDb().collection('users').doc(userId).update(update)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e: any) {
    console.error('[api/admin/users/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id]
// Deletes a user from both Firebase Auth and Firestore. Admin-only.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Check caller is admin
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerRole = callerData?.role
    const isAdmin = callerRole === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (userId === callerUid) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user exists
    const userSnap = await adminDb().collection('users').doc(userId).get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete from Firestore
    await adminDb().collection('users').doc(userId).delete()

    // Delete from Firebase Auth
    try {
      await adminAuth().deleteUser(userId)
    } catch (authError) {
      console.warn('[api/admin/users/[id]] Failed to delete from Auth', authError)
      // Continue even if auth deletion fails (user might not exist in Auth)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e: any) {
    console.error('[api/admin/users/[id]] DELETE error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
