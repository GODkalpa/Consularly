import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/admin/organizations/[id]
// Updates organization quota and other settings. Admin-only.
// Body: { quotaLimit?: number, quotaUsed?: number, plan?: string, settings?: {...} }
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

    const orgId = params.id
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const body = await req.json()
    const update: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Update quota fields
    if (typeof body.quotaLimit === 'number' && body.quotaLimit >= 0) {
      update.quotaLimit = body.quotaLimit
    }
    if (typeof body.quotaUsed === 'number' && body.quotaUsed >= 0) {
      update.quotaUsed = body.quotaUsed
    }

    // Update plan
    if (body.plan && ['basic', 'premium', 'enterprise'].includes(body.plan)) {
      update.plan = body.plan
    }

    // Update settings (partial merge)
    if (body.settings && typeof body.settings === 'object') {
      const currentOrg = await adminDb().collection('organizations').doc(orgId).get()
      const currentSettings = currentOrg.data()?.settings || {}
      update.settings = { ...currentSettings, ...body.settings }
    }

    if (Object.keys(update).length === 1) {
      // Only updatedAt, nothing to update
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await adminDb().collection('organizations').doc(orgId).update(update)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e: any) {
    console.error('[api/admin/organizations/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
