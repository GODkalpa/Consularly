import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { markInvoiceAsPaid } from '@/services/accounting/invoice.service'
import { createAuditLog } from '@/services/accounting/audit.service'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()
    const { paymentDate } = body

    if (!paymentDate) {
      return NextResponse.json({ error: 'paymentDate is required' }, { status: 400 })
    }

    const incomeId = await markInvoiceAsPaid(params.id, new Date(paymentDate))
    await createAuditLog('update', 'invoice', params.id, decoded.uid, { markedAsPaid: true, paymentDate })

    return NextResponse.json({ incomeId, success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/invoices/[id]/mark-paid] POST Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
