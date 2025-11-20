import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getExpenses } from '@/services/accounting/expense.service'
import { getIncomes } from '@/services/accounting/income.service'
import { getSubscriptions } from '@/services/accounting/subscription.service'

function generateCSV(headers: string[], rows: any[][]): string {
  const csvRows = [headers.join(',')]
  rows.forEach(row => {
    csvRows.push(row.map(cell => `"${cell}"`).join(','))
  })
  return csvRows.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const callerSnap = await adminDb().collection('users').doc(decoded.uid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'User profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { role?: string }
    if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'expenses'
    const startDate = searchParams.get('start') ? new Date(searchParams.get('start')!) : undefined
    const endDate = searchParams.get('end') ? new Date(searchParams.get('end')!) : undefined

    let csv = ''
    let filename = ''

    switch (type) {
      case 'expenses': {
        const expenses = await getExpenses({ startDate, endDate, limit: 10000 })
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Status', 'Notes']
        const rows = expenses.map(e => [
          e.date.toISOString().split('T')[0],
          e.description,
          e.category,
          e.amount.toString(),
          e.paymentMethod,
          e.status,
          e.notes || ''
        ])
        csv = generateCSV(headers, rows)
        filename = `expenses-${new Date().toISOString().split('T')[0]}.csv`
        break
      }
      case 'incomes': {
        const incomes = await getIncomes({ startDate, endDate, limit: 10000 })
        const headers = ['Date', 'Description', 'Source', 'Amount', 'Payment Method', 'Status', 'Notes']
        const rows = incomes.map(i => [
          i.date.toISOString().split('T')[0],
          i.description,
          i.source,
          i.amount.toString(),
          i.paymentMethod,
          i.status,
          i.notes || ''
        ])
        csv = generateCSV(headers, rows)
        filename = `incomes-${new Date().toISOString().split('T')[0]}.csv`
        break
      }
      case 'subscriptions': {
        const subscriptions = await getSubscriptions({ limit: 10000 })
        const headers = ['Customer Name', 'Plan Name', 'Amount', 'Billing Cycle', 'Status', 'Renewal Date']
        const rows = subscriptions.map(s => [
          s.customerName,
          s.planName,
          s.amount.toString(),
          s.billingCycle,
          s.status,
          s.renewalDate.toISOString().split('T')[0]
        ])
        csv = generateCSV(headers, rows)
        filename = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (e: any) {
    console.error('[api/admin/accounting/export] GET Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
