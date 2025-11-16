# Script Usage Guide

## Interview Management Scripts

### Prerequisites

Before running these scripts, you need:

1. **Firebase Service Account Key**
   - Download from Firebase Console → Project Settings → Service Accounts
   - Save as `service-account-key.json` in the project root
   - **Never commit this file to git!** (it's in .gitignore)

2. **Node.js and npm installed**
   - The scripts use `tsx` to run TypeScript files

### Available Commands

#### 1. Check Interview Status

Check the current state of all interviews in your database:

```bash
npm run interview:check
```

Or check for a specific organization:

```bash
npm run interview:check YOUR_ORG_ID
```

**What it shows:**
- Total interviews by status (scheduled, in_progress, completed, failed)
- Interviews missing the `finalScore` field
- Recent interviews (last 10)
- Summary statistics

**Example output:**
```
📊 Interview Status Report
============================================================

📈 Total Interviews: 45

📊 Status Breakdown:
------------------------------------------------------------
✅ completed        : 38
⏳ in_progress      : 5
📅 scheduled        : 2

⚠️  Interviews Missing finalScore:
------------------------------------------------------------
ID: abc123xyz
   Status: completed
   Score: 85
   Has Report: Yes
   Created: 2025-01-15T10:30:00.000Z

Total: 1 interviews need finalScore field

💡 Tip: Run "npm run interview:fix" to fix missing finalScore fields
```

#### 2. Fix Stuck Interviews

Fix interviews that are stuck in "in_progress" status:

```bash
npm run interview:fix
```

**What it does:**
1. Finds all interviews with status = "in_progress"
2. Checks if they have a `finalReport` (meaning they were completed)
3. Updates status to "completed" and sets `finalScore` if missing
4. Marks abandoned interviews (>2 hours old with no finalReport) as "failed"

**Example output:**
```
🔍 Searching for stuck interviews...
Found 3 interviews with "in_progress" status

✅ Fixing interview abc123xyz:
   - Student: student123
   - Created: 2025-01-15T10:30:00.000Z
   - Has finalReport: Yes
   - Score: 85
   - Setting finalScore: 85

⚠️  Marking abandoned interview def456uvw as failed:
   - Student: student456
   - Created: 2025-01-15T08:00:00.000Z
   - Hours since creation: 3.5

✨ Summary:
   - Fixed: 2
   - Skipped (recent): 1
   - Total processed: 3

✅ Script completed successfully
```

### Troubleshooting

#### Error: service-account-key.json not found

```
❌ Error: service-account-key.json not found!
Please download your Firebase service account key and place it in the project root.
```

**Solution:**
1. Go to Firebase Console
2. Navigate to Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save the downloaded file as `service-account-key.json` in your project root

#### Error: Unknown file extension ".ts"

```
TypeError: Unknown file extension ".ts"
```

**Solution:**
Use the npm scripts instead of running directly:
```bash
# Instead of: npx ts-node scripts/check-interview-status.ts
npm run interview:check

# Instead of: npx ts-node scripts/fix-stuck-interviews.ts
npm run interview:fix
```

#### Error: Permission denied

**Solution:**
Make sure you have the correct Firebase permissions. The service account needs:
- Read access to `interviews` collection
- Write access to `interviews` collection (for fix script)
- Read access to `orgStudents` collection
- Read access to `organizations` collection

### When to Run These Scripts

#### Run `interview:check` when:
- You want to see the current state of all interviews
- You're debugging interview status issues
- You want to verify that interviews are being completed correctly
- You're checking for data inconsistencies

#### Run `interview:fix` when:
- Interviews are stuck in "in_progress" status
- Dashboard shows "Interview data not available" for completed interviews
- You've just deployed the status fix and want to update existing data
- You notice interviews missing the `finalScore` field

### Safety

Both scripts are **safe to run multiple times**:
- `interview:check` only reads data, never modifies anything
- `interview:fix` only updates interviews that need fixing, skips already-correct data

### Integration with CI/CD

You can add these scripts to your deployment process:

```yaml
# Example GitHub Actions workflow
- name: Fix stuck interviews after deployment
  run: npm run interview:fix
  env:
    GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
```

### Manual Database Queries

If you prefer to check manually in Firebase Console:

```javascript
// Find interviews stuck in progress
db.collection('interviews')
  .where('status', '==', 'in_progress')
  .get()

// Find completed interviews missing finalScore
db.collection('interviews')
  .where('status', '==', 'completed')
  .where('finalScore', '==', null)
  .get()
```

### Related Documentation

- `INTERVIEW_STATUS_FIX.md` - Technical details about the status fix
- `QUICK_FIX_SUMMARY.md` - Quick reference for fixing stuck interviews
- `REPORT_FEATURE_DOCUMENTATION.md` - Information about the report viewing feature
