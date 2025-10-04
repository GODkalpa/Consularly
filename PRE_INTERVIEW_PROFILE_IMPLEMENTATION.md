# Pre-Interview Profile Information System

## Overview

This implementation adds a comprehensive pre-interview profile collection system that gathers essential student information before starting interviews. The system now asks for degree level, program details, and costs, which enables personalized question selection and context-aware interview experiences.

## Problem Solved

**Before**: The system was asking graduate-level questions (like "You already have a Master's degree; why again study MBA or MS in the US?") without knowing if the student was actually an undergraduate or graduate applicant.

**After**: The system now collects detailed profile information upfront and uses it to:
- Select appropriate questions based on degree level (undergraduate vs. graduate vs. doctorate)
- Provide context-aware follow-ups referencing specific programs, universities, and costs
- Generate more realistic and relevant interview scenarios

## Implementation Details

### 1. Database Schema Extensions

**Files Modified:**
- `src/types/firestore.ts`
- `src/lib/database.ts`

**New Types and Interfaces:**
```typescript
export type DegreeLevel = 'undergraduate' | 'graduate' | 'doctorate' | 'other';

export interface StudentProfileInfo {
  degreeLevel?: DegreeLevel;
  programName?: string; // e.g., "Master's in Computer Science"
  universityName?: string; // e.g., "Stanford University"
  programLength?: string; // e.g., "2 years"
  programCost?: string; // e.g., "$50,000"
  fieldOfStudy?: string;
  intendedMajor?: string;
  profileCompleted?: boolean;
}
```

**UserProfile Extended:**
```typescript
export interface UserProfile {
  // ... existing fields
  studentProfile?: StudentProfileInfo; // New field
}
```

### 2. Reusable Profile Form Component

**File Created:** `src/components/profile/ProfileSetupForm.tsx`

A reusable form component that:
- Collects all required profile information
- Validates required fields (degree level, program name, university, length, cost)
- Provides optional fields (field of study, intended major)
- Can be used with or without a card wrapper
- Shows clear validation errors

**Required Fields:**
- ✅ Degree Level
- ✅ Program Name
- ✅ University Name
- ✅ Program Length
- ✅ Total Program Cost

**Optional Fields:**
- Field of Study
- Intended Major/Specialization

### 3. User Flows Implementation

#### A. Sign-up Users Flow

**Files Modified:**
- `src/app/signup/page.tsx` - Redirects to profile setup after sign-up
- `src/app/profile-setup/page.tsx` - New profile completion page

**Flow:**
1. User signs up → Redirected to `/profile-setup`
2. User fills out profile information
3. Profile saved to Firestore with `profileCompleted: true`
4. User redirected to `/dashboard`

**Features:**
- Auto-redirects to dashboard if profile already completed
- Shows loading state while checking profile
- Handles both email and Google sign-up flows

#### B. Organization Dashboard Flow

**File Modified:** `src/components/org/OrgStudentManagement.tsx`

**Flow:**
1. Org admin clicks "Add Student"
2. Modal opens with two sections:
   - **Basic Information**: Name, Email
   - **Program Information**: All profile fields
3. All required fields must be filled before submission
4. Student created with complete profile in database

**Changes:**
- Extended modal with scrollable content
- Added profile field inputs with Select components
- Validation for all required fields
- Student records now include `studentProfile` field

#### C. Admin Dashboard Flow

**File Modified:** `src/components/admin/InterviewSimulation.tsx`

**Flow:**
1. Admin fills out interview form with:
   - **Basic Information**: Student Name, Country/Route
   - **Program Information**: All profile fields
2. All fields validated before starting interview
3. Profile data passed to interview session

**Changes:**
- Extended form with two sections
- Added profile state management
- Validation with clear error messages
- Profile data included in interview session payload
- Reset function clears all profile fields

### 4. Interview Logic Integration

**Files Modified:**
- `src/lib/interview-simulation.ts` - Extended `studentProfile` interface
- `src/lib/llm-service.ts` - Updated prompts to use profile data

