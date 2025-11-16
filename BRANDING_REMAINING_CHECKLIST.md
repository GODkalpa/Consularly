# Organization Branding - Remaining Work Checklist

## Quick Reference
- ✅ = Complete
- 🔄 = In Progress  
- ⏳ = Not Started
- ⭐ = High Priority
- 💡 = Quick Win

---

## Phase 1: Core Integration (2-4 hours) ⭐💡

### Task 4.3: Integrate DynamicStyles in Org Dashboard
- [ ] Import DynamicStyles component
- [ ] Wrap main content with `className="branded-app"`
- [ ] Add `<DynamicStyles branding={branding} />` after DynamicFavicon
- [ ] Test colors apply correctly
- [ ] Test fonts load correctly

**File**: `src/components/org/OrganizationDashboard.tsx`
```typescript
// Add import
import { DynamicStyles } from '@/components/branding';

// In return statement, after DynamicFavicon:
<DynamicStyles branding={branding} scope="branded-app" />

// Wrap SidebarProvider with:
<div className="branded-app">
  <SidebarProvider>
    {/* existing content */}
  </SidebarProvider>
</div>
```

### Task 4.4: Integrate DynamicStyles in Student Portal
- [ ] Import DynamicStyles component
- [ ] Wrap main content with `className="branded-app"`
- [ ] Add `<DynamicStyles branding={branding} />` after DynamicFavicon
- [ ] Test colors apply correctly
- [ ] Test fonts load correctly

**File**: `src/app/student/page.tsx`
```typescript
// Add import
import { DynamicStyles } from '@/components/branding';

// After DynamicFavicon:
<DynamicStyles branding={branding} scope="branded-app" />

// Wrap SidebarProvider with:
<div className="branded-app">
  <SidebarProvider>
    {/* existing content */}
  </SidebarProvider>
</div>
```

### Task 4.5: Integrate DynamicStyles in Interview Pages
- [ ] Import DynamicStyles component
- [ ] Wrap main content with `className="branded-app"`
- [ ] Add `<DynamicStyles branding={orgBranding} />` after DynamicFavicon
- [ ] Test colors apply correctly
- [ ] Test fonts load correctly

**File**: `src/components/interview/InterviewRunner.tsx`
```typescript
// Add import
import { DynamicStyles } from '@/components/branding';

// After DynamicFavicon:
{orgBranding && <DynamicStyles branding={orgBranding} scope="branded-app" />}

// Wrap main div with:
<div className="branded-app">
  {/* existing content */}
</div>
```

### Task 5.2: Integrate BrandedBackground in Org Dashboard Header
- [ ] Import BrandedBackground component
- [ ] Replace existing header section
- [ ] Pass background image and colors
- [ ] Test background renders correctly
- [ ] Ensure text is readable

**File**: `src/components/org/OrganizationDashboard.tsx`
```typescript
// Add import
import { BrandedBackground } from '@/components/branding';

// In renderOverview(), replace the header div with:
<BrandedBackground
  backgroundImage={brandBackground}
  primaryColor={brandColor}
  secondaryColor={brandSecondaryColor}
  height="200px"
>
  <div className="flex items-center gap-4">
    {brandLogo && (
      <div className="relative h-16 w-16">
        <Image src={brandLogo} alt={brandName} fill className="object-contain" />
      </div>
    )}
    <div>
      <h1 className="text-2xl font-bold text-white">{brandName}</h1>
      <p className="text-sm text-white/90">{brandTagline || "Admin Panel"}</p>
    </div>
  </div>
</BrandedBackground>
```

### Task 5.3: Integrate BrandedBackground in Student Portal Header
- [ ] Import BrandedBackground component
- [ ] Replace existing header section
- [ ] Pass background image and colors
- [ ] Test background renders correctly
- [ ] Ensure text is readable

