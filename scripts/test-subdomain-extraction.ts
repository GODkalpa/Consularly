/**
 * Test Subdomain Extraction
 */

import { extractSubdomain, isMainPortal } from '../src/lib/subdomain-utils';

const testCases = [
  'sumedha-education.consularly.com',
  'www.consularly.com',
  'consularly.com',
  'localhost:3000',
  'sumedha-education.localhost:3000',
];

console.log('\n🧪 Testing Subdomain Extraction\n');

testCases.forEach(hostname => {
  const subdomain = extractSubdomain(hostname);
  const isMain = isMainPortal(hostname);
  
  console.log(`Hostname: ${hostname}`);
  console.log(`  Subdomain: ${subdomain || '(none)'}`);
  console.log(`  Is Main Portal: ${isMain}`);
  console.log('');
});
