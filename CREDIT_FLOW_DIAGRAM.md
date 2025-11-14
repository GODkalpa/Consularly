# Credit Flow Diagrams

## Current System (PROBLEMATIC) ❌

```
┌─────────────────────────────────────────────────────────────┐
│                    ORGANIZATION                              │
│                                                              │
│  quotaLimit: 1000  (Total monthly quota)                    │
│  quotaUsed: 50     (Only org-initiated interviews)          │
│  studentCreditsAllocated: 100  (Tracked but not deducted)   │
│                                                              │
│  AVAILABLE: 1000 - 50 = 950  ❌ WRONG!                       │
│  (Should be 850 after allocating 100 to students)           │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Org creates student with 10 credits
                        │ ❌ Problem: 10 credits NOT deducted
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT ACCOUNT                           │
│                                                              │
│  creditsAllocated: 10                                        │
│  creditsUsed: 0                                              │
│  creditsRemaining: 10                                        │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Student starts interview
                        │ ❌ Problem: DOUBLE DEDUCTION
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  WHAT HAPPENS:                                               │
│  1. Student creditsUsed: 0 → 1  ✅ Correct                   │
│  2. Org quotaUsed: 50 → 51     ❌ Double counting!          │
│                                                              │
│  Result: Org paid TWICE for this interview:                 │
│    - Once during student creation (implicit)                 │
│    - Again when student used it                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Proposed System - Option A: Credit Reservation ✅

```
┌─────────────────────────────────────────────────────────────┐
│                    ORGANIZATION                              │
│                                                              │
│  quotaLimit: 1000  (Total monthly quota)                    │
│  quotaUsed: 50     (Org-initiated interviews only)          │
│  studentCreditsAllocated: 100  (Reserved for students)      │
│  studentCreditsUsed: 30        (NEW: Actually used)         │
│                                                              │
│  AVAILABLE: 1000 - 50 - 100 = 850  ✅ CORRECT!              │
│  (Properly accounts for student allocation)                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Org creates student with 10 credits
                        │ ✅ 10 credits RESERVED from org pool
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CHECK AVAILABLE CREDITS                   │
│                                                              │
│  availableCredits = 1000 - 50 - 100 = 850                   │
│  requestedCredits = 10                                       │
│  850 >= 10? ✅ YES → Proceed                                 │
│                                                              │
│  UPDATE:                                                     │
│  studentCreditsAllocated: 100 → 110                          │
│  availableCredits: 850 → 840                                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Email sent, password setup, login
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT ACCOUNT                           │
│                                                              │
│  creditsAllocated: 10   (From org's reserved pool)          │
│  creditsUsed: 0                                              │
│  creditsRemaining: 10                                        │
│                                                              │
│  ✅ These 10 credits are "passed down" from org              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Student starts interview
                        │ ✅ Only deducts from student credits
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  WHAT HAPPENS:                                               │
│  1. Check: creditsRemaining > 0? ✅ Yes (10)                 │
│  2. Student creditsUsed: 0 → 1  ✅                           │
│  3. Org studentCreditsUsed: 30 → 31  ✅ (tracking only)     │
│  4. Org quotaUsed: 50 → 50  ✅ NO CHANGE (already reserved) │
│                                                              │
│  Result: Single credit deduction ✅                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Proposed System - Option B: Immediate Deduction ✅

```
┌─────────────────────────────────────────────────────────────┐
│                    ORGANIZATION                              │
│                                                              │
│  quotaLimit: 1000  (Total monthly quota)                    │
│  quotaUsed: 50     (All interviews: org + student alloc)    │
│  studentCreditsAllocated: 100  (Also added to quotaUsed)    │
│                                                              │
│  AVAILABLE: 1000 - 150 = 850  ✅ CORRECT!                    │
│  (quotaUsed includes both org interviews and allocations)   │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Org creates student with 10 credits
                        │ ✅ 10 credits IMMEDIATELY deducted
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CHECK AVAILABLE CREDITS                   │
│                                                              │
│  availableCredits = 1000 - 150 = 850                        │
│  requestedCredits = 10                                       │
│  850 >= 10? ✅ YES → Proceed                                 │
│                                                              │
│  UPDATE (ATOMIC TRANSACTION):                                │
│  quotaUsed: 150 → 160  ✅ (immediate deduction)             │
│  studentCreditsAllocated: 100 → 110  ✅ (tracking)           │
│  availableCredits: 850 → 840                                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Email sent, password setup, login
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT ACCOUNT                           │
│                                                              │
│  creditsAllocated: 10   (Pre-paid from org's pool)          │
│  creditsUsed: 0                                              │
│  creditsRemaining: 10                                        │
│                                                              │
│  ✅ These 10 credits already "charged" to org                │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Student starts interview
                        │ ✅ Just tracking (already paid for)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  WHAT HAPPENS:                                               │
│  1. Check: creditsRemaining > 0? ✅ Yes (10)                 │
│  2. Student creditsUsed: 0 → 1  ✅                           │
│  3. Org quotaUsed: 160 → 160  ✅ NO CHANGE (pre-paid)       │
│                                                              │
│  Result: No org deduction (already paid at allocation) ✅   │
└─────────────────────────────────────────────────────────────┘
```

---

## Comparison Table

| Feature | Current System ❌ | Option A: Reservation ✅ | Option B: Immediate ✅ |
|---------|-------------------|-------------------------|----------------------|
| **Available Credits** | quotaLimit - quotaUsed | quotaLimit - quotaUsed - studentCreditsAllocated | quotaLimit - quotaUsed |
| **Allocation Impact** | Tracked but not deducted | Reserved, can be reclaimed | Immediately deducted |
| **Interview Deduction** | Double-counted | Single (from reserved pool) | None (pre-paid) |
| **Unused Credits** | Lost in limbo | Can refund to org | Lost (already charged) |
| **Complexity** | Simple but broken | Medium (best accounting) | Simple (best UX) |
| **Flexibility** | Low | High | Low |
| **Accuracy** | ❌ Inaccurate | ✅ Accurate | ✅ Accurate |

---

## Real-World Example

**Scenario:** Organization has 1000 monthly credits

### Current System ❌
```
1. Org creates 10 students, each with 10 credits (100 total)
   - quotaLimit: 1000
   - quotaUsed: 0
   - studentCreditsAllocated: 100
   - Available shown: 1000 - 0 = 1000 ❌ WRONG!

2. Students use 50 credits total
   - quotaUsed: 0 → 50
   - Available shown: 1000 - 50 = 950 ❌ WRONG!
   - Reality: Only 850 available (1000 - 100 allocated - 50 used)

3. Org tries to conduct 850 org-initiated interviews
   - System allows it (shows 950 available)
   - But org only has 850 actual capacity
   - OVERRUN! 😱
```

### Option A: Reservation ✅
```
1. Org creates 10 students, each with 10 credits (100 total)
   - quotaLimit: 1000
   - quotaUsed: 0
   - studentCreditsAllocated: 100 (reserved)
   - Available: 1000 - 0 - 100 = 900 ✅ CORRECT!

2. Students use 50 credits
   - quotaUsed: 0 (unchanged)
   - studentCreditsUsed: 50
   - studentCreditsAllocated: 100 (still reserved)
   - Available: 1000 - 0 - 100 = 900 ✅ Still correct!

3. Student leaves, 50 unused credits returned
   - studentCreditsAllocated: 100 → 50
   - Available: 1000 - 0 - 50 = 950 ✅ Refunded!
```

### Option B: Immediate ✅
```
1. Org creates 10 students, each with 10 credits (100 total)
   - quotaLimit: 1000
   - quotaUsed: 0 → 100 (immediate charge)
   - studentCreditsAllocated: 100 (tracking)
   - Available: 1000 - 100 = 900 ✅ CORRECT!

2. Students use 50 credits
   - quotaUsed: 100 (unchanged, already paid)
   - studentCreditsUsed: 50 (tracking only)
   - Available: 1000 - 100 = 900 ✅ Still correct!

3. Student leaves with 50 unused credits
   - ❌ Cannot refund (already charged)
   - Available: 1000 - 100 = 900 (unchanged)
```

---

## Recommendation 🏆

**Use Option A (Reservation System)** because:

1. ✅ **Most Accurate:** Properly tracks allocation vs usage
2. ✅ **Flexible:** Can reclaim unused credits
3. ✅ **Clear Accounting:** Separates org direct use from student use
4. ✅ **Fair:** Students don't "waste" org credits if they don't use them
5. ✅ **Scalable:** Easy to add features like credit transfers, expiry, etc.

**Avoid Option B if:**
- You need to reclaim unused credits from inactive students
- You want detailed usage analytics (allocation vs actual usage)
- You plan to implement credit trading between students

**Choose Option B if:**
- You want the simplest implementation
- Credits are non-refundable (use-it-or-lose-it policy)
- You don't care about tracking allocated vs used credits

---

## Implementation Difficulty

| Task | Option A | Option B |
|------|----------|----------|
| Add new field to Organization | ✅ Easy | ❌ Not needed |
| Update student creation API | 🟡 Medium | ✅ Easy |
| Update interview creation API | 🟡 Medium | ✅ Easy |
| Update dashboard displays | 🟡 Medium | ✅ Easy |
| Add credit refund feature | ✅ Easy | ❌ Very hard |
| Total Implementation Time | ~2 hours | ~1 hour |

---

## Your Decision

Based on:
> "After every account created by the student 5 credits should be deducted in the org credits since the credits that they have is passed down to the student dashboard."

I recommend **Option A (Reservation)** because:
- Credits are "passed down" = Reserved from org pool
- Clear separation of allocated vs used
- More professional accounting
- Better for future features

But if you want **simplest possible**, go with **Option B (Immediate)**.

**Which would you prefer? Let me know and I'll implement it!** 🚀
