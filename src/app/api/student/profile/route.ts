import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// GET /api/student/profile
// Returns student's own profile data with org branding
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

    // Get organization details for branding
    const orgSnap = await adminDb().collection('organizations').doc(studentData.orgId).get()
    const orgData = orgSnap.exists ? orgSnap.data() : null

    const student = {
      id: studentId,
      name: studentData.name,
      email: studentData.email,
      interviewCountry: studentData.interviewCountry || null,
      studentProfile: studentData.studentProfile || null,
      
      // Account status
      accountStatus: studentData.accountStatus,
      dashboardEnabled: studentData.dashboardEnabled,
      canSelfStartInterviews: studentData.canSelfStartInterviews,
      
      // Credits
      creditsAllocated: studentData.creditsAllocated || 0,
      creditsUsed: studentData.creditsUsed || 0,
      creditsRemaining: (studentData.creditsAllocated || 0) - (studentData.creditsUsed || 0),
      
      // Timestamps
      invitedAt: studentData.invitedAt?.toDate?.()?.toISOString() || null,
      invitationAcceptedAt: studentData.invitationAcceptedAt?.toDate?.()?.toISOString() || null,
      lastLoginAt: studentData.lastLoginAt?.toDate?.()?.toISOString() || null,
      createdAt: studentData.createdAt?.toDate?.()?.toISOString() || null
    }

    const organization = {
      id: studentData.orgId,
      name: orgData?.name || 'Your Organization',
      branding: orgData?.settings?.customBranding || {}
    }

    return NextResponse.json({
      student,
      organization
    })

  } catch (e: any) {
    console.error('[api/student/profile] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/student/profile
// Updates student's own profile information
export async function PATCH(req: NextRequest) {
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

    const body = await req.json()
    const allowedFields = ['name', 'studentProfile']
    const updates: any = {}

    // Validate and prepare updates
    if (body.name && typeof body.name === 'string') {
      const name = body.name.trim()
      if (name.length >= 2) {
        updates.name = name
      } else {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
      }
    }

    if (body.studentProfile && typeof body.studentProfile === 'object') {
      // Validate student profile fields
      const profile = body.studentProfile
      const validatedProfile: any = {}
      
      if (profile.degreeLevel && ['undergraduate', 'graduate', 'doctorate', 'other'].includes(profile.degreeLevel)) {
        validatedProfile.degreeLevel = profile.degreeLevel
      }
      
      if (profile.programName && typeof profile.programName === 'string') {
        validatedProfile.programName = profile.programName.trim()
      }
      
      if (profile.universityName && typeof profile.universityName === 'string') {
        validatedProfile.universityName = profile.universityName.trim()
      }
      
      if (profile.programLength && typeof profile.programLength === 'string') {
        validatedProfile.programLength = profile.programLength.trim()
      }
      
      if (profile.programCost && typeof profile.programCost === 'string') {
        validatedProfile.programCost = profile.programCost.trim()
      }
      
      if (profile.fieldOfStudy && typeof profile.fieldOfStudy === 'string') {
        validatedProfile.fieldOfStudy = profile.fieldOfStudy.trim()
      }
      
      if (profile.intendedMajor && typeof profile.intendedMajor === 'string') {
        validatedProfile.intendedMajor = profile.intendedMajor.trim()
      }
      
      if (Object.keys(validatedProfile).length > 0) {
        updates.studentProfile = {
          ...studentData.studentProfile,
          ...validatedProfile,
          profileCompleted: true
        }
      }
    }

    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add timestamp
    updates.updatedAt = FieldValue.serverTimestamp()

    // Update student record
    await adminDb().collection('orgStudents').doc(studentId).update(updates)

    // Also update Firebase Auth display name if name was changed
    if (updates.name) {
      try {
        await adminAuth().updateUser(firebaseUid, {
          displayName: updates.name
        })
      } catch (authError) {
        console.warn('[Student Profile] Failed to update Firebase Auth display name:', authError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updates).filter(key => key !== 'updatedAt')
    })

  } catch (e: any) {
    console.error('[api/student/profile] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
