# Organization Branding System

## Overview

Organizations now have comprehensive control over their dashboard branding, including logos, colors, typography, and more. This guide covers setup, features, and usage.

## Features by Plan Tier

### 🔵 Basic Plan
- ✅ Primary brand color
- ✅ Company name
- ✅ Logo upload

### 💜 Premium Plan
- ✅ All Basic features
- ✅ Secondary/accent color
- ✅ Custom tagline
- ✅ Welcome message
- ✅ Favicon
- ✅ Background image
- ✅ Font selection
- ✅ Social media links

### 🏆 Enterprise Plan
- ✅ All Premium features
- ✅ **White-label mode** (hide platform branding)
- ✅ **Custom CSS** (advanced styling)
- ✅ Footer customization

## Setup Instructions

### 1. Cloudinary Configuration

Organizations use **Cloudinary** for image storage. To enable image uploads:

#### Get Cloudinary Credentials
1. Sign up at https://cloudinary.com/
2. Go to Dashboard > Settings
3. Note your **Cloud Name**
4. Create an **Unsigned Upload Preset**:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set **Signing Mode** to "Unsigned"
   - Set **Folder** to `org-branding` (optional)
   - Save and note the preset name

#### Add to Environment Variables

Update your `.env.local`:

```env
# Cloudinary (Image Storage for Branding)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Firestore Schema Update

The branding schema has been automatically extended in `src/types/firestore.ts`:

```typescript
interface OrganizationBranding {
  // Logo variants
  logoUrl?: string
  logoLight?: string
  logoDark?: string
  favicon?: string
  
  // Colors
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  
  // Text branding
  companyName?: string
  tagline?: string
  welcomeMessage?: string
  footerText?: string
  
  // Visual assets
  backgroundImage?: string
  
  // Typography
  fontFamily?: 'inter' | 'poppins' | 'roboto' | 'montserrat' | 'system'
  
