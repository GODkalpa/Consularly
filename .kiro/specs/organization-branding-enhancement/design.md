# Design Document: Organization Branding Enhancement

## Overview

This design document outlines the architecture and implementation approach for enhancing the organization branding system to provide comprehensive white-label capabilities. The system will enable organizations to fully customize their visual identity across all user touchpoints including dashboards, interview pages, emails, and PDF reports.

### Current State Analysis

**Strengths:**
- ✅ Basic branding infrastructure exists (logo upload, color settings)
- ✅ Cloudinary integration for image storage
- ✅ Branding API endpoints (`/api/org/branding`)
- ✅ Type definitions for `OrganizationBranding` interface
- ✅ Email templates with partial branding support
- ✅ PDF report generation with basic organization info

**Gaps:**
- ❌ Favicon not dynamically applied
- ❌ Background images uploaded but not rendered
- ❌ Font family selected but not applied
- ❌ Interview pages lack branding
- ❌ White label mode not implemented
- ❌ Custom CSS not supported
- ❌ Inconsistent color application across pages
- ❌ PDF reports lack comprehensive branding

### Design Goals

1. **Seamless White-Label Experience**: Organizations should feel like they're using their own platform
2. **Performance**: Branding should not impact page load times
3. **Flexibility**: Support basic to enterprise-level customization
4. **Consistency**: Branding applied uniformly across all touchpoints
5. **Security**: Prevent XSS and CSS injection attacks
6. **Maintainability**: Clean architecture that's easy to extend

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Org Dashboard│  │Student Portal│  │Interview Page│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │ Branding Hook  │                        │
│                    │ (useBranding)  │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Branding Cache  │
                    │  (5 min TTL)     │
                    └────────┬─────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Backend Services                           │
│                    ┌───────▼────────┐                         │
│                    │ Branding API   │                         │
│                    │ /api/org/      │                         │
│                    │   branding     │                         │
│                    └───────┬────────┘                         │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐      │
│  │  Firestore  │  │   Cloudinary    │  │Email Service│      │
│  │ (branding)  │  │  (images)       │  │  (Brevo)    │      │
│  └─────────────┘  └─────────────────┘  └────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── hooks/
│   └── useBranding.ts                    # NEW: Central branding hook
├── components/
│   ├── branding/
│   │   ├── BrandingProvider.tsx          # NEW: Context provider
│   │   ├── DynamicFavicon.tsx            # NEW: Favicon injector
│   │   ├── DynamicStyles.tsx             # NEW: CSS injector
│   │   └── BrandedBackground.tsx         # NEW: Background component
│   └── org/
│       └── OrgBrandingSettings.tsx       # ENHANCED: Add preview
├── lib/
│   ├── branding/
│   │   ├── branding-cache.ts             # NEW: Client-side cache
│   │   ├── branding-validator.ts         # NEW: Validation logic
│   │   ├── css-sanitizer.ts              # NEW: CSS security
│   │   └── font-loader.ts                # NEW: Dynamic font loading
│   └── email-branding.ts                 # ENHANCED: Full branding
├── app/
│   ├── org/
│   │   └── layout.tsx                    # ENHANCED: Add branding
│   ├── student/
│   │   └── layout.tsx                    # ENHANCED: Add branding
│   └── interview/
│       └── [id]/
│           └── layout.tsx                # ENHANCED: Add branding
└── api/
    ├── org/
    │   └── branding/
    │       └── route.ts                  # ENHANCED: Add validation
    └── report/
        └── [id]/
            └── pdf/
                └── route.ts              # ENHANCED: Full branding
```

## Components and Interfaces

### 1. Branding Hook (`useBranding`)

**Purpose**: Central hook for accessing organization branding across all components.

```typescript
// src/hooks/useBranding.ts

interface BrandingContextValue {
  branding: OrganizationBranding | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  applyBranding: (element: HTMLElement) => void;
}

export function useBranding(): BrandingContextValue {
  // Fetches branding from cache or API
  // Returns branding data with helper methods
}
```

**Key Features:**
- Automatic caching (5-minute TTL)
- Lazy loading (fetch on first use)
- Error handling and retry logic
- Helper method to apply branding to elements

### 2. Branding Provider (`BrandingProvider`)

**Purpose**: Context provider that wraps applications and provides branding data.

```typescript
// src/components/branding/BrandingProvider.tsx

