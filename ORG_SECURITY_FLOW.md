# Organization Security Flow Diagram

## Authentication Flow with Organization Validation

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Login Attempt                            │
│              (sumedha-education.consularly.com)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Firebase Authentication                         │
│              (Validates email + password)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                    ✅ Valid Credentials
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/auth/session                              │
│              { idToken: "..." }                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         Extract Subdomain from Request                           │
│         subdomain = "sumedha-education"                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      Query Firestore: organizations                              │
│      WHERE subdomain = "sumedha-education"                       │
│      WHERE subdomainEnabled = true                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                    Found Org?
                    /        \
                   /          \
                  NO          YES
                  │            │
                  ▼            ▼
            ┌─────────┐   ┌──────────────────────────────────────┐
            │ Return  │   │  Get Organization ID                 │
            │ 404     │   │  orgId = "sumedha-org-id"           │
            └─────────┘   └──────────┬───────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │  Decode ID Token                     │
                          │  userId = "user-firebase-uid"        │
                          └──────────┬───────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │  Query Firestore: users              │
                          │  WHERE uid = userId                  │
                          └──────────┬───────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │  Check User's Organization           │
                          │  user.orgId === orgId?               │
                          │  OR user.role === 'admin'?           │
                          └──────────┬───────────────────────────┘
                                     │
                                     ▼
                              Match?
                              /    \
                             /      \
                            NO      YES
                            │        │
                            ▼        ▼
                  ┌──────────────┐  ┌──────────────────────────┐
                  │ Check if     │  │ ✅ SET SESSION COOKIES   │
                  │ Student?     │  │                          │
                  └──────┬───────┘  │ s = 1                    │
                         │          │ uid = userId             │
                         ▼          │ role = userRole          │
              ┌──────────────────┐ │ orgId = userOrgId        │
              │ Query: orgStudents│ │                          │
              │ WHERE firebaseUid │ │ Return 200 Success       │
              │ WHERE orgId       │ └──────────┬───────────────┘
              └──────┬───────────┘            │
                     │                        │
                     ▼                        │
                 Found?                       │
                 /    \                       │
                /      \                      │
               NO      YES                    │
               │        │                     │
               ▼        ▼                     │
         ┌─────────┐  ┌────────┐            │
         │ Return  │  │ SET    │            │
         │ 403     │  │ COOKIES│            │
         │         │  │        │            │
         │ Error:  │  │ Return │            │
         │ "Access │  │ 200    │            │
         │ Denied" │  └────┬───┘            │
         │         │       │                │
         │ Sign Out│       │                │
         │ User    │       │                │
         └─────────┘       │                │
                           │                │
                           └────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  User Redirected to  │
                        │  Dashboard           │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Middleware Validates│
                        │  (Backup Check)      │
                        │                      │
                        │  - Check cookies     │
                        │  - Verify orgId      │
                        │  - Clear if mismatch │
                        └──────────────────────┘
```

## Key Security Points

### 1. Validation Happens BEFORE Cookie Setting
- Organization check occurs in `/api/auth/session`
- Cookies are only set if validation passes
- Failed validation = no session = no access

### 2. Multiple Validation Layers
- **Layer 1:** Firebase (credentials valid?)
- **Layer 2:** Session API (belongs to org?)
- **Layer 3:** Middleware (backup check)

### 3. Automatic Cleanup
- Failed validation triggers sign-out
- All cookies cleared on access denial
- User sees clear error message

### 4. Special Cases
- **Platform Admins:** Can access any org (role='admin')
- **Students:** Validated via orgStudents collection
- **Org Users:** Validated via users.orgId field

## Error Responses

### 403 - Access Denied
```json
{
  "success": false,
  "error": "You do not have access to this organization. Please use the correct subdomain for your organization.",
  "code": "ORG_ACCESS_DENIED"
}
```

### 404 - Organization Not Found
```json
{
  "success": false,
  "error": "Organization not found"
}
```

### 200 - Success
```json
{
  "success": true,
  "orgId": "sumedha-org-id",
  "orgName": "Sumedha Education"
}
```

## Cookie Structure

After successful validation:
```
s=1                    (Session flag)
uid=user-firebase-uid  (User ID)
role=org               (User role)
orgId=sumedha-org-id   (Organization ID)
```

All cookies:
- httpOnly: true (not accessible via JavaScript)
- secure: true (HTTPS only in production)
- sameSite: 'lax' (CSRF protection)
- maxAge: 7 days
- path: '/' (available site-wide)
