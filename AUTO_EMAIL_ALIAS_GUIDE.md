# Automatic Email Alias Generation

## ✅ Now Enabled!

Email aliases are **automatically generated** when you create a new organization from the admin dashboard.

## How It Works

### When Creating an Organization

1. **Admin creates organization**: "Sumedha Education"
2. **System auto-generates alias**: `sumedha-education@consularly.com`
3. **Saves to database**: Stored in organization branding
4. **Returns in response**: You'll see the generated alias

### Example Flow

```
Admin Dashboard
  └─ Create Organization
      ├─ Name: "Sumedha Education"
      ├─ Plan: Premium
      ├─ Quota: 100
      └─ [Create] ← Click
          ↓
System automatically:
  ├─ Generates: sumedha-education@consularly.com
  ├─ Saves to Firestore
  └─ Returns: { id: "org123", emailAlias: "sumedha-education@consularly.com" }
          ↓
You still need to:
  └─ Create alias in Hostinger panel
```

## What You Need to Do

### 1. Create Organization (Automatic)

When you create an organization through the admin dashboard:
- ✅ Email alias is **automatically generated**
- ✅ Saved to organization branding
- ✅ Ready to use immediately

### 2. Create Alias in Hostinger (Manual)

You still need to create the alias in Hostinger:

1. **Log in to Hostinger email panel**
2. **Go to Email Aliases**
3. **Create new alias**:
   - Alias: `sumedha-education`
   - Forward to: `info@consularly.com`
4. **Save**

## API Response

When creating an organization, you'll get:

```json
{
  "id": "org123",
  "userCreated": true,
  "resetLink": "https://...",
  "emailAlias": "sumedha-education@consularly.com"
}
```

The `emailAlias` field shows what was auto-generated!

## Viewing Generated Aliases

### Option 1: Check Response
When you create the org, the API returns the generated alias.

### Option 2: Admin Dashboard
Use the EmailAliasManager component to view/edit the alias:
- Shows current alias
- Allows regeneration
- Allows manual editing

### Option 3: Firestore
Check the organization document:
```
organizations/{orgId}/settings/customBranding/emailAlias
```

## If Generation Fails

If the system can't generate an alias (rare):
- Organization is still created successfully
- `emailAlias` will be empty/undefined
- You can manually generate it later using the admin dashboard

## Examples

| Organization Name | Auto-Generated Alias |
|-------------------|---------------------|
| Sumedha Education | `sumedha-education@consularly.com` |
| Acme Corporation | `acme-corporation@consularly.com` |
| Global Tech | `global-tech@consularly.com` |
| Microsoft | `microsoft@consularly.com` |

## Existing Organizations

For organizations created **before** this feature:
- They won't have email aliases yet
- Run the migration script: `npx tsx scripts/generate-email-aliases.ts`
- Or use the admin dashboard to generate manually

## Manual Override

You can always change the auto-generated alias:

1. **Go to organization settings**
2. **Find Email Configuration section**
3. **Enter new alias** or **click Regenerate**
4. **Save**
5. **Update in Hostinger panel**

## Workflow Summary

### Creating New Organization

```
1. Admin Dashboard → Create Organization
   ├─ Enter: "Sumedha Education"
   └─ Click: Create
       ↓
2. System Auto-Generates
   ├─ Alias: sumedha-education@consularly.com
   └─ Saves to database
       ↓
3. You Create in Hostinger
   ├─ Log in to Hostinger
   ├─ Create alias: sumedha-education
   └─ Forward to: info@consularly.com
       ↓
4. Ready to Use!
   └─ Emails sent from: sumedha-education@consularly.com
```

### For Existing Organizations

```
1. Run Migration Script
   └─ npx tsx scripts/generate-email-aliases.ts
       ↓
2. Script Generates Aliases
   ├─ For all orgs without aliases
   └─ Shows list of aliases to create
       ↓
3. Create in Hostinger
   ├─ Create each alias shown
   └─ Forward to: info@consularly.com
       ↓
4. Ready to Use!
```

## Benefits

✅ **Automatic**: No need to manually generate for new orgs
✅ **Consistent**: Always follows the same naming pattern
✅ **Fast**: Happens instantly when org is created
✅ **Flexible**: Can still be changed manually if needed
✅ **Safe**: If generation fails, org creation still succeeds

## Troubleshooting

### Alias Not Generated

**Check**:
1. Look at API response - does it include `emailAlias`?
2. Check Firestore - is `emailAlias` field present?
3. Check logs - any error messages?

**Fix**:
- Use admin dashboard to generate manually
- Or call the email alias API endpoint

### Duplicate Alias

**Problem**: Two orgs with same name generate same alias

**Solution**:
- System will save the alias for both (Firestore allows duplicates)
- But Hostinger only allows one alias
- Manually change one of them:
  - `sumedha-education@consularly.com`
  - `sumedha-education-2@consularly.com`

### Reserved Name

**Problem**: Org name generates reserved alias (e.g., "Info Services" → `info-services@consularly.com`)

**Solution**:
- System validates and rejects reserved names
- Manually set a different alias
- Examples: `infoservices@consularly.com`, `info-srv@consularly.com`

## Code Location

The automatic generation happens in:
```
src/app/api/admin/organizations/route.ts
```

When an organization is created, it:
1. Imports: `generateEmailAlias` from `src/lib/email-alias-generator.ts`
2. Calls: `generateEmailAlias(organizationName)`
3. Saves: To `settings.customBranding.emailAlias`
4. Returns: In API response

## Summary

🎉 **Email aliases are now automatic!**

- ✅ Generated when org is created
- ✅ Saved to database
- ✅ Returned in API response
- ⚠️ Still need to create in Hostinger panel
- ✅ Can be changed manually anytime

No more forgetting to generate aliases for new organizations!
