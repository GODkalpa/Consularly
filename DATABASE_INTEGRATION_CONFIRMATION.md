# Interview Scheduling Database Integration ✅

## Status: **FULLY INTEGRATED**

All scheduling features are properly integrated with Firestore database with complete student country mapping.

---

## ✅ Database Integration Checklist

### **1. Student Country → Interview Route Mapping**

**How it works:**
1. Students stored in `orgStudents` collection with `interviewCountry` field
2. When org user selects a student, the interview route **auto-populates** based on their country
3. Mapping logic:
   - `'usa'` → `'usa_f1'` (USA F1 Student Visa)
   - `'uk'` → `'uk_student'` (UK Student Visa)
   - `'france'` or `'france_ema'` → `'france_ema'` (France EMA Interview)
   - `'france_icn'` → `'france_icn'` (France ICN Interview)

**Implemented in:**
- ✅ `src/components/org/CreateSlotDialog.tsx` (lines 90-108)
- ✅ `src/components/org/EditSlotDialog.tsx` (lines 65-83)

**User Experience:**
- Student dropdown shows: `"John Doe - USA (john@email.com)"`
- Route field automatically updates when student is selected
- User can still manually override if needed

---

### **2. API Routes Database Integration**

#### **GET /api/org/students**
**Status:** ✅ Fully Integrated

**Returns:**
```typescript
{
  students: [
    {
      id: string,
      name: string,
      email: string,
      interviewCountry: string,  // ← Used for route mapping
      lastActive: string,
      interviewsCompleted: number
    }
  ]
}
```

**Security:** Org-scoped, requires Firebase ID token

---

#### **GET /api/org/slots**
**Status:** ✅ Fully Integrated

**Returns all slot fields including:**
- `interviewRoute` - Properly saved and retrieved
- `studentId` - Links to orgStudents collection
- `studentName`, `studentEmail` - Denormalized for fast access
- All timestamps converted to ISO strings

**Query Options:**
- Filter by date range: `?start=2024-01-01&end=2024-12-31`
- Filter by status: `?status=booked`

**Security:** Org-scoped, requires Firebase ID token

---

#### **POST /api/org/slots**
**Status:** ✅ Fully Integrated

**Accepts:**
```typescript
{
  startTime: string,
  endTime: string,
  timezone: string,
  route?: string,        // ← interviewRoute saved to DB
  studentId?: string,    // ← Links to orgStudents
  notes?: string
}
```

**What it does:**
1. Validates org scope
2. **Checks for overlapping slots** (prevents double-booking)
3. If `studentId` provided:
   - Fetches student from `orgStudents` collection
   - Saves `studentName`, `studentEmail` to slot (denormalized)
   - Sets status to `'booked'`
   - **Sends white-labeled confirmation email**
4. Saves `interviewRoute` to `interviewSlots` collection
5. Returns created slot with all fields

---

#### **PATCH /api/org/slots/[id]**
**Status:** ✅ Fully Integrated

**Accepts:**
```typescript
{
  startTime?: string,
  endTime?: string,
  timezone?: string,
  status?: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show',
  studentId?: string,
  studentName?: string,
  studentEmail?: string,
  interviewRoute?: string,  // ← Can update route
  notes?: string
}
```

**What it does:**
1. Validates org owns the slot
2. Updates all provided fields
3. If time/date changed: **Sends reschedule email**
4. Updates `updatedAt` timestamp
5. Properly handles `interviewRoute` updates

---

#### **DELETE /api/org/slots/[id]**
**Status:** ✅ Fully Integrated

**What it does:**
1. Validates org owns the slot
2. If slot is booked: **Sends cancellation email**
3. Deletes slot from `interviewSlots` collection

---

### **3. Firestore Collections**

#### **Collection: `orgStudents`**
**Purpose:** Store organization students with interview preferences

**Schema:**
```typescript
{
  id: string,
  orgId: string,
  name: string,
  email: string,
  interviewCountry: string,     // ← KEY FIELD for route mapping
  studentProfile?: object,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActiveAt?: Timestamp
}
```

**Indexes Required:**
- `orgId` (Ascending)

**Usage:** Queried when loading student dropdown in scheduling dialogs

---

#### **Collection: `interviewSlots`**
**Purpose:** Store interview time slots

