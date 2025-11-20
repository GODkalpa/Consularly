# Email Alias Manager Integration Guide

## Overview

The EmailAliasManager component has been created and is ready to be integrated into your admin dashboard. Since there isn't a dedicated organization settings page yet, here are the integration options:

## Option 1: Add to Admin Dashboard (Recommended)

Add the EmailAliasManager to your main admin dashboard page:

```tsx
// src/app/admin/page.tsx
import EmailAliasManager from '@/components/admin/EmailAliasManager'

export default function AdminDashboard() {
  // ... existing code ...
  
  return (
    <div>
      {/* ... existing dashboard content ... */}
      
      {/* Add Email Configuration Section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Email Configuration</h2>
        <EmailAliasManager 
          orgId={currentOrgId} 
          orgName={currentOrgName} 
        />
      </section>
    </div>
  )
}
```

## Option 2: Create Organization Settings Page

Create a dedicated organization settings page:

```tsx
// src/app/admin/organizations/[id]/settings/page.tsx
import EmailAliasManager from '@/components/admin/EmailAliasManager'

export default function OrganizationSettings({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Organization Settings</h1>
      
      {/* Email Configuration */}
      <EmailAliasManager 
        orgId={params.id} 
        orgName="Organization Name" // Fetch from API
      />
      
      {/* Other settings sections can be added here */}
    </div>
  )
}
```

## Option 3: Add to Existing Organization Management

If you have an organization management component, add it there:

```tsx
import EmailAliasManager from '@/components/admin/EmailAliasManager'

// Inside your organization management component
<Tabs>
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="email">Email</TabsTrigger>
    <TabsTrigger value="branding">Branding</TabsTrigger>
  </TabsList>
  
  <TabsContent value="email">
    <EmailAliasManager orgId={orgId} orgName={orgName} />
  </TabsContent>
</Tabs>
```

## Component Features

The EmailAliasManager component provides:

1. **Display Current Alias**: Shows the currently configured email alias
2. **Auto-Generate**: Generates an alias based on organization name
3. **Manual Input**: Allows manual entry with validation
4. **Test Email**: Sends a test email to verify configuration
5. **Error Handling**: Displays validation and SMTP errors
6. **Success Feedback**: Confirms successful operations

## Usage Example

```tsx
<EmailAliasManager 
  orgId="org123" 
  orgName="Acme Corporation" 
/>
```

This will:
- Fetch the current email alias for the organization
- Allow generating: `org-acme-corporation@consularly.com`
- Validate format: `org-{slug}@consularly.com`
- Send test emails using the configured alias

## API Endpoints Used

The component uses these endpoints:
- `GET /api/admin/organizations/[id]/email-alias` - Fetch current alias
- `POST /api/admin/organizations/[id]/email-alias` - Update alias
- `POST /api/admin/test-email` - Send test email

## Next Steps

1. Choose an integration option above
2. Add the component to your admin interface
3. Test the email alias generation
4. Send test emails to verify SMTP configuration
5. Create email aliases in Hostinger panel to match generated aliases

## Important Notes

- Email aliases must be created in Hostinger panel after generation
- Format must be: `org-{slug}@consularly.com`
- All emails to students will use the organization's alias as sender
- Falls back to `info@consularly.com` if no alias is configured
