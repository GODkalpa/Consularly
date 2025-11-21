import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { OrganizationWithId } from '@/types/firestore';

/**
 * GET /api/subdomain/context
 * 
 * Returns organization context based on subdomain headers set by middleware
 */
export async function GET(req: NextRequest) {
  try {
    // Get organization context from headers (set by middleware)
    const orgId = req.headers.get('x-org-id');
    const subdomain = req.headers.get('x-subdomain');
    const orgName = req.headers.get('x-org-name');

    // If no subdomain context, return main portal response
    if (!orgId || !subdomain) {
      return NextResponse.json({
        isMainPortal: true,
        subdomain: null,
        orgId: null,
        orgName: null,
        branding: null,
      });
    }

    // Fetch full organization details including branding
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json({
        isMainPortal: true,
        subdomain: null,
        orgId: null,
        orgName: null,
        branding: null,
      });
    }

    const org = { id: orgDoc.id, ...orgDoc.data() } as OrganizationWithId;

    return NextResponse.json({
      isMainPortal: false,
      subdomain,
      orgId: org.id,
      orgName: org.name,
      branding: org.settings?.customBranding || null,
    });
  } catch (error) {
    console.error('[Subdomain Context API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization context' },
      { status: 500 }
    );
  }
}