**Question Selection Enhancement:**

The LLM now receives detailed profile information and uses it to:

**For Undergraduates:**
- Focus on high school background
- Career exploration questions
- Why US education is needed
- Foundational knowledge assessment

**For Graduate Students (Master's):**
- Questions about existing undergraduate degree
- Why further study is necessary
- Career advancement plans
- Research interests and specialization

**For Doctorate (PhD) Students:**
- Research proposals and methodology
- Why this specific program/advisor
- Long-term academic goals
- Publications and research experience

**Prompt Example (USA F1):**
```
Student Profile:
- Degree Level: graduate
- Program: Master's in Computer Science
- University: Stanford University
- Program Length: 2 years
- Total Cost: $80,000

IMPORTANT: Use the degree level (graduate) and program details to tailor questions:
- Ask about their existing degree, why further study is necessary, career advancement plans
- Reference the specific program (Master's in Computer Science) and cost ($80,000) in questions
- Use university name (Stanford University) to ask why they chose this specific institution
```

### 5. API Routes

**File Modified:** `src/app/api/org/students/route.ts`

**Changes:**
- POST endpoint now accepts `studentProfile` in request body
- GET endpoint returns `studentProfile` with student data
- Profile data saved and retrieved from Firestore

**POST Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "studentProfile": {
    "degreeLevel": "graduate",
    "programName": "Master's in Computer Science",
    "universityName": "Stanford University",
    "programLength": "2 years",
    "programCost": "$80,000",
    "fieldOfStudy": "Computer Science",
    "intendedMajor": "Artificial Intelligence",
    "profileCompleted": true
  }
}
```

## Benefits

### 1. Context-Aware Question Selection
- No more asking grad-level questions to undergrads
- Questions reference actual program names and costs
- University-specific questions possible

### 2. Better Interview Realism
- Matches real visa interview scenarios
- Officers know applicant details beforehand
- Questions feel more natural and targeted

### 3. Improved Scoring Accuracy
- Context helps evaluate answers appropriately
- Different expectations for different degree levels
- Cost-related questions have actual numbers

### 4. User Experience
- Clear expectation setting upfront
- Organized data collection
- Consistent experience across all user types

## Handling Existing Users

### Problem
Existing users who created accounts before this feature would bypass the profile setup and go directly to the dashboard without filling their information.

### Solution: Multi-Layer Profile Guard

**1. ProfileGuard Component** (`src/components/guards/ProfileGuard.tsx`)
- Checks if user has completed profile (`profileCompleted: true`)
- If not, redirects to `/profile-setup`
- Wraps protected routes like dashboard
- Shows loading state while checking

**2. Dashboard Protection** (`src/app/dashboard/page.tsx`)
```tsx
<UserGuard>
  <ProfileGuard>
    <UserDashboard />
  </ProfileGuard>
