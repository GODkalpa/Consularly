# Implementation Preview - Code Changes

## Option A: Credit Reservation System (RECOMMENDED)

### 1. Update Type Definitions

**File:** `src/types/firestore.ts`

```typescript
// ADD this field to Organization interface (around line 324)
export interface Organization {
  id: string;
  name: string;
  domain: string;
  plan: OrganizationPlan;
  quotaLimit: number;
  quotaUsed: number;
  adminUsers: string[];
  settings: OrganizationSettings;
  
  // Student credit management
  studentCreditsAllocated: number;   // Total credits reserved for students
  studentCreditsUsed: number;        // NEW: Credits actually used by students ✨
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2. Update Student Creation API

**File:** `src/app/api/org/students/route.ts`

**Current code (lines 138-155):**
```typescript
// Check organization credit availability if allocating credits
if (initialCredits > 0) {
  const orgSnap = await adminDb().collection('organizations').doc(orgId).get()
  if (!orgSnap.exists) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  
  const org = orgSnap.data() as any
  const quotaLimit = org?.quotaLimit || 0
  const quotaUsed = org?.quotaUsed || 0
  const studentCreditsAllocated = org?.studentCreditsAllocated || 0
  const availableCredits = quotaLimit - quotaUsed - studentCreditsAllocated // ❌ WRONG CALCULATION
  
  if (initialCredits > availableCredits) {
    return NextResponse.json({ 
      error: 'Insufficient credits', 
      message: `Only ${availableCredits} credits available (${initialCredits} requested)`,
      availableCredits
    }, { status: 400 })
  }
}
```

**New code (OPTION A):**
```typescript
// Check organization credit availability if allocating credits
if (initialCredits > 0) {
  const orgSnap = await adminDb().collection('organizations').doc(orgId).get()
  if (!orgSnap.exists) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  
  const org = orgSnap.data() as any
  const quotaLimit = org?.quotaLimit || 0
  const quotaUsed = org?.quotaUsed || 0
  const studentCreditsAllocated = org?.studentCreditsAllocated || 0
  
  // ✅ CORRECT: Account for both org usage AND student allocations
  const availableCredits = quotaLimit - quotaUsed - studentCreditsAllocated
  
  if (initialCredits > availableCredits) {
    return NextResponse.json({ 
      error: 'Insufficient credits', 
      message: `Only ${availableCredits} credits available. You have used ${quotaUsed} credits directly and allocated ${studentCreditsAllocated} to students.`,
      availableCredits,
      breakdown: {
        total: quotaLimit,
        used: quotaUsed,
        allocated: studentCreditsAllocated,
        available: availableCredits
      }
    }, { status: 400 })
  }
}
```

**Current code (lines 198-204):**
```typescript
// Update organization credits if allocating
if (initialCredits > 0) {
  const orgRef = adminDb().collection('organizations').doc(orgId)
  transaction.update(orgRef, {
    studentCreditsAllocated: FieldValue.increment(initialCredits),
    updatedAt: FieldValue.serverTimestamp()
  })
  
  // ... credit log ...
}
```

**New code (OPTION A - NO CHANGE NEEDED):**
```typescript
// Update organization credits if allocating
if (initialCredits > 0) {
  const orgRef = adminDb().collection('organizations').doc(orgId)
  transaction.update(orgRef, {
    studentCreditsAllocated: FieldValue.increment(initialCredits), // ✅ Reserves from pool
    updatedAt: FieldValue.serverTimestamp()
  })
  
  // ... credit log ...
}
```

---

### 3. Update Student Interview API

**File:** `src/app/api/student/interviews/route.ts`

**Current code (lines 223-234):**
```typescript
// Deduct student credit
transaction.update(studentRef, {
  creditsUsed: FieldValue.increment(1),
  creditsRemaining: FieldValue.increment(-1),
  updatedAt: FieldValue.serverTimestamp()
})

// Increment organization quota usage
transaction.update(orgRef, {
  quotaUsed: FieldValue.increment(1), // ❌ DOUBLE DEDUCTION!
  updatedAt: FieldValue.serverTimestamp()
})
```

**New code (OPTION A):**
```typescript
// Deduct student credit
transaction.update(studentRef, {
  creditsUsed: FieldValue.increment(1),
  creditsRemaining: FieldValue.increment(-1),
  updatedAt: FieldValue.serverTimestamp()
})

