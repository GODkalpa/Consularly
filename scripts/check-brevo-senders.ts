/**
 * Check Brevo Account for Verified Senders
 * Run with: npx tsx scripts/check-brevo-senders.ts
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { SendersApi } from '@getbrevo/brevo'

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

async function checkSenders() {
  log('\n' + '='.repeat(70), colors.bold)
  log('   BREVO SENDER VERIFICATION CHECK', colors.bold)
  log('='.repeat(70) + '\n', colors.bold)

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    log('❌ BREVO_API_KEY not found in .env.local', colors.red)
    return
  }

  const sendersApi = new SendersApi()
  sendersApi.setApiKey(0, apiKey)

  try {
    log('📧 Fetching your verified senders from Brevo...', colors.blue)
    const response = await sendersApi.getSenders()
    
    if (!response.body.senders || response.body.senders.length === 0) {
      log('\n⚠️  No verified senders found!', colors.yellow)
      log('\n📝 NEXT STEPS:', colors.bold)
      log('   1. Go to https://app.brevo.com/senders/list', colors.blue)
      log('   2. Click "Add a Sender"', colors.blue)
      log('   3. Choose one:', colors.blue)
      log('      • Use your own domain (Recommended)', colors.green)
      log('      • Or verify an email address', colors.yellow)
      log('\n   ❌ DO NOT use @gmail.com - it will not work!', colors.red)
      return
    }

    log('\n✅ Found verified senders:\n', colors.green)
    
    response.body.senders.forEach((sender: any, index: number) => {
      const isActive = sender.active ? '✅ ACTIVE' : '❌ INACTIVE'
      const status = colors[sender.active ? 'green' : 'red']
      
      log(`${index + 1}. Email: ${sender.email}`, colors.bold)
      log(`   Status: ${isActive}`, status)
      log(`   Name: ${sender.name || 'Not set'}`, colors.blue)
      log(`   ID: ${sender.id}`, colors.blue)
      
      if (sender.email.includes('@gmail.com')) {
        log('   ⚠️  WARNING: Gmail addresses often get blocked!', colors.yellow)
      }
      
      log('') // Empty line
    })

    const activeSenders = response.body.senders.filter((s: any) => s.active)
    
    if (activeSenders.length === 0) {
      log('⚠️  No active senders found. Emails will not be delivered!', colors.yellow)
    } else {
      log('💡 RECOMMENDATION:', colors.bold)
      log('   Update your .env.local with an active sender:', colors.blue)
      log(`   BREVO_SENDER_EMAIL=${activeSenders[0].email}`, colors.green)
      log(`   ORG_SUPPORT_EMAIL=${activeSenders[0].email}`, colors.green)
    }

    // Check current configuration
    const currentSender = process.env.BREVO_SENDER_EMAIL
    if (currentSender) {
      log(`\n📌 Current .env.local sender: ${currentSender}`, colors.blue)
      const isVerified = response.body.senders.find((s: any) => s.email === currentSender && s.active)
      
      if (isVerified) {
        log('   ✅ This sender is verified and active!', colors.green)
      } else {
        log('   ❌ This sender is NOT verified or inactive!', colors.red)
        log('   🔧 This is why your emails are not being delivered!', colors.yellow)
      }
    }

  } catch (error: any) {
    log('❌ Failed to fetch senders', colors.red)
    if (error.response?.statusCode === 401) {
      log('   Invalid API key', colors.red)
    } else {
      log(`   Error: ${error.message}`, colors.red)
    }
  }

  log('\n' + '='.repeat(70) + '\n', colors.bold)
}

checkSenders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
