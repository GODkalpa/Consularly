import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/interviews/[id]/report
// Get complete interview report with finalReport, perAnswerScores, conversationHistory
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

    // Load caller profile
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const isAdmin = caller?.role === 'admin' || caller?.role === 'super_admin'

    // Load interview
    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const interview = interviewSnap.data()
    if (!interview) {
      return NextResponse.json({ error: 'Interview data not found' }, { status: 404 })
    }
    
    // Authorization: user can view their own interviews, org members can view org interviews, admin can view any
    const canView = isAdmin || 
                    interview.userId === callerUid || 
                    (interview.orgId && interview.orgId === caller?.orgId)
    
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden: cannot view this interview' }, { status: 403 })
    }

    // Return complete interview with all report data
    return NextResponse.json({ 
      id: interviewId,
      ...interview,
      // Ensure these fields are included
      finalReport: interview.finalReport || null,
      perAnswerScores: interview.perAnswerScores || [],
      conversationHistory: interview.conversationHistory || [],
      completedQuestions: interview.completedQuestions || 0,
    })
  } catch (e: any) {
    console.error('[api/interviews/[id]/report] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

