import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// GET /api/student/interviews
// Returns student's own interview history
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const firebaseUid = decoded.uid

    // Find student record by Firebase UID
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get()

    if (studentQuery.empty) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id

    // Check if student has dashboard access
    if (!studentData.dashboardEnabled) {
      return NextResponse.json({ error: 'Dashboard access disabled' }, { status: 403 })
    }

    // Get student's interviews
    const interviewsSnap = await adminDb()
      .collection('interviews')
      .where('orgId', '==', studentData.orgId)
      .where('userId', '==', studentId)
      .orderBy('startTime', 'desc')
      .get()

    const interviews = interviewsSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        status: data?.status || 'unknown',
        score: typeof data?.score === 'number' ? Math.round(data.score) : null,
        route: data?.route || null,
        startTime: data?.startTime?.toDate?.()?.toISOString() || data?.startTime,
        endTime: data?.endTime?.toDate?.()?.toISOString() || data?.endTime,
        duration: data?.duration || null,
        creditSource: data?.creditSource || 'org', // org vs student initiated
        completedQuestions: data?.completedQuestions || 0,
        
        // Score breakdown
        scoreDetails: data?.scoreDetails || null,
        detailedScores: data?.detailedScores || null,
        
        // Basic final report data (not full report for performance)
        finalReport: data?.finalReport ? {
          decision: data.finalReport.decision,
          overall: data.finalReport.overall,
          summary: data.finalReport.summary?.substring(0, 200) + '...' || ''
        } : null
      }
    })

    // Calculate statistics
    const completedInterviews = interviews.filter(i => i.status === 'completed')
    const stats = {
      total: interviews.length,
      completed: completedInterviews.length,
      averageScore: completedInterviews.length > 0 
        ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length)
        : 0,
      highestScore: completedInterviews.length > 0 
        ? Math.max(...completedInterviews.map(i => i.score || 0))
        : 0,
      improvement: completedInterviews.length >= 2 
        ? (completedInterviews[0].score || 0) - (completedInterviews[completedInterviews.length - 1].score || 0)
        : 0
    }

    return NextResponse.json({
      interviews,
      statistics: stats,
      student: {
        id: studentId,
        name: studentData.name,
        creditsRemaining: (studentData.creditsAllocated || 0) - (studentData.creditsUsed || 0)
      }
    })

  } catch (e: any) {
    console.error('[api/student/interviews] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// POST /api/student/interviews
// Student creates their own interview (self-initiated)
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const firebaseUid = decoded.uid

    // Find student record by Firebase UID
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get()

    if (studentQuery.empty) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id

    // Validation checks
    if (!studentData.dashboardEnabled) {
      return NextResponse.json({ error: 'Dashboard access disabled' }, { status: 403 })
    }

    if (!studentData.canSelfStartInterviews) {
      return NextResponse.json({ 
        error: 'Self-start interviews not allowed',
        message: 'Your organization has disabled self-initiated interviews. Please contact them to schedule an interview.'
      }, { status: 403 })
    }

    const creditsRemaining = (studentData.creditsAllocated || 0) - (studentData.creditsUsed || 0)
    if (creditsRemaining <= 0) {
      return NextResponse.json({ 
        error: 'No credits remaining',
        message: 'You have no interview credits remaining. Please contact your organization to request more credits.',
        creditsRemaining: 0
      }, { status: 400 })
    }

    const body = await req.json()
    const route = body.route || (studentData.interviewCountry ? `${studentData.interviewCountry}_student` : 'usa_f1')

    // Check organization quotas
    const orgSnap = await adminDb().collection('organizations').doc(studentData.orgId).get()
    if (!orgSnap.exists) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const org = orgSnap.data() as any
    const quotaLimit = org?.quotaLimit || 0
    const quotaUsed = org?.quotaUsed || 0

    if (quotaLimit > 0 && quotaUsed >= quotaLimit) {
      return NextResponse.json({ 
        error: 'Organization quota exceeded',
        message: 'Your organization has reached its monthly interview quota. Please contact your administrator.'
      }, { status: 403 })
    }

    // Atomic transaction: create interview + deduct credit + update quotas
    const interviewId = await adminDb().runTransaction(async (transaction) => {
      const interviewRef = adminDb().collection('interviews').doc()
      const studentRef = adminDb().collection('orgStudents').doc(studentId)
      const orgRef = adminDb().collection('organizations').doc(studentData.orgId)

      // Create interview document
      const interviewData = {
        userId: studentId,
        orgId: studentData.orgId,
        startTime: FieldValue.serverTimestamp(),
        endTime: null,
        status: 'scheduled',
        score: 0,
        scoreDetails: {
          communication: 0,
          technical: 0,
          confidence: 0,
          overall: 0,
        },
        interviewType: 'visa',
        route,
        duration: 30,
        creditSource: 'student', // Mark as student-initiated
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        
        // Include student profile for context
        ...(studentData.studentProfile?.universityName && {
          university: studentData.studentProfile.universityName
        }),
        ...(studentData.studentProfile?.programName && {
          programName: studentData.studentProfile.programName
        }),
        ...(studentData.studentProfile?.degreeLevel && {
          degreeLevel: studentData.studentProfile.degreeLevel
        })
      }

      transaction.set(interviewRef, interviewData)

      // Deduct student credit
      transaction.update(studentRef, {
        creditsUsed: FieldValue.increment(1),
        creditsRemaining: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      })

      // Track student credit usage (but don't deduct from quotaUsed - already reserved)
      transaction.update(orgRef, {
        studentCreditsUsed: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
        // NOTE: Do NOT increment quotaUsed - credits already reserved via studentCreditsAllocated
      })

      // Log credit usage
      const creditLogRef = adminDb().collection('studentCreditHistory').doc()
      transaction.set(creditLogRef, {
        orgId: studentData.orgId,
        studentId,
        type: 'used',
        amount: 1,
        reason: `Self-initiated ${route} interview`,
        performedBy: firebaseUid,
        interviewId: interviewRef.id,
        timestamp: FieldValue.serverTimestamp(),
        balanceBefore: creditsRemaining,
        balanceAfter: creditsRemaining - 1
      })

      return interviewRef.id
    })

    return NextResponse.json({
      success: true,
      interview: {
        id: interviewId,
        route,
        scheduledFor: 'now'
      },
      student: {
        creditsRemaining: creditsRemaining - 1,
        creditsUsed: (studentData.creditsUsed || 0) + 1
      }
    }, { status: 201 })

  } catch (e: any) {
    console.error('[api/student/interviews] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
