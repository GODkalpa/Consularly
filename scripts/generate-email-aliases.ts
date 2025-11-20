/**
 * Email Alias Migration Script
 * Generates email aliases for all existing organizations
 * 
 * Run with: npx tsx scripts/generate-email-aliases.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { generateEmailAlias } from '../src/lib/email-alias-generator'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green)
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red)
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue)
}

interface MigrationResult {
  orgId: string
  orgName: string
  emailAlias: string
  status: 'success' | 'skipped' | 'error'
  error?: string
}

async function generateEmailAliasesForOrgs() {
  log('\n' + '='.repeat(70), colors.bold)
  log('   EMAIL ALIAS MIGRATION - Generate Aliases for Organizations', colors.bold)
  log('='.repeat(70) + '\n', colors.bold)

  const results: MigrationResult[] = []
  let successCount = 0
  let skippedCount = 0
  let errorCount = 0

  try {
    // Fetch all organizations
    logInfo('Fetching all organizations from Firestore...')
    const orgsSnapshot = await db.collection('organizations').get()
    
    if (orgsSnapshot.empty) {
      logWarning('No organizations found in database')
      return
    }

    logSuccess(`Found ${orgsSnapshot.size} organizations\n`)

    // Process each organization
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id
      const orgData = orgDoc.data()
      const orgName = orgData.name || 'Unknown'
      const existingAlias = orgData.settings?.customBranding?.emailAlias

      logInfo(`Processing: ${orgName} (${orgId})`)

      // Skip if already has email alias
      if (existingAlias) {
        logWarning(`  Already has email alias: ${existingAlias}`)
        results.push({
          orgId,
          orgName,
          emailAlias: existingAlias,
          status: 'skipped',
        })
        skippedCount++
        continue
      }

      try {
        // Generate email alias
        const emailAlias = generateEmailAlias(orgName)
        logInfo(`  Generated: ${emailAlias}`)

        // Update organization in Firestore
        await db.collection('organizations').doc(orgId).update({
          'settings.customBranding.emailAlias': emailAlias,
          updatedAt: new Date(),
        })

        logSuccess(`  Updated successfully!`)
        results.push({
          orgId,
          orgName,
          emailAlias,
          status: 'success',
        })
        successCount++
      } catch (error: any) {
        logError(`  Failed: ${error.message}`)
        results.push({
          orgId,
          orgName,
          emailAlias: '',
          status: 'error',
          error: error.message,
        })
        errorCount++
      }

      console.log('') // Empty line for readability
    }

    // Print summary
    log('\n' + '='.repeat(70), colors.bold)
    log('   MIGRATION SUMMARY', colors.bold)
    log('='.repeat(70) + '\n', colors.bold)

    logInfo(`Total organizations: ${orgsSnapshot.size}`)
    logSuccess(`Successfully generated: ${successCount}`)
    logWarning(`Skipped (already had alias): ${skippedCount}`)
    if (errorCount > 0) {
      logError(`Failed: ${errorCount}`)
    }

    // Print detailed results
    if (successCount > 0) {
      log('\n' + '-'.repeat(70), colors.bold)
      log('   GENERATED EMAIL ALIASES', colors.bold)
      log('-'.repeat(70) + '\n', colors.bold)

      results
        .filter(r => r.status === 'success')
        .forEach(r => {
          log(`${r.orgName}`, colors.bold)
          log(`  Alias: ${r.emailAlias}`, colors.green)
          log(`  Org ID: ${r.orgId}`, colors.blue)
          console.log('')
        })
    }

    // Print errors if any
    if (errorCount > 0) {
      log('\n' + '-'.repeat(70), colors.bold)
      log('   ERRORS', colors.bold)
      log('-'.repeat(70) + '\n', colors.bold)

      results
        .filter(r => r.status === 'error')
        .forEach(r => {
          log(`${r.orgName} (${r.orgId})`, colors.bold)
          log(`  Error: ${r.error}`, colors.red)
          console.log('')
        })
    }

    // Next steps
    log('\n' + '='.repeat(70), colors.bold)
    log('   NEXT STEPS', colors.bold)
    log('='.repeat(70) + '\n', colors.bold)

    logInfo('1. Create email aliases in Hostinger email panel:')
    results
      .filter(r => r.status === 'success')
      .forEach(r => {
        log(`   - ${r.emailAlias}`, colors.blue)
      })

    logInfo('\n2. Configure SMTP credentials in .env.local:')
    log('   SMTP_HOST=smtp.hostinger.com', colors.blue)
    log('   SMTP_PORT=465', colors.blue)
    log('   SMTP_USER=info@consularly.com', colors.blue)
    log('   SMTP_PASSWORD=your_password_here', colors.blue)

    logInfo('\n3. Test email sending using the admin dashboard')
    logInfo('4. Monitor email logs for any issues')

    log('\n' + '='.repeat(70) + '\n', colors.bold)

    if (errorCount === 0) {
      logSuccess('Migration completed successfully! 🎉')
    } else {
      logWarning('Migration completed with some errors. Please review above.')
    }

  } catch (error: any) {
    logError(`\nMigration failed: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Run the migration
generateEmailAliasesForOrgs()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    logError(`Unexpected error: ${error.message}`)
    console.error(error)
    process.exit(1)
  })
