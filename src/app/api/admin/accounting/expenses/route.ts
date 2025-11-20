import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getExpenses, createExpense } from '@/services/accounting/expense.service'
import { createAuditLog } from '@/services/accounting/audit.service'
import { expenseSchema } from '@/lib/validation/accounting'
import { z } from 'zod'

/**
 * GET /api/admin/accounting/expenses
 * Get expenses with optional filters
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') ? new Date(searchParams.get('start')!) : undefined
    const endDate = searchParams.get('end') ? new Date(searchParams.get('end')!) : undefined
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch expenses
    const expenses = await getExpenses({
      startDate,
      endDate,
      category,
      status,
      limit,
      offset
    })

    const response = NextResponse.json(expenses)
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/accounting/expenses] GET Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


/**
 * POST /api/admin/accounting/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    
    // Convert date string to Date object
    const expenseData = {
      ...body,
      date: new Date(body.date)
    }

    const validatedData = expenseSchema.parse(expenseData)

    // Create expense
    const expenseId = await createExpense(validatedData)

    // Create audit log
    await createAuditLog('create', 'expense', expenseId, decoded.uid)

    return NextResponse.json({ id: expenseId, success: true }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/accounting/expenses] POST Error', e)
    
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 })
    }
    
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
