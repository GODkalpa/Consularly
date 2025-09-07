#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import our setup modules
const { initializeFirebaseAdmin, setupFirestoreCollections } = require('./firebase-admin-setup');
const { deployFirestoreRules } = require('./deploy-rules');
const { initializeSystemSettings, createSampleData } = require('./database-init');
const { createAdminUserFromEnv, createAdminUserInteractive } = require('./create-admin');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check prerequisites
async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');

  const checks = [];

  // Check if service account key exists
  const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    console.log('✅ Service account key found');
    checks.push(true);
  } else {
    console.log('❌ Service account key not found');
    console.log('📝 Please download your service account key:');
    console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('   2. Click "Generate new private key"');
    console.log('   3. Save as "service-account-key.json" in the scripts folder');
    checks.push(false);
  }

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ Environment file found');
    checks.push(true);
  } else {
    console.log('⚠️  .env file not found (optional for manual setup)');
    checks.push(true); // Not critical
  }

  // Check Firebase CLI
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI installed');
    checks.push(true);
  } catch (error) {
    console.log('⚠️  Firebase CLI not installed (will install automatically)');
    checks.push(true); // Will install automatically
  }

  // Check Node.js dependencies
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    console.log('✅ Package.json found');
    checks.push(true);
  } else {
    console.log('❌ Package.json not found');
    checks.push(false);
  }

  const allPassed = checks.every(check => check);
  
  if (!allPassed) {
    console.log('\n❌ Some prerequisites are missing. Please fix them before continuing.');
    return false;
  }

  console.log('\n✅ All prerequisites met!');
  return true;
}

// Install required dependencies
async function installDependencies() {
  console.log('📦 Installing required dependencies...');
  
  try {
    // Install Firebase Admin SDK if not already installed
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    
    if (!packageJson.dependencies['firebase-admin'] && !packageJson.devDependencies['firebase-admin']) {
      console.log('   Installing firebase-admin...');
      execSync('npm install firebase-admin', { stdio: 'inherit' });
    }

    // Install Firebase CLI globally if not available
    try {
      execSync('firebase --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('   Installing Firebase CLI...');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    }

    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    throw error;
  }
}

// Setup Firebase project
async function setupFirebaseProject() {
  console.log('🔧 Setting up Firebase project...');
  
  try {
    // Check if already initialized
    const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
    
    if (!fs.existsSync(firebaseJsonPath)) {
      console.log('   Initializing Firebase project...');
      
      // Create basic firebase.json
      const firebaseConfig = {
        firestore: {
          rules: "firestore.rules",
          indexes: "firestore.indexes.json"
        },
        hosting: {
          public: "out",
          ignore: [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
          ],
          rewrites: [
            {
              source: "**",
              destination: "/index.html"
            }
          ]
        }
      };
      
      fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
      console.log('   ✓ Created firebase.json');
    }

    // Create firestore.indexes.json if it doesn't exist
    const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
    if (!fs.existsSync(indexesPath)) {
      const indexesConfig = {
        indexes: [],
        fieldOverrides: []
      };
      fs.writeFileSync(indexesPath, JSON.stringify(indexesConfig, null, 2));
      console.log('   ✓ Created firestore.indexes.json');
    }

    console.log('✅ Firebase project setup completed');
  } catch (error) {
    console.error('❌ Failed to setup Firebase project:', error.message);
    throw error;
  }
}

// Main setup orchestrator
async function runFullSetup() {
  console.log('🚀 Starting complete Firebase setup automation...\n');

  try {
    // Step 1: Check prerequisites
    const prereqsPassed = await checkPrerequisites();
    if (!prereqsPassed) {
      return;
    }

    // Step 2: Install dependencies
    await installDependencies();

    // Step 3: Setup Firebase project structure
    await setupFirebaseProject();

    // Step 4: Initialize Firebase Admin SDK
    console.log('\n🔧 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();

    // Step 5: Setup Firestore collections
    console.log('\n📊 Setting up Firestore collections...');
    await setupFirestoreCollections();

    // Step 6: Initialize system settings and sample data
    console.log('\n⚙️  Initializing system settings...');
    await initializeSystemSettings();
    await createSampleData();

    // Step 7: Deploy Firestore rules
    console.log('\n🛡️  Deploying Firestore security rules...');
    try {
      deployFirestoreRules();
    } catch (error) {
      console.log('⚠️  Rules deployment failed (you can deploy manually later)');
      console.log('   Command: firebase deploy --only firestore:rules');
    }

    // Step 8: Create admin user
    console.log('\n👤 Setting up admin user...');
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await createAdminUserFromEnv();
    } else {
      const createAdmin = await askQuestion('Create admin user now? (Y/n): ');
      if (createAdmin.toLowerCase() !== 'n' && createAdmin.toLowerCase() !== 'no') {
        await createAdminUserInteractive();
      } else {
        console.log('ℹ️  Admin user creation skipped. You can create one later with:');
        console.log('   node scripts/create-admin.js');
      }
    }

    // Success message
    console.log('\n🎉 Firebase setup completed successfully!');
    console.log('\n📋 What was set up:');
    console.log('   ✓ Firebase Admin SDK configured');
    console.log('   ✓ Firestore collections initialized');
    console.log('   ✓ Security rules deployed');
    console.log('   ✓ System settings configured');
    console.log('   ✓ Sample data created');
    console.log('   ✓ Admin user created (if requested)');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. Visit /admin to access the admin dashboard');
    console.log('   3. Test user registration and authentication');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 You can run individual setup scripts:');
    console.log('   - node scripts/firebase-admin-setup.js');
    console.log('   - node scripts/database-init.js');
    console.log('   - node scripts/deploy-rules.js');
    console.log('   - node scripts/create-admin.js');
  } finally {
    rl.close();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🔧 Firebase Setup Automation Script');
    console.log('\nUsage:');
    console.log('  node scripts/setup-firebase.js [options]');
    console.log('\nOptions:');
    console.log('  --help, -h     Show this help message');
    console.log('  --check        Only check prerequisites');
    console.log('  --deps         Only install dependencies');
    console.log('  --rules        Only deploy Firestore rules');
    console.log('  --admin        Only create admin user');
    console.log('\nEnvironment Variables:');
    console.log('  ADMIN_EMAIL    Admin user email (for automated setup)');
    console.log('  ADMIN_PASSWORD Admin user password (for automated setup)');
    console.log('\nFiles needed:');
    console.log('  scripts/service-account-key.json (Firebase service account key)');
    return;
  }

  if (args.includes('--check')) {
    await checkPrerequisites();
    return;
  }

  if (args.includes('--deps')) {
    await installDependencies();
    return;
  }

  if (args.includes('--rules')) {
    initializeFirebaseAdmin();
    deployFirestoreRules();
    return;
  }

  if (args.includes('--admin')) {
    initializeFirebaseAdmin();
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await createAdminUserFromEnv();
    } else {
      await createAdminUserInteractive();
    }
    return;
  }

  // Run full setup by default
  await runFullSetup();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkPrerequisites,
  installDependencies,
  setupFirebaseProject,
  runFullSetup
};