**Schema:**
```typescript
{
  id: string,
  orgId: string,
  startTime: Timestamp,
  endTime: Timestamp,
  timezone: string,
  status: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show',
  
  // Student assignment (links to orgStudents)
  studentId?: string,           // ← Foreign key to orgStudents.id
  studentName?: string,         // ← Denormalized for performance
  studentEmail?: string,        // ← Denormalized for email sending
  
  // Interview details
  interviewRoute?: string,      // ← Saved from student's country or manual selection
  notes?: string,
  
  // Booking metadata
  bookedBy?: string,            // User ID who booked
  bookedAt?: Timestamp,
  
  // Email tracking
  remindersSent?: {
    confirmation: boolean,
    reminder24h: boolean,
    reminder1h: boolean
  },
  
  // Interview link
  interviewId?: string,         // If interview created
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes Required:**
- `orgId` + `startTime` (Ascending, Ascending)
- `orgId` + `status` + `startTime` (Ascending, Ascending, Ascending)
- `status` + `startTime` (Ascending, Ascending) - For cron reminders

**Usage:**
- Calendar display queries by org and date range
- Cron job queries for upcoming slots to send reminders
- Links to students via `studentId`

---

### **4. Data Flow Example**

**Scenario:** Org user schedules interview for a USA student

1. **User opens Create Slot dialog**
   - `GET /api/org/students` → Returns students with `interviewCountry`
   - Student list shows: `"Sarah Johnson - USA (sarah@email.com)"`

2. **User selects student "Sarah Johnson"**
   - `useEffect` detects `studentId` change
   - Finds student with `interviewCountry: 'usa'`
   - Auto-sets `route` state to `'usa_f1'`
   - Route dropdown updates to "USA F1 Student Visa"

3. **User fills date/time and submits**
   - `POST /api/org/slots` with:
     ```json
     {
       "startTime": "2024-01-15T10:00:00Z",
       "endTime": "2024-01-15T10:30:00Z",
       "timezone": "America/New_York",
       "route": "usa_f1",
       "studentId": "student123"
     }
     ```

4. **Backend processes request**
   - Validates org scope
   - Checks no overlapping slots
   - Queries `orgStudents` to get student name and email
   - Creates slot in `interviewSlots`:
     ```json
     {
       "orgId": "org456",
       "startTime": Timestamp,
       "endTime": Timestamp,
       "timezone": "America/New_York",
       "status": "booked",
       "studentId": "student123",
       "studentName": "Sarah Johnson",
       "studentEmail": "sarah@email.com",
       "interviewRoute": "usa_f1",
       "bookedAt": Timestamp,
       "remindersSent": {
         "confirmation": true,
         "reminder24h": false,
         "reminder1h": false
       },
       "createdAt": Timestamp,
       "updatedAt": Timestamp
     }
     ```

5. **Email service sends confirmation**
   - Uses `studentEmail` from slot
   - Uses `orgId` to fetch organization branding
   - Sends white-labeled email: "Your USA F1 Student Visa Interview is Scheduled"

6. **Calendar updates**
   - Refreshes slot list via `GET /api/org/slots`
   - Shows booked slot with USA F1 label
   - Displays student name on calendar

---

### **5. Country Mapping Coverage**

**Supported Countries:**

| Country Value | Interview Route | Display Name |
|--------------|----------------|--------------|
| `'usa'` | `'usa_f1'` | USA F1 Student Visa |
| `'uk'` | `'uk_student'` | UK Student Visa |
| `'france'` | `'france_ema'` | France EMA Interview |
| `'france_ema'` | `'france_ema'` | France EMA Interview |
| `'france_icn'` | `'france_icn'` | France ICN Interview |

**Extensible:** Add more countries by updating the `countryToRoute` mapping in both dialogs.

---

### **6. Denormalization Strategy**

**Why we denormalize student data in slots:**

Instead of:
```typescript
// Requires JOIN query
slot = { studentId: "student123" }
// Then: query orgStudents to get name and email
```

We store:
```typescript
// Fast, no JOIN needed
slot = {
  studentId: "student123",
  studentName: "Sarah Johnson",  // ← Copied at booking time
  studentEmail: "sarah@email.com" // ← Copied at booking time
}
```

**Benefits:**
1. ⚡ **Faster queries** - No need to join students on every calendar load
2. 📧 **Email reliability** - Can send emails even if student deleted
3. 📊 **Historical accuracy** - Shows student name at time of booking
4. 🔒 **Security** - Less database reads = lower costs

**Trade-off:** If student changes name/email, old slots keep old values (acceptable for historical records)

---

## 🎯 Verification Steps

To confirm full database integration:

1. **Create a student with country:**
   ```
   name: "John Doe"
   email: "john@test.com"
   interviewCountry: "usa"
   ```

2. **Create a slot and assign John:**
   - Open Schedule → Create Slot
   - Select "John Doe - USA"
   - Verify route auto-changes to "USA F1 Student Visa" ✅
   - Submit

3. **Check Firestore:**
   - Collection: `interviewSlots`
   - Find your slot document
   - Verify fields exist:
     - `studentId: "john-id"`
     - `studentName: "John Doe"`
     - `studentEmail: "john@test.com"`
     - `interviewRoute: "usa_f1"` ✅
     - `status: "booked"`

4. **Check email:**
   - John receives confirmation email
   - Email shows "USA F1 Student Visa Interview" ✅

5. **Edit the slot:**
   - Change student to UK student
   - Verify route auto-changes to "UK Student Visa" ✅

---

## 🎉 Summary

✅ **Student country field fully integrated** with scheduling system  
✅ **Auto-population of interview route** based on student's country  
✅ **Database queries optimized** with proper indexing  
✅ **Denormalized data** for fast access and email reliability  
✅ **All API routes handle** `interviewRoute` correctly  
✅ **Country mapping extensible** for future visa types  

**The scheduling system is 100% database-integrated and production-ready!** 🚀
