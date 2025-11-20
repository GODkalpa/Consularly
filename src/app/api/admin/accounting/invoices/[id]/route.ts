import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getInvoiceById, updateInvoice, deleteInvoice } from '@/services/accounting/invoice.service'
import { createAuditLog } from '@/services/accounting/audit.service'
import { invoiceSchema } from '@/lib/validation/accounting'
import { z } from 'zod'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const existing = await getInvoiceById(params.id)
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const body = await request.json()
    if (body.issueDate) body.issueDate = new Date(body.issueDate)
    if (body.dueDate) body.dueDate = new Date(body.dueDate)
    if (body.paymentReceivedDate) body.paymentReceivedDate = new Date(body.paymentReceivedDate)

    const partialSchema = invoiceSchema.partial()
    const validatedData = partialSchema.parse(body)

    await updateInvoice(params.id, validatedData)
    await createAuditLog('update', 'invoice', params.id, decoded.uid, validatedData)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/invoices/[id]] PATCH Error', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const existing = await getInvoiceById(params.id)
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    await deleteInvoice(params.id)
    await createAuditLog('delete', 'invoice', params.id, decoded.uid)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api/admin/accounting/invoices/[id]] DELETE Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
