import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/org/credits/summary
// Returns organization credit overview with student allocations
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

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { orgId?: string }
    const orgId = caller?.orgId || ''
    if (!orgId) {
      return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })
    }

    // Load organization and students in parallel
    const [orgSnap, studentsSnap] = await Promise.all([
      adminDb().collection('organizations').doc(orgId).get(),
      adminDb().collection('orgStudents').where('orgId', '==', orgId).get()
    ])

    if (!orgSnap.exists) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const org = orgSnap.data() as any
    const quotaLimit = org?.quotaLimit || 0
    const quotaUsed = org?.quotaUsed || 0
    const studentCreditsAllocated = org?.studentCreditsAllocated || 0
    const studentCreditsUsed = org?.studentCreditsUsed || 0

    // Calculate organization-level metrics
    const totalUsed = quotaUsed + studentCreditsAllocated
    const orgMetrics = {
      quotaLimit,
      quotaUsed, // Org direct usage only
      studentCreditsAllocated, // Reserved for students
      studentCreditsUsed, // Actually used by students
      quotaRemaining: Math.max(0, quotaLimit - totalUsed), // Available for new allocations
      unallocatedCredits: Math.max(0, quotaLimit - totalUsed), // Same as quotaRemaining
      utilizationPercent: quotaLimit > 0 ? Math.round((totalUsed / quotaLimit) * 100) : 0,
      studentUtilizationPercent: studentCreditsAllocated > 0 ? Math.round((studentCreditsUsed / studentCreditsAllocated) * 100) : 0
    }

    // Process student data
    const students = studentsSnap.docs.map(doc => {
      const data = doc.data()
      const creditsAllocated = data.creditsAllocated || 0
      const creditsUsed = data.creditsUsed || 0
      const creditsRemaining = creditsAllocated - creditsUsed

      return {
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        creditsAllocated,
        creditsUsed,
        creditsRemaining,
        utilizationPercent: creditsAllocated > 0 ? Math.round((creditsUsed / creditsAllocated) * 100) : 0,
        accountStatus: data.accountStatus || 'pending',
        dashboardEnabled: data.dashboardEnabled || false,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null
      }
    }).sort((a, b) => {
      // Sort by usage (highest first), then by name
      if (a.creditsUsed !== b.creditsUsed) {
        return b.creditsUsed - a.creditsUsed
      }
      return a.name.localeCompare(b.name)
    })

    // Calculate student-level statistics
    const studentStats = {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.accountStatus === 'active' && s.dashboardEnabled).length,
      studentsWithCredits: students.filter(s => s.creditsAllocated > 0).length,
      studentsWithRemainingCredits: students.filter(s => s.creditsRemaining > 0).length,
      totalCreditsUsedByStudents: students.reduce((sum, s) => sum + s.creditsUsed, 0),
      averageUtilization: students.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + s.utilizationPercent, 0) / students.length)
        : 0
    }

    // Top performers and insights
    const topPerformers = students
      .filter(s => s.creditsUsed >= 3) // Only students with meaningful usage
      .sort((a, b) => b.creditsUsed - a.creditsUsed)
      .slice(0, 5)

    const underutilizedStudents = students
      .filter(s => s.creditsAllocated >= 5 && s.utilizationPercent <= 20)
      .sort((a, b) => a.utilizationPercent - b.utilizationPercent)
      .slice(0, 5)

    return NextResponse.json({
      organization: orgMetrics,
      students: {
        list: students,
        stats: studentStats,
        insights: {
          topPerformers,
          underutilized: underutilizedStudents
        }
      },
      recommendations: generateRecommendations(orgMetrics, studentStats, students)
    })

  } catch (e: any) {
    console.error('[api/org/credits/summary] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

function generateRecommendations(
  orgMetrics: any, 
  studentStats: any, 
  students: any[]
): string[] {
  const recommendations: string[] = []

  // Quota utilization recommendations
  if (orgMetrics.utilizationPercent > 90) {
    recommendations.push('Consider requesting additional quota - you\'re using 90%+ of your allocation')
  } else if (orgMetrics.utilizationPercent < 30) {
    recommendations.push('Low quota utilization detected - consider allocating more credits to students')
  }

  // Unallocated credits recommendation
  if (orgMetrics.unallocatedCredits > 50) {
    recommendations.push(`You have ${orgMetrics.unallocatedCredits} unallocated credits - consider distributing them to students`)
  }

  // Student engagement recommendations
  const inactiveStudents = students.filter(s => s.creditsAllocated > 0 && s.creditsUsed === 0).length
  if (inactiveStudents > 0) {
    recommendations.push(`${inactiveStudents} student${inactiveStudents > 1 ? 's have' : ' has'} allocated credits but haven't started practicing`)
  }

  // Credit allocation efficiency
  if (studentStats.averageUtilization < 40 && studentStats.studentsWithCredits > 3) {
    recommendations.push('Consider reducing initial credit allocations - current average utilization is low')
  }

  // Dashboard enablement
  const studentsWithoutDashboard = students.filter(s => !s.dashboardEnabled).length
  if (studentsWithoutDashboard > 0) {
    recommendations.push(`${studentsWithoutDashboard} student${studentsWithoutDashboard > 1 ? 's don\'t' : ' doesn\'t'} have dashboard access enabled`)
  }

  return recommendations
}
