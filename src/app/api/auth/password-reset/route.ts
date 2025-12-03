import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendPasswordResetEmail } from '@/lib/email/send-helpers'

// POST /api/auth/password-reset
// Sends a custom branded password reset email
// Body: { email: string }
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    try {
      // Check if user exists in Firestore
      const usersRef = adminDb().collection('users')
      const userSnap = await usersRef.where('email', '==', email).limit(1).get()

      let displayName: string | undefined
      let orgName: string | undefined
      let orgBranding: any

      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data()
        displayName = userData?.displayName
        const orgId = userData?.orgId

        // If user belongs to an org, get org branding
        if (orgId) {
          try {
            const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
            if (orgDoc.exists) {
              const orgData = orgDoc.data()
              orgName = orgData?.name
              orgBranding = orgData?.settings?.customBranding
            }
          } catch (e) {
            console.warn('[password-reset] Failed to fetch org branding:', e)
          }
        }
      }

      // Generate password reset link using Firebase Admin
      // This link will be valid for 1 hour
      // Use org subdomain if available and enabled
      let continueUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com'}`
      
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data()
        const orgId = userData?.orgId
        if (orgId) {
          try {
            const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
            if (orgDoc.exists) {
              const orgData = orgDoc.data()
              const subdomain = orgData?.subdomain
              const subdomainEnabled = orgData?.subdomainEnabled
              if (subdomain && subdomainEnabled) {
                const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com'
                continueUrl = `https://${subdomain}.${baseDomain}`
              }
            }
          } catch (e) {
            console.warn('[password-reset] Failed to fetch org subdomain:', e)
          }
        }
      }
      
      const resetLink = await adminAuth().generatePasswordResetLink(email, {
        url: continueUrl,
      })

      // Send custom branded email via Brevo
      await sendPasswordResetEmail({
        to: email,
        displayName,
        resetLink,
        orgName,
        orgBranding,
      })

      console.log('[password-reset] Custom password reset email sent to:', email)

      // Always return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.',
      })
    } catch (error: any) {
      console.error('[password-reset] Error:', error)

      // Don't reveal if email exists - return generic success message
      // This prevents account enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.',
      })
    }
  } catch (e: any) {
    console.error('[password-reset] POST error', e)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
