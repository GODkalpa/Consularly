import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/admin/organizations/list
// Returns all organizations for admin dashboard
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

    // Check caller is admin
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerRole = callerData?.role
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Super admins can see all organizations
    // Regular admins can only see their own organization
    let organizationsQuery = adminDb().collection('organizations')
    
    if (callerRole === 'admin' && callerData?.orgId) {
      // Regular admin - only their org
      const orgSnap = await organizationsQuery.doc(callerData.orgId).get()
      if (!orgSnap.exists) {
        return NextResponse.json({ organizations: [] }, { status: 200 })
      }
      const organizations = [{
        id: orgSnap.id,
        ...orgSnap.data()
      }]
      return NextResponse.json({ organizations }, { status: 200 })
    } else {
      // Super admin - all orgs
      const snapshot = await organizationsQuery.get()
      const organizations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      return NextResponse.json({ organizations }, { status: 200 })
    }
  } catch (e: any) {
    console.error('[api/admin/organizations/list] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
