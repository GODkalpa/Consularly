import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getTotalIncome } from '@/services/accounting/income.service'
import { getTotalExpenses } from '@/services/accounting/expense.service'
import { calculateMRR, getSubscriptions } from '@/services/accounting/subscription.service'
import { getPendingInvoicesCount } from '@/services/accounting/invoice.service'

export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerSnap = await adminDb().collection('users').doc(decoded.uid).get()
    
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string }
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') ? new Date(searchParams.get('start')!) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = searchParams.get('end') ? new Date(searchParams.get('end')!) : new Date()

    // Fetch all metrics in parallel
    const [totalIncome, totalExpenses, mrrValue, activeSubscriptions, invoicesPending] = await Promise.all([
      getTotalIncome(startDate, endDate, ['paid']),
      getTotalExpenses(startDate, endDate, ['approved', 'paid']),
      calculateMRR(),
      getSubscriptions({ status: 'active' }).then(subs => subs.length),
      getPendingInvoicesCount()
    ])

    const netProfit = totalIncome - totalExpenses

    const summary = {
      totalIncome,
      totalExpenses,
      netProfit,
      activeSubscriptions,
      mrrValue,
      invoicesPending
    }

    const response = NextResponse.json(summary)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response
  } catch (e: any) {
    console.error('[api/admin/accounting/financial-summary] GET Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
