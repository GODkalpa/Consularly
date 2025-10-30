/**
 * One-time cleanup script to remove orgId from admin users
 * Admin users should be system-wide and not tied to organizations
 * 
 * Run with: npx ts-node scripts/cleanup-admin-orgs.ts
 */

import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('../service-account-key.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function cleanupAdminOrganizations() {
  console.log('🔍 Searching for admin users with orgId...')
  
  try {
    // Find all users with admin role
    const usersRef = db.collection('users')
    const adminUsersSnap = await usersRef
      .where('role', '==', 'admin')
      .get()

    if (adminUsersSnap.empty) {
      console.log('✅ No admin users found')
      return
    }

    console.log(`📊 Found ${adminUsersSnap.size} admin user(s)`)
    
    let updatedCount = 0
    const batch = db.batch()

    for (const doc of adminUsersSnap.docs) {
      const data = doc.data()
      if (data.orgId) {
        console.log(`  🔧 Removing orgId from admin user: ${data.email} (${data.displayName})`)
        batch.update(doc.ref, {
          orgId: '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
        updatedCount++
      } else {
        console.log(`  ✓ Admin user already clean: ${data.email}`)
      }
    }

    if (updatedCount > 0) {
      await batch.commit()
      console.log(`\n✅ Successfully cleaned up ${updatedCount} admin user(s)`)
    } else {
      console.log('\n✅ All admin users are already clean (no orgId)')
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

// Run cleanup
cleanupAdminOrganizations()
  .then(() => {
    console.log('\n🎉 Cleanup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error)
    process.exit(1)
  })