**File**: `src/app/student/page.tsx`
```typescript
// Add import
import { BrandedBackground } from '@/components/branding';

// In renderOverview(), replace the header div with:
<BrandedBackground
  backgroundImage={branding.backgroundImage}
  primaryColor={brandColor}
  secondaryColor={branding.secondaryColor || '#8B5CF6'}
  height="200px"
>
  <div className="flex items-center gap-4">
    {brandLogo && (
      <div className="relative h-16 w-16">
        <Image src={brandLogo} alt={brandName} fill className="object-contain" />
      </div>
    )}
    <div>
      <h1 className="text-2xl font-bold text-white">{brandName}</h1>
      <p className="text-sm text-white/90">{brandTagline}</p>
    </div>
  </div>
</BrandedBackground>
```

---

## Phase 2: White Label Mode (2-3 hours) ⭐

### Task 9.1: Create White Label Utility
- [ ] Create `src/lib/branding/white-label.ts`
- [ ] Implement `shouldShowPlatformBranding()` function
- [ ] Add component wrapper for conditional rendering
- [ ] Export utility functions

**File**: `src/lib/branding/white-label.ts`
```typescript
import { OrganizationBranding } from '@/types/firestore';

export function shouldShowPlatformBranding(branding?: OrganizationBranding): boolean {
  return !branding?.whiteLabel;
}

export function isPlatformBrandingHidden(branding?: OrganizationBranding): boolean {
  return branding?.whiteLabel === true;
}

interface PlatformBrandingProps {
  branding?: OrganizationBranding;
  children: React.ReactNode;
}

export function PlatformBranding({ branding, children }: PlatformBrandingProps) {
  if (isPlatformBrandingHidden(branding)) {
    return null;
  }
  return <>{children}</>;
}
```

### Task 9.2: Hide Platform Branding in Org Dashboard
- [ ] Import white label utility
- [ ] Wrap platform logos with conditional
- [ ] Test white label mode works
- [ ] Ensure org branding is prominent

**Usage Example**:
```typescript
import { PlatformBranding } from '@/lib/branding/white-label';

<PlatformBranding branding={branding}>
  <div>Platform Logo Here</div>
</PlatformBranding>
```

### Task 9.3: Hide Platform Branding in Student Portal
- [ ] Import white label utility
- [ ] Wrap platform logos with conditional
- [ ] Test white label mode works
- [ ] Ensure org branding is prominent

### Task 9.4: Enforce Enterprise Plan Requirement
- [ ] Update branding API validation
- [ ] Check plan before allowing white label
- [ ] Return error if plan insufficient
- [ ] Add enterprise badge in UI

**File**: `src/app/api/org/branding/route.ts`
```typescript
// In PATCH handler, add validation:
if (branding.whiteLabel && organizationPlan !== 'enterprise') {
  return NextResponse.json(
    { error: 'White label mode requires Enterprise plan' },
    { status: 403 }
  );
}
```

---

## Phase 3: Custom CSS Support (2-3 hours)

### Task 10.1: Update Branding API
- [ ] Add custom CSS validation
- [ ] Sanitize CSS before saving
- [ ] Enforce enterprise plan requirement
- [ ] Return validation errors

**File**: `src/app/api/org/branding/route.ts`
```typescript
import { validateBranding } from '@/lib/branding/branding-validator';
import { sanitizeCSS } from '@/lib/branding/css-sanitizer';

// In PATCH handler:
const validation = validateBranding(branding, organizationPlan);
if (!validation.valid) {
  return NextResponse.json({ errors: validation.errors }, { status: 400 });
}

if (branding.customCSS) {
  branding.customCSS = sanitizeCSS(branding.customCSS, 'branded-app');
}
```

### Task 10.2: Update OrgBrandingSettings UI
- [ ] Add custom CSS textarea
- [ ] Show enterprise badge
- [ ] Display validation errors
- [ ] Add helpful examples

### Task 10.3: Test Custom CSS
- [ ] Test CSS applies correctly
- [ ] Test sanitization works
- [ ] Test scoping prevents conflicts
- [ ] Test in all three interfaces

---

## Phase 4: Preview System (2-3 hours)

### Task 11.1: Add Live Preview
- [ ] Update OrgBrandingSettings component
- [ ] Show logo preview
- [ ] Display color swatches
- [ ] Show font preview
- [ ] Update in real-time

### Task 11.2: Create Preview Page
- [ ] Create `src/app/org/branding-preview/page.tsx`
- [ ] Display sample dashboard
- [ ] Apply branding from session storage
- [ ] Show various UI elements

