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

    // Fetch all interviews and organizations
    const [interviewsSnap, orgsSnap] = await Promise.all([
      adminDb().collection('interviews').get(),
      adminDb().collection('organizations').get(),
    ])

    // Calculate monthly test usage for last 6 months
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const testUsageData: Array<{ month: string; tests: number }> = []
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
      
      let count = 0
      interviewsSnap.forEach((doc) => {
        const data = doc.data()
        const createdAt = data?.createdAt
        if (createdAt) {
          const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
          if (date >= monthStart && date <= monthEnd) {
            count++
          }
        }
      })
      
      testUsageData.push({
        month: monthNames[monthDate.getMonth()],
        tests: count,
      })
    }

    // Calculate organization type distribution
    // Since we don't have explicit org types, we'll use plan types
    const orgTypeData: Array<{ name: string; value: number; color: string }> = [
      { name: 'Basic Plan', value: 0, color: 'hsl(var(--chart-1))' },
      { name: 'Premium Plan', value: 0, color: 'hsl(var(--chart-2))' },
      { name: 'Enterprise Plan', value: 0, color: 'hsl(var(--chart-3))' },
    ]
    
    orgsSnap.forEach((doc) => {
      const data = doc.data()
      const plan = data?.plan as string
      if (plan === 'basic') {
        orgTypeData[0].value++
      } else if (plan === 'premium') {
        orgTypeData[1].value++
      } else if (plan === 'enterprise') {
        orgTypeData[2].value++
      }
    })

    return NextResponse.json({
      testUsageData,
      organizationTypeData: orgTypeData,
    })
  } catch (e: any) {
    console.error('[api/admin/stats/trends] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

