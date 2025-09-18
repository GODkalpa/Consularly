import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'

// POST /api/admin/organizations
// Creates a new organization document in Firestore. Admin-only (super_admin recommended).
// Body: {
//   name: string,
//   domain?: string,
//   plan: 'basic' | 'premium' | 'enterprise',
//   quotaLimit: number,
//   type?: 'visa_consultancy' | 'educational' | 'corporate',
//   status?: 'active' | 'suspended' | 'pending',
//   contactPerson?: string,
//   email?: string,
//   phone?: string,
//   settings?: {
//     allowSelfRegistration?: boolean,
//     defaultInterviewDuration?: number,
//     enableMetricsCollection?: boolean,
//     customBranding?: { logoUrl?: string; primaryColor?: string; companyName?: string }
//   }
// }
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Check caller is admin
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerRole = callerData?.role
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const name = String(body.name || '').trim()
    const plan = String(body.plan || '').trim() as 'basic' | 'premium' | 'enterprise'
    const quotaLimit = Number(body.quotaLimit)

    if (!name || !plan || !Number.isFinite(quotaLimit) || quotaLimit <= 0) {
      return NextResponse.json({ error: 'name, plan and positive quotaLimit are required' }, { status: 400 })
    }

    const organizationDoc: Record<string, any> = {
      name,
      domain: body.domain ? String(body.domain) : '',
      plan,
      quotaLimit,
      quotaUsed: 0,
      adminUsers: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      settings: {
        allowSelfRegistration: Boolean(body?.settings?.allowSelfRegistration ?? false),
        defaultInterviewDuration: Number(body?.settings?.defaultInterviewDuration ?? 30),
        enableMetricsCollection: Boolean(body?.settings?.enableMetricsCollection ?? true),
        customBranding: {
          logoUrl: body?.settings?.customBranding?.logoUrl || '',
          primaryColor: body?.settings?.customBranding?.primaryColor || '#1d4ed8',
          companyName: body?.settings?.customBranding?.companyName || name,
        },
      },
    }

    // Optional UI-specific fields (not strictly in typed Organization interface)
    if (body.type) organizationDoc.type = String(body.type)
    if (body.status) organizationDoc.status = String(body.status)
    if (body.contactPerson) organizationDoc.contactPerson = String(body.contactPerson)
    if (body.email) organizationDoc.email = String(body.email)
    if (body.phone) organizationDoc.phone = String(body.phone)

    const ref = await adminDb().collection('organizations').add(organizationDoc)

    // If the caller is a regular admin without an org assignment yet,
    // automatically assign them to this newly created organization so
    // they can read/manage it per Firestore rules.
    if (callerRole === 'admin' && !callerData?.orgId) {
      try {
        await Promise.all([
          adminDb().collection('users').doc(callerUid).set({ orgId: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
          adminDb().collection('organizations').doc(ref.id).set({ adminUsers: [callerUid] }, { merge: true }),
        ])
      } catch (e) {
        // non-fatal: assignment can be done later by a super admin
        console.warn('[api/admin/organizations] Failed to auto-assign admin to org', e)
      }
    }

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/organizations] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
