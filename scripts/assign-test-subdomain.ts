/**
 * Script to assign a test subdomain to an organization
 * Run: npx tsx scripts/assign-test-subdomain.ts
 */

import { adminDb } from '../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

async function assignTestSubdomain() {
  try {
    console.log('🔍 Fetching organizations...');
    
    // Get first organization
    const orgsSnapshot = await adminDb()
      .collection('organizations')
      .limit(1)
      .get();

    if (orgsSnapshot.empty) {
      console.error('❌ No organizations found. Create an organization first.');
      return;
    }

    const orgDoc = orgsSnapshot.docs[0];
    const orgId = orgDoc.id;
    const orgData = orgDoc.data();

    console.log(`\n📋 Organization found:`);
    console.log(`   ID: ${orgId}`);
    console.log(`   Name: ${orgData.name}`);
    console.log(`   Current subdomain: ${orgData.subdomain || 'Not set'}`);

    // Generate subdomain from org name
    const subdomain = orgData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 63);

    console.log(`\n🔧 Assigning subdomain: ${subdomain}`);

    // Update organization with subdomain
    await adminDb()
      .collection('organizations')
      .doc(orgId)
      .update({
        subdomain: subdomain,
        subdomainEnabled: true,
        subdomainCreatedAt: FieldValue.serverTimestamp(),
        subdomainUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    console.log(`\n✅ Subdomain assigned successfully!`);
    console.log(`\n🌐 Test URLs:`);
    console.log(`   Main site: https://consularly.com`);
    console.log(`   Subdomain: https://${subdomain}.consularly.com`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Wait 1-2 minutes for cache to clear`);
    console.log(`   2. Visit: https://${subdomain}.consularly.com`);
    console.log(`   3. You should see branded login page`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
assignTestSubdomain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
