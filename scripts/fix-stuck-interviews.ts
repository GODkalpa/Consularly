/**
 * Script to fix interviews stuck in "in_progress" status
 * 
 * This script finds interviews that are:
 * 1. Status = "in_progress"
 * 2. Have a finalReport (meaning they were completed)
 * 3. Updates their status to "completed"
 * 
 * Usage: npm run interview:fix
 * Or: npx tsx scripts/fix-stuck-interviews.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json')
  
  // Check if service account file exists
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: service-account-key.json not found!')
    console.error('Please download your Firebase service account key and place it in the project root.')
    console.error('See: https://firebase.google.com/docs/admin/setup#initialize-sdk')
    process.exit(1)
  }
  
  initializeApp({
    credential: cert(serviceAccountPath)
  })
}

const db = getFirestore()

async function fixStuckInterviews() {
  console.log('🔍 Searching for stuck interviews...')
  
  try {
    // Find interviews that are stuck in "in_progress" status
    const stuckInterviews = await db
      .collection('interviews')
      .where('status', '==', 'in_progress')
      .get()
    
    console.log(`Found ${stuckInterviews.size} interviews with "in_progress" status`)
    
    let fixedCount = 0
    let skippedCount = 0
    
    for (const doc of stuckInterviews.docs) {
      const data = doc.data()
      const interviewId = doc.id
      
      // Check if interview has finalReport (meaning it was completed)
      if (data.finalReport) {
        console.log(`\n✅ Fixing interview ${interviewId}:`)
        console.log(`   - Student: ${data.userId}`)
        console.log(`   - Created: ${data.createdAt?.toDate?.()?.toISOString() || 'unknown'}`)
        console.log(`   - Has finalReport: Yes`)
        console.log(`   - Score: ${data.score || 'N/A'}`)
        
        const updates: any = {
          status: 'completed',
          updatedAt: FieldValue.serverTimestamp()
        }
        
        // If score exists but finalScore doesn't, copy it
        if (typeof data.score === 'number' && !data.finalScore) {
          updates.finalScore = data.score
          console.log(`   - Setting finalScore: ${data.score}`)
        }
        
        // If finalReport.overall exists but score doesn't, use it
        if (data.finalReport?.overall && !data.score) {
          updates.score = Math.round(data.finalReport.overall)
          updates.finalScore = Math.round(data.finalReport.overall)
          console.log(`   - Setting score from finalReport: ${Math.round(data.finalReport.overall)}`)
        }
        
        await db.collection('interviews').doc(interviewId).update(updates)
        fixedCount++
      } else {
        // Interview is truly in progress or abandoned
        const createdAt = data.createdAt?.toDate?.()
        const now = new Date()
        const hoursSinceCreation = createdAt 
          ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          : 999
        
        // If interview is older than 2 hours and has no finalReport, mark as failed
        if (hoursSinceCreation > 2) {
          console.log(`\n⚠️  Marking abandoned interview ${interviewId} as failed:`)
          console.log(`   - Student: ${data.userId}`)
          console.log(`   - Created: ${createdAt?.toISOString() || 'unknown'}`)
          console.log(`   - Hours since creation: ${hoursSinceCreation.toFixed(1)}`)
          
          await db.collection('interviews').doc(interviewId).update({
            status: 'failed',
            updatedAt: FieldValue.serverTimestamp(),
            failureReason: 'Interview abandoned - no completion data after 2 hours'
          })
          fixedCount++
        } else {
          console.log(`\n⏳ Skipping recent interview ${interviewId} (${hoursSinceCreation.toFixed(1)} hours old)`)
          skippedCount++
        }
      }
    }
    
    console.log(`\n✨ Summary:`)
    console.log(`   - Fixed: ${fixedCount}`)
    console.log(`   - Skipped (recent): ${skippedCount}`)
    console.log(`   - Total processed: ${stuckInterviews.size}`)
    
  } catch (error) {
    console.error('❌ Error fixing stuck interviews:', error)
    throw error
  }
}

// Run the script
fixStuckInterviews()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
