# Implementation Plan

- [x] 1. Install dependencies and update environment configuration


  - Install nodemailer package (`npm install nodemailer @types/nodemailer`)
  - Add Hostinger SMTP environment variables to `.env.local`
  - Remove Brevo environment variables
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Extend organization branding schema with email alias

  - [x] 2.1 Update `OrganizationBranding` interface in `src/types/firestore.ts` to include `emailAlias` field


    - Add optional `emailAlias?: string` field
    - _Requirements: 3.1_
  - [x] 2.2 Create email alias generator utility at `src/lib/email-alias-generator.ts`


    - Implement `generateEmailAlias(orgName: string): string` function
    - Implement `validateEmailAlias(alias: string): { valid: boolean; error?: string }` function
    - Implement `createOrgSlug(orgName: string): string` helper function
    - _Requirements: 3.2, 3.4_

- [x] 3. Migrate email service from Brevo to Hostinger SMTP

  - [x] 3.1 Update `src/lib/email-service.ts` to use Nodemailer


    - Remove Brevo imports and client initialization
    - Create SMTP transport configuration function
    - Implement `createSMTPTransport(): nodemailer.Transporter | null`
    - Implement `resolveSenderEmail(orgBranding?: OrganizationBranding): string`
    - _Requirements: 1.1, 1.3, 1.4, 2.6_
  - [x] 3.2 Update `sendInterviewConfirmation` function to use SMTP transport


    - Replace Brevo API call with Nodemailer `sendMail`
    - Use org email alias as sender
    - Maintain existing template generation
    - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 3.3 Update `send24HourReminder` function to use SMTP transport


    - Replace Brevo API call with Nodemailer `sendMail`
    - Use org email alias as sender
    - _Requirements: 1.5, 4.1, 4.2, 4.3_
  - [x] 3.4 Update `send1HourReminder` function to use SMTP transport


    - Replace Brevo API call with Nodemailer `sendMail`
    - Use org email alias as sender
    - _Requirements: 1.5, 4.1, 4.2, 4.3_
  - [x] 3.5 Update `sendCancellationEmail` function to use SMTP transport


    - Replace Brevo API call with Nodemailer `sendMail`
    - Use org email alias as sender
    - _Requirements: 1.5, 4.1, 4.2, 4.3_
  - [x] 3.6 Update `sendRescheduleConfirmation` function to use SMTP transport


    - Replace Brevo API call with Nodemailer `sendMail`
    - Use org email alias as sender
    - _Requirements: 1.5, 4.1, 4.2, 4.3_
  - [x] 3.7 Update `sendStudentInvitation` function to use SMTP transport


    - Replace Brevo API call with Nodemailer `sendMail`
    - Use org email alias as sender
    - _Requirements: 1.5, 4.1, 4.2, 4.3_
  - [x] 3.8 Add comprehensive error handling for SMTP operations

    - Handle authentication errors (EAUTH)
    - Handle connection errors (ECONNECTION)
    - Log errors without throwing exceptions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4. Create test email endpoint for verification

  - [x] 4.1 Create API route at `src/app/api/admin/test-email/route.ts`


    - Implement POST handler with admin authentication
    - Accept orgId and recipientEmail in request body
    - Fetch organization branding from Firestore
    - Send test email using email service
    - Return success/error response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Create admin dashboard UI for email alias management

  - [x] 5.1 Create API route at `src/app/api/admin/organizations/[id]/email-alias/route.ts`


    - Implement GET handler to retrieve current email alias
    - Implement POST handler to update email alias with validation
    - Validate email alias format before saving
    - Update organization branding in Firestore
    - _Requirements: 3.5, 5.1, 5.3, 5.4_
  - [x] 5.2 Create email alias management component at `src/components/admin/EmailAliasManager.tsx`


    - Display current email alias for organization
    - Provide button to auto-generate email alias
    - Allow manual email alias input with validation
    - Show validation errors
    - Integrate test email functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 5.3 Integrate EmailAliasManager into organization settings page


    - Add email alias section to existing org settings UI
    - Display warning if no email alias configured
    - _Requirements: 5.5_

- [x] 6. Update reminder log tracking to reflect new email provider


  - Update `src/app/api/cron/send-reminders/route.ts` to log `emailProvider: 'hostinger-smtp'` instead of `'brevo'`
  - Update any other locations that create ReminderLog entries
  - _Requirements: 7.5_

- [x] 7. Remove Brevo dependencies from codebase

  - [x] 7.1 Remove Brevo package from package.json


    - Run `npm uninstall @getbrevo/brevo`
    - _Requirements: 1.2_
  - [x] 7.2 Remove Brevo-related code from `src/lib/email/index.ts`


    - Delete file if it only contains Brevo code
    - _Requirements: 1.2_
  - [x] 7.3 Remove Brevo debug endpoint at `src/app/api/debug/env/route.ts`


    - Delete Brevo-related checks
    - _Requirements: 1.2_
  - [x] 7.4 Remove Brevo test script at `scripts/test-email.ts`


    - Delete file or update to use new email service
    - _Requirements: 1.2_

- [x] 8. Create migration script for existing organizations

  - [x] 8.1 Create script at `scripts/generate-email-aliases.ts`


    - Fetch all organizations from Firestore
    - Generate email alias for each organization
    - Update organization branding with email alias
    - Log results and any errors
    - _Requirements: 3.3_

- [x] 9. Update documentation


  - [x] 9.1 Create setup guide for Hostinger email configuration


    - Document SMTP credentials setup
    - Document email alias creation in Hostinger
    - Document environment variable configuration
  - [x] 9.2 Update README with new email service information


    - Remove Brevo references
    - Add Hostinger SMTP setup instructions
