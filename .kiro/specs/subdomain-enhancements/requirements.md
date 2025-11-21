# Subdomain Enhancements - Requirements

## Overview
Enhance the subdomain feature with admin UI, auto-generation, and custom landing pages.

## User Stories

### 1. Admin Subdomain Management
**As an admin**, I want to manage organization subdomains from the dashboard, so I can easily assign and modify subdomains without using Firestore directly.

**Acceptance Criteria:**
- View all organizations with their current subdomains
- Edit/assign subdomain for any organization
- Enable/disable subdomain feature per organization
- See subdomain availability status
- Quick link to visit organization's subdomain

### 2. Auto-Generate Subdomain on Org Creation
**As an admin**, when I create a new organization, I want a subdomain to be automatically generated from the organization name, so I don't have to manually create it.

**Acceptance Criteria:**
- Subdomain auto-generated from org name (e.g., "Acme Corp" → "acmecorp")
- Remove special characters and spaces
- Check for uniqueness, append number if needed (e.g., "acmecorp2")
- Subdomain enabled by default
- Admin can edit the generated subdomain before saving

### 3. Custom Subdomain Landing Page
**As an organization**, when users visit my subdomain, I want them to see a branded login page (not the main homepage), so they have a focused experience.

**Acceptance Criteria:**
- Subdomain homepage shows login page, not marketing homepage
- Display organization logo and name
- Custom branding (colors, background) if configured
- "Sign in to [Org Name]" heading
- Link to main site for new users
- No navigation to Features/Testimonials/Pricing

## Technical Requirements

### Database Schema
```typescript
Organization {
  subdomain: string          // e.g., "acmecorp"
  subdomainEnabled: boolean  // true/false
  name: string              // "Acme Corp"
  logo?: string             // URL to logo
  branding?: {
    primaryColor: string
    backgroundColor: string
  }
}
```

### API Endpoints
- `GET /api/admin/organizations` - List all orgs with subdomains
- `PUT /api/admin/organizations/[id]/subdomain` - Update subdomain (existing)
- `POST /api/admin/organizations` - Create org with auto-subdomain

### UI Components
- `/admin/subdomains` - Subdomain management page
- Update org creation form to show generated subdomain
- Custom subdomain landing page component

## Out of Scope
- Custom domains (e.g., org.com pointing to their subdomain)
- Subdomain analytics
- Subdomain-specific email templates
- Multi-language support for subdomain pages

## Success Metrics
- Admins can assign subdomains in < 30 seconds
- 100% of new orgs get auto-generated subdomains
- Users see branded login page on subdomain visit
- Zero manual Firestore edits needed for subdomain management