  // Social links
  socialLinks?: {
    website?: string
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  
  // Advanced (enterprise)
  customCSS?: string
  whiteLabel?: boolean
}
```

**No Firestore migrations required** - the schema is backward compatible.

## Usage Guide

### For Organization Members

Organizations can now customize their branding through the dashboard:

1. **Access Branding Settings**
   - Log in to your organization dashboard at `/org`
   - Navigate to the **Branding** tab in the sidebar

2. **Visual Assets Tab**
   - **Logo**: Upload PNG/SVG (recommended 200x60px)
   - **Favicon**: Upload 32x32px or 64x64px icon
   - **Background**: Upload hero image for dashboard header

3. **Colors Tab**
   - **Primary Color**: Main brand color (used throughout dashboard)
   - **Secondary Color**: Accent color for highlights
   - **Background Color**: Custom background

4. **Text & Content Tab**
   - **Company Name**: Override organization name
   - **Tagline**: Company slogan
   - **Welcome Message**: Custom greeting on dashboard
   - **Footer Text**: Copyright/disclaimer
   - **Font Family**: Choose from 5 preset fonts

5. **Advanced Tab**
   - **Social Links**: Website, LinkedIn, Twitter, Facebook
   - **White Label** (Enterprise): Hide platform branding
   - **Custom CSS** (Enterprise): Advanced style overrides

### For Platform Admins

Admins can manage organization branding through:

1. **Organization Management** (`/admin`)
   - View all organizations
   - Monitor branding assets
   - Adjust quotas and plans

2. **API Access**
   - `GET /api/org/branding` - Fetch branding settings
   - `PATCH /api/org/branding` - Update branding settings

## Technical Architecture

### File Structure

```
src/
├── app/api/
│   ├── cloudinary/delete/route.ts    # Image deletion endpoint
│   └── org/branding/route.ts          # Branding CRUD operations
├── components/org/
│   ├── OrgBrandingSettings.tsx        # Branding settings UI
│   └── OrganizationDashboard.tsx      # Main dashboard (updated)
├── lib/
│   └── cloudinary.ts                   # Upload utilities
└── types/
    └── firestore.ts                    # Extended schema

```

### API Routes

#### `GET /api/org/branding`
Retrieves current organization branding settings.

**Headers:**
- `Authorization: Bearer <firebase_id_token>`

**Response:**
```json
{
  "success": true,
  "branding": {
    "logoUrl": "https://...",
    "primaryColor": "#1d4ed8",
    "companyName": "Acme Corp",
    ...
  }
}
```

#### `PATCH /api/org/branding`
Updates organization branding settings.

**Headers:**
- `Authorization: Bearer <firebase_id_token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "branding": {
    "primaryColor": "#1d4ed8",
    "companyName": "Updated Name",
    "tagline": "Your Success Partner"
  }
}
```

**Plan Restrictions:**
- Enterprise-only fields (`customCSS`, `whiteLabel`) are automatically removed for Basic/Premium plans

#### `POST /api/cloudinary/delete`
Deletes an image from Cloudinary (called automatically when replacing images).

### Security

1. **Authentication**: All branding endpoints require valid Firebase ID tokens
2. **Authorization**: Users must belong to an organization
3. **Plan Enforcement**: Enterprise features restricted server-side
4. **Image Validation**: 
   - Max file size: 5MB
   - Allowed formats: jpg, jpeg, png, svg, webp, ico
5. **API Secrets**: Cloudinary secrets stored server-side only

## Branding Application

Branding is applied across the organization dashboard:

### Header Hero Section
- Logo display
- Company name and tagline
- Background image support
- Custom welcome message

### Sidebar
- Logo in header
- Primary color for active states

### Content Cards
- Primary color accents
- Secondary color highlights
- Custom quota warnings

### Typography
Font families are mapped to Google Fonts (requires separate import if not using defaults).

## Image Recommendations

| Asset | Recommended Size | Format | Notes |
|-------|-----------------|--------|-------|
| Logo | 200x60px | PNG/SVG | **Transparent background preferred**. Displayed on white background in dashboard. Horizontal/wide logos work best. |
| Favicon | 32x32 or 64x64px | PNG/ICO | Square format |
| Background | 1920x400px | JPG/PNG/WebP | Will be overlaid with gradient |

### Logo Best Practices
✅ **DO:**
- Use PNG with transparent background or SVG format
- Ensure logo has good contrast on white backgrounds
- Use horizontal/wide aspect ratios (3:1 or 4:1)
- Keep file size under 500KB for fast loading
- Test logo visibility on both light and dark surfaces

❌ **DON'T:**
- Use logos with white backgrounds (will blend with dashboard)
- Upload extremely large files (>5MB limit)
- Use complex gradients that may not render well at small sizes
- Include excessive whitespace/padding in the image file

## Color Format Support

Supports multiple CSS color formats:
- Hex: `#1d4ed8`
- RGB: `rgb(29, 78, 216)`
- RGBA: `rgba(29, 78, 216, 0.9)`
- HSL: `hsl(221, 83%, 53%)`
- CSS Variables: `hsl(var(--primary))`

## Troubleshooting

### Images Not Uploading
1. Verify Cloudinary credentials in `.env.local`
2. Check upload preset is **unsigned**
3. Verify file size < 5MB
4. Check browser console for errors

### Branding Not Appearing
1. Ensure organization is created in Firestore
2. Verify user has `orgId` field in their profile
3. Check Network tab for API errors
4. Clear browser cache

### Plan Restrictions
- Enterprise features automatically hidden for Basic/Premium plans
- Server-side enforcement prevents unauthorized access
- Contact platform admin to upgrade plan

## Development Notes

### Adding New Branding Fields

1. Update `OrganizationBranding` interface in `src/types/firestore.ts`
2. Add UI controls in `OrgBrandingSettings.tsx`
3. Apply branding in `OrganizationDashboard.tsx`
4. No backend changes needed (schema is flexible)

### Custom CSS Guidelines (Enterprise)

Custom CSS is injected with class scope `.org-dashboard`. Example:

```css
.org-dashboard .custom-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
```

**⚠️ Warning**: Custom CSS can break layouts. Test thoroughly.

## Future Enhancements

Potential additions:
- 🎨 Multiple theme presets
- 🌓 Dark mode customization
- 📧 Email template branding
- 📄 PDF report headers
- 🔗 Custom domain support
- 🎨 More font options (Google Fonts integration)
- 📱 Mobile app branding

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Verify Cloudinary setup
4. Contact platform administrator

---

**Version**: 1.0  
**Last Updated**: 2025-01-30
