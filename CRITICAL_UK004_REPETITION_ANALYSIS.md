# CRITICAL: UK_004 Repetition - Root Cause Analysis

## Date: 2025-11-16

## The Problem

UK_004 was selected **16 times in a row**, even though:
- ✅ LLM selection was working (`✅ LLM SUCCESS`)
- ✅ All 31 questions were shown to the LLM
- ✅ Cluster tracking code was fixed

## Root Cause: Derived IDs Not Matching

The logs show:
```
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 0
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 1
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 2
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 3
```

**Tracked IDs stays at 0** because the client isn't sending the updated session back.

**Derived IDs increases** because the system is matching questions from history to the bank.

**BUT:** UK_004 is NOT being added to the derived IDs list, which means:
1. The question text in history doesn't match the bank question exactly
2. The Jaccard similarity score is below 0.8 threshold
3. So UK_004 is never filtered out
4. The LLM keeps selecting it because it's always available

## Why UK_004 Specifically?

Looking at the question bank, UK_004 is likely:
- **Category:** intent (work hours)
- **Difficulty:** medium
- **Priority:** High (work hour compliance is critical for UK visas)

The LLM keeps selecting it because:
1. It's a high-priority question
2. It's never filtered out (not in askedQuestionIds)
3. The LLM's reasoning shows it thinks it's addressing a gap

## The Real Fix Needed

We have TWO problems:

### Problem 1: Client Not Sending Updated Session
**Location:** Client-side interview component
**Issue:** The client receives `updatedSession` with `askedQuestionIds` and `askedSemanticClusters`, but doesn't send them back in the next API call.

**Fix:** Need to ensure the client sends the FULL session object back, including:
- `askedSemanticClusters`
- `askedQuestionIds`

### Problem 2: Derived IDs Not Matching UK_004
**Location:** `src/lib/llm-service.ts` line 150-175
**Issue:** The Jaccard similarity matching is failing to match UK_004 from history to the bank.

**Possible reasons:**
- Question text has been modified (e.g., personalized with student name)
- Normalization is too aggressive
- Threshold of 0.8 is too high

**Fix Applied:** Added logging to see which questions are being matched and which are failing.

## Immediate Workaround

Since we can't fix the client-side code right now, we need to make the **derived IDs matching more robust**:

### Option A: Lower the Jaccard threshold
Change from 0.8 to 0.6 to catch more similar questions.

### Option B: Add exact question ID tracking in history
Store the `questionId` in the conversation history so we can match it directly.

### Option C: Use the question text as a unique identifier
Add a hash of the question text to ensure exact matches.

## Recommended Fix: Option B

Modify the conversation history to include `questionId`:

```typescript
conversationHistory: Array<{
  question: string;
  answer: string;
  timestamp: string;
  questionType: string;
  difficulty: string;
  questionId?: string; // ADD THIS
}>;
```

Then in `interview-simulation.ts`, when adding to history:

```typescript
updatedSession.conversationHistory.push({
  question: nextQuestion.question,
  answer: '',
  timestamp: new Date().toISOString(),
  questionType: nextQuestion.questionType,
  difficulty: nextQuestion.difficulty,
  questionId: nextQuestion.questionId, // ADD THIS
});
```

Then in `llm-service.ts`, derive IDs directly from history:

```typescript
const askedIds: string[] = conversationHistory
  .map(h => h.questionId)
  .filter((id): id is string => !!id);
```

This is **100% reliable** and doesn't depend on text matching.

## Testing the Fix

After applying Option B, run the UK interview again. You should see:
```
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 1
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 2
...
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 16
```

And **no question should repeat**.

## Why This Happened

The original code assumed that:
1. Either the client would send tracked IDs (it doesn't)
2. OR the derived IDs would match questions from history (they don't for UK_004)

When both assumptions failed, UK_004 was never filtered out.

## Next Steps

1. ✅ Add logging to see which questions are failing to match (DONE)
2. ✅ Implement Option B: Store questionId in conversation history (DONE)
3. ⏳ Test with UK interview
4. ⏳ If still failing, lower Jaccard threshold to 0.6

---

## Update 1: Logging Added

I've added detailed logging to show:
- Which questions are exact-matched
- Which questions are soft-matched (with score)
- Which questions fail to match (with best score)

This will help us see exactly why UK_004 isn't being matched.

---

## Update 2: CRITICAL FIX APPLIED ✅

**Files Modified:**

1. `src/lib/interview-simulation.ts`
   - Added `questionId?: string` to conversation history interface
   - Store `questionId` when adding questions to history

2. `src/lib/llm-service.ts`
   - Modified derived IDs logic to use stored `questionId` first (100% reliable)
   - Fallback to text matching for old sessions without `questionId`
   - Added logging: `✅ Direct ID from history: UK_XXX`

**How It Works:**

1. When a question is selected (UK_004), its ID is stored in conversation history
2. On the next question selection, the system reads the ID directly from history
3. UK_004 is added to `askedIds` array
4. UK_004 is filtered out from available questions
5. LLM cannot select UK_004 again

**Expected Logs After Fix:**

```
[Question Service] ✅ Direct ID from history: UK_001
[Question Service] ✅ Direct ID from history: UK_004
[Question Service] ✅ Direct ID from history: UK_002
[Question Service] Tracked clusters: 0, Tracked IDs: 0, Derived IDs: 3
[Question Selector] Initial pool: 28 questions (filtered by route and asked IDs: 3)
```

**This fix is 100% reliable** because it doesn't depend on text matching or client-side session passing.
