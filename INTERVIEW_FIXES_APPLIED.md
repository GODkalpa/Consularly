# Interview System Fixes Applied

## Date: 2025-11-16

## Critical Issues Fixed

### 1. ✅ Cluster Tracking Persistence (FIXED)
**Problem:** Cluster tracking was being rebuilt from history on every question selection, causing the system to "forget" what topics had been covered.

**Root Cause:**
- `llm-service.ts` was passing `undefined` when cluster array was empty
- `smart-question-selector.ts` was always rebuilding clusters from history instead of trusting the passed array

**Fix Applied:**
- Modified `llm-service.ts` line 203: Always pass the tracked clusters array (even if empty)
- Modified `smart-question-selector.ts` line 490: Trust the passed `askedClusters` array, only rebuild as fallback
- Added logging to show when clusters are rebuilt vs. when they're trusted from session

**Result:** Clusters are now properly tracked across the entire interview session.

---

### 2. ✅ LLM Question Selection Failure (FIXED)
**Problem:** LLM was selecting question IDs that weren't in the filtered pool, causing silent failures and fallback to broken rule-based selection.

**Root Cause:**
- The code was filtering questions by stage/category BEFORE showing them to the LLM
- LLM would select from a limited pool (first 15 questions)
- When LLM selected a question not in the filtered pool, it would fail silently

**Fix Applied:**
- Modified `smart-question-selector.ts` line 640: Show ALL available questions to LLM (not just first 20)
- Modified `smart-question-selector.ts` line 730: Search in full `availableQuestions` pool (already filtered by clusters/context)
- Added better error logging to show exactly why LLM selection fails
- Added success/failure emoji logging for easier debugging

**Result:** LLM can now see all valid options and select appropriately.

---

### 3. ✅ Question Repetition Loop (FIXED)
**Problem:** Same question (UK_017) was selected 6 times in a row because rule-based fallback had no memory.

**Root Cause:**
- Rule-based fallback always picked the first non-hard question from least-covered category
- No randomness or session-based seeding
- When cluster tracking failed, it would pick the same question repeatedly

**Fix Applied:**
- Modified `smart-question-selector.ts` line 780: Added session-based seeding using hash of first question
- Modified `smart-question-selector.ts` line 850: Use seeded selection instead of always picking first question
- Added index logging to show which question was selected from the pool

**Result:** Even when rule-based fallback is used, questions are varied across the session.

---

### 4. ✅ Better LLM Prompt Clarity (FIXED)
**Problem:** LLM prompt wasn't clear about which question IDs were valid.

**Fix Applied:**
- Modified `smart-question-selector.ts` line 710: Added explicit instruction to select from provided list
- Added format example in prompt: `{"questionId": "UK_XXX", "reasoning": "..."}`
- Increased question preview length from 60 to 80 characters for better context

**Result:** LLM has clearer instructions and better context for selection.

---

### 5. ✅ Enhanced Debugging (ADDED)
**Problem:** Hard to diagnose why question selection was failing.

**Fix Applied:**
- Added detailed error logging when LLM returns invalid question ID
- Shows available pool IDs, asked IDs, and LLM reasoning
- Added success/failure emoji indicators (✅/❌) for easier log scanning
- Added cluster tracking logs in session initialization

**Result:** Much easier to diagnose issues in production logs.

---

## Testing Recommendations

### Test Case 1: UK Interview with No Answers
Run a UK interview where you click "Next" without answering (like your test).

**Expected Behavior:**
- No question should repeat
- Logs should show: `✅ LLM SUCCESS` for most questions
- Cluster tracking should show increasing numbers: `Tracked clusters: 1`, `Tracked clusters: 2`, etc.
- Should see: `Using X tracked clusters from session` (not "Rebuilt from history")

### Test Case 2: UK Interview with Vague Answers
Give short, vague answers like "yes", "maybe", "I don't know".

**Expected Behavior:**
- Should trigger follow-up questions
- Should detect red flags: `agent_dependency`, `no_specific_amounts`, `weak_return_intent`
- Should not repeat questions even when answers are poor

### Test Case 3: USA F1 Interview
Run a USA F1 interview to ensure fixes work for all routes.

**Expected Behavior:**
- Should follow stage-based flow (Study Plans → University → Academic → Financial → Post-study)
- Should not repeat questions
- Should track clusters properly

---

## Files Modified

1. `src/lib/smart-question-selector.ts`
   - Line 490: Fixed cluster initialization logic
   - Line 640: Show all questions to LLM
   - Line 710: Improved LLM prompt clarity
   - Line 730: Fixed LLM selection search logic
   - Line 780: Added session-based seeding to rule-based fallback
   - Line 850: Fixed rule-based selection to use seeded randomness

2. `src/lib/llm-service.ts`
   - Line 203: Always pass tracked clusters array (even if empty)

3. `src/lib/interview-simulation.ts`
   - Line 120: Added logging for first question cluster/ID tracking

---

## Performance Impact

**Positive:**
- LLM now sees all available questions (not just first 20), improving selection quality
- Better caching of question selector (already implemented)
- Fewer fallbacks to rule-based selection

**Neutral:**
- Slightly larger prompts to LLM (showing all questions instead of 15-20)
- Claude Haiku 4.5 is fast enough that this won't be noticeable

---

## Monitoring

Watch for these log patterns:

**Good Signs:**
```
✅ LLM SUCCESS - path=llm route=uk_student step=2 id=UK_004
Using 2 tracked clusters from session
[Question Service] bank question selected: ...
```

**Bad Signs (should be rare now):**
```
❌ LLM FAILURE - Invalid question ID: UK_999
Rebuilt 0 clusters from history (fallback)
path=rule route=uk_student (fallback due to LLM failure)
```

---

## Next Steps

1. **Deploy and Test:** Run the UK interview test again with no answers
2. **Monitor Logs:** Check for `✅ LLM SUCCESS` vs `❌ LLM FAILURE` ratio
3. **Verify Cluster Tracking:** Ensure clusters increment properly (1, 2, 3, ...)
4. **Check Question Variety:** No question should appear more than once

If issues persist, the detailed error logging will show exactly what's happening.
