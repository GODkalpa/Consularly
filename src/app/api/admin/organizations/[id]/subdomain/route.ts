import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { validateSubdomainFormat, isReservedSubdomain } from '@/lib/subdomain-utils';
import { subdomainCache } from '@/lib/subdomain-cache';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * PATCH /api/admin/organizations/[id]/subdomain
 * 
 * Assign or update subdomain for an organization
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Subdomain API] Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (authError) {
      console.error('[Subdomain API] Token verification failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      console.error('[Subdomain API] User is not an admin:', decodedToken.uid);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    console.log('[Subdomain API] Processing request:', { orgId, subdomain: body.subdomain, enabled: body.enabled, userId: decodedToken.uid });
    const { subdomain, enabled } = body;

    // Validate subdomain format if provided
    if (subdomain) {
      const validation = validateSubdomainFormat(subdomain);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Check if subdomain is already taken by another organization
      const existingOrg = await adminDb()
        .collection('organizations')
        .where('subdomain', '==', subdomain)
        .limit(1)
        .get();

      if (!existingOrg.empty && existingOrg.docs[0].id !== orgId) {
        return NextResponse.json(
          { error: 'This subdomain is already in use by another organization' },
          { status: 409 }
        );
      }
    }

    // Get current organization
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get();
    
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const currentOrg = orgDoc.data();
    const oldSubdomain = currentOrg?.subdomain;

    // Prepare update data
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (subdomain !== undefined) {
      updateData.subdomain = subdomain;
      updateData.subdomainUpdatedAt = FieldValue.serverTimestamp();
      
      // Set createdAt if this is the first time subdomain is being set
      if (!currentOrg?.subdomainCreatedAt) {
        updateData.subdomainCreatedAt = FieldValue.serverTimestamp();
      }
    }

    if (enabled !== undefined) {
      updateData.subdomainEnabled = enabled;
    }

    // Update organization
    console.log('[Subdomain API] Updating organization with data:', updateData);
    await adminDb().collection('organizations').doc(orgId).update(updateData);
    console.log('[Subdomain API] Organization updated successfully');

    // Invalidate cache for old and new subdomains
    if (oldSubdomain) {
      subdomainCache.invalidate(oldSubdomain);
    }
    if (subdomain) {
      subdomainCache.invalidate(subdomain);
    }
    subdomainCache.invalidateByOrgId(orgId);

    // Fetch updated organization
    const updatedOrgDoc = await adminDb().collection('organizations').doc(orgId).get();
    const updatedOrgData = updatedOrgDoc.data();
    const updatedOrg = { id: updatedOrgDoc.id, ...updatedOrgData };

    console.log('[Subdomain API] Returning success response with org:', { 
      id: updatedOrg.id, 
      subdomain: updatedOrgData?.subdomain, 
      subdomainEnabled: updatedOrgData?.subdomainEnabled 
    });

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
    });
  } catch (error: any) {
    console.error('[Subdomain Management API] Error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: error?.message || 'Failed to update subdomain' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/organizations/[id]/subdomain
 * 
 * Get subdomain configuration for an organization
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    try {
      const decodedToken = await adminAuth().verifyIdToken(token);
      
      // Verify user is admin
      const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
    } catch (authError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const orgDoc = await adminDb().collection('organizations').doc(orgId).get();
    
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const org = orgDoc.data();

    return NextResponse.json({
      subdomain: org?.subdomain || null,
      subdomainEnabled: org?.subdomainEnabled || false,
      subdomainCreatedAt: org?.subdomainCreatedAt || null,
      subdomainUpdatedAt: org?.subdomainUpdatedAt || null,
    });
  } catch (error) {
    console.error('[Subdomain Management API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomain configuration' },
      { status: 500 }
    );
  }
}