interface BrandingProviderProps {
  children: React.ReactNode;
  orgId?: string;
  initialBranding?: OrganizationBranding;
}

export function BrandingProvider({ 
  children, 
  orgId, 
  initialBranding 
}: BrandingProviderProps) {
  // Manages branding state
  // Provides context to children
  // Handles SSR with initialBranding
}
```

**Implementation Details:**
- Server-side rendering support via `initialBranding`
- Automatic refresh on orgId change
- Memoized context value for performance

### 3. Dynamic Favicon (`DynamicFavicon`)

**Purpose**: Injects organization favicon into page metadata.

```typescript
// src/components/branding/DynamicFavicon.tsx

interface DynamicFaviconProps {
  faviconUrl?: string;
}

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  // Uses next/head to inject favicon link
  // Falls back to default if not provided
}
```

**Implementation:**
```tsx
import Head from 'next/head';

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  const favicon = faviconUrl || '/favicon.ico';
  
  return (
    <Head>
      <link rel="icon" href={favicon} />
      <link rel="apple-touch-icon" href={favicon} />
    </Head>
  );
}
```

### 4. Dynamic Styles (`DynamicStyles`)

**Purpose**: Injects organization colors, fonts, and custom CSS.

```typescript
// src/components/branding/DynamicStyles.tsx

interface DynamicStylesProps {
  branding: OrganizationBranding;
  scope?: string; // CSS class scope
}

export function DynamicStyles({ 
  branding, 
  scope = 'branded-app' 
}: DynamicStylesProps) {
  // Generates CSS from branding
  // Injects into <style> tag
  // Sanitizes custom CSS
}
```

**Generated CSS Structure:**
```css
/* Color variables */
.branded-app {
  --brand-primary: #1d4ed8;
  --brand-secondary: #7c3aed;
  --brand-background: #ffffff;
}

/* Font family */
.branded-app {
  font-family: 'Poppins', sans-serif;
}

/* Component overrides */
.branded-app .btn-primary {
  background-color: var(--brand-primary);
}

/* Custom CSS (sanitized) */
.branded-app .custom-styles {
  /* User's custom CSS here */
}
```

### 5. Branded Background (`BrandedBackground`)

**Purpose**: Renders hero sections with organization background images.

```typescript
// src/components/branding/BrandedBackground.tsx

interface BrandedBackgroundProps {
  backgroundImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  children: React.ReactNode;
  height?: string;
}

