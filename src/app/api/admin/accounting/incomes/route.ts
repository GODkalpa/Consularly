import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getIncomes, createIncome } from '@/services/accounting/income.service'
import { createAuditLog } from '@/services/accounting/audit.service'
import { incomeSchema } from '@/lib/validation/accounting'
import { z } from 'zod'

/**
 * GET /api/admin/accounting/incomes
 * Get incomes with optional filters
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
    const source = searchParams.get('source') || undefined
    const status = searchParams.get('status') || undefined
    const relatedSubscriptionId = searchParams.get('subscriptionId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch incomes
    const incomes = await getIncomes({
      startDate,
      endDate,
      source,
      status,
      relatedSubscriptionId,
      limit,
      offset
    })

    const response = NextResponse.json(incomes)
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/accounting/incomes] GET Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/accounting/incomes
 * Create a new income
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
    const incomeData = {
      ...body,
      date: new Date(body.date)
    }

    const validatedData = incomeSchema.parse(incomeData)

    // Create income
    const incomeId = await createIncome(validatedData)

    // Create audit log
    await createAuditLog('create', 'income', incomeId, decoded.uid)

    return NextResponse.json({ id: incomeId, success: true }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/accounting/incomes] POST Error', e)
    
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 })
    }
    
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
