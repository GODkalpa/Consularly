// Fix existing signup users who don't have quotaLimit/quotaUsed fields
const admin = require('firebase-admin');

// Initialize Firebase Admin (assumes service account key is available)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../service-account-key.json'))
  });
}

const db = admin.firestore();

async function fixUserQuotas() {
  try {
    console.log('🔍 Finding users without quota fields...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const usersToUpdate = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const hasQuotaFields = userData.quotaLimit !== undefined && userData.quotaUsed !== undefined;
      
      // Only update signup users (no orgId) who don't have quota fields
      if (!userData.orgId && !hasQuotaFields) {
        usersToUpdate.push({
          id: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role
        });
      }
    });
    
    console.log(`📊 Found ${usersToUpdate.length} users to update:`);
    usersToUpdate.forEach(user => {
      console.log(`  - ${user.displayName} (${user.email}) - Role: ${user.role}`);
    });
    
    if (usersToUpdate.length === 0) {
      console.log('✅ No users need quota updates');
      return;
    }
    
    // Update users in batches
    const batch = db.batch();
    
    usersToUpdate.forEach(user => {
      const userRef = db.collection('users').doc(user.id);
      batch.update(userRef, {
        quotaLimit: 10, // Default quota for signup users
        quotaUsed: 0,   // Reset to 0 (they can start fresh)
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    console.log('💾 Updating user profiles...');
    await batch.commit();
    
    console.log('✅ Successfully updated all user quotas!');
    console.log('📋 Summary:');
    console.log(`  - Users updated: ${usersToUpdate.length}`);
    console.log(`  - Default quotaLimit: 10`);
    console.log(`  - Default quotaUsed: 0`);
    
  } catch (error) {
    console.error('❌ Error updating user quotas:', error);
    throw error;
  }
}

// Run the script
fixUserQuotas()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