export function BrandedBackground({
  backgroundImage,
  primaryColor,
  secondaryColor,
  children,
  height = '300px'
}: BrandedBackgroundProps) {
  // Renders background with gradient overlay
  // Ensures text readability
}
```

**Implementation:**
```tsx
<div 
  className="branded-background"
  style={{
    height,
    backgroundImage: backgroundImage 
      ? `linear-gradient(135deg, ${primaryColor}CC 0%, ${secondaryColor}CC 100%), url(${backgroundImage})`
      : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  <div className="content-overlay">
    {children}
  </div>
</div>
```

### 6. Branding Cache (`branding-cache.ts`)

**Purpose**: Client-side caching to reduce API calls.

```typescript
// src/lib/branding/branding-cache.ts

interface CacheEntry {
  data: OrganizationBranding;
  timestamp: number;
  ttl: number; // milliseconds
}

class BrandingCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  get(orgId: string): OrganizationBranding | null {
    const entry = this.cache.get(orgId);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(orgId);
      return null;
    }
    
    return entry.data;
  }
  
  set(orgId: string, data: OrganizationBranding, ttl = 5 * 60 * 1000) {
    this.cache.set(orgId, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  invalidate(orgId: string) {
    this.cache.delete(orgId);
  }
  
  clear() {
    this.cache.clear();
  }
}

export const brandingCache = new BrandingCache();
```

### 7. CSS Sanitizer (`css-sanitizer.ts`)

**Purpose**: Prevent XSS attacks through custom CSS.

```typescript
// src/lib/branding/css-sanitizer.ts

export function sanitizeCSS(css: string, scope: string): string {
  // Remove dangerous patterns
  const dangerous = [
    /javascript:/gi,
    /expression\(/gi,
    /import\s+/gi,
    /@import/gi,
    /behavior:/gi,
    /-moz-binding:/gi,
  ];
  
  let sanitized = css;
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Scope all selectors
  sanitized = scopeSelectors(sanitized, scope);
  
  return sanitized;
}

function scopeSelectors(css: string, scope: string): string {
  // Parse CSS and prepend scope to all selectors
  // Example: ".btn" becomes ".branded-app .btn"
  
  return css.replace(
    /([^{}]+)\{/g,
    (match, selector) => {
      const trimmed = selector.trim();
      if (trimmed.startsWith('@')) return match; // Keep @media, @keyframes
      return `.${scope} ${trimmed} {`;
    }
  );
}

export function validateCSS(css: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for balanced braces
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in CSS');
  }
  
  // Check for dangerous patterns
  if (/javascript:/i.test(css)) {
    errors.push('JavaScript URLs not allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 8. Font Loader (`font-loader.ts`)

**Purpose**: Dynamically load Google Fonts based on selection.

```typescript
// src/lib/branding/font-loader.ts

const FONT_MAP = {
  inter: 'Inter:wght@400;500;600;700',
  poppins: 'Poppins:wght@400;500;600;700',
  roboto: 'Roboto:wght@400;500;700',
  montserrat: 'Montserrat:wght@400;500;600;700',
  system: null, // Use system fonts
};

export function loadFont(fontFamily: keyof typeof FONT_MAP) {
  if (fontFamily === 'system') return;
  
  const fontQuery = FONT_MAP[fontFamily];
  if (!fontQuery) return;
  
  // Check if already loaded
  const existingLink = document.querySelector(
    `link[href*="${fontFamily}"]`
  );
  if (existingLink) return;
  
  // Create and inject font link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  document.head.appendChild(link);
}

export function getFontFamilyCSS(fontFamily: keyof typeof FONT_MAP): string {
  const fontMap = {
    inter: "'Inter', sans-serif",
    poppins: "'Poppins', sans-serif",
    roboto: "'Roboto', sans-serif",
    montserrat: "'Montserrat', sans-serif",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
  
  return fontMap[fontFamily] || fontMap.inter;
}
```

### 9. Branding Validator (`branding-validator.ts`)

**Purpose**: Validate branding inputs before saving.

```typescript
// src/lib/branding/branding-validator.ts

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateBranding(
  branding: Partial<OrganizationBranding>,
  plan: 'basic' | 'premium' | 'enterprise'
): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate colors
  if (branding.primaryColor && !isValidColor(branding.primaryColor)) {
    errors.primaryColor = 'Invalid color format';
  }
  if (branding.secondaryColor && !isValidColor(branding.secondaryColor)) {
    errors.secondaryColor = 'Invalid color format';
  }
  
  // Validate URLs
  if (branding.logoUrl && !isValidUrl(branding.logoUrl)) {
    errors.logoUrl = 'Invalid logo URL';
  }
  if (branding.favicon && !isValidUrl(branding.favicon)) {
    errors.favicon = 'Invalid favicon URL';
  }
  
  // Validate plan restrictions
  if (plan !== 'enterprise') {
    if (branding.customCSS) {
      errors.customCSS = 'Custom CSS requires Enterprise plan';
    }
    if (branding.whiteLabel) {
      errors.whiteLabel = 'White label mode requires Enterprise plan';
    }
  }
  
  // Validate custom CSS
  if (branding.customCSS) {
    const cssValidation = validateCSS(branding.customCSS);
    if (!cssValidation.valid) {
      errors.customCSS = cssValidation.errors.join(', ');
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

function isValidColor(color: string): boolean {
  // Validate hex, rgb, rgba, hsl, hsla
  const patterns = [
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/,
    /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/,
  ];
  
  return patterns.some(pattern => pattern.test(color));
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

## Data Models

### Enhanced OrganizationBranding Interface

```typescript
// src/types/firestore.ts (already exists, no changes needed)

export interface OrganizationBranding {
  // Logo variants
  logoUrl?: string;
  logoLight?: string;
  logoDark?: string;
  favicon?: string;
  
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  
  // Text branding
  companyName?: string;
  tagline?: string;
  welcomeMessage?: string;
  footerText?: string;
  
  // Visual assets
  backgroundImage?: string;
  
  // Typography
  fontFamily?: 'inter' | 'poppins' | 'roboto' | 'montserrat' | 'system';
  
  // Social links
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  
  // Advanced (enterprise)
  customCSS?: string;
  whiteLabel?: boolean;
}
```

### Branding Cache Entry

```typescript
interface BrandingCacheEntry {
  orgId: string;
  branding: OrganizationBranding;
  timestamp: number;
  ttl: number;
}
```

## Error Handling

### Client-Side Error Handling

```typescript
// Graceful degradation strategy

function useBranding() {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchBranding()
      .catch(err => {
        console.error('Failed to load branding:', err);
        setError(err);
        // Use default branding
        setBranding(DEFAULT_BRANDING);
      });
  }, []);
  
  return { branding, error };
}

const DEFAULT_BRANDING: OrganizationBranding = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  fontFamily: 'inter',
};
```

### Server-Side Error Handling

```typescript
// API route error handling

export async function PATCH(req: NextRequest) {
  try {
    const { branding } = await req.json();
    
    // Validate
    const validation = validateBranding(branding, userPlan);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Save
    await saveBranding(orgId, branding);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Branding update failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// src/lib/branding/__tests__/css-sanitizer.test.ts

describe('CSS Sanitizer', () => {
  it('should remove javascript: URLs', () => {
    const malicious = '.btn { background: url(javascript:alert(1)); }';
    const sanitized = sanitizeCSS(malicious, 'app');
    expect(sanitized).not.toContain('javascript:');
  });
  
  it('should scope selectors', () => {
    const css = '.btn { color: red; }';
    const scoped = sanitizeCSS(css, 'app');
    expect(scoped).toContain('.app .btn');
  });
  
  it('should preserve @media queries', () => {
    const css = '@media (max-width: 768px) { .btn { display: none; } }';
    const sanitized = sanitizeCSS(css, 'app');
    expect(sanitized).toContain('@media');
  });
});
```

### Integration Tests

```typescript
// src/hooks/__tests__/useBranding.test.tsx

describe('useBranding Hook', () => {
  it('should fetch branding from API', async () => {
    const { result } = renderHook(() => useBranding());
    
    await waitFor(() => {
      expect(result.current.branding).not.toBeNull();
    });
  });
  
  it('should use cached branding', async () => {
    brandingCache.set('org-123', mockBranding);
    
    const { result } = renderHook(() => useBranding());
    
    expect(result.current.branding).toEqual(mockBranding);
    expect(result.current.loading).toBe(false);
  });
  
  it('should handle errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useBranding());
    
    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.branding).toEqual(DEFAULT_BRANDING);
    });
  });
});
```

### E2E Tests

```typescript
// e2e/branding.spec.ts

describe('Organization Branding', () => {
  it('should apply custom favicon', async () => {
    await page.goto('/org');
    
    const favicon = await page.$('link[rel="icon"]');
    const href = await favicon?.getAttribute('href');
    
    expect(href).toContain('cloudinary.com');
  });
  
  it('should apply custom colors', async () => {
    await page.goto('/org');
    
    const button = await page.$('.btn-primary');
    const bgColor = await button?.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(bgColor).toBe('rgb(29, 78, 216)'); // #1d4ed8
  });
  
  it('should hide platform branding in white label mode', async () => {
    await enableWhiteLabelMode();
    await page.goto('/student');
    
    const platformLogo = await page.$('[data-testid="platform-logo"]');
    expect(platformLogo).toBeNull();
  });
});
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Multi-layer caching

// Layer 1: In-memory cache (client)
const brandingCache = new Map<string, CacheEntry>();

// Layer 2: localStorage (persistent)
function persistBranding(orgId: string, branding: OrganizationBranding) {
  try {
    localStorage.setItem(
      `branding:${orgId}`,
      JSON.stringify({ branding, timestamp: Date.now() })
    );
  } catch (e) {
    // Quota exceeded, ignore
  }
}

// Layer 3: Server-side cache (Redis/Firestore cache)
// Implemented in API routes
```

### 2. Image Optimization

```typescript
// Use Cloudinary transformations

function getOptimizedLogoUrl(logoUrl: string): string {
  return getTransformedImageUrl(logoUrl, {
    width: 200,
    height: 60,
    crop: 'fit',
    quality: 'auto',
    format: 'auto', // WebP when supported
  });
}

function getOptimizedBackgroundUrl(bgUrl: string): string {
  return getTransformedImageUrl(bgUrl, {
    width: 1920,
    height: 400,
    crop: 'fill',
    quality: 80,
    format: 'auto',
  });
}
```

### 3. Lazy Loading

```typescript
// Lazy load background images

<div 
  className="branded-background"
  style={{
    backgroundImage: 'none', // Initial
  }}
  ref={el => {
    if (el && backgroundImage) {
      // Load image
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url(${backgroundImage})`;
      };
      img.src = backgroundImage;
    }
  }}
>
```

### 4. Font Loading Strategy

```typescript
// Use font-display: swap

<link 
  rel="stylesheet" 
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
/>

// Or use next/font for optimization
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});
```

## Security Considerations

### 1. CSS Injection Prevention

- Sanitize all custom CSS
- Scope selectors to prevent global pollution
- Remove dangerous patterns (javascript:, expression(), etc.)
- Validate CSS syntax before saving

### 2. XSS Prevention

- Escape all user-provided text in emails and PDFs
- Use React's built-in XSS protection
- Validate URLs before rendering
- Use Content Security Policy headers

### 3. Image Upload Security

- Validate file types and sizes
- Use Cloudinary's security features
- Implement rate limiting on uploads
- Scan for malicious content

### 4. Plan Enforcement

```typescript
// Server-side plan validation

function enforcePlanRestrictions(
  branding: OrganizationBranding,
  plan: string
): OrganizationBranding {
  if (plan !== 'enterprise') {
    // Remove enterprise-only features
    delete branding.customCSS;
    delete branding.whiteLabel;
  }
  
  return branding;
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
- Create branding hook and provider
- Implement caching layer
- Add validation and sanitization

### Phase 2: Core Features (Week 2)
- Implement dynamic favicon
- Apply background images
- Load and apply fonts
- Enhance color application

### Phase 3: Advanced Features (Week 3)
- Implement white label mode
- Add custom CSS support
- Create preview functionality
- Enhance PDF branding

### Phase 4: Polish (Week 4)
- Performance optimization
- Security hardening
- Testing and bug fixes
- Documentation

## Rollout Plan

### 1. Beta Testing
- Enable for 3-5 pilot organizations
- Gather feedback
- Fix critical issues

### 2. Gradual Rollout
- Enable for Premium plans
- Monitor performance
- Enable for Enterprise plans

### 3. Full Release
- Enable for all plans
- Announce feature
- Provide documentation

## Monitoring and Metrics

### Key Metrics

1. **Performance**
   - Page load time impact
   - Image load times
   - Cache hit rate

2. **Usage**
   - % of orgs with custom branding
   - Most used features
   - Upload success rate

3. **Errors**
   - Validation failures
   - Upload failures
   - CSS sanitization triggers

### Monitoring Tools

```typescript
// Track branding performance

function trackBrandingLoad(orgId: string, duration: number) {
  analytics.track('branding_loaded', {
    orgId,
    duration,
    cached: duration < 100,
  });
}

// Track errors

function trackBrandingError(error: Error, context: string) {
  errorTracking.captureException(error, {
    tags: { component: 'branding', context },
  });
}
```

## Future Enhancements

### Potential Features

1. **Theme Presets**: Pre-designed color schemes
2. **Dark Mode**: Separate branding for dark mode
3. **Multiple Logos**: Different logos for different contexts
4. **Animation Customization**: Custom loading animations
5. **Email Template Builder**: Visual email template editor
6. **A/B Testing**: Test different branding variations
7. **Brand Guidelines Export**: Generate brand guideline PDFs
8. **Multi-language Support**: Localized branding text

### Technical Improvements

1. **Server-Side Rendering**: Pre-render with branding
2. **Edge Caching**: Cache branding at CDN edge
3. **Real-time Preview**: Live preview as you edit
4. **Version History**: Track branding changes over time
5. **Approval Workflow**: Require approval for branding changes
