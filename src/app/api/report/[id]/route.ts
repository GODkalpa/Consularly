import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/report/[id]
// Fetch interview report data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    const interviewId = params.id

    // Load interview
    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const interviewData = interviewSnap.data()
    if (!interviewData) {
      return NextResponse.json({ error: 'Interview data not found' }, { status: 404 })
    }

    // Check authorization
    // User can view their own interviews, or org members can view org interviews
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data()
    
    // Check if caller is a student
    const studentSnap = await adminDb().collection('orgStudents').where('firebaseUid', '==', callerUid).limit(1).get()
    const isStudent = !studentSnap.empty
    
    const canView = 
      interviewData.userId === callerUid || // User's own interview
      (callerData?.orgId && callerData.orgId === interviewData.orgId) || // Org member viewing org interview
      (isStudent && studentSnap.docs[0].id === interviewData.userId) // Student viewing their own interview

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden: cannot view this report' }, { status: 403 })
    }

    // Get student info
    let studentName = 'Student'
    let studentEmail = ''
    
    if (interviewData.userId) {
      const studentDoc = await adminDb().collection('orgStudents').doc(interviewData.userId).get()
      if (studentDoc.exists) {
        const studentData = studentDoc.data()
        studentName = studentData?.name || studentData?.fullName || 'Student'
        studentEmail = studentData?.email || ''
      }
    }

    // Get organization info
    let orgName = ''
    let orgLogo = ''
    
    if (interviewData.orgId) {
      const orgDoc = await adminDb().collection('organizations').doc(interviewData.orgId).get()
      if (orgDoc.exists) {
        const orgData = orgDoc.data()
        orgName = orgData?.name || ''
        orgLogo = orgData?.settings?.customBranding?.logoUrl || ''
      }
    }

    // Build report response
    const report = {
      id: interviewId,
      studentName,
      studentEmail,
      route: interviewData.route || 'unknown',
      startTime: interviewData.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
      endTime: interviewData.endTime?.toDate?.()?.toISOString() || new Date().toISOString(),
      status: interviewData.status || 'unknown',
      score: interviewData.score || 0,
      finalReport: interviewData.finalReport || {
        decision: 'borderline',
        overall: 0,
        dimensions: {},
        summary: 'Report not available',
        detailedInsights: [],
        strengths: [],
        weaknesses: []
      },
      orgName,
      orgLogo
    }

    return NextResponse.json(report)
  } catch (e: any) {
    console.error('[api/report/[id]] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
