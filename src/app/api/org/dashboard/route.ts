import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { logStep } from '@/lib/api-performance'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Combined endpoint for dashboard - reduces round trips from 2-3 to 1
export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now()
    console.log(`[Dashboard API] 🚀 Starting dashboard request...`)
    
    const firebaseStep = logStep('Firebase Admin Initialization', startTime)
    await ensureFirebaseAdmin()
    firebaseStep.end()

    const authStep = logStep('Authentication', Date.now())
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    authStep.end('Token verified')

    const userStep = logStep('User Profile Fetch', Date.now())
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { orgId?: string } | undefined
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })
    userStep.end(`Found orgId: ${orgId}`)

    // OPTIMIZED: Fetch ALL dashboard data in parallel
    const queryStep = logStep('Database Queries', Date.now())
    const [
      orgSnap,
      studentsSnapshot, 
      totalInterviewsSnapshot, 
      recentInterviewsSnapshot, 
      orgUsersSnapshot,
      scoredInterviewsSnapshot
    ] = await Promise.all([
      // Organization data
      adminDb().collection('organizations').doc(orgId).get(),
      
      // Statistics queries
      adminDb()
        .collection('orgStudents')
        .where('orgId', '==', orgId)
        .count()
        .get(),
      
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .count()
        .get(),
      
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
      
      adminDb()
        .collection('users')
        .where('orgId', '==', orgId)
        .count()
        .get(),
      
      adminDb()
        .collection('interviews')
        .where('orgId', '==', orgId)
        .where('finalScore', '>=', 0)
        .limit(20) // Reduced from 50
        .get(),
    ])
    queryStep.end(`6 parallel queries completed`)

    if (!orgSnap.exists) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgData = orgSnap.data() || {}

    // Process statistics
    const totalStudents = studentsSnapshot.data().count
    const totalInterviews = totalInterviewsSnapshot.data().count
    const activeUsers = orgUsersSnapshot.data().count

    // Calculate average score
    let avgScore = 0
    if (!scoredInterviewsSnapshot.empty) {
      const totalScore = scoredInterviewsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().finalScore || 0)
      }, 0)
      avgScore = Math.round(totalScore / scoredInterviewsSnapshot.docs.length)
    }
    
    // Get student names for recent interviews (optimized)
    const recentInterviewDocs = recentInterviewsSnapshot.docs
    const studentIds = [...new Set(
      recentInterviewDocs
        .map(doc => doc.data().userId)
        .filter((id): id is string => !!id)
    )]
    
    const studentNameMap = new Map<string, string>()
    
    if (studentIds.length > 0) {
      // Batch fetch students efficiently 
      const chunkSize = 10
      const chunks: string[][] = []
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        chunks.push(studentIds.slice(i, i + chunkSize))
      }
      
      const studentSnapshots = await Promise.all(
        chunks.map(chunk => 
          adminDb()
            .collection('orgStudents')
            .where('__name__', 'in', chunk)
            .get()
        )
      )
      
      studentSnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data()
          const name = data?.name || data?.fullName || 'Unknown'
          studentNameMap.set(doc.id, name)
        })
      })
    }
    
    const recentInterviews = recentInterviewDocs.map((doc) => {
      const data = doc.data()
      const studentId = data.userId
      const candidateName = studentId ? (studentNameMap.get(studentId) || 'Unknown') : 'Unknown'
      
      return {
        id: doc.id,
        candidateName,
        date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        score: data.finalScore || 0,
        status: data.status || 'completed',
      }
    })

    const queryTime = Date.now() - startTime
    console.log(`[Dashboard API] ✅ Combined fetch completed in ${queryTime}ms for org: ${orgId}`)

    // Build combined response
    const responseStep = logStep('Response Building', Date.now())
    const organization = {
      id: orgSnap.id,
      name: orgData.name ?? '',
      domain: orgData.domain ?? '',
      plan: orgData.plan ?? 'basic',
      quotaLimit: typeof orgData.quotaLimit === 'number' ? orgData.quotaLimit : 0,
      quotaUsed: typeof orgData.quotaUsed === 'number' ? orgData.quotaUsed : 0,
      settings: {
        allowSelfRegistration: !!orgData?.settings?.allowSelfRegistration,
        defaultInterviewDuration: typeof orgData?.settings?.defaultInterviewDuration === 'number' ? orgData.settings.defaultInterviewDuration : 30,
        enableMetricsCollection: !!orgData?.settings?.enableMetricsCollection,
        customBranding: {
          logoUrl: orgData?.settings?.customBranding?.logoUrl || undefined,
          primaryColor: orgData?.settings?.customBranding?.primaryColor || undefined,
          secondaryColor: orgData?.settings?.customBranding?.secondaryColor || undefined,
          companyName: orgData?.settings?.customBranding?.companyName || undefined,
          tagline: orgData?.settings?.customBranding?.tagline || undefined,
          welcomeMessage: orgData?.settings?.customBranding?.welcomeMessage || undefined,
          backgroundImage: orgData?.settings?.customBranding?.backgroundImage || undefined,
          fontFamily: orgData?.settings?.customBranding?.fontFamily || undefined,
          socialLinks: orgData?.settings?.customBranding?.socialLinks || undefined,
        },
        notifications: {
          emailReports: !!orgData?.settings?.notifications?.emailReports,
          weeklyDigest: !!orgData?.settings?.notifications?.weeklyDigest,
          quotaWarnings: !!orgData?.settings?.notifications?.quotaWarnings,
        },
      },
      createdAt: orgData.createdAt || null,
      updatedAt: orgData.updatedAt || null,
    }

    const statistics = {
      totalStudents,
      totalInterviews,
      avgScore,
      activeUsers,
      recentInterviews,
    }

    const response = NextResponse.json({ 
      organization, 
      statistics 
    })
    responseStep.end('Combined response built')
    
    // Add aggressive caching headers
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    
    const totalTime = Date.now() - startTime
    console.log(`[Dashboard API] 🎯 TOTAL REQUEST TIME: ${totalTime}ms`)
    
    return response
  } catch (e: any) {
    console.error('[api/org/dashboard] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
