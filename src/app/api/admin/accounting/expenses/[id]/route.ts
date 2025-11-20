import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getExpenseById, updateExpense, deleteExpense } from '@/services/accounting/expense.service'
import { createAuditLog } from '@/services/accounting/audit.service'
import { expenseSchema } from '@/lib/validation/accounting'
import { z } from 'zod'

/**
 * PATCH /api/admin/accounting/expenses/[id]
 * Update an expense
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

    // Get existing expense
    const existingExpense = await getExpenseById(params.id)
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Convert date string to Date object if present
    if (body.date) {
      body.date = new Date(body.date)
    }

    // Partial validation
    const partialSchema = expenseSchema.partial()
    const validatedData = partialSchema.parse(body)

    // Update expense
    await updateExpense(params.id, validatedData)

    // Create audit log
    await createAuditLog('update', 'expense', params.id, decoded.uid, validatedData)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/expenses/[id]] PATCH Error', e)
    
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 })
    }
    
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/accounting/expenses/[id]
 * Delete an expense
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

    // Check if expense exists
    const existingExpense = await getExpenseById(params.id)
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Delete expense
    await deleteExpense(params.id)

    // Create audit log
    await createAuditLog('delete', 'expense', params.id, decoded.uid)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/expenses/[id]] DELETE Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
