import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateSubdomainFormat } from '@/lib/subdomain-utils';

/**
 * POST /api/admin/subdomain/validate
 * 
 * Validate subdomain format and check availability
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subdomain, excludeOrgId } = body;

    if (!subdomain) {
      return NextResponse.json(
        { valid: false, available: false, error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    // Validate format
    const validation = validateSubdomainFormat(subdomain);
    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        available: false,
        error: validation.error,
      });
    }

    // Check availability
    const existingOrg = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .limit(1)
      .get();

    // If found, check if it's the excluded org (for updates)
    const isAvailable = existingOrg.empty || 
      (excludeOrgId && existingOrg.docs[0].id === excludeOrgId);

    if (!isAvailable) {
      return NextResponse.json({
        valid: true,
        available: false,
        error: 'This subdomain is already in use',
      });
    }

    return NextResponse.json({
      valid: true,
      available: true,
    });
  } catch (error) {
    console.error('[Subdomain Validation API] Error:', error);
    return NextResponse.json(
      { valid: false, available: false, error: 'Failed to validate subdomain' },
      { status: 500 }
    );
  }
}
