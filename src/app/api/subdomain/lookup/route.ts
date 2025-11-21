import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { OrganizationWithId } from '@/types/firestore';

/**
 * GET /api/subdomain/lookup?subdomain=acmecorp
 * 
 * Lookup organization by subdomain
 * Used by middleware for subdomain resolution
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain parameter is required' },
        { status: 400 }
      );
    }

    // Query Firestore for organization with this subdomain
    const orgsSnapshot = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .where('subdomainEnabled', '==', true)
      .limit(1)
      .get();

    if (orgsSnapshot.empty) {
      return NextResponse.json(
        { organization: null },
        { status: 404 }
      );
    }

    const orgDoc = orgsSnapshot.docs[0];
    const org: OrganizationWithId = {
      id: orgDoc.id,
      ...orgDoc.data(),
    } as OrganizationWithId;

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        subdomainEnabled: org.subdomainEnabled,
        settings: org.settings,
      },
    });
  } catch (error) {
    console.error('[Subdomain Lookup API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup organization' },
      { status: 500 }
    );
  }
}
