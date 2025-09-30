import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/admin/users/[id]
// Updates user profile, quota, and other settings. Admin-only.
// Body: { quotaLimit?: number, quotaUsed?: number, role?: string, isActive?: boolean, displayName?: string }
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
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin'
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
    if (body.role && ['user', 'admin', 'super_admin'].includes(body.role)) {
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
