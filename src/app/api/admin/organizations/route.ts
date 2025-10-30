import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { sendOrgWelcomeEmail } from '@/lib/email/send-helpers'

// POST /api/admin/organizations
// Creates a new organization document in Firestore. Admin-only.
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
    const callerData = callerSnap.data() as { role?: string; orgId?: string; displayName?: string; email?: string } | undefined
    const callerRole = callerData?.role
    const isAdmin = callerRole === 'admin'
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

    // Add the creator to adminUsers array so they can see the organization
    // Note: Regular admins are NOT assigned orgId (they remain system-wide)
    // but we track which orgs they manage via adminUsers array
    const adminUsers = callerRole === 'admin' ? [callerUid] : []

    const organizationDoc: Record<string, any> = {
      name,
      domain: body.domain ? String(body.domain) : '',
      plan,
      quotaLimit,
      quotaUsed: 0,
      adminUsers, // Include creator for access control
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

    // Send organization welcome email (non-blocking)
    if (callerData?.email) {
      sendOrgWelcomeEmail({
        to: callerData.email,
        adminName: callerData.displayName || 'Administrator',
        orgName: name,
        orgId: ref.id,
        plan,
        quotaLimit,
      }).catch((e) => {
        console.warn('[api/admin/organizations] Org welcome email failed:', e)
      })
    }

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/organizations] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
