import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string } | undefined
    const isAdmin = caller?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const db = adminDb()
    const timeRange = request.nextUrl.searchParams.get('timeRange') || '30d'
    
    // Calculate date range
    const now = new Date()
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    // startDate will be used for future time-based filtering
    // const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    // Get basic counts
    const [usersCount, orgsCount, interviewsCount] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('organizations').count().get(),
      db.collection('interviews').count().get(),
    ])

    const totalUsers = usersCount.data().count
    const totalOrganizations = orgsCount.data().count
    const totalInterviews = interviewsCount.data().count

    // Get today's stats
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [todayUsersCount, todayInterviewsCount] = await Promise.all([
      db.collection('users').where('createdAt', '>=', todayStart).count().get(),
      db.collection('interviews').where('createdAt', '>=', todayStart).count().get(),
    ])

    const todayUsers = todayUsersCount.data().count
    const todayInterviews = todayInterviewsCount.data().count

    // Calculate weekly growth
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const [thisWeekCount, lastWeekCount] = await Promise.all([
      db.collection('users').where('createdAt', '>=', weekAgo).count().get(),
      db.collection('users').where('createdAt', '>=', twoWeeksAgo).where('createdAt', '<', weekAgo).count().get(),
    ])
    
    const thisWeek = thisWeekCount.data().count
    const lastWeek = lastWeekCount.data().count
    const weeklyGrowth = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0

    // Calculate completion rate
    const completedCount = await db.collection('interviews')
      .where('status', '==', 'completed')
      .count()
      .get()
    
    const completedInterviews = completedCount.data().count
    const completionRate = totalInterviews > 0 
      ? Math.round((completedInterviews / totalInterviews) * 100) 
      : 0

    // Calculate average score from completed interviews (without compound query to avoid index)
    const completedInterviewsSnap = await db.collection('interviews')
      .where('status', '==', 'completed')
      .limit(100)
      .get()
    
    let totalScore = 0
    let scoreCount = 0
    completedInterviewsSnap.forEach(doc => {
      const data = doc.data()
      if (data.score && data.score > 0) {
        totalScore += data.score
        scoreCount++
      }
    })
    
    const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

    // Find top performing route
    const routeCounts: Record<string, { count: number; totalScore: number }> = {}
    completedInterviewsSnap.forEach(doc => {
      const data = doc.data()
      const route = data.route || 'unknown'
      if (!routeCounts[route]) {
        routeCounts[route] = { count: 0, totalScore: 0 }
      }
      routeCounts[route].count++
      if (data.score) {
        routeCounts[route].totalScore += data.score
      }
    })
    
    let topPerformingRoute = 'N/A'
    let maxAvgScore = 0
    Object.entries(routeCounts).forEach(([route, data]) => {
      const avgScore = data.totalScore / data.count
      if (avgScore > maxAvgScore) {
        maxAvgScore = avgScore
        topPerformingRoute = route
      }
    })

    // Calculate peak hour (simplified - use mock data for now)
    const peakHour = 14 // 2 PM as default peak

    // Active users
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeUsersCount = await db.collection('users')
      .where('lastLoginAt', '>=', thirtyDaysAgo)
      .count()
      .get()
    
    const activeUsers = activeUsersCount.data().count

    // Calculate revenue
    const planPricing = { basic: 99, premium: 299, enterprise: 999 }
    const [basicCount, premiumCount, enterpriseCount] = await Promise.all([
      db.collection('organizations').where('plan', '==', 'basic').count().get(),
      db.collection('organizations').where('plan', '==', 'premium').count().get(),
      db.collection('organizations').where('plan', '==', 'enterprise').count().get(),
    ])
    
    const monthlyRevenue = 
      (basicCount.data().count * planPricing.basic) +
      (premiumCount.data().count * planPricing.premium) +
      (enterpriseCount.data().count * planPricing.enterprise)

    const pendingSupport = 0
    const systemHealth = completionRate

    const response = NextResponse.json({
      totalUsers,
      totalOrganizations,
      totalInterviews,
      monthlyRevenue,
      activeUsers,
      pendingSupport,
      systemHealth,
      todayUsers,
      todayInterviews,
      weeklyGrowth,
      completionRate,
      averageScore,
      topPerformingRoute,
      peakHour,
    })
    
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    return response
  } catch (e: any) {
    const errorMessage = e?.message || String(e) || 'Internal error'
    const errorStack = e?.stack || 'No stack trace'
    console.error('[api/admin/stats/enhanced-overview] Error:', errorMessage)
    console.error('[api/admin/stats/enhanced-overview] Stack:', errorStack)
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined 
    }, { status: 500 })
  }
}
