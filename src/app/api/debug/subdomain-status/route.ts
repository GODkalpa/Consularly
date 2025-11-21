import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { extractSubdomain } from '@/lib/subdomain-utils';

export async function GET(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    hostname,
    subdomain,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING: process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING,
      NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    },
    headers: {
      host: req.headers.get('host'),
      'x-forwarded-host': req.headers.get('x-forwarded-host'),
      'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
    },
  };
  
  if (subdomain) {
    try {
      // Query Firestore
      const orgsSnapshot = await adminDb()
        .collection('organizations')
        .where('subdomain', '==', subdomain)
        .limit(1)
        .get();
      
      if (!orgsSnapshot.empty) {
        const orgDoc = orgsSnapshot.docs[0];
        const orgData = orgDoc.data();
        
        diagnostics.organization = {
          found: true,
          id: orgDoc.id,
          name: orgData.name,
          subdomain: orgData.subdomain,
          subdomainEnabled: orgData.subdomainEnabled,
        };
      } else {
        diagnostics.organization = {
          found: false,
          message: 'No organization found with this subdomain',
        };
        
        // List all orgs with subdomains
        const allOrgs = await adminDb()
          .collection('organizations')
          .where('subdomain', '!=', null)
          .limit(10)
          .get();
        
        diagnostics.allOrganizations = allOrgs.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          subdomain: doc.data().subdomain,
          enabled: doc.data().subdomainEnabled,
        }));
      }
    } catch (error: any) {
      diagnostics.error = {
        message: error.message,
        stack: error.stack,
      };
    }
  } else {
    diagnostics.message = 'No subdomain detected - this is the main portal';
  }
  
  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
