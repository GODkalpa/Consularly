# Requirements Document

## Introduction

This feature migrates the email service from Brevo to Hostinger SMTP and implements organization-specific email aliases for white-labeled B2B communication. Each organization will have a dedicated email alias (e.g., `org-acmecorp@consularly.com`) that appears as the sender for all emails sent to their students, enhancing the white-label experience.

## Glossary

- **Email System**: The application's email sending infrastructure
- **Hostinger SMTP**: Hostinger's email server used to send transactional emails
- **Email Alias**: An additional email address that delivers to the main mailbox but can be used as a sender address
- **Organization**: A B2B client using the white-labeled platform
- **Branding Settings**: Organization-specific customization including logo, colors, and now email alias
- **Transactional Email**: Automated emails sent by the system (invitations, reminders, confirmations)

## Requirements

### Requirement 1

**User Story:** As a platform administrator, I want to migrate from Brevo to Hostinger SMTP, so that we use our own email infrastructure

#### Acceptance Criteria

1. WHEN the Email System sends any transactional email, THE Email System SHALL use Hostinger SMTP server with authentication
2. THE Email System SHALL remove all Brevo API dependencies from the codebase
3. THE Email System SHALL use Nodemailer library for SMTP communication
4. THE Email System SHALL authenticate with Hostinger using credentials stored in environment variables
5. THE Email System SHALL maintain all existing email functionality (invitations, reminders, confirmations, cancellations, reschedules)

### Requirement 2

**User Story:** As a platform administrator, I want to configure Hostinger SMTP credentials securely, so that email sending is properly authenticated

#### Acceptance Criteria

1. THE Email System SHALL read SMTP host from environment variable SMTP_HOST
2. THE Email System SHALL read SMTP port from environment variable SMTP_PORT
3. THE Email System SHALL read SMTP username from environment variable SMTP_USER
4. THE Email System SHALL read SMTP password from environment variable SMTP_PASSWORD
5. THE Email System SHALL use secure TLS connection for SMTP communication
6. IF SMTP credentials are missing, THEN THE Email System SHALL log a warning and skip email sending

### Requirement 3

**User Story:** As a platform administrator, I want each organization to have a unique email alias, so that emails appear to come from organization-specific addresses

#### Acceptance Criteria

1. THE Email System SHALL store an email alias field in organization branding settings
2. THE Email System SHALL generate email aliases in format `org-{orgSlug}@consularly.com` where orgSlug is a URL-safe organization identifier
3. WHEN an organization is created, THE Email System SHALL automatically generate and store an email alias
4. THE Email System SHALL validate that email aliases follow the pattern `org-*@consularly.com`
5. THE Email System SHALL allow administrators to manually update organization email aliases

### Requirement 4

**User Story:** As an organization owner, I want all emails to students sent from my organization's email alias, so that branding is consistent

#### Acceptance Criteria

1. WHEN the Email System sends any email to a student, THE Email System SHALL use the organization's email alias as the sender address
2. THE Email System SHALL use the organization's company name as the sender display name
3. IF an organization does not have an email alias configured, THEN THE Email System SHALL use the default sender `info@consularly.com`
4. THE Email System SHALL include the organization's email alias as the reply-to address
5. THE Email System SHALL apply organization branding (logo, colors) to email templates

### Requirement 5

**User Story:** As a platform administrator, I want to manage organization email aliases through the admin dashboard, so that I can provision and update aliases easily

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display the current email alias for each organization in the branding settings
2. THE Admin Dashboard SHALL provide a button to generate a new email alias for an organization
3. THE Admin Dashboard SHALL validate email alias format before saving
4. WHEN an administrator updates an email alias, THE Admin Dashboard SHALL save the change to Firestore
5. THE Admin Dashboard SHALL display a warning if an organization does not have an email alias configured

### Requirement 6

**User Story:** As a platform administrator, I want to test email sending functionality, so that I can verify the Hostinger SMTP integration works correctly

#### Acceptance Criteria

1. THE Email System SHALL provide a test email endpoint at `/api/admin/test-email`
2. WHEN the test endpoint is called, THE Email System SHALL send a test email using Hostinger SMTP
3. THE Email System SHALL return success or error status from the test email attempt
4. THE Email System SHALL log detailed SMTP connection and sending information for debugging
5. THE test endpoint SHALL require admin authentication

### Requirement 7

**User Story:** As a developer, I want comprehensive error handling for email failures, so that issues are logged and don't break the application

#### Acceptance Criteria

1. WHEN SMTP connection fails, THEN THE Email System SHALL log the error with connection details
2. WHEN email sending fails, THEN THE Email System SHALL log the error with recipient and email type
3. THE Email System SHALL not throw unhandled exceptions for email failures
4. THE Email System SHALL continue application flow even if email sending fails
5. THE Email System SHALL track email send attempts in Firestore with status (sent, failed) and error messages
