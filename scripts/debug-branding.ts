/**
 * Debug script to check organization branding in Firestore
 * Run with: npx ts-node scripts/debug-branding.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

const db = admin.firestore();

async function debugBranding() {
  console.log('🔍 Checking organization branding in Firestore...\n');

  try {
    // Get all organizations
    const orgsSnapshot = await db.collection('organizations').get();
    
    if (orgsSnapshot.empty) {
      console.log('❌ No organizations found');
      return;
    }

    for (const doc of orgsSnapshot.docs) {
      const data = doc.data();
      console.log('━'.repeat(60));
      console.log(`📁 Organization: ${data.name || 'Unknown'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Plan: ${data.plan || 'N/A'}`);
      
      const branding = data.settings?.customBranding;
      
      if (!branding) {
        console.log('   ⚠️  No customBranding found in settings');
        console.log('   Raw settings:', JSON.stringify(data.settings, null, 2));
      } else {
        console.log('\n   🎨 Branding Settings:');
        console.log(`      - logoUrl: ${branding.logoUrl || '(not set)'}`);
        console.log(`      - favicon: ${branding.favicon || '(not set)'}`);
        console.log(`      - primaryColor: ${branding.primaryColor || '(not set)'}`);
        console.log(`      - secondaryColor: ${branding.secondaryColor || '(not set)'}`);
        console.log(`      - companyName: ${branding.companyName || '(not set)'}`);
        console.log(`      - tagline: ${branding.tagline || '(not set)'}`);
        
        // Show all keys in branding
        console.log('\n   📋 All branding keys:', Object.keys(branding));
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

debugBranding();
