/**
 * Script to check the status of interviews in the database
 * 
 * This script provides a summary of:
 * 1. Total interviews by status
 * 2. Interviews with missing finalScore
 * 3. Recent interviews (last 10)
 * 
 * Usage: npm run interview:check [orgId]
 * Or: npx tsx scripts/check-interview-status.ts [orgId]
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
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

async function checkInterviewStatus(orgId?: string) {
  console.log('📊 Interview Status Report')
  console.log('=' .repeat(60))
  
  try {
    // Build query
    let query = db.collection('interviews')
    
    if (orgId) {
      console.log(`\n🏢 Filtering by Organization: ${orgId}`)
      query = query.where('orgId', '==', orgId) as any
    }
    
    const allInterviews = await query.get()
    
    console.log(`\n📈 Total Interviews: ${allInterviews.size}`)
    
    // Count by status
    const statusCounts: Record<string, number> = {}
    const missingFinalScore: any[] = []
    const recentInterviews: any[] = []
    
    allInterviews.forEach(doc => {
      const data = doc.data()
      const status = data.status || 'unknown'
      
      // Count by status
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      // Check for missing finalScore
      if (data.status === 'completed' && !data.finalScore && data.score) {
        missingFinalScore.push({
          id: doc.id,
          status: data.status,
          score: data.score,
          hasFinalReport: !!data.finalReport,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || 'unknown'
        })
      }
      
      // Collect recent interviews
      if (recentInterviews.length < 10) {
        recentInterviews.push({
          id: doc.id,
          status: data.status,
          score: data.score,
          finalScore: data.finalScore,
          hasFinalReport: !!data.finalReport,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || 'unknown'
        })
      }
    })
    
    // Sort recent interviews by date
    recentInterviews.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
    
    // Display status counts
    console.log('\n📊 Status Breakdown:')
    console.log('-'.repeat(60))
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const emoji = status === 'completed' ? '✅' : 
                     status === 'in_progress' ? '⏳' : 
                     status === 'scheduled' ? '📅' : 
                     status === 'failed' ? '❌' : '❓'
        console.log(`${emoji} ${status.padEnd(15)}: ${count}`)
      })
    
    // Display missing finalScore
    if (missingFinalScore.length > 0) {
      console.log('\n⚠️  Interviews Missing finalScore:')
      console.log('-'.repeat(60))
      missingFinalScore.forEach(interview => {
        console.log(`ID: ${interview.id}`)
        console.log(`   Status: ${interview.status}`)
        console.log(`   Score: ${interview.score}`)
        console.log(`   Has Report: ${interview.hasFinalReport ? 'Yes' : 'No'}`)
        console.log(`   Created: ${interview.createdAt}`)
        console.log()
      })
      console.log(`Total: ${missingFinalScore.length} interviews need finalScore field`)
    } else {
      console.log('\n✅ All completed interviews have finalScore field')
    }
    
    // Display recent interviews
    console.log('\n📅 Recent Interviews (Last 10):')
    console.log('-'.repeat(60))
    recentInterviews.forEach((interview, index) => {
      const statusEmoji = interview.status === 'completed' ? '✅' : 
                         interview.status === 'in_progress' ? '⏳' : 
                         interview.status === 'scheduled' ? '📅' : 
                         interview.status === 'failed' ? '❌' : '❓'
      console.log(`${index + 1}. ${statusEmoji} ${interview.id}`)
      console.log(`   Status: ${interview.status}`)
      console.log(`   Score: ${interview.score || 'N/A'} | Final Score: ${interview.finalScore || 'N/A'}`)
      console.log(`   Has Report: ${interview.hasFinalReport ? 'Yes' : 'No'}`)
      console.log(`   Created: ${interview.createdAt}`)
      console.log()
    })
    
    // Summary
    console.log('\n📋 Summary:')
    console.log('-'.repeat(60))
    console.log(`Total Interviews: ${allInterviews.size}`)
    console.log(`Completed: ${statusCounts['completed'] || 0}`)
    console.log(`In Progress: ${statusCounts['in_progress'] || 0}`)
    console.log(`Scheduled: ${statusCounts['scheduled'] || 0}`)
    console.log(`Failed: ${statusCounts['failed'] || 0}`)
    console.log(`Missing finalScore: ${missingFinalScore.length}`)
    
    if (missingFinalScore.length > 0) {
      console.log('\n💡 Tip: Run "npm run interview:fix" to fix missing finalScore fields')
    }
    
  } catch (error) {
    console.error('❌ Error checking interview status:', error)
    throw error
  }
}

// Get orgId from command line args
const orgId = process.argv[2]

// Run the script
checkInterviewStatus(orgId)
  .then(() => {
    console.log('\n✅ Report completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Report failed:', error)
    process.exit(1)
  })
