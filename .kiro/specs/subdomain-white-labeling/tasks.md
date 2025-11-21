# Implementation Plan

## Overview

This implementation plan breaks down the subdomain-based white labeling feature into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring the system remains functional throughout development.

---

## Phase 1: Core Infrastructure

- [x] 1. Set up subdomain detection utilities ✅
  - Create `src/lib/subdomain-utils.ts` with subdomain extraction logic
  - Implement hostname parsing for development and production
  - Add reserved subdomain list validation
  - Add subdomain format validation (3-63 chars, lowercase, alphanumeric + hyphens)
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.6_

- [x] 2. Create subdomain cache layer ✅
  - Create `src/lib/subdomain-cache.ts` with in-memory caching
  - Implement get/set/invalidate/clear methods
  - Add TTL-based cache expiration (5 minutes)
  - Add cache statistics tracking
  - _Requirements: 1.3, 4.5_

- [x] 3. Update Organization schema in Firestore ✅
  - Add `subdomain` field to Organization interface in `src/types/firestore.ts`
  - Add `subdomainEnabled` boolean field
  - Add `subdomainCreatedAt` timestamp field
  - Add `subdomainUpdatedAt` timestamp field
  - _Requirements: 2.1_

- [x] 4. Create Firestore composite index ✅
  - Add composite index definition to `firestore.indexes.json`
  - Index fields: `subdomain` (ASCENDING), `subdomainEnabled` (ASCENDING)
  - Document index deployment instructions
  - _Requirements: 2.1, 2.4_

---

## Phase 2: Middleware and Routing

- [x] 5. Implement subdomain detection middleware ✅
  - Enhance `middleware.ts` with subdomain extraction
  - Add organization lookup by subdomain with caching
  - Set `x-org-id`, `x-subdomain`, `x-org-name` headers
  - Handle main portal routing (www, empty subdomain)
  - Handle reserved subdomain blocking
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.6_

- [x] 6. Add organization not found handling ✅
  - Create `/org-not-found` error page
  - Display user-friendly message
  - Add contact information and support links
  - Log subdomain not found errors
  - _Requirements: 1.4, 12.1, 12.4_

- [x] 7. Implement access control in middleware ✅
  - Add user session extraction from cookies
  - Implement `validateUserAccessToOrg` function
  - Check student organization membership
  - Check organization member organization membership
  - Allow platform admin access to all subdomains
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.1, 10.2, 11.1, 11.2, 11.4_

- [x] 8. Create access denied error page ✅
  - Create `/access-denied` page component
  - Display clear explanation of access restriction
  - Provide link to correct subdomain or main portal
  - Log access denied attempts
  - _Requirements: 10.3, 11.2, 12.4, 12.5_

---

## Phase 3: API Endpoints

- [x] 9. Create organization context API ✅
  - Create `/api/subdomain/context/route.ts` endpoint
  - Read `x-org-id` and `x-subdomain` from headers
  - Fetch organization details from Firestore
  - Return organization context and branding
  - Handle main portal case (no subdomain)
  - _Requirements: 1.3, 4.2, 4.5_

- [x] 10. Create subdomain management API ✅
  - Create `/api/admin/organizations/[id]/subdomain/route.ts`
  - Implement PATCH endpoint to assign/update subdomain
  - Validate subdomain format and uniqueness
  - Check for reserved subdomains
  - Update organization document in Firestore
  - Invalidate subdomain cache on update
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 11. Add subdomain validation endpoint ✅
  - Create `/api/admin/subdomain/validate/route.ts`
  - Check subdomain format validity
  - Check subdomain availability (uniqueness)
  - Check against reserved subdomain list
  - Return validation result with error messages
  - _Requirements: 2.2, 2.3, 2.4, 2.6_

---

## Phase 4: Authentication and Session Management

