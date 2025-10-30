/**
 * Upload Consularly Logo to Cloudinary
 * Run: node scripts/upload-logo-to-cloudinary.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Missing Cloudinary credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

async function uploadToCloudinary() {
  const logoPath = path.join(__dirname, '..', 'public', 'Consularly.png');
  
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo file not found:', logoPath);
    process.exit(1);
  }

  console.log('📦 Reading logo file...');
  const imageBuffer = fs.readFileSync(logoPath);
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = 'email-assets/consularly-logo';
  
  // Generate signature
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = {
    file: base64Image,
    public_id: publicId,
    timestamp: timestamp,
    api_key: API_KEY,
    signature: signature,
  };

  console.log('☁️  Uploading to Cloudinary...');

  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';

    for (const [key, value] of Object.entries(formData)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Upload successful!');
            console.log('');
            console.log('📋 Cloudinary Details:');
            console.log('   URL:', result.secure_url);
            console.log('   Public ID:', result.public_id);
            console.log('   Format:', result.format);
            console.log('   Size:', Math.round(result.bytes / 1024), 'KB');
            console.log('   Dimensions:', `${result.width}x${result.height}px`);
            console.log('');
            console.log('🔗 Use this URL in your email templates:');
            console.log('   ', result.secure_url);
            resolve(result);
          } else {
            console.error('❌ Upload failed:', result);
            reject(new Error(result.error?.message || 'Upload failed'));
          }
        } catch (err) {
          console.error('❌ Error parsing response:', err);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

// Run upload
uploadToCloudinary()
  .then(() => {
    console.log('');
    console.log('✨ Done! Update your email templates with the URL above.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Upload failed:', err.message);
    process.exit(1);
  });
