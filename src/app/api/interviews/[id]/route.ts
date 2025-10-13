import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// PATCH /api/interviews/{id}
// Update interview record (used by admin and user interviews)
// Body: { status?: string, endTime?: string ISO, score?: number, scoreDetails?: object }
export async function PATCH(
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

    // Load interview to verify ownership
    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const interview = interviewSnap.data() as { userId?: string; orgId?: string } | undefined
    
    // Authorization: user can only update their own interviews, or org admin can update org interviews, or super admin can update any
    const canUpdate = isAdmin || interview?.userId === callerUid
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden: cannot update this interview' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    }

    if (body.status) {
      updateData.status = body.status
    }

    if (body.endTime) {
      updateData.endTime = FieldValue.serverTimestamp()
    }

    if (typeof body.score === 'number') {
      updateData.score = body.score
    }

    if (body.scoreDetails && typeof body.scoreDetails === 'object') {
      updateData.scoreDetails = body.scoreDetails
    }

    if (body.route) {
      updateData.route = body.route
    }

    // Enhanced reporting fields
    if (body.finalReport && typeof body.finalReport === 'object') {
      updateData.finalReport = body.finalReport
    }

    if (Array.isArray(body.perAnswerScores)) {
      updateData.perAnswerScores = body.perAnswerScores
    }

    if (typeof body.completedQuestions === 'number') {
      updateData.completedQuestions = body.completedQuestions
    }

    if (Array.isArray(body.conversationHistory)) {
      updateData.conversationHistory = body.conversationHistory
    }

    // Update interview document
    await adminDb().collection('interviews').doc(interviewId).update(updateData)

    return NextResponse.json({ success: true, id: interviewId })
  } catch (e: any) {
    console.error('[api/interviews/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// GET /api/interviews/{id}
// Get interview record
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

    const interview = interviewSnap.data() as { userId?: string; orgId?: string } | undefined
    
    // Authorization: user can only view their own interviews, or org members can view org interviews, or admin can view any
    const canView = isAdmin || 
                    interview?.userId === callerUid || 
                    (interview?.orgId && interview.orgId === caller?.orgId)
    
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden: cannot view this interview' }, { status: 403 })
    }

    return NextResponse.json({ 
      id: interviewId,
      ...interview
    })
  } catch (e: any) {
    console.error('[api/interviews/[id]] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