- [ ] 12. Update session management for subdomains
  - Modify session creation to include subdomain context
  - Update cookie domain based on subdomain
  - Implement subdomain-scoped cookie settings
  - Add subdomain field to session data structure
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 13. Enhance authentication flow for subdomain context
  - Update `/api/auth/session/route.ts` to handle subdomain
  - Validate user belongs to subdomain's organization
  - Set appropriate cookie domain for subdomain
  - Handle main portal authentication separately
  - _Requirements: 3.5, 5.1, 5.2, 5.3, 5.4, 10.1, 10.2, 11.1, 11.2_

- [ ] 14. Implement cross-subdomain access prevention
  - Add middleware check for authenticated routes
  - Validate user's orgId matches subdomain's orgId
  - Redirect to access denied page on mismatch
  - Allow platform admins to bypass check
  - Log cross-subdomain access attempts
  - _Requirements: 5.3, 10.1, 10.2, 10.3, 11.1, 11.2, 11.4, 11.5_

---

## Phase 5: Branded Login Pages

- [x] 15. Create organization context hook ✅
  - Create `src/hooks/useOrgContext.ts`
  - Fetch organization context from API
  - Cache context in React state
  - Provide loading and error states
  - _Requirements: 3.1, 3.2, 4.1_

- [ ] 16. Enhance sign-in page with subdomain branding
  - Update `src/app/signin/page.tsx` to use organization context
  - Fetch organization branding on page load
  - Apply DynamicFavicon component with org favicon
  - Apply DynamicStyles component with org colors
  - Display organization logo if available
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [ ] 17. Add white-label mode to login page
  - Conditionally hide platform branding based on `whiteLabel` flag
  - Hide "Powered by Consularly" footer when white-label enabled
  - Display organization name and tagline
  - Apply organization background image
  - _Requirements: 3.3, 3.4_

- [ ] 18. Update login redirect logic for subdomains
  - Modify redirect after successful login
  - Redirect to appropriate dashboard based on role
  - Maintain subdomain context in redirect
  - Handle student vs organization member routing
  - _Requirements: 3.5, 6.5_

---

## Phase 6: Dashboard Branding

- [x] 19. Enhance useBranding hook for subdomain auto-detection ✅
  - Update `src/hooks/useBranding.ts`
  - Auto-detect organization from subdomain context if orgId not provided
  - Fetch organization context API when needed
  - Use subdomain-detected orgId for branding fetch
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 20. Apply subdomain branding to organization dashboard
  - Update organization dashboard pages to use subdomain context
  - Ensure branding loads from subdomain context
  - Apply DynamicFavicon, DynamicStyles, and BrandedBackground
  - Maintain subdomain context across navigation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 21. Apply subdomain branding to student portal
  - Update student portal pages to use subdomain context
  - Apply organization branding to student login page
  - Apply organization branding to student dashboard
  - Apply organization branding to interview pages
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

## Phase 7: Admin Interface

- [x] 22. Create subdomain management UI component ✅
  - Create `src/components/admin/SubdomainManager.tsx`
  - Display current subdomain for organization
  - Add form to assign/update subdomain
  - Show subdomain validation errors
  - Add subdomain enable/disable toggle
  - _Requirements: 2.5_

- [ ] 23. Integrate subdomain manager into admin dashboard
  - Add subdomain management section to organization edit page
  - Display subdomain status and configuration
  - Add button to open subdomain manager
  - Show subdomain URL preview
  - _Requirements: 2.5_

- [ ] 24. Add subdomain listing to organizations table
  - Update organizations list to show subdomain column
  - Display subdomain status (enabled/disabled)
  - Add filter for organizations with/without subdomains
  - Add quick link to visit organization subdomain
  - _Requirements: 2.5_

---

## Phase 8: Error Handling and Edge Cases

- [x] 25. Create subdomain not configured page ✅
  - Create `/subdomain-not-configured` page component
  - Display message that subdomain is not set up
  - Provide contact information for organization admin
  - Add link to main portal
  - _Requirements: 12.2_

- [ ] 26. Add error logging for subdomain issues
  - Create `src/lib/subdomain-logger.ts`
  - Log subdomain not found errors to Firestore
  - Log access denied attempts to Firestore
  - Log subdomain detection failures
  - Include user agent, IP address, timestamp
  - _Requirements: 12.3, 12.5_

