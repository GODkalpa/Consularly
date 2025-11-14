import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import type { AllocateCreditsRequest } from '@/types/firestore'

// PATCH /api/org/students/[id]/credits
// Body: AllocateCreditsRequest
// Allocates or deallocates credits for a specific student
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    const { id: studentId } = await params

    if (!studentId) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 })
    }

    // Load caller and student to enforce same-org access
    const [callerSnap, studentSnap] = await Promise.all([
      adminDb().collection('users').doc(callerUid).get(),
      adminDb().collection('orgStudents').doc(studentId).get(),
    ])

    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const caller = callerSnap.data() as { orgId?: string }
    const student = studentSnap.data() as any

    if (!caller?.orgId || caller.orgId !== student?.orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    const body = await req.json() as AllocateCreditsRequest
    const { amount, reason } = body

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'amount must be a non-zero number' }, { status: 400 })
    }

    // Get current student and org data
    const currentCreditsAllocated = student.creditsAllocated || 0
    const currentCreditsUsed = student.creditsUsed || 0
    const currentCreditsRemaining = currentCreditsAllocated - currentCreditsUsed

    if (amount > 0) {
      // ALLOCATING credits - check org availability
      const orgSnap = await adminDb().collection('organizations').doc(caller.orgId).get()
      if (!orgSnap.exists) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      const org = orgSnap.data() as any
      const quotaLimit = org?.quotaLimit || 0
      const quotaUsed = org?.quotaUsed || 0
      const studentCreditsAllocated = org?.studentCreditsAllocated || 0
      const availableCredits = quotaLimit - quotaUsed - studentCreditsAllocated

      if (amount > availableCredits) {
        return NextResponse.json({
          error: 'Insufficient credits',
          message: `Only ${availableCredits} credits available (${amount} requested)`,
          availableCredits
        }, { status: 400 })
      }
    } else if (amount < 0) {
      // DEALLOCATING credits - check student availability
      const deallocateAmount = Math.abs(amount)
      if (deallocateAmount > currentCreditsRemaining) {
        return NextResponse.json({
          error: 'Cannot deallocate more than unused credits',
          message: `Student has ${currentCreditsRemaining} unused credits (cannot deallocate ${deallocateAmount})`,
          availableToDeallcate: currentCreditsRemaining
        }, { status: 400 })
      }
    }

    // Atomic transaction: update student + org + log
    const result = await adminDb().runTransaction(async (transaction) => {
      const studentRef = adminDb().collection('orgStudents').doc(studentId)
      const orgRef = adminDb().collection('organizations').doc(caller.orgId!)

      // Update student credits
      const newCreditsAllocated = currentCreditsAllocated + amount
      const newCreditsRemaining = newCreditsAllocated - currentCreditsUsed

      transaction.update(studentRef, {
        creditsAllocated: newCreditsAllocated,
        creditsRemaining: newCreditsRemaining,
        updatedAt: FieldValue.serverTimestamp()
      })

      // Update organization credits
      transaction.update(orgRef, {
        studentCreditsAllocated: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp()
      })

      // Log credit transaction
      const creditLogRef = adminDb().collection('studentCreditHistory').doc()
      transaction.set(creditLogRef, {
        orgId: caller.orgId!,
        studentId,
        type: amount > 0 ? 'allocated' : 'deallocated',
        amount: Math.abs(amount),
        reason: reason || (amount > 0 ? 'Credit allocation' : 'Credit deallocation'),
        performedBy: callerUid,
        timestamp: FieldValue.serverTimestamp(),
        balanceBefore: currentCreditsAllocated,
        balanceAfter: newCreditsAllocated
      })

      return {
        oldCredits: currentCreditsAllocated,
        newCredits: newCreditsAllocated,
        change: amount
      }
    })

    return NextResponse.json({
      success: true,
      student: {
        id: studentId,
        creditsAllocated: result.newCredits,
        creditsUsed: currentCreditsUsed,
        creditsRemaining: result.newCredits - currentCreditsUsed
      },
      change: {
        amount: amount,
        reason: reason || (amount > 0 ? 'Credit allocation' : 'Credit deallocation'),
        performedBy: callerUid,
        timestamp: new Date().toISOString()
      }
    })

  } catch (e: any) {
    console.error('[api/org/students/[id]/credits] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

// GET /api/org/students/[id]/credits
// Returns credit summary and transaction history for a student
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    const { id: studentId } = await params

    if (!studentId) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 })
    }

    // Load caller and student to enforce same-org access
    const [callerSnap, studentSnap] = await Promise.all([
      adminDb().collection('users').doc(callerUid).get(),
      adminDb().collection('orgStudents').doc(studentId).get(),
    ])

    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const caller = callerSnap.data() as { orgId?: string }
    const student = studentSnap.data() as any

    if (!caller?.orgId || caller.orgId !== student?.orgId) {
      return NextResponse.json({ error: 'Forbidden: cross-organization access' }, { status: 403 })
    }

    // Get credit transaction history
    const historySnap = await adminDb()
      .collection('studentCreditHistory')
      .where('studentId', '==', studentId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get()

    const history = historySnap.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        performedBy: data.performedBy,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        interviewId: data.interviewId || null
      }
    })

    return NextResponse.json({
      student: {
        id: studentId,
        name: student.name,
        email: student.email
      },
      credits: {
        allocated: student.creditsAllocated || 0,
        used: student.creditsUsed || 0,
        remaining: (student.creditsAllocated || 0) - (student.creditsUsed || 0)
      },
      history
    })

  } catch (e: any) {
    console.error('[api/org/students/[id]/credits] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
