# Quick Test Guide - Subdomain Fix

## Test in Production (2 minutes)

1. **Deploy the changes** (git push)

2. **Go to** https://consularly.com/admin/organizations

3. **Open browser console** (Press F12, click Console tab)

4. **Click Edit** on any organization

5. **Click Subdomain tab**

6. **Enter a subdomain** (e.g., "test-org-123")

7. **Enable the toggle**

8. **Click "Save Configuration"**

9. **Watch the console** - You should see:
   ```
   [SubdomainManager] Saving subdomain: { subdomain: "test-org-123", enabled: true, orgId: "..." }
   [SubdomainManager] Response status: 200
   [SubdomainManager] Success response: { success: true, organization: {...} }
   ```

10. **Refresh the page** (F5)

11. **Click Edit** on the same organization again

12. **Click Subdomain tab**

13. **Check if the subdomain is still there** ✅

## If It Works
🎉 You're done! The subdomain should persist after refresh.

## If It Doesn't Work

### Check Console for Errors:

**"Not authenticated"**
→ Sign out and sign back in

**"Response status: 401"** or **"Response status: 403"**
→ Your user doesn't have admin permissions
→ Check Firestore `users` collection, make sure `role: "admin"`

**"Response status: 500"**
→ Server error
→ Go to Vercel dashboard → Functions → Logs
→ Look for `[Subdomain API]` errors
→ Share the error message

**"Response status: 404"**
→ API route not found
→ Make sure you deployed the latest code
→ Check Vercel deployment logs

### Check Vercel Logs:

1. Go to Vercel dashboard
2. Click on your project
3. Go to "Logs" or "Functions"
4. Filter by `/api/admin/organizations`
5. Look for error messages

### Common Issues:

**Firebase Admin not initialized**
→ Check environment variables in Vercel:
- `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- OR `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`

**Token expired**
→ Sign out and sign back in

**Firestore permissions**
→ Check Firebase console → Firestore → Rules
→ Make sure admin users can write to organizations collection

## Still Not Working?

Share these with me:
1. Browser console logs (screenshot or copy/paste)
2. Vercel function logs (screenshot or copy/paste)
3. The exact error message you see
