import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminDb } from '@/lib/firebase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/auth/validate-reset-token
// Validates a custom password reset token
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 })
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        email: string
        orgId?: string
        type: string
        exp: number
      }

      if (decoded.type !== 'password-reset') {
        return NextResponse.json({ valid: false, error: 'Invalid token type' }, { status: 400 })
      }

      // Get user and org info
      let orgName: string | undefined
      let subdomain: string | undefined

      if (decoded.orgId) {
        const orgDoc = await adminDb().collection('organizations').doc(decoded.orgId).get()
        if (orgDoc.exists) {
          const orgData = orgDoc.data()
          orgName = orgData?.name
          subdomain = orgData?.subdomainEnabled ? orgData?.subdomain : undefined
        }
      }

      return NextResponse.json({
        valid: true,
        email: decoded.email,
        orgName,
        subdomain,
      })
    } catch (e: any) {
      if (e.name === 'TokenExpiredError') {
        return NextResponse.json({ valid: false, error: 'Token has expired' }, { status: 400 })
      }
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[validate-reset-token] Error:', e)
    return NextResponse.json({ valid: false, error: 'Internal error' }, { status: 500 })
  }
}
