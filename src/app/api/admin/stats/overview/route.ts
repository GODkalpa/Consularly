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

    // Use aggregation queries for efficient counting - no full collection scans
    const db = adminDb()
    
    const [usersCount, orgsCount, interviewsCount] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('organizations').count().get(),
      db.collection('interviews').count().get(),
    ])

    const totalUsers = usersCount.data().count
    const totalOrganizations = orgsCount.data().count
    const totalInterviews = interviewsCount.data().count

    // Calculate active users (logged in within last 30 days) using query
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsersCount = await db.collection('users')
      .where('lastLoginAt', '>=', thirtyDaysAgo)
      .count()
      .get()
    
    const activeUsers = activeUsersCount.data().count

    // Calculate monthly revenue - fetch only organizations with select()
    const orgsSnap = await db.collection('organizations')
      .select('plan')
      .get()
    
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

    // System health: percentage of completed interviews using aggregation
    const completedCount = await db.collection('interviews')
      .where('status', '==', 'completed')
      .count()
      .get()
    
    const completedInterviews = completedCount.data().count
    const systemHealth = totalInterviews > 0 
      ? Math.round((completedInterviews / totalInterviews) * 100 * 10) / 10 
      : 100

    const response = NextResponse.json({
      totalUsers,
      totalOrganizations,
      totalInterviews,
      monthlyRevenue,
      activeUsers,
      pendingSupport,
      systemHealth,
    })
    
    // Cache for 30 seconds to reduce database load
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/stats/overview] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

