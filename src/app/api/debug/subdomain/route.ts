import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const subdomain = req.nextUrl.searchParams.get('subdomain') || 'sumedha-education';
  
  try {
    console.log(`[Debug] Looking up subdomain: ${subdomain}`);
    
    // Query Firestore
    const orgsSnapshot = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .where('subdomainEnabled', '==', true)
      .limit(1)
      .get();
    
    if (orgsSnapshot.empty) {
      console.log(`[Debug] No organization found for subdomain: ${subdomain}`);
      
      // List all orgs with subdomains
      const allOrgs = await adminDb()
        .collection('organizations')
        .where('subdomain', '!=', null)
        .get();
      
      const orgs = allOrgs.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        subdomain: doc.data().subdomain,
        enabled: doc.data().subdomainEnabled,
      }));
      
      return NextResponse.json({
        found: false,
        subdomain,
        allOrganizations: orgs,
      });
    }
    
    const orgDoc = orgsSnapshot.docs[0];
    const orgData = orgDoc.data();
    
    return NextResponse.json({
      found: true,
      organization: {
        id: orgDoc.id,
        name: orgData.name,
        subdomain: orgData.subdomain,
        subdomainEnabled: orgData.subdomainEnabled,
      },
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
