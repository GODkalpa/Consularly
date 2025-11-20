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
    const now = new Date()
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // Get completed and failed interviews (without date filter to avoid index requirement)
    const [completedCount, failedCount] = await Promise.all([
      db.collection('interviews')
        .where('status', '==', 'completed')
        .count()
        .get(),
      db.collection('interviews')
        .where('status', '==', 'failed')
        .count()
        .get(),
    ])

    const totalCompleted = completedCount.data().count
    const totalFailed = failedCount.data().count

    // Calculate average duration (limit to recent 100 to avoid full scan)
    const completedInterviews = await db.collection('interviews')
      .where('status', '==', 'completed')
      .limit(100)
      .get()

    let totalDuration = 0
    let durationCount = 0
    const routeCounts: Record<string, number> = {}

    completedInterviews.forEach(doc => {
      const data = doc.data()
      if (data.startTime && data.endTime) {
        const start = data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime)
        const end = data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
        totalDuration += duration
        durationCount++
      }
      
      const route = data.route || 'unknown'
      routeCounts[route] = (routeCounts[route] || 0) + 1
    })

    const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0

    // Find top route
    let topRoute = 'N/A'
    let topRouteCount = 0
    Object.entries(routeCounts).forEach(([route, count]) => {
      if (count > topRouteCount) {
        topRoute = route.replace('_', ' ').toUpperCase()
        topRouteCount = count
      }
    })

    const response = NextResponse.json({
      totalCompleted,
      totalFailed,
      averageDuration,
      topRoute,
      topRouteCount,
    })
    
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
    return response
  } catch (e: any) {
    const errorMessage = e?.message || String(e) || 'Internal error'
    const errorStack = e?.stack || 'No stack trace'
    console.error('[api/admin/stats/interview-insights] Error:', errorMessage)
    console.error('[api/admin/stats/interview-insights] Stack:', errorStack)
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined 
    }, { status: 500 })
  }
}
