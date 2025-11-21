/**
 * Test Subdomain Live
 * 
 * Test if subdomain is working in production
 */

async function testSubdomain() {
  const subdomain = process.argv[2] || 'sumedha-education';
  const baseUrl = process.argv[3] || 'https://consularly.com';
  
  console.log(`\n🧪 Testing subdomain: ${subdomain}\n`);
  
  // Test 1: Diagnostic API from main domain
  console.log('Test 1: Diagnostic API (main domain)');
  try {
    const response = await fetch(`${baseUrl}/api/debug/subdomain?subdomain=${subdomain}`);
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Diagnostic API from subdomain
  console.log('Test 2: Diagnostic API (subdomain)');
  try {
    const subdomainUrl = baseUrl.replace('://', `://${subdomain}.`);
    const response = await fetch(`${subdomainUrl}/api/debug/subdomain-status`);
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Homepage
  console.log('Test 3: Subdomain Homepage');
  try {
    const subdomainUrl = baseUrl.replace('://', `://${subdomain}.`);
    const response = await fetch(subdomainUrl);
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`✅ Headers:`, {
      'content-type': response.headers.get('content-type'),
      'x-org-id': response.headers.get('x-org-id'),
      'x-subdomain': response.headers.get('x-subdomain'),
    });
    
    // Check if it's an error page
    const html = await response.text();
    if (html.includes('Organization Not Found')) {
      console.log('❌ Error: Organization Not Found page detected');
    } else if (html.includes('Access Denied')) {
      console.log('❌ Error: Access Denied page detected');
    } else {
      console.log('✅ Page loaded successfully');
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n');
}

testSubdomain();
