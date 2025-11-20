# Email Alias Format Update

## New Simplified Format ✨

The email alias format has been updated to be **cleaner and more professional**!

### Old Format (Before)
```
org-sumedha-education@consularly.com
org-acme-corporation@consularly.com
org-global-tech@consularly.com
```

### New Format (Now)
```
sumedha-education@consularly.com
acme-corporation@consularly.com
global-tech@consularly.com
```

## How It Works

### Automatic Generation

When you create an organization named **"Sumedha Education"**:
- Takes the **first two words**: "Sumedha Education"
- Converts to lowercase and joins with hyphen: "sumedha-education"
- Adds domain: `sumedha-education@consularly.com`

### Examples

| Organization Name | Generated Email Alias |
|-------------------|----------------------|
| Sumedha Education | `sumedha-education@consularly.com` |
| Acme Corporation | `acme-corporation@consularly.com` |
| Global Tech Solutions | `global-tech@consularly.com` |
| EduPrep Academy | `eduprep-academy@consularly.com` |
| Oxford Consultancy | `oxford-consultancy@consularly.com` |
| Microsoft | `microsoft@consularly.com` (single word) |

### Manual Entry

You can also manually set any email alias:
- Format: `{name}@consularly.com`
- Must be lowercase
- Can include letters, numbers, and hyphens
- Cannot start or end with hyphen
- Cannot use reserved names (info, admin, support, noreply, contact, help, sales)

## Benefits

1. **Cleaner**: `sumedha@consularly.com` vs `org-sumedha-education@consularly.com`
2. **Professional**: Looks like a real company email
3. **Shorter**: Easier to type and remember
4. **Branded**: Each org gets their own identity

## Reserved Email Addresses

These cannot be used as organization aliases (they're reserved for system use):
- `info@consularly.com` (main mailbox)
- `admin@consularly.com`
- `support@consularly.com`
- `noreply@consularly.com`
- `contact@consularly.com`
- `help@consularly.com`
- `sales@consularly.com`

## Using the System

### 1. Auto-Generate (Recommended)

When creating a new organization:
1. Enter organization name: "Sumedha Education"
2. Click **"Generate Email Alias"**
3. System creates: `sumedha@consularly.com`
4. Create this alias in Hostinger panel

### 2. Manual Entry

If you want a custom alias:
1. Enter manually: `sumedha-edu@consularly.com`
2. Click **"Save"**
3. Create this alias in Hostinger panel

### 3. Hostinger Setup

For each generated alias:
1. Log in to Hostinger email panel
2. Go to **Email Aliases**
3. Create new alias:
   - **Alias**: `sumedha` (without @domain)
   - **Forward to**: `info@consularly.com`
4. Save

## Migration

### Existing Organizations

If you already have organizations with the old format (`org-*@consularly.com`):

**Option 1 - Keep Old Format**:
- Old aliases will continue to work
- No action needed

**Option 2 - Update to New Format**:
1. Use admin dashboard to regenerate aliases
2. Update aliases in Hostinger panel
3. Delete old aliases (optional)

### Running Migration Script

The migration script will use the **new format** for any organizations without an email alias:

```bash
npx tsx scripts/generate-email-aliases.ts
```

Output example:
```
Sumedha Education
  Alias: sumedha@consularly.com
  Org ID: org123

Acme Corporation
  Alias: acme@consularly.com
  Org ID: org456
```

## Validation Rules

The system validates email aliases to ensure they're valid:

✅ **Valid Examples**:
- `sumedha@consularly.com`
- `acme@consularly.com`
- `global-tech@consularly.com`
- `eduprep123@consularly.com`

❌ **Invalid Examples**:
- `Sumedha@consularly.com` (uppercase not allowed)
- `sumedha education@consularly.com` (spaces not allowed)
- `-sumedha@consularly.com` (cannot start with hyphen)
- `sumedha-@consularly.com` (cannot end with hyphen)
- `info@consularly.com` (reserved name)
- `sumedha@gmail.com` (wrong domain)

## Testing

Test the new format:

```bash
# Start dev server
npm run dev

# Generate alias for test org
curl -X POST http://localhost:3000/api/admin/organizations/org123/email-alias \
  -H "Content-Type: application/json" \
  -d '{"autoGenerate": true}'

# Response:
{
  "success": true,
  "emailAlias": "sumedha@consularly.com"
}
```

## FAQ

**Q: What if two organizations have the same first word?**
A: You'll need to manually set a unique alias for the second one. For example:
- First: `sumedha@consularly.com`
- Second: `sumedha-edu@consularly.com` or `sumedha2@consularly.com`

**Q: Can I use the full organization name?**
A: Yes! Manually enter it:
- `sumedha-education@consularly.com`
- Just remember it must be lowercase with hyphens instead of spaces

**Q: What about special characters in org names?**
A: They're automatically removed:
- "Sumedha & Co." → `sumedha@consularly.com`
- "Acme (UK) Ltd" → `acme@consularly.com`

**Q: Can I change an alias later?**
A: Yes! Use the admin dashboard to update it. Remember to also update it in Hostinger panel.

## Summary

The new email alias format is:
- ✅ Descriptive: `sumedha-education@consularly.com`
- ✅ Professional: Looks like a real company email
- ✅ Automatic: Takes first two words of org name
- ✅ Flexible: Can be manually customized
- ✅ Validated: Prevents invalid formats

All existing functionality remains the same - just with cleaner email addresses!
