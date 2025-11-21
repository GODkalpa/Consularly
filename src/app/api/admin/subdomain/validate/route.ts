import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateSubdomainFormat } from '@/lib/subdomain-utils';

/**
 * POST /api/admin/subdomain/validate
 * 
 * Validate subdomain availability and format
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subdomain, excludeOrgId } = body;

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    // Validate format
    const formatValidation = validateSubdomainFormat(subdomain);
    if (!formatValidation.valid) {
      return NextResponse.json({
        valid: false,
        available: false,
        error: formatValidation.error,
      });
    }

    // Check availability (uniqueness)
    const existingOrg = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .limit(1)
      .get();

    let available = existingOrg.empty;

    // If excludeOrgId is provided, allow the subdomain if it belongs to that org
    if (!available && excludeOrgId && !existingOrg.empty) {
      available = existingOrg.docs[0].id === excludeOrgId;
    }

    if (!available) {
      return NextResponse.json({
        valid: true,
        available: false,
        error: 'This subdomain is already in use',
      });
    }

    return NextResponse.json({
      valid: true,
      available: true,
      error: null,
    });
  } catch (error) {
    console.error('[Subdomain Validation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate subdomain' },
      { status: 500 }
    );
  }
}
