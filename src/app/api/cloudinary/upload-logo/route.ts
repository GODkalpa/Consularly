/**
 * One-time API endpoint to upload Consularly logo to Cloudinary
 * GET /api/cloudinary/upload-logo
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET() {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured' },
        { status: 500 }
      );
    }

    // Read the logo file
    const logoPath = path.join(process.cwd(), 'public', 'Consularly.png');
    
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json(
        { error: 'Logo file not found at public/Consularly.png' },
        { status: 404 }
      );
    }

    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = 'email-assets/consularly-logo';

    // Generate signature
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Upload failed', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Logo uploaded successfully to Cloudinary',
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      size: Math.round(data.bytes / 1024),
      dimensions: `${data.width}x${data.height}`,
      instructions: 'Update your email templates to use this URL',
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
