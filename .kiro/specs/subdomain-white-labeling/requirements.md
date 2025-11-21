# Requirements Document

## Introduction

This feature enables subdomain-based white labeling for organizations using the Consularly.com platform. Each organization will have their own subdomain (e.g., `acmecorp.consularly.com`) with a fully branded experience including custom login pages, dashboards, and student portals. This builds upon the existing organization branding system to provide true multi-tenant white-label capabilities.

## Glossary

- **Platform**: The main Consularly.com application and infrastructure
- **Organization**: A client entity that uses the Platform to manage their students and interviews
- **Subdomain**: A prefix to the main domain (e.g., `acmecorp` in `acmecorp.consularly.com`)
- **White Label**: Customized branding that hides or minimizes Platform branding
- **Middleware**: Next.js server-side routing logic that executes before page rendering
- **DNS Wildcard**: A DNS record (`*.consularly.com`) that routes all subdomains to the Platform
- **Organization Portal**: The subdomain-specific interface for an Organization
- **Main Portal**: The primary Platform interface at `consularly.com` or `www.consularly.com`
- **Subdomain Mapping**: The association between a subdomain string and an Organization ID

## Requirements

### Requirement 1: Subdomain Detection and Routing

**User Story:** As a platform administrator, I want organizations to access their portal via custom subdomains, so that each organization has a unique branded URL.

#### Acceptance Criteria

1. WHEN a request arrives at the Platform, THE Middleware SHALL extract the subdomain from the request hostname
2. WHEN the subdomain is `www` or empty, THE Middleware SHALL route the request to the Main Portal
3. WHEN the subdomain matches an Organization's assigned subdomain, THE Middleware SHALL set the organization context for that request
4. IF the subdomain does not match any Organization, THEN THE Platform SHALL display a "Organization Not Found" error page
5. THE Platform SHALL support subdomain detection in both development (`localhost`) and production (`consularly.com`) environments

### Requirement 2: Organization Subdomain Management

**User Story:** As a platform administrator, I want to assign and manage subdomains for organizations, so that I can control which organizations have subdomain access.

#### Acceptance Criteria

1. THE Platform SHALL store a `subdomain` field in the Organization document in Firestore
2. THE Platform SHALL validate that subdomain values contain only lowercase letters, numbers, and hyphens
3. THE Platform SHALL enforce that subdomain values are between 3 and 63 characters in length
4. THE Platform SHALL prevent duplicate subdomain assignments across all Organizations
5. THE Platform SHALL provide an API endpoint to assign or update an Organization's subdomain
6. THE Platform SHALL reserve specific subdomains (`www`, `api`, `admin`, `app`, `mail`, `ftp`, `smtp`) from Organization assignment

### Requirement 3: Subdomain-Specific Login Pages

**User Story:** As an organization member, I want to see my organization's branding on the login page when I visit our subdomain, so that the experience feels native to our organization.

#### Acceptance Criteria

1. WHEN a user visits `{subdomain}.consularly.com`, THE Platform SHALL display a login page with the Organization's branding
2. THE Platform SHALL apply the Organization's logo, colors, and background image to the login page
3. WHEN white-label mode is enabled for the Organization, THE Platform SHALL hide all Platform branding from the login page
4. THE Platform SHALL display the Organization's company name and tagline on the login page
5. WHEN a user successfully authenticates on a subdomain, THE Platform SHALL redirect them to the appropriate dashboard for their role within that Organization

### Requirement 4: Subdomain-Specific Dashboards

**User Story:** As an organization member, I want all dashboard pages to maintain my organization's branding when accessed via our subdomain, so that the entire experience is consistent.

#### Acceptance Criteria

1. WHEN a user accesses any page on `{subdomain}.consularly.com`, THE Platform SHALL apply the Organization's branding to that page
2. THE Platform SHALL load the Organization's branding settings based on the subdomain context
3. THE Platform SHALL apply dynamic favicons, colors, fonts, and custom CSS based on the Organization's settings
4. THE Platform SHALL maintain the subdomain context across all navigation within the Organization Portal
5. WHEN a user navigates between pages within the subdomain, THE Platform SHALL preserve the Organization context without additional API calls

### Requirement 5: Cross-Subdomain Session Management

**User Story:** As a platform user, I want my authentication to be scoped to the subdomain I'm using, so that I can securely access multiple organizations if I belong to them.

#### Acceptance Criteria

1. THE Platform SHALL set authentication cookies with the appropriate domain scope for subdomain access
2. WHEN a user authenticates on `{subdomain}.consularly.com`, THE Platform SHALL create a session scoped to that subdomain
3. THE Platform SHALL prevent session sharing between different Organization subdomains for security
4. WHEN a user belongs to multiple Organizations, THE Platform SHALL allow them to authenticate separately on each subdomain
5. THE Platform SHALL provide a logout mechanism that clears the session for the current subdomain

