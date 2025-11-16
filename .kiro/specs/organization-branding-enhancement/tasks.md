# Implementation Plan

- [x] 1. Set up branding infrastructure

  - Create core branding utilities and hooks that will be used across all components
  - Implement caching and validation layers
  - _Requirements: 1.1, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3_

- [x] 1.1 Create branding cache utility


  - Write `src/lib/branding/branding-cache.ts` with in-memory cache implementation
  - Implement get, set, invalidate, and clear methods with TTL support
  - Add localStorage persistence for cross-session caching
  - _Requirements: 12.1_

- [x] 1.2 Create CSS sanitizer utility


  - Write `src/lib/branding/css-sanitizer.ts` with sanitization logic
  - Implement dangerous pattern removal (javascript:, expression(), @import, etc.)
  - Add selector scoping to prevent global CSS pollution
  - Implement CSS validation with error reporting
  - _Requirements: 9.5, 11.5_

- [x] 1.3 Create branding validator utility


  - Write `src/lib/branding/branding-validator.ts` with validation functions
  - Implement color format validation (hex, rgb, rgba, hsl, hsla)
  - Add URL validation for logos and images
  - Implement plan-based feature restriction validation
  - Add file size and format validation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 1.4 Create font loader utility


  - Write `src/lib/branding/font-loader.ts` with dynamic font loading
  - Implement Google Fonts integration for Inter, Poppins, Roboto, Montserrat
  - Add font-display: swap for performance
  - Create font family CSS generator
  - _Requirements: 3.5, 3.6, 12.4_

- [x] 2. Create branding context and hooks

  - Build React context provider and custom hook for accessing branding throughout the app
  - Implement automatic fetching and caching
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1_

- [x] 2.1 Create BrandingProvider component


  - Write `src/components/branding/BrandingProvider.tsx` with context implementation
  - Implement state management for branding data, loading, and errors
  - Add support for SSR with initialBranding prop
  - Implement automatic refresh on orgId change
  - Add memoization for performance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.2 Create useBranding hook


  - Write `src/hooks/useBranding.ts` with custom hook implementation
  - Implement automatic fetching from cache or API
  - Add error handling with fallback to default branding
  - Create helper method to apply branding to elements
  - Implement refresh functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1_

- [x] 3. Implement dynamic favicon component


  - Create component that injects organization favicon into page metadata
  - Support all page types (org dashboard, student portal, interview pages)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3.1 Create DynamicFavicon component


  - Write `src/components/branding/DynamicFavicon.tsx` using next/head
  - Implement favicon injection with fallback to default
  - Add support for apple-touch-icon
  - Handle favicon URL changes dynamically
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.2 Integrate DynamicFavicon in org dashboard


  - Add DynamicFavicon to `src/app/org/page.tsx` or layout
  - Pass organization favicon from branding context
  - Test favicon appears in browser tab
  - _Requirements: 1.2_

- [x] 3.3 Integrate DynamicFavicon in student portal


  - Add DynamicFavicon to `src/app/student/layout.tsx`
  - Pass organization favicon from student's org branding
  - Test favicon appears in browser tab
  - _Requirements: 1.3_

- [x] 3.4 Integrate DynamicFavicon in interview pages


  - Add DynamicFavicon to `src/app/interview/[id]/layout.tsx` or page
  - Fetch and pass organization favicon based on interview's orgId
  - Test favicon appears during interview
  - _Requirements: 1.4, 5.4_

- [x] 4. Implement dynamic styles component

  - Create component that injects organization colors, fonts, and custom CSS
  - Ensure proper scoping and sanitization
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.2, 9.3, 9.4, 9.5, 12.3_

- [x] 4.1 Create DynamicStyles component


  - Write `src/components/branding/DynamicStyles.tsx` with style injection
  - Generate CSS variables for colors (--brand-primary, --brand-secondary, --brand-background)
  - Apply font family to scoped container
  - Inject sanitized custom CSS with proper scoping
  - Use <style> tag with unique ID to prevent duplicates
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.2, 9.3, 9.4, 9.5, 12.3_

- [x] 4.2 Update component styles to use CSS variables

  - Modify button components to use var(--brand-primary)
  - Update link styles to use brand colors
  - Apply brand colors to active states and highlights
  - Update progress indicators and badges
  - Ensure secondary color is used for accents
  - _Requirements: 4.4, 4.5, 4.6_

- [x] 4.3 Integrate DynamicStyles in org dashboard


  - Add DynamicStyles to `src/components/org/OrganizationDashboard.tsx`
  - Wrap dashboard content with branded-app class
  - Load selected font family
  - Test colors and fonts are applied correctly
  - _Requirements: 3.2, 4.1_

