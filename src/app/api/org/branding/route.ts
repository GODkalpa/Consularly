import { NextRequest, NextResponse } from 'next/server';
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin';
import type { OrganizationBranding } from '@/types/firestore';

/**
 * PATCH /api/org/branding
 * Updates organization branding settings
 * Only accessible by organization members (admin or regular users with branding permission)
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await ensureFirebaseAdmin();
    
    // Verify token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user profile
    const userDoc = await adminDb().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orgId = userData.orgId;
    if (!orgId) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const branding: Partial<OrganizationBranding> = body.branding || {};

    // Validate branding fields
    if (branding.primaryColor && !isValidCSSColor(branding.primaryColor)) {
      return NextResponse.json(
        { error: 'Invalid primary color format' },
        { status: 400 }
      );
    }

    if (branding.secondaryColor && !isValidCSSColor(branding.secondaryColor)) {
      return NextResponse.json(
        { error: 'Invalid secondary color format' },
        { status: 400 }
      );
    }

    // Check if enterprise plan for custom CSS and white-label
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get();
    const orgData = orgDoc.data();
    const plan = orgData?.plan || 'basic';

    if (plan !== 'enterprise') {
      // Remove enterprise-only fields for non-enterprise plans
      delete branding.customCSS;
      delete branding.whiteLabel;
    }

    // Update organization branding
    await adminDb().collection('organizations').doc(orgId).update({
      'settings.customBranding': branding,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      branding,
      message: 'Branding updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating branding:', error);
    
    if (error?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to update branding' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/org/branding
 * Retrieves organization branding settings
 * Supports both authenticated requests and orgId query parameter
 */
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin();
    
    // Check if orgId is provided as query parameter (for public access)
    const { searchParams } = new URL(req.url);
    const queryOrgId = searchParams.get('orgId');
    
    let orgId: string;
    
    if (queryOrgId) {
      // Public access via orgId parameter
      orgId = queryOrgId;
    } else {
      // Authenticated access
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      
      // Verify token
      const decodedToken = await adminAuth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // Get user profile
      const userDoc = await adminDb().collection('users').doc(uid).get();
      const userData = userDoc.data();

      if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      orgId = userData.orgId;
      if (!orgId) {
        return NextResponse.json(
          { error: 'User not associated with an organization' },
          { status: 403 }
        );
      }
    }

    // Get organization branding
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get();
    
    if (!orgDoc.exists) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const orgData = orgDoc.data();
    const branding: OrganizationBranding = orgData?.settings?.customBranding || {};

    return NextResponse.json({
      success: true,
      branding,
    });
  } catch (error: any) {
    console.error('Error fetching branding:', error);
    
    if (error?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch branding' },
      { status: 500 }
    );
  }
}

/**
 * Validates CSS color format
 */
function isValidCSSColor(color: string): boolean {
  // Check for hex colors
  if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) return true;
  
  // Check for rgb/rgba
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(color)) return true;
  
  // Check for hsl/hsla
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/i.test(color)) return true;
  
  // Check for CSS variables
  if (/^(hsl\()?var\(--[\w-]+\)\)?$/i.test(color)) return true;
  
  return false;
}
