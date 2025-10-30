import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { sendInterviewResultsEmail } from '@/lib/email/send-helpers'

// PATCH /api/org/interviews/[id]
// Body: { status?: 'scheduled'|'in_progress'|'completed'|'cancelled', endTime?: string ISO, score?: number, scoreDetails?: Partial<{communication:number;technical:number;confidence:number;overall:number}> }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    if (!interviewId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Load caller and interview to enforce same-org access
    const [callerSnap, interviewSnap] = await Promise.all([
      adminDb().collection('users').doc(callerUid).get(),
      adminDb().collection('interviews').doc(interviewId).get(),
    ])

    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    if (!interviewSnap.exists) return NextResponse.json({ error: 'Interview not found' }, { status: 404 })

    const caller = callerSnap.data() as { orgId?: string; role?: string } | undefined
    const interview = interviewSnap.data() as { orgId?: string } | undefined

    if (!caller?.orgId || caller.orgId !== interview?.orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    const body = await req.json()
    const updates: any = { updatedAt: FieldValue.serverTimestamp() }

    if (body.status) updates.status = String(body.status)
    if (body.endTime) updates.endTime = new Date(String(body.endTime))
    if (typeof body.score === 'number') updates.score = Number(body.score)
    if (body.scoreDetails && typeof body.scoreDetails === 'object') {
      updates.scoreDetails = {
        communication: Number(body.scoreDetails.communication ?? interviewSnap.get('scoreDetails.communication') ?? 0),
        technical: Number(body.scoreDetails.technical ?? interviewSnap.get('scoreDetails.technical') ?? 0),
        confidence: Number(body.scoreDetails.confidence ?? interviewSnap.get('scoreDetails.confidence') ?? 0),
        overall: Number(body.scoreDetails.overall ?? interviewSnap.get('scoreDetails.overall') ?? 0),
      }
    }

    // Enhanced reporting fields
    if (body.finalReport && typeof body.finalReport === 'object') {
      updates.finalReport = body.finalReport
    }

    if (Array.isArray(body.perAnswerScores)) {
      updates.perAnswerScores = body.perAnswerScores
    }

    if (typeof body.completedQuestions === 'number') {
      updates.completedQuestions = body.completedQuestions
    }

    if (Array.isArray(body.conversationHistory)) {
      updates.conversationHistory = body.conversationHistory
    }

    await adminDb().collection('interviews').doc(interviewId).update(updates)

    // Send interview results email if interview is completed with a final report
    if (body.status === 'completed' && body.finalReport) {
      try {
        // Get student and organization details for email
        const studentId = interviewSnap.get('userId')
        const orgId = interview?.orgId
        const route = interviewSnap.get('route') || 'USA F1'

        if (studentId && orgId) {
          const [studentSnap, orgSnap] = await Promise.all([
            adminDb().collection('orgStudents').doc(studentId).get(),
            adminDb().collection('organizations').doc(orgId).get(),
          ])

          const studentData = studentSnap.data()
          const orgData = orgSnap.data()
          const studentEmail = studentData?.email

          if (studentEmail) {
            const finalReport = body.finalReport
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

            sendInterviewResultsEmail({
              to: studentEmail,
              studentName: studentData?.name || 'Student',
              interviewType: route,
              overall: finalReport.overall || 0,
              decision: finalReport.decision || 'borderline',
              summary: finalReport.summary || 'Interview completed',
              strengths: finalReport.strengths || [],
              weaknesses: finalReport.weaknesses || [],
              reportLink: `${appUrl}/org/results?id=${interviewId}`,
              orgName: orgData?.name,
              orgBranding: orgData?.settings?.customBranding,
              interviewDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
            }).catch((e) => {
              console.warn('[api/org/interviews/[id]] Results email failed:', e)
            })
          }
        }
      } catch (emailError) {
        console.warn('[api/org/interviews/[id]] Email preparation failed:', emailError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/org/interviews/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