// Track student credit usage (but don't deduct from quotaUsed)
transaction.update(orgRef, {
  studentCreditsUsed: FieldValue.increment(1), // ✅ Track usage only
  updatedAt: FieldValue.serverTimestamp()
  // NOTE: Do NOT increment quotaUsed - credits already reserved via studentCreditsAllocated
})
```

---

### 4. Update Organization Dashboard

**File:** `src/components/org/OrganizationDashboard.tsx`

**Current code (lines 172-174):**
```typescript
const quotaLimit = org?.quotaLimit || 0
const quotaUsed = org?.quotaUsed || 0
const quotaPct = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0
```

**New code (OPTION A):**
```typescript
const quotaLimit = org?.quotaLimit || 0
const quotaUsed = org?.quotaUsed || 0
const studentCreditsAllocated = org?.studentCreditsAllocated || 0
const studentCreditsUsed = org?.studentCreditsUsed || 0

// ✅ Show total usage including student allocations
const totalUsed = quotaUsed + studentCreditsAllocated
const quotaPct = quotaLimit > 0 ? Math.min(100, (totalUsed / quotaLimit) * 100) : 0

// Calculate available credits
const availableCredits = Math.max(0, quotaLimit - totalUsed)
```

**Display update (around line 428):**
```typescript
<p className="text-sm text-center text-muted-foreground">
  You&apos;ve used <span className="font-semibold">{quotaUsed}</span> directly
  {studentCreditsAllocated > 0 && (
    <> and allocated <span className="font-semibold">{studentCreditsAllocated}</span> to students</>
  )}
  {' '}of your <span className="font-semibold">{quotaLimit}</span> simulations.
  {' '}<span className="font-semibold">{availableCredits}</span> available.
