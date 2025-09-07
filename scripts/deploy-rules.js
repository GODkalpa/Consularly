const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Deploy Firestore security rules
function deployFirestoreRules() {
  try {
    console.log('🚀 Deploying Firestore security rules...');
    
    // Check if firestore.rules exists
    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    if (!fs.existsSync(rulesPath)) {
      throw new Error('firestore.rules file not found in project root');
    }
    
    // Check if Firebase CLI is installed
    try {
      execSync('firebase --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Firebase CLI...');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    }
    
    // Deploy rules
    execSync('firebase deploy --only firestore:rules', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Firestore security rules deployed successfully');
    
  } catch (error) {
    console.error('❌ Failed to deploy Firestore rules:', error.message);
    console.log('\n📋 Manual deployment steps:');
    console.log('   1. Install Firebase CLI: npm install -g firebase-tools');
    console.log('   2. Login to Firebase: firebase login');
    console.log('   3. Initialize project: firebase init firestore');
    console.log('   4. Deploy rules: firebase deploy --only firestore:rules');
    throw error;
  }
}

// Deploy Firebase Functions (if they exist)
function deployFunctions() {
  try {
    const functionsPath = path.join(process.cwd(), 'functions');
    if (fs.existsSync(functionsPath)) {
      console.log('🚀 Deploying Firebase Functions...');
      execSync('firebase deploy --only functions', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Firebase Functions deployed successfully');
    } else {
      console.log('ℹ️  No functions directory found, skipping functions deployment');
    }
  } catch (error) {
    console.error('❌ Failed to deploy Firebase Functions:', error.message);
    throw error;
  }
}

// Main deployment function
async function main() {
  console.log('🚀 Starting Firebase deployment...\n');
  
  try {
    // Deploy Firestore rules
    deployFirestoreRules();
    
    // Deploy Functions (optional)
    deployFunctions();
    
    console.log('\n🎉 Firebase deployment completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Firebase deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  deployFirestoreRules,
  deployFunctions
};
