# Subdomain Feature - Quick Reference

## For Admins

### Creating Organizations
✅ **Automatic** - Subdomain is auto-generated from organization name
- No manual setup required
- Enabled by default
- Shows in success message

### Managing Subdomains
📍 **Location:** Admin Dashboard → Organizations → Edit → Subdomain Tab

**Actions:**
- View current subdomain
- Generate new suggestion
- Manually enter custom subdomain
- Enable/disable access
- Preview URL

### Viewing Subdomains
📊 **Organizations Table** shows:
- 🌐 Subdomain name
- Status badge (Active/Disabled/Not set)

## Quick Actions

### Create Organization with Subdomain
```
1. Admin Dashboard → Organizations
2. Click "Add Organization"
3. Fill form (name, email, plan, quota)
4. Click "Create Organization"
5. ✓ Subdomain auto-assigned!
```

### Edit Subdomain
```
1. Organizations → Click "Edit"
2. Switch to "Subdomain" tab
3. Modify subdomain or click "Suggest"
4. Toggle enable/disable
5. Click "Save Configuration"
```

### Check Subdomain Status
```
1. Organizations table
2. Look at "Subdomain" column
3. See status at a glance
```

## Subdomain Rules

| Rule | Value |
|------|-------|
| **Min Length** | 3 characters |
| **Max Length** | 63 characters |
| **Allowed** | a-z, 0-9, hyphen (-) |
| **Not Allowed** | Start/end with hyphen |
| **Reserved** | www, api, admin, app, mail, etc. |
| **Uniqueness** | One per organization |

## URL Formats

| Environment | Format | Example |
|-------------|--------|---------|
| **Development** | `http://[subdomain].localhost:3000` | `http://acmecorp.localhost:3000` |
| **Production** | `https://[subdomain].consularly.com` | `https://acmecorp.consularly.com` |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/organizations` | POST | Create org (auto-assigns subdomain) |
| `/api/admin/organizations/[id]/subdomain` | PATCH | Update subdomain |
| `/api/admin/subdomain/validate` | POST | Validate subdomain |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Subdomain not generated | Manually set in edit dialog |
| Subdomain taken | Try different name or use numeric suffix |
| Subdomain not working | Check enabled status and DNS config |
| Validation error | Check format rules (3-63 chars, lowercase) |

## Success Indicators

✅ **Organization Created:**
```
✓ Organization created successfully
🌐 Subdomain: acmecorp.consularly.com (Active)
```

✅ **Subdomain Updated:**
```
✓ Subdomain configuration updated successfully!
```

✅ **Validation Passed:**
```
✓ Available
```

## Common Patterns

### Organization Name → Subdomain
- "ACME Corporation" → `acmecorp`
- "Tech Solutions Inc." → `techsolutions`
- "Global Visa Services" → `globalvisaservices`
- "ABC Company" → `abccompany`

### Handling Duplicates
- First: `acmecorp`
- Second: `acmecorp2`
- Third: `acmecorp3`
- etc.

## Best Practices

1. ✅ Use descriptive organization names
2. ✅ Let system auto-generate subdomains
3. ✅ Keep subdomains short and memorable
4. ✅ Enable subdomains for active organizations
5. ✅ Disable subdomains for suspended orgs
6. ✅ Test subdomain access after creation

## Documentation

- 📖 [SUBDOMAIN_AUTO_ASSIGNMENT_GUIDE.md](./SUBDOMAIN_AUTO_ASSIGNMENT_GUIDE.md) - Full guide
- 📖 [SUBDOMAIN_UI_GUIDE.md](./SUBDOMAIN_UI_GUIDE.md) - UI walkthrough
- 📖 [SUBDOMAIN_FEATURE_COMPLETE.md](./SUBDOMAIN_FEATURE_COMPLETE.md) - Technical details

## Support

Need help? Check:
1. This quick reference
2. Full documentation (links above)
3. Organizations table for current status
4. Edit dialog for configuration options
