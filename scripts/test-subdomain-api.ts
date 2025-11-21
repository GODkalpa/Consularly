/**
 * Test script to verify subdomain API works
 * 
 * Usage:
 * 1. Get your auth token from browser console:
 *    await firebase.auth().currentUser.getIdToken()
 * 2. Run: npx tsx scripts/test-subdomain-api.ts <ORG_ID> <SUBDOMAIN> <TOKEN>
 */

const orgId = process.argv[2];
const subdomain = process.argv[3];
const token = process.argv[4];

if (!orgId || !subdomain || !token) {
  console.error('Usage: npx tsx scripts/test-subdomain-api.ts <ORG_ID> <SUBDOMAIN> <TOKEN>');
  console.error('\nGet your token from browser console:');
  console.error('  await firebase.auth().currentUser.getIdToken()');
  process.exit(1);
}

async function testSubdomainAPI() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://consularly.com';
  const url = `${apiUrl}/api/admin/organizations/${orgId}/subdomain`;

  console.log('Testing subdomain API...');
  console.log('URL:', url);
  console.log('Org ID:', orgId);
  console.log('Subdomain:', subdomain);
  console.log('Token:', token.substring(0, 20) + '...');
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subdomain: subdomain,
        enabled: true,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Subdomain updated successfully');
      console.log('Subdomain:', data.organization?.subdomain);
      console.log('Enabled:', data.organization?.subdomainEnabled);
    } else {
      console.log('\n❌ FAILED! API returned error');
      console.log('Error:', data.error);
    }
  } catch (error: any) {
    console.error('\n❌ REQUEST FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSubdomainAPI();
