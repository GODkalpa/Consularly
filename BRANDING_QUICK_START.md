# Organization Branding - Quick Start Guide

## What's Been Implemented

### ✅ Core Infrastructure (Ready to Use)
All the foundational branding utilities are complete and ready to use:

1. **Branding Cache** (`src/lib/branding/branding-cache.ts`)
   - Caches branding data for 5 minutes
   - Persists to localStorage

2. **CSS Sanitizer** (`src/lib/branding/css-sanitizer.ts`)
   - Prevents XSS attacks
   - Scopes CSS to prevent conflicts

3. **Branding Validator** (`src/lib/branding/branding-validator.ts`)
   - Validates colors, URLs, file sizes
   - Enforces plan restrictions

4. **Font Loader** (`src/lib/branding/font-loader.ts`)
   - Loads Google Fonts dynamically
   - Supports 5 font families

### ✅ React Components (Ready to Use)
1. **BrandingProvider** - Context provider for branding data
2. **useBranding Hook** - Easy access to branding anywhere
3. **DynamicFavicon** - Auto-updates browser tab icon
4. **DynamicStyles** - Injects colors, fonts, and custom CSS
5. **BrandedBackground** - Hero sections with branded backgrounds

### ✅ Integrations (Working)
- ✅ Org Dashboard has dynamic favicon
- ✅ Student Portal has dynamic favicon  
- ✅ Interview Pages have dynamic favicon

## Quick Integration Guide

### Step 1: Add Dynamic Styles to a Page

```typescript
import { DynamicStyles } from '@/components/branding';
import { useBranding } from '@/hooks/useBranding';

function MyPage() {
  const { branding } = useBranding(orgId);
  
  return (
    <div className="branded-app">
      <DynamicStyles branding={branding} scope="branded-app" />
      {/* Your content here */}
    </div>
  );
}
```

### Step 2: Add Branded Background to Headers

```typescript
import { BrandedBackground } from '@/components/branding';

function MyHeader() {
  return (
    <BrandedBackground
      backgroundImage={branding?.backgroundImage}
      primaryColor={branding?.primaryColor}
      secondaryColor={branding?.secondaryColor}
      height="300px"
    >
      <div className="text-white text-center">
        <h1>{branding?.companyName}</h1>
        <p>{branding?.tagline}</p>
      </div>
    </BrandedBackground>
  );
}
```

### Step 3: Use Branding Colors in Components

```typescript
function MyButton() {
  const { branding } = useBranding(orgId);
  
  return (
    <button style={{ 
      backgroundColor: branding?.primaryColor,
      color: 'white'
    }}>
      Click Me
    </button>
  );
}
```

## What Still Needs Integration

### Priority 1: Add DynamicStyles to Main Pages
1. **OrganizationDashboard** - Wrap content with `<DynamicStyles>`
2. **Student Portal** - Wrap content with `<DynamicStyles>`
3. **Interview Runner** - Wrap content with `<DynamicStyles>`

### Priority 2: Add BrandedBackground to Headers
1. **Org Dashboard** - Replace header with `<BrandedBackground>`
2. **Student Portal** - Replace header with `<BrandedBackground>`

### Priority 3: Implement White Label Mode
Create utility to conditionally hide platform branding:

```typescript
// src/lib/branding/white-label.ts
export function shouldShowPlatformBranding(branding?: OrganizationBranding): boolean {
  return !branding?.whiteLabel;
}
```

Then use it:
```typescript
{shouldShowPlatformBranding(branding) && (
  <div>Platform Logo</div>
)}
```

## Testing Your Branding

### 1. Test Favicon
- Navigate to org dashboard
- Check browser tab icon
- Should show organization favicon

### 2. Test Colors
- Add DynamicStyles to a page
- Use CSS variables: `var(--brand-primary)`
- Colors should match organization settings

### 3. Test Fonts
- Set font family in branding settings
- Font should load and apply automatically

### 4. Test Background Images
- Add BrandedBackground component
- Upload background image in settings
- Should display with gradient overlay

## Common Issues & Solutions

### Issue: Favicon not updating
**Solution**: Clear browser cache or use incognito mode

### Issue: Colors not applying
**Solution**: Ensure you've wrapped content with `className="branded-app"` and added `<DynamicStyles>`

### Issue: Font not loading
**Solution**: Check browser console for font loading errors, ensure font name is correct

### Issue: Background image not showing
**Solution**: Check image URL is valid and accessible, check browser console for CORS errors

## API Endpoints

### Get Organization Branding
```
GET /api/org/branding?orgId={orgId}
```

### Update Organization Branding
```
PATCH /api/org/branding
Body: { branding: OrganizationBranding }
```

## File Structure

```
src/
├── lib/branding/
│   ├── branding-cache.ts       # Caching utility
│   ├── css-sanitizer.ts        # CSS security
│   ├── branding-validator.ts   # Input validation
│   ├── font-loader.ts          # Font management
│   └── index.ts                # Exports
├── components/branding/
│   ├── BrandingProvider.tsx    # Context provider
│   ├── DynamicFavicon.tsx      # Favicon component
│   ├── DynamicStyles.tsx       # Styles component
│   ├── BrandedBackground.tsx   # Background component
│   └── index.ts                # Exports
└── hooks/
    └── useBranding.ts          # Branding hook
```

## Next Steps

1. **Integrate DynamicStyles** in the three main interfaces
2. **Add BrandedBackground** to dashboard headers
3. **Implement white label mode** for enterprise customers
4. **Add custom CSS support** for advanced customization
5. **Create preview system** for testing changes

## Support

For questions or issues:
1. Check `BRANDING_IMPLEMENTATION_STATUS.md` for detailed status
2. Review component source code for usage examples
3. Check browser console for errors
4. Verify branding data is being fetched correctly

---

**Quick Tip**: Start by adding `<DynamicStyles>` to one page and test it thoroughly before rolling out to all pages.
