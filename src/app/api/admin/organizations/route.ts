import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { sendOrgWelcomeEmail, sendAccountCreationEmail } from '@/lib/email/send-helpers'

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

    // Create or assign user account for the organization email
    let userCreated = false
    let resetLink = ''
    if (body.email) {
      const orgEmail = String(body.email).trim()
      const orgContactPerson = body.contactPerson ? String(body.contactPerson).trim() : 'Organization Admin'
      
      try {
        // Check if user with this email already exists
        const usersRef = adminDb().collection('users')
        const existingUserSnap = await usersRef.where('email', '==', orgEmail).limit(1).get()
        
        if (!existingUserSnap.empty) {
          // User exists - assign them to this organization
          const existingUserDoc = existingUserSnap.docs[0]
          const existingData = existingUserDoc.data()
          
          // Only update role if they're not already a system admin
          const updates: any = {
            orgId: ref.id,
            updatedAt: FieldValue.serverTimestamp(),
          }
          
          // Don't demote system admins to regular users
          if (existingData?.role !== 'admin') {
            updates.role = 'user'
          }
          
          await usersRef.doc(existingUserDoc.id).update(updates)
          console.log('[api/admin/organizations] Assigned existing user to org:', orgEmail)
        } else {
          // User doesn't exist - create new account
          const authUser = await adminAuth().createUser({
            email: orgEmail,
            displayName: orgContactPerson,
            emailVerified: false,
          })
          
          // Create user document in Firestore
          await usersRef.doc(authUser.uid).set({
            email: orgEmail,
            displayName: orgContactPerson,
            role: 'user', // Organization admin is a regular user, not system admin
            orgId: ref.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
          
          // Generate password reset link
          resetLink = await adminAuth().generatePasswordResetLink(orgEmail)
          userCreated = true
          console.log('[api/admin/organizations] Created new user for org:', orgEmail)
          
          // Send account creation email with password reset link
          try {
            await sendAccountCreationEmail({
              to: orgEmail,
              displayName: orgContactPerson,
              resetLink,
              role: 'Organization Admin',
              orgName: name,
              createdBy: callerData?.displayName || 'System Administrator',
            })
            console.log('[api/admin/organizations] Account creation email sent to:', orgEmail)
          } catch (e: any) {
            console.warn('[api/admin/organizations] Account creation email failed:', e.message)
          }
        }
      } catch (e: any) {
        console.warn('[api/admin/organizations] Failed to create/assign user:', e.message)
        // Don't fail the org creation if user creation fails
      }
    }

    // Send organization welcome email to the org email (not the creating admin)
    let emailError: string | null = null
    const orgEmail = body.email ? String(body.email).trim() : null
    const orgContactPerson = body.contactPerson ? String(body.contactPerson).trim() : 'Administrator'
    
    if (orgEmail) {
      try {
        await sendOrgWelcomeEmail({
          to: orgEmail,
          adminName: orgContactPerson,
          orgName: name,
          orgId: ref.id,
          plan,
          quotaLimit,
        })
        console.log('[api/admin/organizations] Welcome email sent to:', orgEmail)
      } catch (e: any) {
        emailError = e?.message || 'Email service error'
        console.error('[api/admin/organizations] Org welcome email failed:', e)
      }
    }

    return NextResponse.json({ 
      id: ref.id,
      emailSent: !emailError && !!orgEmail,
      emailError: emailError || undefined,
      userCreated,
      resetLink: userCreated ? resetLink : undefined,
    }, { status: 201 })
  } catch (e: any) {
    console.error('[api/admin/organizations] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
