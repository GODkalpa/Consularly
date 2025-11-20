# Design Document

## Overview

This design outlines the migration from Brevo email service to Hostinger SMTP with organization-specific email aliases. The solution uses Nodemailer for SMTP communication and extends the organization branding system to include email aliases. Each organization will have a unique sender address (e.g., `org-acmecorp@consularly.com`) that maintains white-label branding consistency.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Interview Confirmations, Reminders, Invitations, etc.)    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Service (email-service.ts)                │
│  • Fetches org branding (including email alias)             │
│  • Generates HTML templates with org branding               │
│  • Determines sender address from org alias                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           SMTP Transport (Nodemailer)                        │
│  • Connects to Hostinger SMTP                               │
│  • Authenticates with credentials                           │
│  • Sends email with org-specific sender                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Hostinger Email Server                          │
│  • Main mailbox: info@consularly.com                        │
│  • Aliases: org-*@consularly.com (up to 50)                 │
│  • All emails delivered to main mailbox                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Email Trigger**: Application needs to send email (e.g., interview confirmation)
2. **Fetch Branding**: Email service retrieves organization branding from Firestore
3. **Determine Sender**: Uses org's email alias or falls back to default
4. **Generate Template**: Creates HTML email with org branding (logo, colors, etc.)
5. **SMTP Send**: Nodemailer sends via Hostinger SMTP with org-specific sender
6. **Logging**: Records send attempt in Firestore (ReminderLog or similar)

## Components and Interfaces

### 1. Email Service Module (`src/lib/email-service.ts`)

**Purpose**: Core email sending functionality with organization branding

**Key Changes**:
- Replace Brevo API client with Nodemailer SMTP transport
- Add email alias resolution logic
- Maintain existing email template generation
- Keep all existing email functions (confirmations, reminders, etc.)

**Interface**:

```typescript
// SMTP Transport Configuration
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email Sending Options
interface EmailOptions {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  senderEmail: string;
  senderName: string;
  replyTo?: string;
}

// Initialize SMTP transport
function createSMTPTransport(): nodemailer.Transporter

// Resolve sender email from org branding
function resolveSenderEmail(orgBranding?: OrganizationBranding): string

// Send email via SMTP
async function sendEmail(options: EmailOptions): Promise<void>

// Existing functions (updated to use new SMTP transport)
async function sendInterviewConfirmation(params: InterviewConfirmationParams): Promise<void>
async function send24HourReminder(params: ReminderParams): Promise<void>
async function send1HourReminder(params: ReminderParams): Promise<void>
async function sendCancellationEmail(params: CancellationParams): Promise<void>
async function sendRescheduleConfirmation(params: RescheduleConfirmationParams): Promise<void>
async function sendStudentInvitation(params: StudentInvitationParams): Promise<void>
```

### 2. Organization Branding Extension

**Purpose**: Add email alias field to organization branding

**Schema Update** (`src/types/firestore.ts`):

```typescript
export interface OrganizationBranding {
  // ... existing fields ...
  
  // Email configuration
  emailAlias?: string;           // Organization-specific email alias
                                 // Format: org-{slug}@consularly.com
}
```

**Validation Rules**:
- Email alias must match pattern: `^org-[a-z0-9-]+@consularly\.com$`
- Slug portion must be URL-safe (lowercase, alphanumeric, hyphens only)
- Maximum length: 50 characters
- Must be unique across all organizations

### 3. Email Alias Generator Utility

**Purpose**: Generate and validate email aliases

**Module**: `src/lib/email-alias-generator.ts`

```typescript
// Generate email alias from organization name
function generateEmailAlias(orgName: string): string {
  // Convert to lowercase, replace spaces with hyphens
  // Remove special characters, ensure uniqueness
  // Return: org-{slug}@consularly.com
}

// Validate email alias format
function validateEmailAlias(alias: string): boolean {
  // Check pattern, length, domain
}

// Create slug from organization name
function createOrgSlug(orgName: string): string {
  // Convert to URL-safe slug
}
```

