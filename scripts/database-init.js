const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (reuse from firebase-admin-setup.js)
function initializeFirebaseAdmin() {
  try {
    const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ Service account key not found at:', serviceAccountPath);
      console.log('📝 Please download your service account key from Firebase Console and save as service-account-key.json');
      process.exit(1);
    }

    const serviceAccount = require('./service-account-key.json');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
      });
    }

    console.log('✅ Firebase Admin SDK initialized');
    return admin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

// Create Firestore indexes
async function createFirestoreIndexes() {
  try {
    console.log('📊 Creating Firestore indexes...');
    
    // Note: Indexes are typically created through Firebase Console or firebase CLI
    // This function documents the required indexes for the application
    
    const requiredIndexes = [
      {
        collection: 'users',
        fields: [
          { fieldPath: 'role', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'mockSessions',
        fields: [
          { fieldPath: 'userId', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'mockSessions',
        fields: [
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'userProgress',
        fields: [
          { fieldPath: 'userId', order: 'ASCENDING' },
          { fieldPath: 'lastSessionDate', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'organizations',
        fields: [
          { fieldPath: 'isActive', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'supportTickets',
        fields: [
          { fieldPath: 'userId', order: 'ASCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' }
        ]
      }
    ];

    console.log('📋 Required Firestore indexes:');
    requiredIndexes.forEach((index, i) => {
      console.log(`   ${i + 1}. Collection: ${index.collection}`);
      console.log(`      Fields: ${index.fields.map(f => `${f.fieldPath} (${f.order})`).join(', ')}`);
    });

    console.log('\n💡 These indexes will be automatically created when queries are run.');
    console.log('   You can also create them manually in Firebase Console > Firestore > Indexes');
    
    return requiredIndexes;
  } catch (error) {
    console.error('❌ Failed to document indexes:', error.message);
    throw error;
  }
}

// Initialize default system settings
async function initializeSystemSettings() {
  try {
    console.log('⚙️  Initializing system settings...');
    
    const firestore = admin.firestore();
    
    const defaultSettings = {
      platform: {
        name: 'Visa Mock Interview Platform',
        version: '1.0.0',
        maintenanceMode: false,
        registrationEnabled: true,
        maxSessionsPerUser: 50,
        sessionTimeoutMinutes: 30
      },
      quotas: {
        defaultUserQuota: 10,
        premiumUserQuota: 100,
        organizationBaseQuota: 1000
      },
      features: {
        aiPoweredFeedback: true,
        videoRecording: true,
        realTimeAnalytics: true,
        multiLanguageSupport: false
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      },
      security: {
        passwordMinLength: 8,
        sessionTimeoutHours: 24,
        maxLoginAttempts: 5,
        requireEmailVerification: true
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system-init'
    };

    await firestore.collection('systemSettings').doc('platform').set(defaultSettings);
    console.log('✅ System settings initialized');
    
    return defaultSettings;
  } catch (error) {
    console.error('❌ Failed to initialize system settings:', error.message);
    throw error;
  }
}

// Create sample data for testing
async function createSampleData() {
  try {
    console.log('📝 Creating sample data...');
    
    const firestore = admin.firestore();
    
    // Sample organizations
    const sampleOrganizations = [
      {
        id: 'tech-corp',
        name: 'Tech Corporation',
        domain: 'techcorp.com',
        subscriptionType: 'enterprise',
        quotaLimit: 5000,
        quotaUsed: 1250,
        adminEmails: ['admin@techcorp.com'],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'startup-inc',
        name: 'Startup Inc',
        domain: 'startup.com',
        subscriptionType: 'premium',
        quotaLimit: 1000,
        quotaUsed: 150,
        adminEmails: ['founder@startup.com'],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const org of sampleOrganizations) {
      await firestore.collection('organizations').doc(org.id).set(org);
      console.log(`   ✓ Created organization: ${org.name}`);
    }

    // Sample analytics data
    const sampleAnalytics = {
      daily: {
        date: new Date().toISOString().split('T')[0],
        totalSessions: 45,
        totalUsers: 12,
        averageScore: 78.5,
        completionRate: 0.85,
        topQuestions: [
          'Tell me about yourself',
          'Why do you want to visit the US?',
          'What is your occupation?'
        ]
      },
      monthly: {
        month: new Date().toISOString().substring(0, 7),
        totalSessions: 1200,
        totalUsers: 350,
        averageScore: 76.2,
        completionRate: 0.82,
        growth: {
          sessions: 0.15,
          users: 0.22,
          score: 0.03
        }
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await firestore.collection('analytics').doc('platform-stats').set(sampleAnalytics);
    console.log('   ✓ Created sample analytics data');

    console.log('✅ Sample data created successfully');
    
  } catch (error) {
    console.error('❌ Failed to create sample data:', error.message);
    throw error;
  }
}

// Main database initialization function
async function main() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    // Create indexes (documentation)
    await createFirestoreIndexes();

    // Initialize system settings
    await initializeSystemSettings();

    // Create sample data
    await createSampleData();

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📋 Database is ready with:');
    console.log('   ✓ System settings configured');
    console.log('   ✓ Sample organizations created');
    console.log('   ✓ Analytics structure initialized');
    console.log('   ✓ Required indexes documented');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  initializeFirebaseAdmin,
  createFirestoreIndexes,
  initializeSystemSettings,
  createSampleData
};
