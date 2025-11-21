/**
 * Check Subdomain Configuration
 * 
 * Verify subdomain setup in Firestore
 */

import { adminDb } from '../src/lib/firebase-admin';

async function checkSubdomain() {
  const subdomain = process.argv[2] || 'sumedha-education';
  
  console.log(`\n🔍 Checking subdomain: ${subdomain}\n`);
  
  try {
    // Query by subdomain
    const orgsSnapshot = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .get();
    
    if (orgsSnapshot.empty) {
      console.log('❌ No organization found with this subdomain');
      
      // List all organizations with subdomains
      console.log('\n📋 Organizations with subdomains:');
      const allOrgs = await adminDb()
        .collection('organizations')
        .where('subdomain', '!=', null)
        .get();
      
      allOrgs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.name}: ${data.subdomain} (enabled: ${data.subdomainEnabled})`);
      });
      
      return;
    }
    
    const orgDoc = orgsSnapshot.docs[0];
    const org = orgDoc.data();
    
    console.log('✅ Organization found:');
    console.log(`  ID: ${orgDoc.id}`);
    console.log(`  Name: ${org.name}`);
    console.log(`  Subdomain: ${org.subdomain}`);
    console.log(`  Subdomain Enabled: ${org.subdomainEnabled}`);
    console.log(`  Created At: ${org.subdomainCreatedAt?.toDate?.() || 'N/A'}`);
    console.log(`  Updated At: ${org.subdomainUpdatedAt?.toDate?.() || 'N/A'}`);
    
    // Check if there are any issues
    console.log('\n🔧 Diagnostics:');
    
    if (!org.subdomainEnabled) {
      console.log('  ⚠️  Subdomain is NOT enabled');
    } else {
      console.log('  ✅ Subdomain is enabled');
    }
    
    if (org.subdomain !== subdomain) {
      console.log(`  ⚠️  Subdomain mismatch: expected "${subdomain}", got "${org.subdomain}"`);
    } else {
      console.log('  ✅ Subdomain matches');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSubdomain();
