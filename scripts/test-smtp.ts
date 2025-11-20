import nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testSMTP() {
  console.log('======================================================================')
  console.log('SMTP CONNECTION TEST')
  console.log('======================================================================\n')

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }

  console.log('Configuration:')
  console.log(`  Host: ${config.host}`)
  console.log(`  Port: ${config.port}`)
  console.log(`  User: ${config.auth.user}`)
  console.log(`  Pass: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET'}`)
  console.log()

  if (!config.host || !config.auth.user || !config.auth.pass) {
    console.error('❌ SMTP credentials not configured in .env.local')
    process.exit(1)
  }

  try {
    console.log('🔄 Creating transporter...')
    const transporter = nodemailer.createTransport(config)

    console.log('🔄 Verifying connection...')
    await transporter.verify()

    console.log('✅ SMTP connection successful!')
    console.log()
    console.log('Your Hostinger SMTP is configured correctly!')
    console.log('You can now send emails through your application.')
    
  } catch (error: any) {
    console.error('❌ SMTP connection failed!')
    console.error()
    
    if (error.code === 'EAUTH') {
      console.error('Authentication Error:')
      console.error('  - Check that your SMTP_USER is correct (should be: info@consularly.com)')
      console.error('  - Check that your SMTP_PASSWORD is correct')
      console.error('  - Verify the password in Hostinger email panel')
      console.error('  - Make sure the email account exists and is active')
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('Connection Error:')
      console.error('  - Check that SMTP_HOST is correct (should be: smtp.hostinger.com)')
      console.error('  - Check that SMTP_PORT is correct (should be: 465)')
      console.error('  - Check your firewall/network settings')
    } else {
      console.error('Error details:', error.message)
    }
    
    console.error()
    console.error('Full error:', error)
    process.exit(1)
  }
}

testSMTP()
