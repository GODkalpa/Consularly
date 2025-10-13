import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/admin/organizations/list
// Returns organizations for admin dashboard with pagination
// Query params: ?limit=500 (default 500, max 1000)
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

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 1000)

    const db = adminDb()
    
    // Super admins can see all organizations
    // Regular admins can only see their own organization
    if (callerRole === 'admin' && callerData?.orgId) {
      // Regular admin - only their org
      const orgSnap = await db.collection('organizations').doc(callerData.orgId).get()
      if (!orgSnap.exists) {
        return NextResponse.json({ organizations: [] }, { status: 200 })
      }
      const organizations = [{
        id: orgSnap.id,
        ...orgSnap.data()
      }]
      const response = NextResponse.json({ organizations }, { status: 200 })
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
      return response
    } else {
      // Super admin - all orgs with pagination
      const snapshot = await db.collection('organizations')
        .limit(limit)
        .get()
      
      const organizations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      const response = NextResponse.json({ organizations, total: organizations.length }, { status: 200 })
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
      return response
    }
  } catch (e: any) {
    console.error('[api/admin/organizations/list] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