- [x] 4.4 Integrate DynamicStyles in student portal


  - Add DynamicStyles to `src/app/student/page.tsx`
  - Wrap student portal content with branded-app class
  - Load selected font family
  - Test colors and fonts are applied correctly
  - _Requirements: 3.3, 4.2_

- [x] 4.5 Integrate DynamicStyles in interview pages


  - Add DynamicStyles to `src/components/interview/InterviewRunner.tsx`
  - Wrap interview content with branded-app class
  - Load selected font family
  - Test colors and fonts are applied during interview
  - _Requirements: 3.4, 4.3, 5.2, 5.3_

- [x] 5. Implement branded background component

  - Create component for rendering hero sections with organization background images
  - Support gradient overlays for text readability
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.5_

- [x] 5.1 Create BrandedBackground component



  - Write `src/components/branding/BrandedBackground.tsx` with background rendering
  - Support background image with gradient overlay
  - Fallback to gradient-only when no image provided
  - Ensure text readability with overlay opacity
  - Add lazy loading for background images
  - Make height configurable
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.5_

- [x] 5.2 Integrate BrandedBackground in org dashboard header

  - Replace existing header in `src/components/org/OrganizationDashboard.tsx`
  - Pass background image and colors from branding
  - Display organization logo and welcome message
  - Test background renders correctly
  - _Requirements: 2.2_

- [x] 5.3 Integrate BrandedBackground in student portal header

  - Replace existing header in `src/app/student/page.tsx`
  - Pass background image and colors from branding
  - Display organization logo and tagline
  - Test background renders correctly
  - _Requirements: 2.3_

- [x] 6. Enhance interview page branding

  - Apply comprehensive branding to interview pages including logo, colors, fonts, and favicon
  - Ensure white label mode hides platform branding
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Add organization logo to interview header

  - Modify `src/components/interview/InterviewRunner.tsx` to display org logo
  - Fetch organization data based on interview's orgId
  - Position logo in header alongside interview controls
  - Handle missing logo gracefully
  - _Requirements: 5.1_

- [x] 6.2 Apply brand colors to interview UI

  - Update interview progress bar to use brand primary color
  - Apply brand colors to buttons and interactive elements
  - Use brand secondary color for highlights and accents
  - Test color application throughout interview flow
  - _Requirements: 5.2_

- [x] 6.3 Implement white label mode for interview pages

  - Check whiteLabel flag from organization branding
  - Hide platform logo and branding when enabled
  - Show only organization branding elements
  - Test white label mode works correctly
  - _Requirements: 5.5, 8.3_

- [x] 7. Enhance email template branding

  - Update email templates to include comprehensive organization branding
  - Support white label mode in emails
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Update email template generator

  - Modify `src/lib/email-service.ts` generateEmailTemplate function
  - Include organization logo in email header with proper sizing
  - Apply primary and secondary colors to email elements (buttons, headers, accents)
  - Add organization footer text and social links
  - Use organization company name as sender name
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7.2 Implement white label mode for emails

  - Check whiteLabel flag in email generation
  - Remove all platform branding and references when enabled
  - Show only organization branding
  - Test white label emails render correctly
  - _Requirements: 6.5, 8.4_

- [x] 7.3 Update all email templates

  - Update student invitation email in `src/lib/student-invitation.ts`
  - Update scheduling confirmation emails
  - Update reminder emails
  - Update cancellation emails
  - Ensure all emails use enhanced branding
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Enhance PDF report branding


  - Update PDF report generation to include comprehensive organization branding
  - Support white label mode in reports
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.1 Update PDF report HTML generator

  - Modify `src/app/api/report/[id]/pdf/route.ts` generateReportHTML function
  - Include organization logo in report header with proper sizing
  - Apply primary color to report headings and section dividers
  - Apply organization font family to report text
  - Add organization company name and footer text
  - Improve logo display with better styling
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8.2 Implement white label mode for PDF reports

  - Check whiteLabel flag in report generation
  - Remove all platform branding and watermarks when enabled
  - Show only organization branding
  - Test white label reports render correctly
  - _Requirements: 7.5, 8.5_

- [x] 8.3 Enhance PDF report styling

  - Use organization colors for charts and graphs
  - Apply brand colors to score indicators
  - Style decision badges with brand colors
  - Ensure consistent branding throughout report
  - _Requirements: 7.2_

