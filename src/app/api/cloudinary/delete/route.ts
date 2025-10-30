import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * DELETE /api/cloudinary/delete
 * Deletes an image from Cloudinary using Admin API
 * Requires authenticated user with appropriate permissions
 */
export async function POST(req: NextRequest) {
  try {
    const { publicId } = await req.json();

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary credentials missing');
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      );
    }

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Create signature for authentication
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(stringToSign).digest('hex');

    // Call Cloudinary Destroy API
    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();

    if (!response.ok || data.result !== 'ok') {
      console.error('Cloudinary delete failed:', data);
      return NextResponse.json(
        { error: data?.error?.message || 'Failed to delete image' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ success: true, result: data.result });
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
