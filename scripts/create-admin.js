const admin = require('firebase-admin');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  return password.length >= 8;
}

// Create admin user with interactive prompts
async function createAdminUserInteractive() {
  try {
    console.log('👤 Creating admin user...\n');

    // Get email
    let email;
    while (true) {
      email = await askQuestion('Enter admin email: ');
      if (isValidEmail(email)) {
        break;
      }
      console.log('❌ Invalid email format. Please try again.');
    }

    // Get password
    let password;
    while (true) {
      password = await askQuestion('Enter admin password (min 8 characters): ');
      if (isValidPassword(password)) {
        break;
      }
      console.log('❌ Password must be at least 8 characters long. Please try again.');
    }

    // Get display name
    const displayName = await askQuestion('Enter admin display name (optional): ') || 'Administrator';

    // Confirm creation
    console.log('\n📋 Admin user details:');
    console.log(`   Email: ${email}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Role: admin`);

    const confirm = await askQuestion('\nCreate this admin user? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Admin user creation cancelled.');
      rl.close();
      return;
    }

    // Create the user
    const auth = admin.auth();
    const firestore = admin.firestore();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });

    console.log('\n✅ Admin user created in Firebase Auth:', userRecord.uid);

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
      },
      adminMetadata: {
        createdBy: 'system-script',
        permissions: [
          'user_management',
          'organization_management',
          'quota_management',
          'analytics_access',
          'billing_management',
          'system_settings',
          'support_management'
        ]
      }
    });

    console.log('✅ Admin user profile created in Firestore');

    // Log the creation in audit logs
    await firestore.collection('auditLogs').add({
      action: 'admin_user_created',
      targetUserId: userRecord.uid,
      targetUserEmail: email,
      performedBy: 'system-script',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        method: 'admin_script',
        role: 'admin'
      }
    });

    console.log('✅ Admin creation logged in audit trail');

    console.log('\n🎉 Admin user created successfully!');
    console.log('📋 Next steps:');
    console.log('   1. The admin can now log in to the platform');
    console.log('   2. Access the admin dashboard at /admin');
    console.log('   3. Manage users, organizations, and platform settings');

    rl.close();
    return userRecord;

  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    rl.close();
    throw error;
  }
}

// Create admin user from environment variables (for automated setup)
async function createAdminUserFromEnv() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const displayName = process.env.ADMIN_DISPLAY_NAME || 'System Administrator';

    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format in ADMIN_EMAIL');
    }

    if (!isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    console.log('👤 Creating admin user from environment variables...');

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
      },
      adminMetadata: {
        createdBy: 'automated-setup',
        permissions: [
          'user_management',
          'organization_management',
          'quota_management',
          'analytics_access',
          'billing_management',
          'system_settings',
          'support_management'
        ]
      }
    });

    console.log('✅ Admin user profile created in Firestore');

    // Log the creation in audit logs
    await firestore.collection('auditLogs').add({
      action: 'admin_user_created',
      targetUserId: userRecord.uid,
      targetUserEmail: email,
      performedBy: 'automated-setup',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        method: 'environment_variables',
        role: 'admin'
      }
    });

    console.log('✅ Admin creation logged in audit trail');
    return userRecord;

  } catch (error) {
    console.error('❌ Failed to create admin user from environment:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🚀 Admin User Creation Script\n');

  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    // Check if environment variables are provided
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await createAdminUserFromEnv();
    } else {
      await createAdminUserInteractive();
    }

  } catch (error) {
    console.error('\n❌ Admin user creation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createAdminUserInteractive,
  createAdminUserFromEnv
};
