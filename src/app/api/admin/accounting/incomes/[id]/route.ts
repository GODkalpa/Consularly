import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getIncomeById, updateIncome, deleteIncome } from '@/services/accounting/income.service'
import { createAuditLog } from '@/services/accounting/audit.service'
import { incomeSchema } from '@/lib/validation/accounting'
import { z } from 'zod'

/**
 * PATCH /api/admin/accounting/incomes/[id]
 * Update an income
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    // Authentication
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    // Authorization
    const decoded = await adminAuth().verifyIdToken(token)
    const callerSnap = await adminDb().collection('users').doc(decoded.uid).get()
    
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string }
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    // Get existing income
    const existingIncome = await getIncomeById(params.id)
    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Convert date string to Date object if present
    if (body.date) {
      body.date = new Date(body.date)
    }

    // Partial validation
    const partialSchema = incomeSchema.partial()
    const validatedData = partialSchema.parse(body)

    // Update income
    await updateIncome(params.id, validatedData)

    // Create audit log
    await createAuditLog('update', 'income', params.id, decoded.uid, validatedData)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/incomes/[id]] PATCH Error', e)
    
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 })
    }
    
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/accounting/incomes/[id]
 * Delete an income
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    // Authentication
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    // Authorization
    const decoded = await adminAuth().verifyIdToken(token)
    const callerSnap = await adminDb().collection('users').doc(decoded.uid).get()
    
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string }
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    // Check if income exists
    const existingIncome = await getIncomeById(params.id)
    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    // Delete income
    await deleteIncome(params.id)

    // Create audit log
    await createAuditLog('delete', 'income', params.id, decoded.uid)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/incomes/[id]] DELETE Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
