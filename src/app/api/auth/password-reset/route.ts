import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendPasswordResetEmail } from '@/lib/email/send-helpers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/auth/password-reset
// Sends a custom branded password reset email with JWT token
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
      // Check if user exists in Firebase Auth first
      let firebaseUser
      try {
        firebaseUser = await adminAuth().getUserByEmail(email)
      } catch (e: any) {
        // User doesn't exist in Firebase Auth - silently return success (security)
        console.log('[password-reset] Email not found in Firebase Auth:', email)
        return NextResponse.json({
          success: true,
          message: 'If this email is registered, a password reset link has been sent.',
        })
      }

      // Check if user exists in Firestore for additional info
      const usersRef = adminDb().collection('users')
      const userSnap = await usersRef.where('email', '==', email).limit(1).get()

      let displayName: string | undefined
      let orgName: string | undefined
      let orgBranding: any
      let orgId: string | undefined
      let subdomain: string | undefined

      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data()
        displayName = userData?.displayName
        orgId = userData?.orgId

        // If user belongs to an org, get org branding
        if (orgId) {
          try {
            const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
            if (orgDoc.exists) {
              const orgData = orgDoc.data()
              orgName = orgData?.name
              orgBranding = orgData?.settings?.customBranding
              if (orgData?.subdomainEnabled && orgData?.subdomain) {
                subdomain = orgData.subdomain
              }
            }
          } catch (e) {
            console.warn('[password-reset] Failed to fetch org branding:', e)
          }
        }
      }

      // Generate custom JWT token for password reset (expires in 1 hour)
      const token = jwt.sign(
        {
          email: email,
          uid: firebaseUser.uid,
          orgId: orgId,
          type: 'password-reset',
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      // Build the reset URL - use subdomain if available
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com'
      let baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${baseDomain}`

      if (subdomain) {
        baseUrl = `https://${subdomain}.${baseDomain}`
      }

      const resetLink = `${baseUrl}/reset-password?token=${token}`

      // Send custom branded email
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