### Requirement 6: Student Portal Subdomain Access

**User Story:** As a student, I want to access my organization's student portal via their subdomain, so that I have a consistent branded experience.

#### Acceptance Criteria

1. WHEN a student visits `{subdomain}.consularly.com/student`, THE Platform SHALL display the student portal with the Organization's branding
2. THE Platform SHALL apply the Organization's branding to the student login page at `{subdomain}.consularly.com/student/login`
3. THE Platform SHALL apply the Organization's branding to all student dashboard pages
4. THE Platform SHALL apply the Organization's branding to interview pages accessed by students
5. WHEN a student completes an interview via a subdomain, THE Platform SHALL maintain the Organization's branding throughout the interview experience

### Requirement 7: Main Portal Functionality Preservation

**User Story:** As a platform administrator, I want the main portal at consularly.com to continue functioning for platform administration, so that I can manage all organizations centrally.

#### Acceptance Criteria

1. WHEN a user visits `consularly.com` or `www.consularly.com`, THE Platform SHALL display the main Platform interface without Organization-specific branding
2. THE Platform SHALL allow platform administrators to access the admin dashboard at `consularly.com/admin`
3. THE Platform SHALL allow organization members to access their organization dashboard at `consularly.com/org` with organization selection
4. THE Platform SHALL maintain backward compatibility with existing non-subdomain URLs
5. THE Platform SHALL provide navigation or links to help users discover their organization's subdomain

### Requirement 8: Development Environment Support

**User Story:** As a developer, I want to test subdomain functionality in my local development environment, so that I can develop and debug subdomain features effectively.

#### Acceptance Criteria

1. THE Platform SHALL support subdomain testing using localhost with port numbers (e.g., `acmecorp.localhost:3000`)
2. THE Platform SHALL provide configuration options to enable or disable subdomain routing in development
3. THE Platform SHALL log subdomain detection and routing decisions for debugging purposes
4. THE Platform SHALL provide clear error messages when subdomain configuration is incorrect
5. THE Platform SHALL document the local development setup process for subdomain testing

### Requirement 9: DNS and Domain Configuration

**User Story:** As a platform administrator, I want clear guidance on DNS configuration, so that I can properly set up wildcard subdomain routing.

#### Acceptance Criteria

1. THE Platform SHALL provide documentation for configuring wildcard DNS records (`*.consularly.com`)
2. THE Platform SHALL provide documentation for SSL certificate configuration for wildcard domains
3. THE Platform SHALL provide documentation for Vercel domain configuration with wildcard support
4. THE Platform SHALL provide a checklist for verifying subdomain functionality in production
5. THE Platform SHALL provide troubleshooting guidance for common subdomain configuration issues

### Requirement 10: Student Account Isolation by Organization

**User Story:** As an organization administrator, I want student accounts created by my organization to only be accessible on my organization's subdomain and the main portal, so that students cannot access other organizations' data.

#### Acceptance Criteria

1. WHEN a student account is created by an Organization, THE Platform SHALL associate that student account exclusively with that Organization's ID
2. WHEN a student attempts to log in on a subdomain, THE Platform SHALL verify that the student's organization ID matches the subdomain's organization ID
3. IF a student attempts to access a subdomain that does not match their organization, THEN THE Platform SHALL deny access and display an "Access Denied" message
4. THE Platform SHALL allow students to access their account on the main portal (`consularly.com/student`) for backward compatibility
5. WHEN a student logs in via the main portal, THE Platform SHALL redirect them to their organization's subdomain if one is configured

### Requirement 11: Organization Member Access Control

**User Story:** As an organization administrator, I want organization members (staff) to only access their own organization's subdomain, so that organizational data remains isolated.

#### Acceptance Criteria

1. WHEN an organization member attempts to log in on a subdomain, THE Platform SHALL verify that the member's organization ID matches the subdomain's organization ID
2. IF an organization member attempts to access a subdomain that does not match their organization, THEN THE Platform SHALL deny access and display an "Access Denied" message
3. THE Platform SHALL allow organization members to access the main portal at `consularly.com/org` for organization selection
4. WHEN a platform administrator accesses any subdomain, THE Platform SHALL allow access for administrative purposes
5. THE Platform SHALL log all cross-organization access attempts for security monitoring

### Requirement 12: Error Handling and Edge Cases

**User Story:** As a platform user, I want clear error messages when subdomain access fails, so that I understand what went wrong and how to resolve it.

#### Acceptance Criteria

1. WHEN a user visits a non-existent subdomain, THE Platform SHALL display a user-friendly "Organization Not Found" page
2. WHEN an Organization's subdomain is not configured, THE Platform SHALL display a message indicating the subdomain is not set up
3. WHEN subdomain detection fails, THE Platform SHALL log the error and fall back to the Main Portal
4. THE Platform SHALL provide contact information or support links on error pages
5. THE Platform SHALL track subdomain access errors for monitoring and debugging purposes
