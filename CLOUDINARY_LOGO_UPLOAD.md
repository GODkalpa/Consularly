# Upload Consularly Logo to Cloudinary

## Why Upload to Cloudinary?

Email clients require absolute URLs to display images. Using a CDN like Cloudinary is more reliable than relying on your app domain because:
- ✅ Guaranteed availability
- ✅ Faster loading times
- ✅ No dependency on app server status
- ✅ Works in all email clients

## Prerequisites

Ensure these environment variables are set in `.env.local`:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Method 1: API Route (Easiest)

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit in your browser:
   ```
   http://localhost:3000/api/cloudinary/upload-logo
   ```

3. You'll get a JSON response with the Cloudinary URL:
   ```json
   {
     "success": true,
     "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/email-assets/consularly-logo.png",
     "publicId": "email-assets/consularly-logo",
     ...
   }
   ```

4. Copy the `url` value

## Method 2: Node Script

1. Run the upload script:
   ```bash
   node scripts/upload-logo-to-cloudinary.js
   ```

2. Copy the URL from the console output

## Method 3: Manual Upload (via Cloudinary Dashboard)

1. Log in to your Cloudinary dashboard
2. Go to Media Library
3. Create folder: `email-assets`
4. Upload `public/Consularly.png` to this folder
5. Rename to: `consularly-logo`
6. Copy the secure URL (looks like: `https://res.cloudinary.com/.../email-assets/consularly-logo.png`)

## After Upload

Once you have the Cloudinary URL, update all email templates:

### Files to Update:
- `src/lib/email/templates/account-creation.ts`
- `src/lib/email/templates/welcome.ts`
- `src/lib/email/templates/org-welcome.ts`
- `src/lib/email/templates/quota-alert.ts`
- `src/lib/email/templates/interview-results.ts`

### Replace:
```typescript
<img src="${appUrl}/Consularly.png" alt="Consularly" class="logo" />
```

### With:
```typescript
<img src="https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/email-assets/consularly-logo.png" alt="Consularly" class="logo" />
```

## Verification

After updating templates:
1. Create a test user or trigger an email
2. Check email inbox
3. Verify logo displays correctly (even in Gmail, Outlook, etc.)
4. Logo should have white background container

## Troubleshooting

**Logo not displaying in emails?**
- Verify the Cloudinary URL is publicly accessible
- Check that the URL starts with `https://`
- Ensure no authentication is required for the image
- Test the URL directly in a browser

**Upload fails?**
- Verify environment variables are correct
- Check Cloudinary API credentials
- Ensure you're within Cloudinary free tier limits
- Check console for specific error messages
