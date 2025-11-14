import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, ensureFirebaseAdmin } from '@/lib/firebase-admin'

// POST /api/auth/session - Set session cookie
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      )
    }

    // Ensure Firebase Admin is initialized
    await ensureFirebaseAdmin()

    // Verify the ID token using Firebase Admin SDK
    try {
      await adminAuth().verifyIdToken(idToken)
    } catch (error) {
      console.error('[Session API] Token verification failed:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid ID token' },
        { status: 401 }
      )
    }

    // Create response with session cookie
    const response = NextResponse.json({ success: true })

    // Set session cookie with security flags
    const isProduction = process.env.NODE_ENV === 'production'
    const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds

    response.cookies.set('s', '1', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Session API] Error setting session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth/session - Remove session cookie
export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Remove session cookie by setting it to '0' with immediate expiration
    response.cookies.set('s', '0', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Session API] Error removing session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