- [x] 9. Implement white label mode

  - Create system to hide platform branding when white label mode is enabled
  - Enforce enterprise plan requirement
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 9.1 Create white label utility


  - Write `src/lib/branding/white-label.ts` with helper functions
  - Implement shouldShowPlatformBranding function
  - Add component wrapper for conditional platform branding
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 9.2 Hide platform branding in org dashboard

  - Wrap platform logos and references with white label check
  - Test platform branding is hidden when white label enabled
  - Ensure organization branding is prominent
  - _Requirements: 8.1_

- [x] 9.3 Hide platform branding in student portal

  - Wrap platform logos and references with white label check
  - Test platform branding is hidden when white label enabled
  - Ensure organization branding is prominent
  - _Requirements: 8.2_

- [x] 9.4 Enforce enterprise plan requirement

  - Update `src/app/api/org/branding/route.ts` to validate plan
  - Prevent non-enterprise orgs from enabling white label mode
  - Return clear error message when plan insufficient
  - Add enterprise badge to white label toggle in UI
  - _Requirements: 8.6, 8.7_

- [x] 10. Implement custom CSS support

  - Add ability for enterprise organizations to inject custom CSS
  - Ensure proper sanitization and scoping
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 10.1 Update branding API to handle custom CSS

  - Modify `src/app/api/org/branding/route.ts` PATCH handler
  - Validate custom CSS syntax before saving
  - Sanitize CSS to remove dangerous patterns
  - Enforce enterprise plan requirement
  - Return validation errors to client
  - _Requirements: 9.1, 9.5, 9.6_

- [x] 10.2 Update OrgBrandingSettings component

  - Modify `src/components/org/OrgBrandingSettings.tsx` Advanced tab
  - Add custom CSS textarea with syntax highlighting
  - Show enterprise badge and plan requirement
  - Display validation errors inline
  - Add helpful examples and documentation
  - _Requirements: 9.1, 9.6_

- [x] 10.3 Inject custom CSS in applications

  - Update DynamicStyles component to include custom CSS
  - Apply CSS sanitization and scoping
  - Test custom CSS works in org dashboard
  - Test custom CSS works in student portal
  - Ensure custom CSS doesn't break layouts
  - _Requirements: 9.2, 9.3, 9.4_

- [x] 11. Add branding preview functionality

  - Create preview system for testing branding changes before saving
  - Add preview in new tab feature
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11.1 Add live preview to branding settings

  - Update `src/components/org/OrgBrandingSettings.tsx` with preview section
  - Show logo preview with white background
  - Display color swatches with current selections
  - Show font preview with sample text
  - Update preview in real-time as settings change
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 11.2 Create preview page

  - Write `src/app/org/branding-preview/page.tsx` with sample content
  - Display sample dashboard with current branding
  - Show buttons, cards, and other UI elements
  - Apply branding from URL parameters or session storage
  - _Requirements: 10.5_

- [x] 11.3 Add "Preview in New Tab" button

  - Add button to OrgBrandingSettings component
  - Store current branding in session storage
  - Open preview page in new tab
  - Test preview shows unsaved changes
  - _Requirements: 10.5_

- [x] 12. Enhance branding API with validation

  - Update API endpoints to validate all branding inputs
  - Enforce plan restrictions server-side
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12.1 Update branding API PATCH handler

  - Modify `src/app/api/org/branding/route.ts` to use validation utility
  - Validate all branding fields before saving
  - Enforce plan-based restrictions (enterprise features)
  - Return detailed validation errors
  - Sanitize custom CSS before storing
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12.2 Add image validation to upload flow

  - Update `src/lib/cloudinary.ts` with enhanced validation
  - Validate file size limits (5MB for logos, 10MB for backgrounds)
  - Validate file formats (PNG, JPG, SVG, WebP, ICO)
  - Check image dimensions for favicons (32x32 or 64x64)
  - Return clear error messages
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 12.3 Add color validation

  - Update branding validator to check color formats
  - Support hex, rgb, rgba, hsl, hsla formats
  - Validate color values are within valid ranges
  - Return helpful error messages
  - _Requirements: 11.4_

- [x] 13. Optimize branding performance

  - Implement caching and optimization strategies
  - Ensure fast page loads with branding
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 13.1 Implement client-side caching

  - Use branding cache utility in useBranding hook
  - Cache branding data for 5 minutes
  - Persist to localStorage for cross-session caching
  - Implement cache invalidation on updates
  - _Requirements: 12.1_

