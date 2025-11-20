import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { getSubscriptions, createSubscription } from '@/services/accounting/subscription.service'
import { createAuditLog } from '@/services/accounting/audit.service'
import { subscriptionSchema } from '@/lib/validation/accounting'
import { z } from 'zod'

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
    const status = searchParams.get('status') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const subscriptions = await getSubscriptions({ status, customerId, limit, offset })
    const response = NextResponse.json(subscriptions)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
    return response
  } catch (e: any) {
    console.error('[api/admin/accounting/subscriptions] GET Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const subscriptionData = {
      ...body,
      startDate: new Date(body.startDate),
      renewalDate: new Date(body.renewalDate),
      cancelledDate: body.cancelledDate ? new Date(body.cancelledDate) : undefined
    }

    const validatedData = subscriptionSchema.parse(subscriptionData)
    const subscriptionId = await createSubscription(validatedData)
    await createAuditLog('create', 'subscription', subscriptionId, decoded.uid)

    return NextResponse.json({ id: subscriptionId, success: true }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/accounting/subscriptions] POST Error', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