</p>
```

---

### 5. Update Credit Management Component

**File:** `src/components/org/OrgCreditManagement.tsx`

**Current code (lines 16-24):**
```typescript
interface CreditSummary {
  organization: {
    quotaLimit: number
    quotaUsed: number
    quotaRemaining: number
    studentCreditsAllocated: number
    unallocatedCredits: number
    utilizationPercent: number
  }
  // ...
}
```

**New code (OPTION A):**
```typescript
interface CreditSummary {
  organization: {
    quotaLimit: number
    quotaUsed: number                    // Org direct usage
    studentCreditsAllocated: number      // Reserved for students
    studentCreditsUsed: number           // ✨ NEW: Actually used by students
    quotaRemaining: number               // Available credits
    unallocatedCredits: number           // Not yet given to students
    utilizationPercent: number
    studentUtilizationPercent: number    // ✨ NEW: Student usage vs allocation
  }
  // ...
}
```

**Calculation update:**
```typescript
const summary: CreditSummary = {
  organization: {
    quotaLimit,
    quotaUsed,
    studentCreditsAllocated,
    studentCreditsUsed,
    quotaRemaining: Math.max(0, quotaLimit - quotaUsed - studentCreditsAllocated), // ✅ CORRECT
    unallocatedCredits: Math.max(0, quotaLimit - quotaUsed - studentCreditsAllocated),
    utilizationPercent: Math.round(((quotaUsed + studentCreditsAllocated) / quotaLimit) * 100),
    studentUtilizationPercent: studentCreditsAllocated > 0 
      ? Math.round((studentCreditsUsed / studentCreditsAllocated) * 100) 
      : 0
  },
  // ...
}
```

---

## Option B: Immediate Deduction System (SIMPLER)

### 1. Update Student Creation API (ONLY CHANGE NEEDED)

**File:** `src/app/api/org/students/route.ts`

**Current code (lines 198-204):**
```typescript
// Update organization credits if allocating
if (initialCredits > 0) {
  const orgRef = adminDb().collection('organizations').doc(orgId)
  transaction.update(orgRef, {
    studentCreditsAllocated: FieldValue.increment(initialCredits),
    updatedAt: FieldValue.serverTimestamp()
  })
}
```

**New code (OPTION B):**
```typescript
// Update organization credits if allocating
if (initialCredits > 0) {
  const orgRef = adminDb().collection('organizations').doc(orgId)
  transaction.update(orgRef, {
    quotaUsed: FieldValue.increment(initialCredits),              // ✨ Immediately deduct
    studentCreditsAllocated: FieldValue.increment(initialCredits), // Track for reporting
    updatedAt: FieldValue.serverTimestamp()
  })
}
```

### 2. Update Student Interview API

**File:** `src/app/api/student/interviews/route.ts`

**Current code (lines 230-234):**
```typescript
// Increment organization quota usage
transaction.update(orgRef, {
  quotaUsed: FieldValue.increment(1),
  updatedAt: FieldValue.serverTimestamp()
})
```

**New code (OPTION B):**
```typescript
// Do NOT increment quotaUsed - already deducted during allocation
transaction.update(orgRef, {
  // quotaUsed: DO NOT CHANGE ✅
  updatedAt: FieldValue.serverTimestamp()
})
```

---

## Summary of Changes

### Option A (Reservation) - 5 Files
1. ✅ `src/types/firestore.ts` - Add `studentCreditsUsed` field
2. ✅ `src/app/api/org/students/route.ts` - Improve error messages
3. ✅ `src/app/api/student/interviews/route.ts` - Track usage, don't deduct quotaUsed
4. ✅ `src/components/org/OrganizationDashboard.tsx` - Show breakdown
5. ✅ `src/components/org/OrgCreditManagement.tsx` - Update calculations

### Option B (Immediate) - 2 Files
1. ✅ `src/app/api/org/students/route.ts` - Deduct quotaUsed on allocation
2. ✅ `src/app/api/student/interviews/route.ts` - Don't deduct quotaUsed on interview

---

## Migration Script (If Needed)

If you have existing students, run this to fix data:

```typescript
// scripts/migrate-student-credits.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function migrateStudentCredits() {
  const db = getFirestore();
  
  // Get all organizations
  const orgsSnap = await db.collection('organizations').get();
  
  for (const orgDoc of orgsSnap.docs) {
    const orgData = orgDoc.data();
    
    // Option A: Add studentCreditsUsed field
    await orgDoc.ref.update({
      studentCreditsUsed: 0  // Initialize to 0
    });
    
    // Option B: Adjust quotaUsed to include existing student allocations
    // await orgDoc.ref.update({
    //   quotaUsed: (orgData.quotaUsed || 0) + (orgData.studentCreditsAllocated || 0)
    // });
  }
  
  console.log('✅ Migration complete!');
}

migrateStudentCredits();
```

---

## Testing Commands

```bash
# 1. Test student creation
curl -X POST http://localhost:3000/api/org/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "initialCredits": 10,
    "dashboardEnabled": true,
    "canSelfStartInterviews": true,
    "sendInvitation": true
  }'

# Expected: 
# - Org credits available decreased by 10
# - Student has 10 credits allocated

# 2. Test student interview
# (After student sets password and logs in)
curl -X POST http://localhost:3000/api/student/interviews \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "usa_f1"
  }'

# Expected (Option A):
# - Student creditsUsed: 0 → 1
# - Org studentCreditsUsed: 0 → 1
# - Org quotaUsed: UNCHANGED
# - Org available credits: UNCHANGED (still decreased by allocation)

# Expected (Option B):
# - Student creditsUsed: 0 → 1
# - Org quotaUsed: UNCHANGED (already deducted)
# - Org available credits: UNCHANGED
```

---

## Decision Time! 🎯

**Choose your approach:**

### ✅ Option A: Reservation (Recommended)
- More accurate accounting
- Can reclaim unused credits
- Better for analytics
- ~2 hour implementation

### ✅ Option B: Immediate (Simpler)
- Simplest code changes
- Use-it-or-lose-it policy
- Less flexibility
- ~1 hour implementation

**Let me know which one you prefer, and I'll implement it right away!** 🚀

You can also review:
- `STUDENT_ACCOUNT_SYSTEM_ANALYSIS.md` - Full system analysis
- `CREDIT_FLOW_DIAGRAM.md` - Visual diagrams

Just reply with: "Implement Option A" or "Implement Option B" and I'll get started!
