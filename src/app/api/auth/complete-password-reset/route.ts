import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/auth/complete-password-reset
// Completes the password reset using a custom token
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        email: string
        uid: string
        orgId?: string
        type: string
      }

      if (decoded.type !== 'password-reset') {
        return NextResponse.json({ error: 'Invalid token type' }, { status: 400 })
      }

      // Update password in Firebase Auth
      await adminAuth().updateUser(decoded.uid, {
        password: password,
        emailVerified: true, // Also verify email since they clicked the link
      })

      // Update user document in Firestore
      await adminDb().collection('users').doc(decoded.uid).update({
        passwordSet: true,
        updatedAt: FieldValue.serverTimestamp(),
      })

      console.log('[complete-password-reset] Password updated for:', decoded.email)

      return NextResponse.json({
        success: true,
        message: 'Password has been set successfully',
      })
    } catch (e: any) {
      if (e.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Token has expired. Please request a new password reset.' }, { status: 400 })
      }
      console.error('[complete-password-reset] Token error:', e)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[complete-password-reset] Error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
