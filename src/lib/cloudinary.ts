/**
 * Cloudinary Upload Utilities
 * Handles image uploads for organization branding
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
}

/**
 * Upload image to Cloudinary from the client side
 * This uses Cloudinary's unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'org-branding',
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedFormats = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'ico'],
  } = options;

  // Validate file
  if (file.size > maxFileSize) {
    throw new Error(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit`);
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedFormats.includes(fileExtension)) {
    throw new Error(`File format must be one of: ${allowedFormats.join(', ')}`);
  }

  // Get Cloudinary config from environment
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error?.message || 'Upload failed');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error?.message || 'Failed to upload image');
  }
}

/**
 * Delete image from Cloudinary (requires backend API)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(error?.message || 'Failed to delete image');
  }
}

/**
 * Generate Cloudinary transformation URL
 */
export function getTransformedImageUrl(
  url: string,
  transformation: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
): string {
  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL
  }

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = transformation;
  
  const transformations: string[] = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  const transformString = transformations.join(',');
  
  // Insert transformation into URL
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  file: File,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (minWidth && img.width < minWidth) {
        reject(new Error(`Image width must be at least ${minWidth}px`));
        return;
      }
      if (minHeight && img.height < minHeight) {
        reject(new Error(`Image height must be at least ${minHeight}px`));
        return;
      }
      if (maxWidth && img.width > maxWidth) {
        reject(new Error(`Image width must be at most ${maxWidth}px`));
        return;
      }
      if (maxHeight && img.height > maxHeight) {
        reject(new Error(`Image height must be at most ${maxHeight}px`));
        return;
      }

      resolve(true);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
