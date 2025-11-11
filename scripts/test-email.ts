/**
 * Email Service Test Script
 * Run with: npm run test:email
 * Or: npx tsx scripts/test-email.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { TransactionalEmailsApi, SendSmtpEmail, AccountApi } from '@getbrevo/brevo'

// ANSI color codes for pretty output
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

async function testEmailService() {
  log('\n' + '='.repeat(60), colors.bold)
  log('   EMAIL SERVICE TEST - Brevo Configuration Check', colors.bold)
  log('='.repeat(60) + '\n', colors.bold)

  // Step 1: Check environment variables
  logInfo('Step 1: Checking environment variables...')
  
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const supportEmail = process.env.ORG_SUPPORT_EMAIL

  if (!apiKey) {
    logError('BREVO_API_KEY is missing from .env.local')
    logWarning('Add: BREVO_API_KEY=your_api_key_here')
    return false
  }
  logSuccess(`BREVO_API_KEY found (${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)})`)

  if (!senderEmail) {
    logError('BREVO_SENDER_EMAIL is missing from .env.local')
    logWarning('Add: BREVO_SENDER_EMAIL=noreply@yourdomain.com')
    return false
  }
  logSuccess(`BREVO_SENDER_EMAIL found (${senderEmail})`)

  if (supportEmail) {
    logSuccess(`ORG_SUPPORT_EMAIL found (${supportEmail})`)
  } else {
    logWarning('ORG_SUPPORT_EMAIL not set (optional, will use default)')
  }

  // Step 2: Initialize Brevo client
  logInfo('\nStep 2: Initializing Brevo client...')
  const brevo = new TransactionalEmailsApi()
  brevo.setApiKey(0, apiKey)
  
  const accountApi = new AccountApi()
  accountApi.setApiKey(0, apiKey)
  logSuccess('Brevo client initialized')

  // Step 3: Test API connection
  logInfo('\nStep 3: Testing Brevo API connection...')
  try {
    const accountInfo = await accountApi.getAccount()
    logSuccess('Successfully connected to Brevo API!')
    logInfo(`   Account: ${accountInfo.body.email}`)
    logInfo(`   Plan: ${accountInfo.body.plan?.[0]?.type || 'Unknown'}`)
    
    // Check email quota
    const credits = accountInfo.body.plan?.[0]?.credits
    if (credits !== undefined) {
      logInfo(`   Email credits remaining: ${credits}`)
      if (credits < 10) {
        logWarning('   Low on email credits! Consider upgrading your plan.')
      }
    }
  } catch (error: any) {
    logError('Failed to connect to Brevo API')
    if (error.response?.statusCode === 401) {
      logError('   Invalid API key. Please check your BREVO_API_KEY')
    } else {
      logError(`   Error: ${error.message}`)
    }
    return false
  }

  // Step 4: Prompt for test email
  logInfo('\nStep 4: Test email sending')
  logInfo('You can send a test email to verify delivery.')
  
  // Check if test email is provided as argument
  const testEmail = process.argv[2]
  
  if (!testEmail) {
    logWarning('No test email provided. Skipping test email send.')
    logInfo('To send a test email, run:')
    logInfo('   npm run test:email your-email@example.com')
    logInfo('   or: npx tsx scripts/test-email.ts your-email@example.com')
    log('\n' + '='.repeat(60), colors.bold)
    logSuccess('Email configuration is valid! ✨')
    log('='.repeat(60) + '\n', colors.bold)
    return true
  }

  // Step 5: Send test email
  logInfo(`\nStep 5: Sending test email to ${testEmail}...`)
  try {
    const email = new SendSmtpEmail()
    email.subject = '🧪 Consularly Email Test'
    email.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .success { background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Email Test Successful!</h1>
          </div>
          <div class="content">
            <h2>Your Brevo email service is working correctly!</h2>
            <p>This is a test email from your Consularly application.</p>
            
            <div class="success">
              <strong>✨ Configuration verified:</strong>
              <ul>
                <li>✅ Brevo API connection working</li>
                <li>✅ Email delivery successful</li>
                <li>✅ HTML formatting supported</li>
              </ul>
            </div>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Interview confirmation emails will be sent automatically when scheduling</li>
              <li>Reminder emails will be sent 24h and 1h before interviews</li>
              <li>All emails will use your organization's branding</li>
            </ul>

            <p style="color: #666; margin-top: 30px;">
              <small>This is an automated test message from Consularly. You can safely delete this email.</small>
            </p>
          </div>
          <div class="footer">
            Sent from Consularly Email Service<br>
            Powered by Brevo
          </div>
        </div>
      </body>
      </html>
    `
    email.sender = { 
      name: 'Consularly Test',
      email: senderEmail
    }
    email.to = [{ email: testEmail, name: 'Test Recipient' }]
    email.replyTo = {
      email: supportEmail || 'support@consularly.app',
      name: 'Consularly Support'
    }

    const result = await brevo.sendTransacEmail(email)
    
    logSuccess('Test email sent successfully!')
    logInfo(`   Message ID: ${result.body.messageId}`)
    logInfo(`   Check your inbox at: ${testEmail}`)
    logWarning('   Don\'t forget to check your spam/junk folder!')

  } catch (error: any) {
    logError('Failed to send test email')
    if (error.response) {
      logError(`   Status: ${error.response.statusCode}`)
      logError(`   Error: ${JSON.stringify(error.response.body, null, 2)}`)
    } else {
      logError(`   Error: ${error.message}`)
    }
    return false
  }

  // Final summary
  log('\n' + '='.repeat(60), colors.bold)
  logSuccess('All tests passed! Your email service is ready! 🎉')
  log('='.repeat(60) + '\n', colors.bold)

  return true
}

// Run the test
testEmailService()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    logError(`Unexpected error: ${error.message}`)
    console.error(error)
    process.exit(1)
  })
