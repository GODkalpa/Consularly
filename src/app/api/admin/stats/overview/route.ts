import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * GET /api/admin/stats/overview
 * Returns real-time dashboard statistics from Firestore
 * - Total users count
 * - Total organizations count
 * - Total interviews count
 * - Monthly revenue (calculated from org plans)
 * - Active users (logged in within last 30 days)
 * - Pending support tickets
 * - System health metrics
 */
export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    // Verify admin token
    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile to verify admin role
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string } | undefined
    const isAdmin = caller?.role === 'admin' || caller?.role === 'super_admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    // Fetch statistics from Firestore
    const [usersSnap, orgsSnap, interviewsSnap] = await Promise.all([
      adminDb().collection('users').get(),
      adminDb().collection('organizations').get(),
      adminDb().collection('interviews').get(),
    ])

    const totalUsers = usersSnap.size
    const totalOrganizations = orgsSnap.size
    const totalInterviews = interviewsSnap.size

    // Calculate active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    let activeUsers = 0
    usersSnap.forEach((doc) => {
      const data = doc.data()
      const lastLoginAt = data?.lastLoginAt
      if (lastLoginAt) {
        const loginDate = lastLoginAt.toDate ? lastLoginAt.toDate() : new Date(lastLoginAt)
        if (loginDate >= thirtyDaysAgo) {
          activeUsers++
        }
      }
    })

    // Calculate monthly revenue from organization plans
    let monthlyRevenue = 0
    const planPricing = {
      basic: 99,
      premium: 299,
      enterprise: 999,
    }
    
    orgsSnap.forEach((doc) => {
      const data = doc.data()
      const plan = data?.plan as keyof typeof planPricing
      if (plan && planPricing[plan]) {
        monthlyRevenue += planPricing[plan]
      }
    })

    // Count pending support tickets (if you have a support collection)
    // For now, return 0 as placeholder
    const pendingSupport = 0

    // System health: percentage of successful interviews
    let completedInterviews = 0
    interviewsSnap.forEach((doc) => {
      const data = doc.data()
      if (data?.status === 'completed') {
        completedInterviews++
      }
    })
    
    const systemHealth = totalInterviews > 0 
      ? Math.round((completedInterviews / totalInterviews) * 100 * 10) / 10 
      : 100

    return NextResponse.json({
      totalUsers,
      totalOrganizations,
      totalInterviews,
      monthlyRevenue,
      activeUsers,
      pendingSupport,
      systemHealth,
    })
  } catch (e: any) {
    console.error('[api/admin/stats/overview] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