### Task 11.3: Add Preview Button
- [ ] Add "Preview in New Tab" button
- [ ] Store branding in session storage
- [ ] Open preview page
- [ ] Test shows unsaved changes

---

## Phase 5: API Validation (1-2 hours)

### Task 12.1: Update Branding API
- [ ] Use validation utility
- [ ] Validate all fields
- [ ] Enforce plan restrictions
- [ ] Return detailed errors

### Task 12.2: Add Image Validation
- [ ] Validate file sizes
- [ ] Validate formats
- [ ] Check dimensions for favicons
- [ ] Return clear errors

### Task 12.3: Add Color Validation
- [ ] Support all color formats
- [ ] Validate ranges
- [ ] Return helpful errors

---

## Phase 6: Performance Optimization (2-3 hours)

### Task 13.1: Client-Side Caching
- [ ] Use branding cache in hook
- [ ] Cache for 5 minutes
- [ ] Persist to localStorage
- [ ] Implement invalidation

### Task 13.2: Image Optimization
- [ ] Use Cloudinary transformations
- [ ] Resize logos to 200x60px
- [ ] Resize backgrounds to 1920x400px
- [ ] Enable auto format

### Task 13.3: Lazy Loading
- [ ] Update BrandedBackground
- [ ] Load images after render
- [ ] Show gradient while loading
- [ ] Prevent layout shift

### Task 13.4: Font Optimization
- [ ] Use font-display: swap
- [ ] Preload selected font
- [ ] Cache font files
- [ ] Test doesn't block render

### Task 13.5: CSS Minification
- [ ] Add minification to DynamicStyles
- [ ] Remove comments
- [ ] Optimize selectors
- [ ] Test works correctly

---

## Phase 7: Documentation (1-2 hours)

### Task 14.1: Update Branding Settings UI
- [ ] Add tooltips
- [ ] Show plan badges
- [ ] Add size recommendations
- [ ] Include best practices

### Task 14.2: Update Documentation
- [ ] Document new features
- [ ] Add troubleshooting
- [ ] Include examples
- [ ] Document API endpoints

### Task 14.3: Add Inline Help
- [ ] Add CSS examples
- [ ] Show color picker
- [ ] Display font previews
- [ ] Add "Learn More" links

---

## Testing Checklist

### Manual Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile
- [ ] Test with slow network
- [ ] Test with no branding
- [ ] Test with full branding
- [ ] Test white label mode
- [ ] Test custom CSS

### Functionality Testing
- [ ] Favicon updates correctly
- [ ] Colors apply everywhere
- [ ] Fonts load and apply
- [ ] Backgrounds display
- [ ] Cache works correctly
- [ ] Validation catches errors
- [ ] Plan enforcement works
- [ ] Performance is good

---

## Priority Order

### Must Have (Do First) ⭐
1. ✅ Phase 1: Core Integration (2-4 hours)
2. Phase 2: White Label Mode (2-3 hours)

### Should Have (Do Second)
3. Phase 3: Custom CSS Support (2-3 hours)
4. Phase 5: API Validation (1-2 hours)

### Nice to Have (Do Third)
5. Phase 4: Preview System (2-3 hours)
6. Phase 6: Performance Optimization (2-3 hours)
7. Phase 7: Documentation (1-2 hours)

---

## Time Estimates

- **Minimum Viable**: 4-7 hours (Phases 1-2)
- **Feature Complete**: 10-15 hours (Phases 1-5)
- **Production Ready**: 15-20 hours (All phases)

---

## Success Criteria

### Phase 1 Complete When:
- [ ] DynamicStyles working on all 3 pages
- [ ] BrandedBackground showing on 2 headers
- [ ] Colors and fonts applying correctly
- [ ] No console errors

### Phase 2 Complete When:
- [ ] White label utility created
- [ ] Platform branding hidden when enabled
- [ ] Enterprise plan enforced
- [ ] Tested and working

### All Phases Complete When:
- [ ] All features implemented
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Performance acceptable

---

**Current Status**: Infrastructure Complete (45%)
**Next Action**: Start Phase 1 - Core Integration
**Estimated Time to MVP**: 4-7 hours
