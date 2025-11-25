import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { logStep } from '@/lib/api-performance'
import { studentNameCache } from '@/lib/student-cache'
import { compressedJsonResponse } from '@/lib/compression-middleware'

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
    
    // Get student names for recent interviews (OPTIMIZED with cache and single query)
    const recentInterviewDocs = recentInterviewsSnapshot.docs
    const studentIds = [...new Set(
      recentInterviewDocs
        .map(doc => doc.data().userId)
        .filter((id): id is string => !!id)
    )]
    
    const studentNameMap = new Map<string, string>()
    
    if (studentIds.length > 0) {
      const studentFetchStep = logStep('Student Names Fetch', Date.now())
      
      // Check cache first
      const uncachedIds: string[] = []
      studentIds.forEach(id => {
        const cachedName = studentNameCache.get(id)
        if (cachedName) {
          studentNameMap.set(id, cachedName)
        } else {
          uncachedIds.push(id)
        }
      })
      
      // Fetch uncached students with single query using orgId filter
      if (uncachedIds.length > 0) {
        // OPTIMIZED: Single query with orgId filter instead of batched __name__ queries
        const studentsSnapshot = await adminDb()
          .collection('orgStudents')
          .where('orgId', '==', orgId)
          .get()
        
        const fetchedStudents: Array<{ id: string; name: string }> = []
        
        studentsSnapshot.forEach(doc => {
          if (uncachedIds.includes(doc.id)) {
            const data = doc.data()
            const name = data?.name || data?.fullName || 'Unknown'
            studentNameMap.set(doc.id, name)
            fetchedStudents.push({ id: doc.id, name })
          }
        })
        
        // Update cache with newly fetched students
        if (fetchedStudents.length > 0) {
          studentNameCache.setMany(fetchedStudents)
        }
      }
      
      studentFetchStep.end(`Fetched ${uncachedIds.length} students (${studentIds.length - uncachedIds.length} from cache)`)
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
          favicon: orgData?.settings?.customBranding?.favicon || undefined,
          primaryColor: orgData?.settings?.customBranding?.primaryColor || undefined,
          secondaryColor: orgData?.settings?.customBranding?.secondaryColor || undefined,
          backgroundColor: orgData?.settings?.customBranding?.backgroundColor || undefined,
          companyName: orgData?.settings?.customBranding?.companyName || undefined,
          tagline: orgData?.settings?.customBranding?.tagline || undefined,
          welcomeMessage: orgData?.settings?.customBranding?.welcomeMessage || undefined,
          backgroundImage: orgData?.settings?.customBranding?.backgroundImage || undefined,
          fontFamily: orgData?.settings?.customBranding?.fontFamily || undefined,
          footerText: orgData?.settings?.customBranding?.footerText || undefined,
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

    const responseData = { 
      organization, 
      statistics 
    }
    
    // Generate ETag based on data hash for conditional requests
    const dataString = JSON.stringify(responseData)
    const etag = `W/"${Buffer.from(dataString).toString('base64').slice(0, 32)}"`
    
    // Check if client has matching ETag (304 Not Modified)
    const clientEtag = req.headers.get('if-none-match')
    if (clientEtag === etag) {
      const notModifiedResponse = new NextResponse(null, { status: 304 })
      notModifiedResponse.headers.set('ETag', etag)
      notModifiedResponse.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
      return notModifiedResponse
    }
    
    const response = compressedJsonResponse(responseData)
    responseStep.end('Combined response built with compression')
    
    // Add more aggressive caching headers (5 minutes with stale-while-revalidate)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
    response.headers.set('ETag', etag)
    
    const totalTime = Date.now() - startTime
    console.log(`[Dashboard API] 🎯 TOTAL REQUEST TIME: ${totalTime}ms`)
    
    return response
  } catch (e: any) {
    console.error('[api/org/dashboard] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
