import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import { sendOrgWelcomeEmail } from '@/lib/email/send-helpers'

// POST /api/auth/send-welcome
// Sends welcome email to user after they set their password
// Requires authentication
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    // Get auth token
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const decoded = await adminAuth().verifyIdToken(token)
    const uid = decoded.uid

    // Get user document
    const userDoc = await adminDb().collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const email = userData?.email
    const displayName = userData?.displayName
    const orgId = userData?.orgId
    const welcomeEmailSent = userData?.welcomeEmailSent

    // Check if welcome email was already sent
    if (welcomeEmailSent) {
      console.log('[send-welcome] Welcome email already sent to:', email)
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome email already sent',
        alreadySent: true 
      })
    }

    // If user belongs to an organization, send org welcome email
    if (orgId) {
      try {
        const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
        
        if (!orgDoc.exists) {
          console.warn('[send-welcome] Organization not found:', orgId)
          // Don't fail - just mark as complete without sending org email
          // The org might have been deleted or there's a data issue
          await adminDb().collection('users').doc(uid).update({
            welcomeEmailSent: true,
            passwordSet: true,
            updatedAt: FieldValue.serverTimestamp(),
          })
          return NextResponse.json({ 
            success: true, 
            message: 'Organization not found, skipping welcome email',
            orgNotFound: true 
          })
        }

        const orgData = orgDoc.data()
        const orgName = orgData?.name
        const plan = orgData?.plan || 'basic'
        const quotaLimit = orgData?.quotaLimit || 0

        // Send organization welcome email
        await sendOrgWelcomeEmail({
          to: email,
          adminName: displayName || 'there',
          orgName: orgName,
          orgId: orgId,
          plan: plan,
          quotaLimit: quotaLimit,
        })

        console.log('[send-welcome] Organization welcome email sent to:', email)

        // Mark welcome email as sent
        await adminDb().collection('users').doc(uid).update({
          welcomeEmailSent: true,
          passwordSet: true, // Also mark password as set
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Welcome email sent successfully',
        })
      } catch (e: any) {
        console.error('[send-welcome] Error sending org welcome email:', e)
        return NextResponse.json({ 
          error: 'Failed to send welcome email',
          details: e.message 
        }, { status: 500 })
      }
    } else {
      // User is not part of an organization (system admin or standalone user)
      // Mark as complete without sending org welcome email
      await adminDb().collection('users').doc(uid).update({
        welcomeEmailSent: true,
        passwordSet: true,
        updatedAt: FieldValue.serverTimestamp(),
      })

      console.log('[send-welcome] Non-org user, no welcome email sent:', email)
      return NextResponse.json({ 
        success: true, 
        message: 'User updated, no welcome email needed',
        noOrgEmail: true
      })
    }
  } catch (e: any) {
    console.error('[send-welcome] POST error', e)
    return NextResponse.json(
      { error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
