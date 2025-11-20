import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getIncomes } from '@/services/accounting/income.service'
import { getExpenses } from '@/services/accounting/expense.service'

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
    const startDate = searchParams.get('start') ? new Date(searchParams.get('start')!) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = searchParams.get('end') ? new Date(searchParams.get('end')!) : new Date()

    // Fetch all transactions
    const [incomes, expenses] = await Promise.all([
      getIncomes({ startDate, endDate, limit: 1000 }),
      getExpenses({ startDate, endDate, limit: 1000 })
    ])

    // Group by month for income vs expense chart
    const monthlyData: Record<string, { income: number; expense: number }> = {}
    
    incomes.forEach(income => {
      if (income.status === 'paid') {
        const month = income.date.toISOString().substring(0, 7)
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 }
        monthlyData[month].income += income.amount
      }
    })

    expenses.forEach(expense => {
      if (expense.status === 'approved' || expense.status === 'paid') {
        const month = expense.date.toISOString().substring(0, 7)
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 }
        monthlyData[month].expense += expense.amount
      }
    })

    const monthlyIncomeVsExpense = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        netProfit: data.income - data.expense
      }))

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {}
    expenses.forEach(expense => {
      if (expense.status === 'approved' || expense.status === 'paid') {
        expenseByCategory[expense.category] = (expenseByCategory[expense.category] || 0) + expense.amount
      }
    })

    const expenseBreakdown = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount
    }))

    // Income breakdown by source
    const incomeBySource: Record<string, number> = {}
    incomes.forEach(income => {
      if (income.status === 'paid') {
        incomeBySource[income.source] = (incomeBySource[income.source] || 0) + income.amount
      }
    })

    const incomeBreakdown = Object.entries(incomeBySource).map(([source, amount]) => ({
      source,
      amount
    }))

    const chartsData = {
      monthlyIncomeVsExpense,
      expenseBreakdown,
      incomeBreakdown
    }

    const response = NextResponse.json(chartsData)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
    return response
  } catch (e: any) {
    console.error('[api/admin/accounting/charts-data] GET Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
