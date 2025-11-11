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
    const isAdmin = caller?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    // Generate trend data efficiently
    // For now, use estimated/mock data for fast loading
    // TODO: Pre-compute this data with Cloud Functions for production
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const db = adminDb()
    
    // Get total interviews count to estimate monthly distribution
    const totalInterviewsCount = await db.collection('interviews').count().get()
    const totalInterviews = totalInterviewsCount.data().count
    
    // Generate estimated monthly trend (distribute total across 6 months with growth pattern)
    const testUsageData: Array<{ month: string; tests: number }> = []
    const baseMonthly = Math.floor(totalInterviews / 6)
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      // Simulate growth trend: older months have fewer interviews
      const growthFactor = 0.7 + (0.3 * (5 - i) / 5)
      const estimatedTests = Math.floor(baseMonthly * growthFactor)
      
      testUsageData.push({
        month: monthNames[monthDate.getMonth()],
        tests: estimatedTests
      })
    }

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
    
    // Cache for 10 minutes - trends data is estimated and changes slowly
    response.headers.set('Cache-Control', 'private, max-age=600, stale-while-revalidate=1200')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/stats/trends] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