### 4. Admin Dashboard Email Management

**Purpose**: UI for managing organization email aliases

**Component**: `src/components/admin/EmailAliasManager.tsx`

**Features**:
- Display current email alias for organization
- Button to generate new alias
- Manual alias input with validation
- Preview of how emails will appear
- Test email functionality

**API Endpoints**:

```typescript
// GET /api/admin/organizations/[id]/email-alias
// Returns current email alias

// POST /api/admin/organizations/[id]/email-alias
// Updates email alias with validation

// POST /api/admin/test-email
// Sends test email using org branding
```

### 5. Test Email Endpoint

**Purpose**: Verify SMTP configuration and org branding

**Endpoint**: `src/app/api/admin/test-email/route.ts`

```typescript
POST /api/admin/test-email
Body: {
  orgId: string;
  recipientEmail: string;
}

Response: {
  success: boolean;
  message: string;
  error?: string;
}
```

## Data Models

### Environment Variables

```bash
# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@consularly.com
SMTP_PASSWORD=<hostinger-email-password>

# Default sender (fallback)
DEFAULT_SENDER_EMAIL=info@consularly.com
DEFAULT_SENDER_NAME=Consularly

# Remove Brevo variables
# BREVO_API_KEY (deprecated)
# BREVO_SENDER_EMAIL (deprecated)
```

### Firestore Updates

**Organizations Collection** - Add to existing branding:

```typescript
{
  settings: {
    customBranding: {
      // ... existing fields ...
      emailAlias: "org-acmecorp@consularly.com"
    }
  }
}
```

**ReminderLog Collection** - Update email provider tracking:

```typescript
{
  emailProvider: 'hostinger-smtp'  // Changed from 'brevo'
}
```

## Error Handling

### SMTP Connection Errors

```typescript
try {
  await transporter.sendMail(mailOptions);
} catch (error) {
  if (error.code === 'EAUTH') {
    console.error('[Email] SMTP authentication failed');
    // Log to monitoring system
  } else if (error.code === 'ECONNECTION') {
    console.error('[Email] SMTP connection failed');
    // Retry logic or fallback
  } else {
    console.error('[Email] Unknown SMTP error:', error);
  }
  // Don't throw - log and continue application flow
}
```

### Email Alias Validation Errors

```typescript
function validateEmailAlias(alias: string): { valid: boolean; error?: string } {
  if (!alias.match(/^org-[a-z0-9-]+@consularly\.com$/)) {
    return { valid: false, error: 'Invalid format. Must be org-{slug}@consularly.com' };
  }
  if (alias.length > 50) {
    return { valid: false, error: 'Email alias too long (max 50 characters)' };
  }
  return { valid: true };
}
```

### Missing Configuration Handling

```typescript
function createSMTPTransport(): nodemailer.Transporter | null {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  if (!config.host || !config.auth.user || !config.auth.pass) {
    console.warn('[Email] SMTP credentials not configured');
    return null;
  }

  return nodemailer.createTransport(config);
}
```

## Testing Strategy

### Unit Tests

1. **Email Alias Generation**
   - Test slug creation from various org names
   - Test special character handling
   - Test uniqueness validation

2. **Email Alias Validation**
   - Test valid formats
   - Test invalid formats
   - Test edge cases (length, special chars)

3. **Sender Resolution**
   - Test with org alias present
   - Test with missing alias (fallback)
   - Test with invalid alias (fallback)

### Integration Tests

1. **SMTP Connection**
   - Test successful connection to Hostinger
   - Test authentication
   - Test connection error handling

2. **Email Sending**
   - Test sending with org alias
   - Test sending with default sender
   - Test email template generation
   - Test all email types (confirmation, reminder, etc.)

