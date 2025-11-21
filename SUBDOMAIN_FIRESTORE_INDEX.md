# Firestore Index for Subdomain Feature

## Overview

The subdomain white-labeling feature requires a composite index on the `organizations` collection to efficiently query organizations by subdomain.

## Required Index

```json
{
  "collectionGroup": "organizations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "subdomain", "order": "ASCENDING" },
    { "fieldPath": "subdomainEnabled", "order": "ASCENDING" }
  ]
}
```

## Deployment Instructions

### Option 1: Automatic Deployment (Recommended)

Deploy all indexes from `firestore.indexes.json`:

```bash
firebase deploy --only firestore:indexes
```

### Option 2: Manual Creation via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure:
   - Collection ID: `organizations`
   - Fields to index:
     - Field: `subdomain`, Order: Ascending
     - Field: `subdomainEnabled`, Order: Ascending
   - Query scope: Collection
6. Click **Create**

### Option 3: Firebase CLI Command

```bash
firebase firestore:indexes:create \
  --collection-group=organizations \
  --field-path=subdomain \
  --order=ASCENDING \
  --field-path=subdomainEnabled \
  --order=ASCENDING
```

## Index Purpose

This composite index enables efficient queries like:

```typescript
// Find organization by subdomain (with enabled check)
const orgQuery = query(
  collection(db, 'organizations'),
  where('subdomain', '==', 'acmecorp'),
  where('subdomainEnabled', '==', true)
);
```

## Verification

After deployment, verify the index is active:

1. Check Firebase Console → Firestore → Indexes
2. Status should show "Enabled" (not "Building")
3. Test a subdomain query in your application

## Index Build Time

- Small databases (< 1000 docs): ~1-2 minutes
- Medium databases (1000-10000 docs): ~5-10 minutes
- Large databases (> 10000 docs): ~15-30 minutes

## Troubleshooting

If queries fail with "requires an index" error:

1. Check if index is still building (Firebase Console)
2. Verify index configuration matches exactly
3. Wait for index to complete building
4. Clear any cached queries and retry

## Notes

- This index is already included in `firestore.indexes.json`
- Deploy before enabling subdomain features in production
- Index is required for middleware subdomain lookups
