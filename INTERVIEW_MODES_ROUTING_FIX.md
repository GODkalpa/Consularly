# Interview Modes Routing Fix

## Issue Identified
The interview mode selector (Practice, Standard, Comprehensive, Stress Test) and all related difficulty/persona/topic configurations were showing for **all interview routes** (USA, UK, France), but they are designed specifically for **USA F-1 visa interviews only**.

## Problem Details

### Why This Was Wrong
1. **UK Student Visa Format**: Uses a completely different format with:
   - 16 questions total
   - 30 seconds preparation time per question
   - 30 seconds answer time per question
   - No mode/difficulty selection

2. **France Visa Format**: Different structure from USA:
   - Different question categories
   - Different timing requirements
   - Different interview flow

3. **USA-Specific Categories**: The interview modes reference categories that don't exist in UK/France:
   - `academic` (degree-specific questions)
   - `financial` (funding questions)
   - `post_study` (return intent questions)
   - `visa_history`
   - `pressure` (stress questions)
   - `red_flags`

## Solution Implemented

### Conditional Rendering
The `InterviewModeSelector` component is now **only shown for USA F-1 visa routes**:

```typescript
{/* Interview Mode & Difficulty Selector - Only for USA routes */}
{route === 'usa_f1' && (
  <InterviewModeSelector
    selectedMode={mode}
    selectedDifficulty={difficulty}
    selectedPersona={persona}
    selectedTopic={topic}
    onModeChange={setMode}
    onDifficultyChange={setDifficulty}
    onPersonaChange={setPersona}
    onTopicChange={setTopic}
  />
)}
```

### Files Modified
1. **`src/components/org/OrgInterviewSimulation.tsx`**
   - Added conditional check: `{!session && route === 'usa_f1' && ...}`
   - Interview mode selector only appears when USA F-1 is selected

2. **`src/components/user/UserInterviewSimulation.tsx`**
   - Added conditional check: `{route === 'usa_f1' && ...}`
   - Same fix applied to user-facing interview page
   - Also updated start button styling for consistency

## User Experience Impact

### Before
- **USA Interviews**: ✅ All modes/difficulties worked correctly
- **UK Interviews**: ❌ Showed irrelevant USA-specific modes
- **France Interviews**: ❌ Showed irrelevant USA-specific modes

### After
- **USA Interviews**: ✅ Shows all 4 modes + difficulty/persona/topic options
- **UK Interviews**: ✅ Goes straight to start button (uses fixed UK format)
- **France Interviews**: ✅ Goes straight to start button (uses France format)

## Interview Formats by Country

### USA (F-1 Visa)
- **Modes**: Practice (8q), Standard (12q), Comprehensive (16q), Stress Test (20q)
- **Difficulties**: Beginner, Intermediate, Advanced, Master
- **Optional**: Officer persona selection, Topic drills
- **Timing**: 25-60 seconds per question (based on difficulty)

### UK (Student Visa)
- **Format**: Fixed structure
- **Questions**: 16 total
- **Timing**: 30s prep + 30s answer per question
- **No customization**: Standardized format

### France (EMA/ICN)
- **Format**: Standard interview flow
- **Questions**: Varies by interview type
- **No mode selection**: Uses default configuration

## Future Enhancements (Optional)

If needed, we could create country-specific interview modes:

1. **UK-Specific Modes**
   - Quick Practice (8 questions)
   - Full Mock (16 questions)
   - Focus on specific visa types

2. **France-Specific Modes**
   - EMA-focused questions
   - ICN-focused questions
   - Intensity levels

## Technical Notes

- No breaking changes to component props
- No changes to state management
- Maintains backward compatibility
- All existing USA interviews continue to work
- No database schema changes needed

## Testing Checklist

- [x] USA F-1: Interview mode selector appears
- [x] USA F-1: All 4 modes selectable
- [x] USA F-1: Difficulty levels work correctly
- [x] UK Student: No mode selector (goes straight to start)
- [x] France EMA: No mode selector (goes straight to start)
- [x] France ICN: No mode selector (goes straight to start)
- [x] No linter errors
- [x] No TypeScript errors

## Related Files

- `src/lib/interview-modes.ts` - Contains USA-specific mode definitions
- `src/components/interview/InterviewModeSelector.tsx` - The mode selector UI component
- `src/components/org/OrgInterviewSimulation.tsx` - Organization interview page
- `src/components/user/UserInterviewSimulation.tsx` - User interview page

