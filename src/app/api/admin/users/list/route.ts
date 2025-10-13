import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/admin/users/list
// Returns users for admin dashboard with pagination
// Query params: 
//   ?type=signup (signup users only) or ?type=all (all users)
//   ?limit=100 (default 500, max 1000)
//   ?offset=0 (for pagination)
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

    // Check caller is admin or super_admin
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerRole = callerData?.role
    const callerOrgId = callerData?.orgId
    const isSuper = callerRole === 'super_admin'
    const isAdmin = callerRole === 'admin' || isSuper
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 1000)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const db = adminDb()
    
    if (type === 'signup') {
      // For quota management - only signup users (no orgId OR has quotaLimit)
      // Use indexed query with limit
      let query = db.collection('users')
        .where('role', '==', 'user')
        .limit(limit)

      if (offset > 0) {
        query = query.offset(offset)
      }

      const snapshot = await query.get()

      const signupUsers = snapshot.docs
        .filter(doc => {
          const data = doc.data()
          return !data.orgId || (typeof data.quotaLimit === 'number')
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

      const response = NextResponse.json({ users: signupUsers, total: signupUsers.length }, { status: 200 })
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
      return response
    } else {
      // For user management - optimized fetching based on permissions
      let users: any[] = []

      if (isSuper) {
        // Super admin - fetch with pagination
        let query = db.collection('users').limit(limit)
        if (offset > 0) {
          query = query.offset(offset)
        }
        const snapshot = await query.get()
        users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } else if (callerOrgId) {
        // Regular admin with org - fetch only org members + signup users
        const [orgUsersSnap, signupUsersSnap] = await Promise.all([
          db.collection('users')
            .where('orgId', '==', callerOrgId)
            .limit(limit)
            .get(),
          db.collection('users')
            .where('role', '==', 'user')
            .limit(Math.floor(limit / 2))
            .get()
        ])

        const orgUsers = orgUsersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const signupUsers = signupUsersSnap.docs
          .filter(doc => !doc.data().orgId)
          .map(doc => ({ id: doc.id, ...doc.data() }))
        
        users = [...orgUsers, ...signupUsers]
      } else {
        // Admin without org - only themselves
        const callerDoc = await db.collection('users').doc(callerUid).get()
        if (callerDoc.exists) {
          users = [{ id: callerDoc.id, ...callerDoc.data() }]
        }
      }

      const response = NextResponse.json({ users, total: users.length }, { status: 200 })
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
      return response
    }
  } catch (e: any) {
    console.error('[api/admin/users/list] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
