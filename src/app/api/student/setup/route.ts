import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { verifyInvitationToken } from '@/lib/student-invitation'

// POST /api/student/setup
// Body: { token: string, password: string, displayName?: string }
// Creates Firebase Auth user and links to orgStudent record
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const body = await req.json()
    const { token, password, displayName } = body

    if (!token || !password) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'Both token and password are required' 
      }, { status: 400 })
    }

    // Verify invitation token
    const tokenData = verifyInvitationToken(token)
    if (!tokenData) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation token',
        message: 'The invitation link is invalid or has expired. Please contact your organization for a new invitation.'
      }, { status: 400 })
    }

    // Find student by invitation token
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('invitationToken', '==', token)
      .limit(1)
      .get()

    if (studentQuery.empty) {
      return NextResponse.json({ 
        error: 'Student not found',
        message: 'No student record found for this invitation token.'
      }, { status: 404 })
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()

    // Check if student already has Firebase UID (account already set up)
    if (studentData.firebaseUid) {
      return NextResponse.json({ 
        error: 'Account already exists',
        message: 'This student account has already been set up. Please try logging in instead.'
      }, { status: 409 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Weak password',
        message: 'Password must be at least 8 characters long.'
      }, { status: 400 })
    }

    const studentId = studentDoc.id
    const email = studentData.email
    const name = displayName || studentData.name

    // Check if Firebase user already exists and handle appropriately
    let firebaseUser
    try {
      // First, try to get existing user
      try {
        const existingUser = await adminAuth().getUserByEmail(email)
        
        // Check if this user is already linked to our student record
        if (studentData.firebaseUid === existingUser.uid) {
          // User already completed setup, just return success
          console.log('[Student Setup] User already set up, returning existing account')
          return NextResponse.json({ 
            success: true,
            message: 'Account already set up. You can now log in.',
            user: {
              uid: existingUser.uid,
              email: existingUser.email,
              displayName: existingUser.displayName
            }
          })
        }
        
        // Check if existing user is linked to a different student
        const existingStudentQuery = await adminDb()
          .collection('orgStudents')
          .where('firebaseUid', '==', existingUser.uid)
          .limit(1)
          .get()
        
        if (!existingStudentQuery.empty) {
          const existingStudent = existingStudentQuery.docs[0].data()
          return NextResponse.json({ 
            error: 'Email already in use',
            message: `This email is already associated with a student account in ${existingStudent.orgId === studentData.orgId ? 'your organization' : 'another organization'}. Please use a different email or contact support.`
          }, { status: 409 })
        }
        
        // Email exists but not linked to any student - could be an admin/user account
        return NextResponse.json({ 
          error: 'Email already registered',
          message: 'This email is already registered in the system. Please try logging in or contact your organization admin.'
        }, { status: 409 })
        
      } catch (getUserError: any) {
        // User doesn't exist, proceed with creation
        if (getUserError.code !== 'auth/user-not-found') {
          throw getUserError // Re-throw if it's a different error
        }
      }
      
      // Create new Firebase Auth user
      firebaseUser = await adminAuth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false // Organization vouches for email validity
      })
      
      console.log('[Student Setup] Created new Firebase user:', firebaseUser.uid)
      
    } catch (authError: any) {
      console.error('[Student Setup] Firebase Auth error:', authError)
      
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({ 
          error: 'Email already registered',
          message: 'An account with this email address already exists. Try logging in or contact support.'
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'Account creation failed',
        message: 'Failed to create user account. Please try again or contact support.'
      }, { status: 500 })
    }

    // Update student record with Firebase UID and activation
    // ALSO: Auto-allocate 5 credits from organization
    try {
      const AUTO_ALLOCATE_CREDITS = 5 // Credits given to each new student
      
      // Get organization details first
      const orgSnap = await adminDb().collection('organizations').doc(studentData.orgId).get()
      if (!orgSnap.exists) {
        throw new Error('Organization not found')
      }
      
      const orgData = orgSnap.data() as any
      const quotaLimit = orgData?.quotaLimit || 0
      const quotaUsed = orgData?.quotaUsed || 0
      const studentCreditsAllocated = orgData?.studentCreditsAllocated || 0
      const availableCredits = quotaLimit - quotaUsed - studentCreditsAllocated
      
      // Check if org has enough credits to allocate
      if (availableCredits < AUTO_ALLOCATE_CREDITS) {
        // Still allow account creation but with 0 credits
        console.warn(`[Student Setup] Organization has insufficient credits (${availableCredits} available, ${AUTO_ALLOCATE_CREDITS} needed). Creating account with 0 credits.`)
        
        await adminDb().collection('orgStudents').doc(studentId).update({
          firebaseUid: firebaseUser.uid,
          accountStatus: 'active',
          invitationAcceptedAt: FieldValue.serverTimestamp(),
          invitationToken: FieldValue.delete(),
          creditsAllocated: 0,
          creditsUsed: 0,
          creditsRemaining: 0,
          updatedAt: FieldValue.serverTimestamp(),
          ...(displayName && { name: displayName })
        })
        
        return NextResponse.json({
          success: true,
          message: 'Account created successfully! Note: Your organization has no credits available to allocate.',
          student: {
            id: studentId,
            email,
            name,
            firebaseUid: firebaseUser.uid,
            organization: {
              id: studentData.orgId,
              name: orgData?.name || 'Your Organization'
            },
            credits: {
              allocated: 0,
              used: 0,
              remaining: 0
            }
          },
          warning: 'No credits allocated due to insufficient organization credits'
        }, { status: 201 })
      }
      
      // Atomic transaction: Update student + Reserve org credits
      await adminDb().runTransaction(async (transaction) => {
        const studentRef = adminDb().collection('orgStudents').doc(studentId)
        const orgRef = adminDb().collection('organizations').doc(studentData.orgId)
        
        // Update student with Firebase UID and allocate credits
        transaction.update(studentRef, {
          firebaseUid: firebaseUser.uid,
          accountStatus: 'active',
          invitationAcceptedAt: FieldValue.serverTimestamp(),
          invitationToken: FieldValue.delete(),
          creditsAllocated: FieldValue.increment(AUTO_ALLOCATE_CREDITS),
          creditsUsed: 0,
          creditsRemaining: FieldValue.increment(AUTO_ALLOCATE_CREDITS),
          updatedAt: FieldValue.serverTimestamp(),
          ...(displayName && { name: displayName })
        })
        
        // Reserve credits in organization
        transaction.update(orgRef, {
          studentCreditsAllocated: FieldValue.increment(AUTO_ALLOCATE_CREDITS),
          updatedAt: FieldValue.serverTimestamp()
        })
        
        // Log credit allocation
        const creditLogRef = adminDb().collection('studentCreditHistory').doc()
        transaction.set(creditLogRef, {
          orgId: studentData.orgId,
          studentId,
          type: 'allocated',
          amount: AUTO_ALLOCATE_CREDITS,
          reason: 'Auto-allocated on account setup',
          performedBy: firebaseUser.uid,
          timestamp: FieldValue.serverTimestamp(),
          balanceBefore: 0,
          balanceAfter: AUTO_ALLOCATE_CREDITS
        })
      })

      console.log(`[Student Setup] Account created for ${email} (${firebaseUser.uid}) with ${AUTO_ALLOCATE_CREDITS} credits`)

      return NextResponse.json({
        success: true,
        message: 'Account successfully created!',
        student: {
          id: studentId,
          email,
          name,
          firebaseUid: firebaseUser.uid,
          organization: {
            id: studentData.orgId,
            name: orgData?.name || 'Your Organization'
          },
          credits: {
            allocated: AUTO_ALLOCATE_CREDITS,
            used: 0,
            remaining: AUTO_ALLOCATE_CREDITS
          }
        }
      }, { status: 201 })

    } catch (updateError) {
      // Rollback: Delete the Firebase user if student update fails
      try {
        await adminAuth().deleteUser(firebaseUser.uid)
      } catch (rollbackError) {
        console.error('[Student Setup] Rollback failed:', rollbackError)
      }
      
      throw updateError
    }

  } catch (e: any) {
    console.error('[api/student/setup] POST error', e)
    return NextResponse.json({ 
      error: e?.message || 'Internal error',
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}

// GET /api/student/setup?token=abc123
// Validates invitation token and returns student info for setup form
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ 
        error: 'Missing token',
        message: 'No invitation token provided.'
      }, { status: 400 })
    }

    // Verify invitation token
    const tokenData = verifyInvitationToken(token)
    if (!tokenData) {
      return NextResponse.json({ 
        error: 'Invalid or expired token',
        message: 'The invitation link is invalid or has expired.',
        expired: true
      }, { status: 400 })
    }

    await ensureFirebaseAdmin()

    // Find student by invitation token
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('invitationToken', '==', token)
      .limit(1)
      .get()

    if (studentQuery.empty) {
      return NextResponse.json({ 
        error: 'Student not found',
        message: 'No student record found for this invitation token.'
      }, { status: 404 })
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()

    // Check if already set up
    if (studentData.firebaseUid) {
      return NextResponse.json({ 
        error: 'Already set up',
        message: 'This account has already been set up.',
        alreadyExists: true
      }, { status: 409 })
    }

    // Get organization details
    const orgSnap = await adminDb().collection('organizations').doc(studentData.orgId).get()
    const orgData = orgSnap.exists ? orgSnap.data() : null

    return NextResponse.json({
      valid: true,
      student: {
        id: studentDoc.id,
        name: studentData.name,
        email: studentData.email,
        creditsAllocated: studentData.creditsAllocated || 0,
        organization: {
          id: studentData.orgId,
          name: orgData?.name || 'Your Organization',
          branding: orgData?.settings?.customBranding || {}
        }
      }
    })

  } catch (e: any) {
    console.error('[api/student/setup] GET error', e)
    return NextResponse.json({ 
      error: e?.message || 'Internal error' 
    }, { status: 500 })
  }
}
