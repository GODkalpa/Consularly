import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { generateInvitationToken, sendStudentInvitationEmail } from '@/lib/student-invitation'
import type { CreateStudentRequest } from '@/types/firestore'

// GET /api/org/students
// Returns database-only students in caller's organization with minimal fields and completed interviews count
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
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { orgId?: string }
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    // Fetch org-scoped database-only students from top-level collection 'orgStudents'
    const studsSnap = await adminDb()
      .collection('orgStudents')
      .where('orgId', '==', orgId)
      .get()

    const students = studsSnap.docs.map((d) => {
      const data = d.data() as any
      const createdAt: Date | undefined = data?.createdAt?.toDate?.() ?? (data?.createdAt ? new Date(data.createdAt) : undefined)
      const lastActive: Date | undefined = data?.lastLoginAt?.toDate?.() ?? (data?.lastActiveAt ? new Date(data.lastActiveAt) : (data?.updatedAt?.toDate?.() ?? createdAt))
      return {
        id: d.id,
        name: data?.name || data?.displayName || 'Unknown',
        email: data?.email || '',
        interviewCountry: data?.interviewCountry || null,
        lastActive: lastActive ? lastActive.toISOString() : null,
        studentProfile: data?.studentProfile || null,
        // Credit system fields
        creditsAllocated: data?.creditsAllocated || 0,
        creditsUsed: data?.creditsUsed || 0,
        creditsRemaining: (data?.creditsAllocated || 0) - (data?.creditsUsed || 0),
        // Authentication fields
        accountStatus: data?.accountStatus || 'pending',
        dashboardEnabled: data?.dashboardEnabled || false,
        canSelfStartInterviews: data?.canSelfStartInterviews || false,
        firebaseUid: data?.firebaseUid || null,
        invitedAt: data?.invitedAt?.toDate?.()?.toISOString() || null,
        invitationAcceptedAt: data?.invitationAcceptedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: data?.lastLoginAt?.toDate?.()?.toISOString() || null,
      }
    })

    // Compute completed interview counts efficiently - ONE query for all students
    const interviewsSnap = await adminDb()
      .collection('interviews')
      .where('orgId', '==', orgId)
      .where('status', '==', 'completed')
      .select('userId') // Only fetch userId field
      .get()
    
    // Count interviews per student in memory (fast)
    const interviewCounts = new Map<string, number>()
    interviewsSnap.docs.forEach(doc => {
      const userId = doc.data().userId
      if (userId) {
        interviewCounts.set(userId, (interviewCounts.get(userId) || 0) + 1)
      }
    })
    
    // Attach counts to students
    const withCounts = students.map(s => ({
      ...s,
      interviewsCompleted: interviewCounts.get(s.id) || 0
    }))

    const response = NextResponse.json({ students: withCounts })
    
    // Cache for 2 minutes - students don't change frequently
    response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=240')
    
    return response
  } catch (e: any) {
    console.error('[api/org/students] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// POST /api/org/students
// Body: CreateStudentRequest
// Creates a student record with authentication and credit allocation
export async function POST(req: NextRequest) {
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
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { orgId?: string }
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const body = await req.json() as CreateStudentRequest
    const { name, email, interviewCountry, studentProfile, dashboardEnabled, canSelfStartInterviews, sendInvitation } = body
    
    // Validation
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 })
    
    // Check if email is already used
    const existingStudent = await adminDb()
      .collection('orgStudents')
      .where('email', '==', email.trim())
      .limit(1)
      .get()
    
    if (!existingStudent.empty) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // NOTE: Credits will be auto-allocated (5) when student sets their password
    // No need to check or allocate credits here
    
    // Generate invitation token if sending invitation
    const invitationToken = sendInvitation ? generateInvitationToken() : undefined
    
    const studentData: any = {
      orgId,
      name: name.trim(),
      email: email.trim(),
      
      // Credit system (will be auto-allocated when student sets password)
      creditsAllocated: 0,
      creditsUsed: 0,
      creditsRemaining: 0,
      
      // Authentication fields
      accountStatus: 'pending',
      dashboardEnabled: !!dashboardEnabled,
      canSelfStartInterviews: !!canSelfStartInterviews,
      
      // Invitation fields
      ...(invitationToken && {
        invitationToken,
        invitedAt: FieldValue.serverTimestamp()
      }),
      
      // Optional fields
      ...(interviewCountry && { interviewCountry }),
      ...(studentProfile && { studentProfile }),
      
      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Create student record (credits will be allocated when password is set)
    const docRef = adminDb().collection('orgStudents').doc()
    await docRef.set(studentData)
    const studentId = docRef.id
    
    // Send invitation email if requested
    let invitationSent = false
    console.log('[Student Creation] Email check:', { sendInvitation, hasInvitationToken: !!invitationToken })
    
    if (sendInvitation && invitationToken) {
      try {
        console.log('[Student Creation] Sending invitation email to:', email.trim())
        
        // Get organization details for branding
        const orgSnap = await adminDb().collection('organizations').doc(orgId).get()
        const orgData = orgSnap.data() as any
        
        console.log('[Student Creation] Org data for branding:', { 
          orgName: orgData?.name, 
          hasBranding: !!orgData?.settings?.customBranding 
        })
        
        await sendStudentInvitationEmail({
          studentName: name.trim(),
          studentEmail: email.trim(),
          organizationName: orgData?.name || 'Your Organization',
          organizationBranding: orgData?.settings?.customBranding || {},
          initialCredits: 5, // Will be auto-allocated when password is set
          invitationToken
        })
        
        console.log('[Student Creation] ✅ Invitation email sent successfully')
        invitationSent = true
      } catch (emailError) {
        console.error('[Student Creation] ❌ Email failed:', emailError)
        // Don't fail the entire request if email fails
      }
    } else {
      console.log('[Student Creation] ⚠️ Skipping email:', { sendInvitation, hasToken: !!invitationToken })
    }

    return NextResponse.json({ 
      id: studentId,
      invitationSent,
      ...(invitationToken && { invitationToken }) // Include token for testing
    }, { status: 201 })
  } catch (e: any) {
    console.error('[api/org/students] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
