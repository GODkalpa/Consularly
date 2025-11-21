import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
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
  { params }: { params: { id: string } }
) {
  try {
    const orgId = params.id;
    const body = await req.json();
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
    await adminDb().collection('organizations').doc(orgId).update(updateData);

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
    const updatedOrg = { id: updatedOrgDoc.id, ...updatedOrgDoc.data() };

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('[Subdomain Management API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update subdomain' },
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
  { params }: { params: { id: string } }
) {
  try {
    const orgId = params.id;

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
