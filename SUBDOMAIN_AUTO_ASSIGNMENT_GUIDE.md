# Subdomain Auto-Assignment Guide

## Overview

Organizations now automatically receive a subdomain when created, and admins can manage subdomains directly from the organization page in the admin dashboard.

## Features

### 1. Automatic Subdomain Assignment

When creating a new organization:
- A subdomain is automatically generated from the organization name
- The subdomain is validated for format and availability
- If the subdomain is taken, a numeric suffix is added (e.g., `acmecorp2`)
- The subdomain is enabled by default
- If generation fails, the organization is still created (subdomain can be set manually later)

**Example:**
- Organization Name: "ACME Corporation" → Subdomain: `acmecorp`
- Organization Name: "Tech Solutions Inc." → Subdomain: `techsolutions`

### 2. Subdomain Management in Admin Dashboard

Admins can manage subdomains from the Organizations page:

1. Navigate to **Admin Dashboard** → **Organizations**
2. Click the **Edit** button on any organization
3. Switch to the **Subdomain** tab
4. Configure the subdomain:
   - View current subdomain
   - Generate a new suggestion based on organization name
   - Manually enter a custom subdomain
   - Enable/disable subdomain access
   - See real-time validation and availability

### 3. Subdomain Display in Organizations Table

The organizations table now shows:
- Subdomain name (if set)
- Status badge (Active/Disabled)
- "Not set" indicator for organizations without subdomains

## API Endpoints

### Create Organization with Auto-Subdomain
```
POST /api/admin/organizations
```

**Response includes:**
```json
{
  "id": "org123",
  "subdomain": "acmecorp",
  "subdomainEnabled": true,
  "emailAlias": "acmecorp@consularly.com"
}
```

### Validate Subdomain
```
POST /api/admin/subdomain/validate
```

**Request:**
```json
{
  "subdomain": "acmecorp",
  "excludeOrgId": "org123" // Optional, for updates
}
```

**Response:**
```json
{
  "valid": true,
  "available": true
}
```

### Update Organization Subdomain
```
PATCH /api/admin/organizations/[id]/subdomain
```

**Request:**
```json
{
  "subdomain": "newsubdomain",
  "enabled": true
}
```

## Subdomain Rules

1. **Length:** 3-63 characters
2. **Characters:** Lowercase letters, numbers, and hyphens only
3. **Format:** Cannot start or end with a hyphen
4. **Reserved:** Cannot use reserved subdomains (www, api, admin, etc.)
5. **Uniqueness:** Must be unique across all organizations

## Reserved Subdomains

The following subdomains are reserved and cannot be assigned:
- www, api, admin, app
- mail, ftp, smtp, webmail
- cpanel, whm, ns1, ns2
- localhost, staging, dev, test, demo

## Subdomain Generation Logic

1. Convert organization name to lowercase
2. Remove special characters (keep only letters, numbers, spaces, hyphens)
3. Replace spaces with hyphens
4. Remove consecutive hyphens
5. Remove leading/trailing hyphens
6. Limit to 63 characters
7. Validate format
8. Check availability
9. If taken, try with numeric suffix (2-10)
10. If all attempts fail, skip subdomain (can be set manually)

## User Experience

### For Admins

1. **Creating Organizations:**
   - Subdomain is automatically assigned
   - Success message shows the generated subdomain
   - No manual intervention needed

2. **Managing Subdomains:**
   - Edit any organization
   - Switch to "Subdomain" tab
   - Use "Suggest" button for auto-generation
   - Real-time validation as you type
   - Enable/disable subdomain access
   - Preview URL before saving

3. **Viewing Subdomains:**
   - See subdomain status in organizations table
   - Quick visual indicator (Active/Disabled/Not set)
   - Globe icon for easy identification

### For Organization Users

Once a subdomain is enabled:
- Access organization at: `https://[subdomain].consularly.com`
- Automatic organization context
- White-labeled experience
- Custom branding (if configured)

## Development vs Production

### Development (localhost)
- Format: `http://[subdomain].localhost:3000`
- Example: `http://acmecorp.localhost:3000`

### Production
- Format: `https://[subdomain].consularly.com`
- Example: `https://acmecorp.consularly.com`

## Troubleshooting

### Subdomain Not Generated
- Check organization name is valid
- Verify no special characters causing issues
- Manually set subdomain in edit dialog

### Subdomain Already Taken
- System tries numeric suffixes automatically
- If all fail, set a custom subdomain manually
- Check organizations table for conflicts

### Subdomain Not Working
- Verify subdomain is enabled
- Check DNS configuration (production)
- Clear subdomain cache if needed
- Verify middleware is running

## Related Documentation

- [SUBDOMAIN_SETUP_GUIDE.md](./SUBDOMAIN_SETUP_GUIDE.md) - Initial setup
- [SUBDOMAIN_IMPLEMENTATION_COMPLETE.md](./SUBDOMAIN_IMPLEMENTATION_COMPLETE.md) - Technical details
- [SUBDOMAIN_SECURITY_FIX.md](./SUBDOMAIN_SECURITY_FIX.md) - Security considerations

## Next Steps

1. Test subdomain auto-assignment by creating a new organization
2. Verify subdomain management in edit dialog
3. Check subdomain display in organizations table
4. Test subdomain access from user perspective
5. Configure DNS for production deployment