</UserGuard>
```

**3. AuthContext Global Check** (`src/contexts/AuthContext.tsx`)
- Real-time profile monitoring via Firestore snapshot
- Auto-redirects incomplete profiles to setup
- Exempts admin users (they don't need student profiles)
- Exempts certain paths: `/profile-setup`, `/signin`, `/signup`, `/`

**4. Profile Setup Page Enhancements**
- Detects if user is existing (has account but no profile)
- Shows different messaging:
  - **New Users**: "Welcome! Let's set up your profile"
  - **Existing Users**: "Complete Your Profile to access the dashboard"
- Prevents access to dashboard until completed

### User Flows

**New Sign-up User:**
1. Creates account
2. Redirected to `/profile-setup`
3. Fills profile form
4. Profile saved with `profileCompleted: true`
5. Redirected to `/dashboard` ✅

**Existing User (No Profile):**
1. Logs in
2. AuthContext detects missing profile
3. Auto-redirected to `/profile-setup`
4. Fills profile form
5. Profile saved with `profileCompleted: true`
6. Redirected to `/dashboard` ✅

**Existing User (Profile Complete):**
1. Logs in
2. ProfileGuard checks → Profile complete ✅
3. Access to `/dashboard` granted immediately ✅

**Admin User:**
1. Logs in
2. AuthContext detects admin role
3. **No profile required** (admins fill per-interview)
4. Access to admin dashboard granted ✅

## Testing Checklist

- [x] Sign-up users are redirected to profile setup
- [x] Profile form validates all required fields
- [x] Profile data saves to database correctly
- [x] Existing users with profiles skip setup page
- [x] **Existing users WITHOUT profiles are forced to complete it**
- [x] **Dashboard is blocked until profile is completed**
- [x] **Multiple guard layers prevent bypassing**
- [x] Org admins can create students with profiles
- [x] Admin dashboard collects profile before interview
- [x] **Admin users don't need student profiles**
- [x] Interview questions reference profile data
- [x] Graduate vs undergraduate questions are different
- [x] Program name and cost appear in questions
- [x] Profile data persists across sessions
- [x] AuthContext provides real-time profile monitoring

## Database Collections

### `users` Collection
```javascript
{
  uid: "user123",
  email: "student@example.com",
  displayName: "John Doe",
  role: "user",
  studentProfile: {
    degreeLevel: "graduate",
    programName: "Master's in CS",
    universityName: "Stanford",
    programLength: "2 years",
    programCost: "$80,000",
    profileCompleted: true
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `orgStudents` Collection
```javascript
{
  id: "student123",
  orgId: "org456",
  name: "Jane Smith",
  email: "jane@example.com",
  studentProfile: {
    degreeLevel: "undergraduate",
    programName: "Bachelor's in Engineering",
    universityName: "MIT",
    programLength: "4 years",
    programCost: "$200,000",
    profileCompleted: true
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Future Enhancements

1. **Profile Editing**: Allow users to update their profile
2. **Multiple Profiles**: Support users applying to multiple programs
3. **Profile Templates**: Pre-fill common programs and costs
4. **Analytics**: Track which degree levels use the system most
5. **Validation**: Add regex validation for cost formats
6. **Auto-fill**: Suggest universities and programs based on field of study
7. **Profile Import**: Import from CSV for bulk organization setups

## Files Changed

### Created
- `src/components/profile/ProfileSetupForm.tsx` - Reusable profile form component
- `src/app/profile-setup/page.tsx` - Profile setup page
- `src/components/guards/ProfileGuard.tsx` - **Profile completion guard**
- `PRE_INTERVIEW_PROFILE_IMPLEMENTATION.md` - Documentation

### Modified
- `src/types/firestore.ts` - Added StudentProfileInfo types
- `src/lib/database.ts` - Extended UserProfile with studentProfile
- `src/app/signup/page.tsx` - Redirect to profile setup after signup
- `src/app/dashboard/page.tsx` - **Added ProfileGuard wrapper**
- `src/contexts/AuthContext.tsx` - **Added auto-redirect for incomplete profiles**
- `src/components/org/OrgStudentManagement.tsx` - Extended student creation with profile
- `src/components/admin/InterviewSimulation.tsx` - Added profile fields to interview start
- `src/lib/interview-simulation.ts` - Extended studentProfile interface
- `src/lib/llm-service.ts` - Updated prompts with profile data
- `src/app/api/org/students/route.ts` - Added studentProfile to API

## Summary

This implementation successfully adds pre-interview profile collection across all user types (sign-up, org, admin) and integrates the data into the interview logic for context-aware question selection. The system now asks appropriate questions based on degree level, references specific programs and costs, and provides a more realistic interview experience.

**Critical Feature:** Multi-layer profile enforcement ensures **ALL users** (new and existing) must complete their profile before accessing the dashboard. This prevents the system from asking inappropriate questions (like asking undergrads about their Master's degree).

**No linter errors detected** ✅  
**All user flows implemented** ✅  
**Database schema extended** ✅  
**API routes updated** ✅  
**Interview logic enhanced** ✅  
**Existing user handling complete** ✅  
**Profile guard system active** ✅  
**Admin exemption working** ✅