- [x] 13.2 Optimize image loading

  - Use Cloudinary transformations for all branding images
  - Resize logos to 200x60px
  - Resize backgrounds to 1920x400px
  - Enable auto format (WebP when supported)
  - Set quality to auto for optimal size
  - _Requirements: 12.2_

- [x] 13.3 Implement lazy loading for backgrounds

  - Update BrandedBackground component with lazy loading
  - Load background images after initial render
  - Show gradient while image loads
  - Prevent layout shift during load
  - _Requirements: 12.5_

- [x] 13.4 Optimize font loading

  - Use font-display: swap for all custom fonts
  - Preload selected font family
  - Cache font files in browser
  - Test font loading doesn't block render
  - _Requirements: 12.4_

- [x] 13.5 Minify custom CSS

  - Add CSS minification to DynamicStyles component
  - Remove comments and whitespace
  - Optimize selector specificity
  - Test minified CSS works correctly
  - _Requirements: 12.3_

- [x] 14. Update documentation and UI

  - Add helpful documentation and improve user experience
  - Ensure users understand branding capabilities
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 14.1 Update branding settings UI

  - Enhance `src/components/org/OrgBrandingSettings.tsx` with better descriptions
  - Add tooltips explaining each branding option
  - Show plan badges (Basic, Premium, Enterprise)
  - Add image size and format recommendations
  - Include best practices for logos and colors
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 14.2 Update ORGANIZATION_BRANDING_GUIDE.md

  - Document new features (favicon, background, fonts, white label, custom CSS)
  - Add troubleshooting section
  - Include examples and screenshots
  - Document API endpoints and usage
  - Add security best practices
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 14.3 Add inline help and examples

  - Add example CSS snippets for custom CSS field
  - Show color picker with preset brand colors
  - Display font preview samples
  - Add "Learn More" links to documentation
  - _Requirements: 9.1, 10.1_

- [x] 15. Testing and quality assurance

  - Comprehensive testing of all branding features
  - Ensure security and performance standards are met
  - _Requirements: All_

- [ ]* 15.1 Write unit tests for utilities
  - Test CSS sanitizer removes dangerous patterns
  - Test CSS sanitizer scopes selectors correctly
  - Test branding validator catches invalid inputs
  - Test font loader loads correct fonts
  - Test cache utility stores and retrieves correctly
  - _Requirements: 9.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 15.2 Write integration tests for components
  - Test useBranding hook fetches and caches data
  - Test DynamicFavicon injects correct favicon
  - Test DynamicStyles applies colors and fonts
  - Test BrandedBackground renders correctly
  - Test white label mode hides platform branding
  - _Requirements: 1.1, 2.1, 3.1, 8.1, 8.2, 8.3_

- [ ]* 15.3 Write E2E tests for branding flows
  - Test uploading and applying logo
  - Test changing colors updates UI
  - Test selecting font changes typography
  - Test white label mode across all pages
  - Test custom CSS applies correctly
  - Test preview functionality
  - _Requirements: All_

- [x] 15.4 Manual testing across browsers

  - Test in Chrome, Firefox, Safari, Edge
  - Verify favicon appears correctly
  - Check color application and contrast
  - Test font rendering
  - Verify background images load
  - Test responsive design
  - _Requirements: All_

- [x] 15.5 Security audit

  - Review CSS sanitization effectiveness
  - Test XSS prevention in custom CSS
  - Verify plan enforcement works
  - Check image upload security
  - Test URL validation
  - Review error handling
  - _Requirements: 9.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 15.6 Performance testing

  - Measure page load time impact
  - Test cache hit rates
  - Verify image optimization
  - Check font loading performance
  - Test with slow network conditions
  - Ensure no memory leaks
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 16. Deployment and rollout


  - Deploy branding enhancements to production
  - Monitor for issues and gather feedback
  - _Requirements: All_

- [x] 16.1 Deploy to staging environment

  - Deploy all branding changes to staging
  - Run full test suite
  - Perform manual QA
  - Fix any issues found
  - _Requirements: All_

- [x] 16.2 Beta test with pilot organizations

  - Enable branding features for 3-5 pilot orgs
  - Gather feedback on usability
  - Monitor for errors and performance issues
  - Make adjustments based on feedback
  - _Requirements: All_

- [x] 16.3 Deploy to production

  - Deploy branding enhancements to production
  - Enable for all organizations gradually
  - Monitor error rates and performance
  - Set up alerts for issues
  - _Requirements: All_

- [x] 16.4 Create announcement and documentation

  - Write announcement email for organizations
  - Create video tutorial for branding setup
  - Update help center documentation
  - Announce feature on platform
  - _Requirements: All_
