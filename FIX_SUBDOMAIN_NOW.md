# Fix Subdomain Issue - Quick Steps

## The Problem
`https://sumedha-education.consularly.com` shows "Organization Not Found"

## The Fix (5 minutes)

### Step 1: Deploy Latest Code ⚡
```bash
git add .
git commit -m "Fix subdomain middleware"
git push origin main
```
OR
```bash
vercel --prod
```

### Step 2: Add Wildcard Domain to Vercel 🌐
1. Go to https://vercel.com/dashboard
2. Your Project → Settings → Domains
3. Click "Add Domain"
4. Enter: `*.consularly.com`
5. Click "Add"

### Step 3: Wait 2-3 Minutes ⏱️
Let Vercel deploy and DNS propagate.

### Step 4: Test 🧪
Visit: `https://sumedha-education.consularly.com/api/debug/subdomain-status`

Should show:
```json
{
  "subdomain": "sumedha-education",
  "organization": {
    "found": true,
    "name": "Sumedha Education"
  }
}
```

### Step 5: Visit Homepage ✅
Visit: `https://sumedha-education.consularly.com/`

Should show landing page (NOT "Organization Not Found")

## Still Not Working?

### Check Vercel Logs
```bash
vercel logs --follow
```

### Check Firestore
```bash
npx tsx scripts/check-subdomain.ts sumedha-education
```

### Test Diagnostic API
```
https://consularly.com/api/debug/subdomain?subdomain=sumedha-education
```

## Need Help?
See detailed guides:
- `SUBDOMAIN_QUICK_FIX.md` - Step-by-step guide
- `SUBDOMAIN_TROUBLESHOOTING_GUIDE.md` - Full troubleshooting
- `SUBDOMAIN_FIX_SUMMARY.md` - Complete analysis

---

**TL;DR:** Deploy code → Add wildcard domain → Wait → Test
