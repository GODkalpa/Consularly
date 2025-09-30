import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/admin/users/list
// Returns users for admin dashboard
// Query param: ?type=signup (for signup users only) or ?type=all (for all users)
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

    let usersSnapshot
    
    if (type === 'signup') {
      // For quota management - only signup users (no orgId OR has quotaLimit)
      const allUsersSnapshot = await adminDb().collection('users')
        .where('role', '==', 'user')
        .get()

      const signupUsers = allUsersSnapshot.docs
        .filter(doc => {
          const data = doc.data()
          return !data.orgId || (typeof data.quotaLimit === 'number')
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

      return NextResponse.json({ users: signupUsers }, { status: 200 })
    } else {
      // For user management - all users based on permissions
      const allUsersSnap = await adminDb().collection('users').get()

      const users = allUsersSnap.docs
        .filter(doc => {
          if (isSuper) return true
          if (!callerOrgId) return doc.id === callerUid // admin without org sees only themselves

          const data = doc.data() as { orgId?: string | null; role?: string }
          const orgId = data?.orgId
          const role = data?.role

          const isSignupUser = !orgId || orgId === ''
          const inCallerOrg = orgId === callerOrgId
          const isCaller = doc.id === callerUid
          const isSameRoleAdmin = role === 'admin' || role === 'super_admin'

          if (isCaller) return true
          if (inCallerOrg) return true
          if (isSignupUser && (!role || role === 'user' || role === 'student')) return true
          // Do not expose other org admins/users
          if (isSameRoleAdmin && inCallerOrg) return true
          return false
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

      return NextResponse.json({ users }, { status: 200 })
    }
  } catch (e: any) {
    console.error('[api/admin/users/list] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
