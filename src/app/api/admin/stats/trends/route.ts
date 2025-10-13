import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * GET /api/admin/stats/trends
 * Returns time-series data for charts:
 * - Monthly interview completions (last 6 months)
 * - Organization type distribution
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

    // Calculate monthly test usage for last 6 months using efficient queries
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const testUsageData: Array<{ month: string; tests: number }> = []
    
    const db = adminDb()
    
    // Query each month separately with date range filters
    const monthlyPromises = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
      
      monthlyPromises.push(
        db.collection('interviews')
          .where('createdAt', '>=', monthStart)
          .where('createdAt', '<=', monthEnd)
          .count()
          .get()
          .then(countSnap => ({
            month: monthNames[monthDate.getMonth()],
            tests: countSnap.data().count
          }))
      )
    }
    
    const monthlyResults = await Promise.all(monthlyPromises)
    testUsageData.push(...monthlyResults)

    // Calculate organization type distribution using aggregation
    const db2 = adminDb()
    const [basicCount, premiumCount, enterpriseCount] = await Promise.all([
      db2.collection('organizations').where('plan', '==', 'basic').count().get(),
      db2.collection('organizations').where('plan', '==', 'premium').count().get(),
      db2.collection('organizations').where('plan', '==', 'enterprise').count().get(),
    ])
    
    const orgTypeData: Array<{ name: string; value: number; color: string }> = [
      { name: 'Basic Plan', value: basicCount.data().count, color: 'hsl(var(--chart-1))' },
      { name: 'Premium Plan', value: premiumCount.data().count, color: 'hsl(var(--chart-2))' },
      { name: 'Enterprise Plan', value: enterpriseCount.data().count, color: 'hsl(var(--chart-3))' },
    ]

    const response = NextResponse.json({
      testUsageData,
      organizationTypeData: orgTypeData,
    })
    
    // Cache for 5 minutes - trends data changes slowly
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/stats/trends] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

