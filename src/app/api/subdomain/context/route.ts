import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { OrganizationWithId } from '@/types/firestore';
import { extractSubdomain } from '@/lib/subdomain-utils';

/**
 * GET /api/subdomain/context
 * 
 * Returns organization context based on subdomain
 */
export async function GET(req: NextRequest) {
  try {
    // Extract subdomain from hostname
    const hostname = req.headers.get('host') || '';
    const subdomain = extractSubdomain(hostname);

    console.log('[Subdomain Context API] Hostname:', hostname, 'Subdomain:', subdomain);

    // If no subdomain, return main portal response
    if (!subdomain) {
      return NextResponse.json({
        isMainPortal: true,
        subdomain: null,
        organization: null,
      });
    }

    // Query Firestore for organization by subdomain
    const orgsSnapshot = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .where('subdomainEnabled', '==', true)
      .limit(1)
      .get();

    if (orgsSnapshot.empty) {
      console.log('[Subdomain Context API] No organization found for subdomain:', subdomain);
      return NextResponse.json({
        isMainPortal: false,
        subdomain,
        organization: null,
      });
    }

    const orgDoc = orgsSnapshot.docs[0];
    const orgData = orgDoc.data();

    console.log('[Subdomain Context API] Found organization:', orgData.name);

    return NextResponse.json({
      isMainPortal: false,
      subdomain,
      organization: {
        id: orgDoc.id,
        name: orgData.name,
        logo: orgData.logo || null,
        branding: orgData.settings?.customBranding || null,
      },
    });
  } catch (error) {
    console.error('[Subdomain Context API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization context' },
      { status: 500 }
    );
  }
}