- [ ] 27. Add subdomain error monitoring dashboard
  - Create admin page to view subdomain errors
  - Display recent subdomain not found errors
  - Display recent access denied attempts
  - Add filtering and search capabilities
  - _Requirements: 12.5_

---

## Phase 9: Development Environment Support

- [x] 28. Add development environment configuration ✅
  - Add `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING` env variable
  - Add `NEXT_PUBLIC_BASE_DOMAIN` env variable
  - Add `NEXT_PUBLIC_DEV_MODE` env variable
  - Update `.env.local.example` with new variables
  - _Requirements: 8.2_

- [x] 29. Implement localhost subdomain support ✅
  - Update subdomain extraction to handle `subdomain.localhost:3000`
  - Add development mode detection
  - Add logging for subdomain detection in development
  - _Requirements: 8.1, 8.3_

- [x] 30. Create development utilities ✅
  - Create `src/lib/dev-utils.ts` with development helpers
  - Add query parameter override for testing (`?subdomain=acmecorp`)
  - Add subdomain debugging information in dev mode
  - Add console logging for subdomain context
  - _Requirements: 8.3, 8.4_

---

## Phase 10: Documentation and Testing

- [x] 31. Create subdomain setup guide for administrators ✅
  - Document how to assign subdomains to organizations
  - Document subdomain validation rules
  - Document reserved subdomain list
  - Document how to enable/disable subdomain access
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 32. Create DNS configuration guide ✅
  - Document Hostinger DNS wildcard setup
  - Document Vercel domain configuration
  - Document SSL certificate verification
  - Document DNS propagation testing
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 33. Create local development setup guide ✅
  - Document hosts file configuration for local testing
  - Document environment variable setup
  - Document how to test subdomains locally
  - Document troubleshooting common issues
  - _Requirements: 8.1, 8.2, 8.5_

- [x] 34. Create subdomain troubleshooting guide ✅
  - Document common subdomain issues and solutions
  - Document how to debug subdomain detection
  - Document how to verify organization lookup
  - Document how to check access control
  - _Requirements: 8.4, 9.5_

---

## Phase 11: Main Portal Compatibility

- [ ] 35. Ensure main portal functionality preserved
  - Test main portal at `consularly.com` without subdomain
  - Verify admin dashboard access at `/admin`
  - Verify organization dashboard access at `/org`
  - Verify organization selection still works
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 36. Add subdomain discovery feature
  - Add UI element to show user their organization's subdomain
  - Add link to redirect to organization subdomain
  - Display subdomain in organization settings
  - Add subdomain to welcome emails
  - _Requirements: 7.5_

---

## Phase 12: Production Deployment

- [ ] 37. Create deployment checklist document
  - Document pre-deployment verification steps
  - Document DNS configuration verification
  - Document Vercel configuration verification
  - Document environment variable checklist
  - Document post-deployment testing steps
  - _Requirements: 9.4_

- [ ] 38. Create subdomain rollout plan
  - Document gradual rollout strategy
  - Document pilot organization selection
  - Document monitoring and feedback collection
  - Document rollback procedures
  - _Requirements: 7.4_

---

## Notes

- All tasks should be implemented with TypeScript for type safety
- Each task should include error handling and logging
- Each task should maintain backward compatibility with existing functionality
- Testing should be performed after each phase before moving to the next
- Documentation should be updated as features are implemented

## Dependencies

- Phase 2 depends on Phase 1 (core infrastructure must exist)
- Phase 3 depends on Phase 2 (middleware must set headers)
- Phase 4 depends on Phase 2 and 3 (authentication needs middleware and APIs)
- Phase 5 depends on Phase 3 and 4 (login pages need APIs and auth)
- Phase 6 depends on Phase 5 (dashboards need login to work)
- Phase 7 can be developed in parallel with Phase 6
- Phase 8 can be developed in parallel with Phase 6-7
- Phase 9 should be done early for development testing
- Phase 10-12 are final documentation and deployment phases
