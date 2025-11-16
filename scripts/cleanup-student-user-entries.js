/**
 * Cleanup Script: Remove incorrect 'users' collection entries for students
 * 
 * This script finds students in orgStudents collection and removes any
 * corresponding entries in the users collection that were created by mistake.
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanupStudentUserEntries() {
  console.log('🔍 Finding all students with firebaseUid...');
  
  const studentsSnapshot = await db.collection('orgStudents')
    .where('firebaseUid', '!=', null)
    .get();
  
  console.log(`📊 Found ${studentsSnapshot.size} students with Firebase accounts`);
  
  let cleanedCount = 0;
  let notFoundCount = 0;
  
  for (const studentDoc of studentsSnapshot.docs) {
    const studentData = studentDoc.data();
    const firebaseUid = studentData.firebaseUid;
    const email = studentData.email;
    
    // Check if there's a users collection entry
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Only delete if it doesn't have an orgId (incorrectly created entry)
      if (!userData.orgId || userData.orgId === '') {
        console.log(`🗑️  Deleting incorrect users entry for student: ${email} (${firebaseUid})`);
        await db.collection('users').doc(firebaseUid).delete();
        cleanedCount++;
      } else {
        console.log(`⚠️  Skipping ${email} - has orgId: ${userData.orgId}`);
      }
    } else {
      notFoundCount++;
    }
  }
  
  console.log('\n✅ Cleanup complete!');
  console.log(`   - Cleaned: ${cleanedCount} entries`);
  console.log(`   - Not found: ${notFoundCount} entries`);
  console.log(`   - Total students: ${studentsSnapshot.size}`);
}

cleanupStudentUserEntries()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