3. **Admin Dashboard**
   - Test alias generation UI
   - Test alias validation
   - Test alias update API
   - Test test email functionality

### Manual Testing Checklist

1. **Hostinger Setup**
   - [ ] Create main mailbox: info@consularly.com
   - [ ] Create test alias: org-testorg@consularly.com
   - [ ] Verify SMTP credentials
   - [ ] Test SMTP connection from local environment

2. **Email Sending**
   - [ ] Send test interview confirmation
   - [ ] Send test reminder
   - [ ] Send test invitation
   - [ ] Verify sender appears as org alias
   - [ ] Verify reply-to is set correctly
   - [ ] Verify branding (logo, colors) appears correctly

3. **Admin Dashboard**
   - [ ] Generate email alias for test org
   - [ ] Update email alias manually
   - [ ] Send test email from dashboard
   - [ ] Verify validation errors display correctly

## Migration Plan

### Phase 1: Setup and Configuration

1. Set up Hostinger email account
2. Create initial email aliases for existing organizations
3. Configure environment variables
4. Install Nodemailer dependency

### Phase 2: Code Implementation

1. Update email service to use Nodemailer
2. Add email alias field to organization branding
3. Implement email alias generator utility
4. Update all email sending functions

### Phase 3: Admin Dashboard

1. Create email alias management UI
2. Implement test email endpoint
3. Add email alias to organization settings page

### Phase 4: Testing and Validation

1. Run unit tests
2. Run integration tests
3. Manual testing with test organization
4. Verify all email types work correctly

### Phase 5: Deployment

1. Update production environment variables
2. Deploy code changes
3. Create email aliases for all existing organizations
4. Monitor email sending logs
5. Remove Brevo dependencies

### Phase 6: Cleanup

1. Remove Brevo API key from environment
2. Uninstall Brevo npm package
3. Update documentation
4. Archive Brevo-related code

## Security Considerations

1. **SMTP Credentials**: Store in environment variables, never commit to code
2. **Email Alias Validation**: Prevent injection attacks through strict validation
3. **Rate Limiting**: Implement rate limiting on test email endpoint
4. **Authentication**: Require admin authentication for all email management endpoints
5. **Logging**: Log all email send attempts for audit trail
6. **TLS/SSL**: Use secure connection (port 465) for SMTP

## Performance Considerations

1. **Connection Pooling**: Reuse SMTP transport connection across requests
2. **Async Sending**: Don't block application flow waiting for email send
3. **Retry Logic**: Implement exponential backoff for failed sends
4. **Caching**: Cache organization branding to reduce Firestore reads
5. **Batch Sending**: For bulk operations (reminders), send in batches

## Monitoring and Logging

### Metrics to Track

- Email send success rate
- Email send latency
- SMTP connection failures
- Email bounce rate (via Hostinger dashboard)
- Email alias usage per organization

### Log Levels

```typescript
// Info: Successful sends
console.log('[Email] Confirmation sent to user@example.com via org-acme@consularly.com');

// Warn: Configuration issues
console.warn('[Email] SMTP credentials not configured, skipping email');

// Error: Send failures
console.error('[Email] Failed to send email:', { error, recipient, orgId });
```

## Rollback Plan

If issues arise during migration:

1. **Immediate**: Revert to Brevo by restoring environment variables
2. **Code**: Keep Brevo code in separate branch for quick rollback
3. **Data**: Email aliases are additive, no data loss risk
4. **Testing**: Maintain parallel testing environment with both providers

## Future Enhancements

1. **Custom Domains**: Allow organizations to use their own domains (e.g., `noreply@acmecorp.com`)
2. **Email Templates**: Allow organizations to customize email templates
3. **Email Analytics**: Track open rates, click rates per organization
4. **Bulk Email Management**: Admin tool to manage all org aliases at once
5. **Automated Alias Creation**: Auto-create alias when organization is created
6. **Email Verification**: Verify email deliverability before saving alias
