# USA F1 Degree-Level Question Personalization - Implementation Summary

## Problem Statement

A user reported that during a USA F1 visa interview simulation, despite filling out their profile indicating they were pursuing a **Master's degree** with a completed **Bachelor's degree**, the system asked them questions about "going to bachelor's" - which was inappropriate and confusing.

## Root Cause Analysis

The issue was multi-layered:

1. **Profile data was collected but not used for filtering** - The system collected degree level (undergraduate/graduate/doctorate) but didn't actively filter questions based on this information
2. **Question bank contained degree-specific questions without metadata** - Questions like "What is your undergraduate degree?" were in the bank without tags indicating they should only be asked to graduate/PhD students
3. **LLM prompts lacked explicit degree-level filtering rules** - The AI question generator didn't have strong guardrails against asking inappropriate questions
4. **No validation or logging** - System didn't detect or warn when mismatched questions were generated

## Solution Implemented

### 1. Enhanced Question Selection Context (`smart-question-selector.ts`)

**Changes:**
- Added `degreeLevel` and `programName` fields to `StudentContext` interface
- Updated `buildContextFlags()` to include degree-level flags:
  - `is_undergraduate`
  - `is_graduate` 
  - `is_doctorate`
  - `has_completed_bachelors` (true for Master's/PhD students)

**New Filtering Function:**
```typescript
function isQuestionAppropriateForDegreeLevel(
  question: string,
  degreeLevel?: 'undergraduate' | 'graduate' | 'doctorate' | 'other'
): boolean
```

This function filters out:
- Questions about "undergraduate degree" for undergraduate students
- Questions about "bachelor's projects" for undergraduate students  
- PhD-specific questions (publications, conferences) for non-PhD students
- Questions about "planning to do a PhD" for PhD students

**Question Filtering:**
- Added degree-level filtering in `selectFromBank()` before LLM selection
- Questions are filtered based on student's degree level before being presented to the LLM

### 2. Enhanced LLM Prompts (`llm-service.ts`)

**Changes:**
- Added CRITICAL DEGREE-LEVEL FILTERING RULES section with degree-specific guidelines:

For **Undergraduate** students:
```
✓ APPROPRIATE: High school background, basic career goals, why US education
✗ NEVER ASK: "What is your undergraduate degree?", questions implying they have a bachelor's
```

For **Graduate (Master's)** students:
```
✓ APPROPRIATE: COMPLETED bachelor's degree (as PAST education), career advancement
✗ NEVER ASK: "What is your undergraduate degree?" (implies current program)
✗ NEVER ASK: High school background (too basic)
```

For **Doctorate (PhD)** students:
```
✓ APPROPRIATE: Research proposals, advisor fit, publications
✗ NEVER ASK: "Do you plan to do a PhD?" (they ARE doing one!)
```

- Added validation checklist in the prompt for LLM to verify before finalizing questions

### 3. Question Bank Metadata (`f1-questions-data.ts`)

**New Functions:**
```typescript
export function isF1QuestionAppropriateForDegreeLevel(
  question: string,
  degreeLevel: DegreeLevel | undefined
): boolean

export function filterF1QuestionsByDegreeLevel(
  questions: string[],
  degreeLevel: DegreeLevel | undefined
): string[]
```

These functions provide programmatic filtering of F1 questions based on degree level.

### 4. Question Bank Tags (`question-bank.json`)

**Updated Questions with Metadata:**

**USA_029** - "In what year did you get your Bachelor's degree..."
```json
"requiresContext": ["has_completed_bachelors"],
"inappropriateFor": ["undergraduate"]
```

**USA_038** - "What is your undergraduate degree?"
```json
"requiresContext": ["has_completed_bachelors"],
"inappropriateFor": ["undergraduate"]
```

**USA_112** - "What year did you graduate? Explain about your undergraduate projects?"
```json
"requiresContext": ["has_completed_bachelors"],
"inappropriateFor": ["undergraduate"]
```

**USA_057** - "Did you publish any papers during your undergraduate?"
```json
"requiresContext": ["is_doctorate", "has_completed_bachelors"]
```

**USA_058** - "Did you attend or present at any conferences?"
```json
"requiresContext": ["is_doctorate"]
```

**USA_104** - "Do you plan to do a PhD after your master's?"
```json
"requiresContext": ["is_graduate"],
"inappropriateFor": ["doctorate"]
```

### 5. Validation & Logging (`interview-simulation.ts`)

**Added Debug Logging:**
- Logs degree level and program name when generating questions for USA F1
- Example: `[Interview Generation] USA F1 - Degree Level: graduate, Program: Master's in Computer Science`

**Added Validation Warnings:**
After LLM generates a question, the system validates it and logs warnings if inappropriate:

- For undergraduate students: Warns if question mentions "bachelor's degree" or "undergraduate projects"
- For graduate students: Warns if question asks about "high school" or PhD-level topics
- For PhD students: Warns if question asks "plan to do a PhD"

Example warning:
```
⚠️ [DEGREE MISMATCH] Generated question for UNDERGRADUATE student asks about bachelor's degree: "What is your undergraduate degree?"
⚠️ This should NOT happen. Student is pursuing undergraduate, not graduate.
```

## Data Flow

```
User Profile Setup (ProfileSetupForm.tsx)
  ↓ (degreeLevel: 'graduate', programName: 'Master's in CS')
Firestore Storage
  ↓
UserInterviewSimulation.tsx / OrgInterviewSimulation.tsx
  ↓ (studentProfilePayload with degreeLevel)
API /api/interview/session (route.ts)
  ↓
InterviewSimulationService.startInterview()
  ↓ (session.studentProfile.degreeLevel)
generateNextQuestion()
  ↓ (logs degree level, includes in request)
LLMQuestionService.generateQuestion()
  ↓ (enhanced prompt with degree rules)
LLM Selection / Question Bank
  ↓ (filtered by degree level)
SmartQuestionSelector.selectFromBank()
  ↓ (degree-appropriate questions only)
VALIDATION CHECK
  ↓ (warns if mismatch detected)
Final Question Returned
```

## Testing Scenarios

The implementation ensures:

### Undergraduate Students (Bachelor's):
✅ Asked about: High school background, basic career goals, why US education
❌ NEVER asked: "What is your undergraduate degree?", "Your bachelor's projects"

### Graduate Students (Master's):
✅ Asked about: Their COMPLETED bachelor's degree (past education), career advancement, why Master's
❌ NEVER asked: "What is your undergraduate degree?" (implying current program)
❌ NEVER asked: High school questions (too basic)

### Doctorate Students (PhD):
✅ Asked about: Research proposals, publications, advisor fit, academic career goals
❌ NEVER asked: "Do you plan to do a PhD?" (they ARE doing one)

## Expected Outcomes

1. **Zero degree-level mismatches** - Master's students will NEVER be asked bachelor's-level questions
2. **Contextually appropriate questions** - Questions match the student's educational level
3. **Better interview flow** - Natural progression based on student's actual degree pursuit
4. **Improved user experience** - Students won't be confused by inappropriate questions
5. **Comprehensive logging** - System monitors and warns about any filtering failures

## Files Modified

1. `src/lib/smart-question-selector.ts` - Context and filtering logic
2. `src/lib/llm-service.ts` - Enhanced LLM prompts
3. `src/lib/f1-questions-data.ts` - Helper functions
4. `src/data/question-bank.json` - Question metadata
5. `src/lib/interview-simulation.ts` - Validation and logging

## Backward Compatibility

- ✅ UK and France interview routes are unaffected
- ✅ System gracefully handles missing degree level (no filtering applied)
- ✅ Existing interviews continue to work
- ✅ Only USA F1 route uses degree-level filtering

## Future Enhancements

1. Add more granular degree-level tags to additional questions
2. Expand validation to cover more edge cases
3. Add user-facing messaging if profile is incomplete
4. Create analytics dashboard to track question appropriateness
5. Add automated tests for each degree level scenario

