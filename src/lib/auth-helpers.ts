/**
 * Authentication Helper Functions
 * Provides reusable authentication utilities for API routes
 */

import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export interface AuthResult {
  authenticated: boolean
  user?: {
    uid: string
    email?: string
    role?: string
    orgId?: string
    displayName?: string
  }
  error?: string
}

/**
 * Verify authentication token from request headers
 * Returns user data if authenticated, or error information
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    if (!token) {
      return {
        authenticated: false,
        error: 'Missing authorization token',
      }
    }

    // Verify the Firebase ID token
    const decoded = await adminAuth().verifyIdToken(token)
    const uid = decoded.uid

    // Fetch user data from Firestore
    const userDoc = await adminDb().collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return {
        authenticated: false,
        error: 'User profile not found',
      }
    }

    const userData = userDoc.data()

    return {
      authenticated: true,
      user: {
        uid,
        email: userData?.email,
        role: userData?.role,
        orgId: userData?.orgId,
        displayName: userData?.displayName,
      },
    }
  } catch (error: any) {
    console.error('[Auth Helper] Verification failed:', error)
    return {
      authenticated: false,
      error: error.message || 'Authentication failed',
    }
  }
}

/**
 * Verify admin authentication
 * Shorthand for verifyAuth with admin role check
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated) {
    return authResult
  }

  if (authResult.user?.role !== 'admin') {
    return {
      authenticated: false,
      error: 'Insufficient permissions',
    }
  }

  return authResult
}
