import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { sendAccountCreationEmail } from '@/lib/email/send-helpers'

// POST /api/admin/users
// Body: { email: string, displayName: string, role?: 'user'|'admin', orgId?: string }
export async function POST(req: NextRequest) {
  try {
    // Ensure Admin SDK is initialized before any calls
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
    const callerData = callerSnap.data() as { role?: string; orgId?: string; displayName?: string } | undefined
    const isAdmin = callerData?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const displayName = String(body.displayName || '').trim()
    let role = (body.role || 'user') as 'user' | 'admin'
    let orgId = body.orgId ? String(body.orgId) : ''

    if (!email || !displayName) {
      return NextResponse.json({ error: 'email and displayName are required' }, { status: 400 })
    }

    // Enforce role/org constraints
    const callerRole = callerData?.role
    const callerOrgId = callerData?.orgId || ''

    // Admin users should NOT have an orgId - they are system-wide
    if (role === 'admin') {
      orgId = '' // Clear orgId for admin users
    } else {
      // For non-admin users (organization members, students)
      // If no orgId provided, use caller's orgId
      if (!orgId) {
        orgId = callerOrgId
      }
    }

    // Create auth user (no password; use reset link)
    const userRecord = await adminAuth().createUser({
      email,
      displayName,
      emailVerified: false,
      disabled: false,
    })

    // Create Firestore profile
    await adminDb().collection('users').doc(userRecord.uid).set({
      role,
      orgId: orgId || '', // Will be empty string for admins
      email,
      displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isActive: true,
    })

    // Generate password reset link
    let resetLink: string | undefined
    try {
      resetLink = await adminAuth().generatePasswordResetLink(email)
    } catch {
      // ignore if not configured
    }

    // Send account creation email (non-blocking)
    if (resetLink) {
      // Get org name if orgId exists
      let orgName: string | undefined
      if (orgId) {
        try {
          const orgSnap = await adminDb().collection('organizations').doc(orgId).get()
          if (orgSnap.exists) {
            orgName = orgSnap.data()?.name
          }
        } catch (e) {
          console.warn('[api/admin/users] Could not fetch org name:', e)
        }
      }

      sendAccountCreationEmail({
        to: email,
        displayName,
        resetLink,
        role,
        orgName,
        createdBy: callerData?.displayName || 'Administrator',
      }).catch((e) => {
        console.warn('[api/admin/users] Account creation email failed:', e)
      })
    }

    return NextResponse.json({ uid: userRecord.uid, email, resetLink }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/users] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
