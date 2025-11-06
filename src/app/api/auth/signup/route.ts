import { NextRequest, NextResponse } from 'next/server';
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/auth/signup
 * Creates a new user with Firebase Auth and Firestore profile
 * This bypasses client-side security rules using Admin SDK
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    // Validate input
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    await ensureFirebaseAdmin();
    const auth = adminAuth();
    const db = adminDb();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    // Create Firestore user document (bypasses security rules)
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName,
      role: 'user', // Default role for new users
      quotaLimit: 10, // Default quota for new signup users
      quotaUsed: 0, // Start with 0 interviews used
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    });

    // Generate password reset email (so user can confirm their password)
    try {
      const passwordResetLink = await auth.generatePasswordResetLink(email);
      // You can optionally send this via email service
    } catch (e) {
      console.warn('[signup] Password reset link generation failed:', e);
    }

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: 'Account created successfully'
    });

  } catch (error: any) {
    console.error('[signup] Error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
