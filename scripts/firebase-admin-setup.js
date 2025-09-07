const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Check if service account key exists
    const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ Service account key not found at:', serviceAccountPath);
      console.log('📝 Please download your service account key from Firebase Console:');
      console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('   2. Click "Generate new private key"');
      console.log('   3. Save as "service-account-key.json" in the scripts folder');
      process.exit(1);
    }

    const serviceAccount = require('./service-account-key.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

// Create admin user
async function createAdminUser(email, password, displayName = 'Admin User') {
  try {
    const auth = admin.auth();
    const firestore = admin.firestore();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });

    console.log('✅ Admin user created in Firebase Auth:', userRecord.uid);

    // Create user profile in Firestore with admin role
    await firestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    });

    console.log('✅ Admin user profile created in Firestore');
    return userRecord;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    throw error;
  }
}

// Setup Firestore collections and indexes
async function setupFirestoreCollections() {
  try {
    const firestore = admin.firestore();

    // Create initial collections with sample documents
    const collections = [
      {
        name: 'users',
        sampleDoc: {
          uid: 'sample-user-id',
          email: 'user@example.com',
          displayName: 'Sample User',
          role: 'user',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        }
      },
      {
        name: 'mockSessions',
        sampleDoc: {
          userId: 'sample-user-id',
          sessionId: 'sample-session-id',
          type: 'visa-interview',
          status: 'completed',
          score: 85,
          feedback: 'Good performance overall',
          questions: [],
          answers: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      {
        name: 'userProgress',
        sampleDoc: {
          userId: 'sample-user-id',
          totalSessions: 5,
          averageScore: 82,
          improvementRate: 15,
          lastSessionDate: admin.firestore.FieldValue.serverTimestamp(),
          strengths: ['communication', 'confidence'],
          areasForImprovement: ['technical knowledge'],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      {
        name: 'organizations',
        sampleDoc: {
          name: 'Sample Organization',
          domain: 'example.com',
          subscriptionType: 'premium',
          quotaLimit: 1000,
          quotaUsed: 150,
          adminEmails: ['admin@example.com'],
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    ];

    for (const collection of collections) {
      const docRef = firestore.collection(collection.name).doc('sample-document');
      await docRef.set(collection.sampleDoc);
      console.log(`✅ Created sample document in ${collection.name} collection`);
      
      // Delete the sample document after creating the collection
      await docRef.delete();
      console.log(`🗑️  Removed sample document from ${collection.name} collection`);
    }

    console.log('✅ Firestore collections initialized successfully');
  } catch (error) {
    console.error('❌ Failed to setup Firestore collections:', error.message);
    throw error;
  }
}

// Main setup function
async function main() {
  console.log('🚀 Starting Firebase setup automation...\n');

  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    // Setup Firestore collections
    await setupFirestoreCollections();

    // Create admin user if email and password are provided
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      await createAdminUser(adminEmail, adminPassword, 'System Administrator');
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log('⚠️  No admin credentials provided. Skipping admin user creation.');
      console.log('   Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to create admin user.');
    }

    console.log('\n🎉 Firebase setup completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Deploy Firestore security rules: npm run deploy:rules');
    console.log('   2. Start your application: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Firebase setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  initializeFirebaseAdmin,
  createAdminUser,
  setupFirestoreCollections
};
