import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb, ensureFirebaseAdmin } from '@/lib/firebase-admin'
import { extractSubdomain, isMainPortal } from '@/lib/subdomain-utils'

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
    let decodedToken
    try {
      decodedToken = await adminAuth().verifyIdToken(idToken)
    } catch (error) {
      console.error('[Session API] Token verification failed:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid ID token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Check if we're on a subdomain
    const hostname = req.headers.get('host') || ''
    const subdomain = extractSubdomain(hostname)
    const isMain = isMainPortal(hostname)
    const subdomainRoutingEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === 'true'

    console.log('[Session API] Login attempt:', { userId, subdomain, isMain, subdomainRoutingEnabled })

    // If on a subdomain, validate user belongs to that org
    if (subdomainRoutingEnabled && subdomain && !isMain) {
      console.log('[Session API] Validating subdomain access for:', subdomain)
      
      // Get organization by subdomain
      const orgsSnapshot = await adminDb()
        .collection('organizations')
        .where('subdomain', '==', subdomain)
        .where('subdomainEnabled', '==', true)
        .limit(1)
        .get()

      if (orgsSnapshot.empty) {
        console.error('[Session API] Organization not found for subdomain:', subdomain)
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        )
      }

      const orgDoc = orgsSnapshot.docs[0]
      const orgId = orgDoc.id
      const orgData = orgDoc.data()

      console.log('[Session API] Found org:', { orgId, orgName: orgData.name })

      // Check if user has access to this organization
      const userDoc = await adminDb().collection('users').doc(userId).get()
      
      let hasAccess = false
      let userRole = null
      let userOrgId = null

      if (userDoc.exists) {
        const userData = userDoc.data()
        userRole = userData?.role
        userOrgId = userData?.orgId

        // Platform admins can access any organization
        if (userData?.role === 'admin') {
          hasAccess = true
          console.log('[Session API] Platform admin granted access')
        }
        // Check if user's orgId matches
        else if (userData?.orgId === orgId) {
          hasAccess = true
          console.log('[Session API] User belongs to this org')
        }
      }

      // If not found in users, check if they're a student
      if (!hasAccess) {
        const studentSnapshot = await adminDb()
          .collection('orgStudents')
          .where('firebaseUid', '==', userId)
          .where('orgId', '==', orgId)
          .limit(1)
          .get()

        if (!studentSnapshot.empty) {
          hasAccess = true
          userRole = 'student'
          userOrgId = orgId
          console.log('[Session API] Student belongs to this org')
        }
      }

      if (!hasAccess) {
        console.error('[Session API] Access denied: User does not belong to this organization')
        return NextResponse.json(
          { 
            success: false, 
            error: 'You do not have access to this organization. Please use the correct subdomain for your organization.',
            code: 'ORG_ACCESS_DENIED'
          },
          { status: 403 }
        )
      }

      // Create response with session cookie and org info
      const response = NextResponse.json({ success: true, orgId, orgName: orgData.name })

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

      // Store user ID and role for middleware validation
      response.cookies.set('uid', userId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge,
        path: '/',
      })

      if (userRole) {
        response.cookies.set('role', userRole, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge,
          path: '/',
        })
      }

      if (userOrgId) {
        response.cookies.set('orgId', userOrgId, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge,
          path: '/',
        })
      }

      console.log('[Session API] Session created with org validation')
      return response
    }

    // Main portal - no subdomain validation needed
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

    // Store user ID for middleware
    response.cookies.set('uid', userId, {
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

    // Remove all session cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    }

    response.cookies.set('s', '0', cookieOptions)
    response.cookies.set('uid', '', cookieOptions)
    response.cookies.set('role', '', cookieOptions)
    response.cookies.set('orgId', '', cookieOptions)

    return response
  } catch (error) {
    console.error('[Session API] Error removing session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
