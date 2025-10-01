# SCORING SYSTEM - TESTING CHECKLIST ✅
**After implementing critical fixes - Verify everything works**

---

## 🧪 PRE-FLIGHT CHECKS

Before running any interviews, verify:

### 1. Environment Setup
```bash
# Check that all required API keys are configured
- [ ] ASSEMBLYAI_API_KEY is set in .env
- [ ] At least one LLM provider key is set (GROQ_API_KEY or GOOGLE_API_KEY)
- [ ] Firebase credentials are configured
```

### 2. Build Check
```bash
npm run build
# Should complete without errors
```

### 3. Start Development Server
```bash
npm run dev
# Open browser DevTools Console (F12) - watch for errors
```

---

## 🎯 TEST SCENARIO 1: Perfect Interview (High Score Expected)

**Goal:** Verify scoring works correctly for excellent answers with good body language.

### Steps:
1. Navigate to interview page
2. Enter candidate name: "Test Student 1"
3. Select USA F1 route
4. **Before clicking Start Interview:**
   - [ ] Camera preview should be visible
   - [ ] Check DevTools Console for: `👁️ Starting camera preview`
   
5. Click "Start Interview"
   - [ ] Console should show: `🎥 Starting interview recording`
   - [ ] Console should show: `✅ TensorFlow backend active: webgl`
   - [ ] If errors appear about models, note them down

6. For each question, give a GOOD answer (30-60 seconds, detailed):
   - Example: "I'm applying to Stanford University to pursue a Master's in Computer Science. I chose Stanford because of their AI research lab led by Professor Andrew Ng, and their strong industry connections. My bachelor's degree in Software Engineering from Tribhuvan University prepared me well. I plan to specialize in machine learning and return to Nepal to establish a tech startup focused on agricultural AI solutions."
   
7. **Monitor Console Logs** for each answer:
   - [ ] `🎤 ASR confidence: XX%` should appear multiple times
   - [ ] `✅ Captured body language score: { overall: XX, ... }` should appear when moving to next question
   - [ ] `📊 Scoring answer:` should show all metrics captured
   - [ ] `📊 Scoring complete:` should show final scores

8. Complete all questions

9. **Review Final Report:**
   - [ ] Console shows: `📄 Final evaluation: { avgPerAnswerScore: XX }`
   - [ ] Console shows: `✅ Using per-answer scores for final evaluation`
   - [ ] Overall score should be 70-90/100 (if answers were good)
   - [ ] Decision should be "accepted" or "borderline"

---

## 🎯 TEST SCENARIO 2: Poor Interview (Low Score Expected)

**Goal:** Verify system correctly penalizes weak answers.

### Steps:
1. Start new interview: "Test Student 2"
2. Select USA F1 route
3. For each question, give WEAK answers (5-10 seconds, vague):
   - Example: "I want to study in America. University is good. I will study computer."
   
4. **Monitor Console Logs:**
   - [ ] ASR confidence should still be tracked
   - [ ] Body language should still be captured
   - [ ] Content scores should be LOW (20-40/100)

5. **Review Final Report:**
   - [ ] Overall score should be 20-50/100
   - [ ] Decision should be "rejected" or "borderline"
   - [ ] Recommendations should highlight weaknesses

---

## 🎯 TEST SCENARIO 3: Body Language Failure (Edge Case)

**Goal:** Verify graceful handling when body language tracking fails.

### Steps:
1. **BEFORE starting interview:** Cover your camera or deny camera permission
2. Start interview: "Test Student 3"
3. Attempt to give answers

4. **Expected Behavior:**
   - [ ] Console shows: `⚠️ Body language data missing - using penalty score`
   - [ ] Console shows: `📊 Scoring complete: { bodyMissing: true, weights: { content: 0.75, speech: 0.25, body: 0 } }`
   - [ ] Body language weight should be redistributed (0%)
   - [ ] Overall score should still be calculated (just based on content + speech)

---

## 🎯 TEST SCENARIO 4: Empty/Silent Answers

**Goal:** Verify system rejects non-answers.

### Steps:
1. Start interview: "Test Student 4"
2. For first question: **Say nothing** or whisper inaudibly
3. Click "Next" after timer expires

4. **Expected Behavior:**
   - [ ] Console might show: `No answer provided` error
   - [ ] Score API returns 0/100 with recommendations
   - [ ] Or transcript shows "[No response]" and gets 0 score

---

## 🎯 TEST SCENARIO 5: Mixed Performance

**Goal:** Verify per-answer scoring accurately reflects variation.

### Steps:
1. Start interview: "Test Student 5"
2. **Question 1:** Give EXCELLENT answer (detailed, 60+ seconds)
3. **Question 2:** Give POOR answer (vague, 10 seconds)
4. **Question 3:** Give MEDIUM answer (okay, 30 seconds)

5. **Monitor perfList in Console:**
   - [ ] After Q1: High score (70-90)
   - [ ] After Q2: Low score (30-50)
   - [ ] After Q3: Medium score (50-70)

6. **Final Report:**
   - [ ] Overall should be AVERAGE of the three (~50-70)
   - [ ] Decision should reflect mixed performance ("borderline")

---

## 🔍 CONSOLE LOG CHECKLIST

During ANY interview, you should see these logs in order:

**Camera Setup:**
```
👁️ Starting camera preview
📹 Camera already active, skipping setup
✅ Video stream attached { previewing: true, running: false }
```

**Interview Start:**
```
🎥 Starting interview recording
✅ TensorFlow backend active: webgl
✅ Video stream attached { previewing: false, running: true }
```

**Per Answer (repeated for each question):**
```
🎤 ASR confidence: 87% (1 segments)
🎤 ASR confidence: 85% (2 segments)
🎤 ASR confidence: 89% (3 segments)
✅ Captured body language score: { overall: 75, posture: 80, gestures: 70, expressions: 75 }
📊 Scoring answer: { transcriptLength: 234, bodyScoreCaptured: true, bodyScoreOverall: 75, avgASRConfidence: '87%', confidenceSegments: 3 }
📊 Scoring complete: { content: 72, speech: 81, body: 75, bodyMissing: false, weights: { content: 0.7, speech: 0.2, body: 0.1 }, overall: 74, usedLLM: true }
```

**Final Report:**
```
📄 Final evaluation: { route: 'usa_f1', answersCount: 5, perAnswerScoresCount: 5, avgPerAnswerScore: 68 }
✅ Using per-answer scores for final evaluation: { avgContent: 65, avgSpeech: 78, avgBody: 72, avgOverall: 68 }
```

---

## ⚠️ COMMON ISSUES & FIXES

### Issue: Body language always shows 0 or 25
**Possible Causes:**
- TensorFlow models failed to load
- Camera blocked by OS/browser
- WebGL not available

**Check Console For:**
```
❌ Body language tracker errors: [...]
Failed to load one or more models: ...
```

**Fix:**
- Ensure camera permissions are granted
- Try different browser (Chrome recommended)
- Check for console errors during model loading

### Issue: ASR confidence always undefined
**Possible Causes:**
- AssemblyAI API key missing
- Network issues
- Microphone not working

**Check Console For:**
```
Failed to get session token: ...
```

**Fix:**
- Verify ASSEMBLYAI_API_KEY in .env
- Check microphone permissions
- Test with browser's built-in recorder

### Issue: Content scores always 40-60 (heuristic range)
**Possible Causes:**
- LLM API failed silently
- API key invalid
- Rate limits exceeded

**Check Console For:**
```
LLM scoring failed, using heuristics: ...
```

**Fix:**
- Check LLM provider API keys
- Verify API quotas/limits
- Check provider status (Groq, Gemini, etc.)

### Issue: Final report shows different score than per-answer average
**Expected Behavior:** This might be normal if LLM gives holistic evaluation

**Check:**
- If perAnswerScores were passed: Console shows `✅ Using per-answer scores`
- If not passed: Console shows `⚠️ No per-answer scores available`

**Fix:**
- Verify `perfList` is populated in InterviewRunner
- Check network tab: final API call should include `perAnswerScores` array

---

## ✅ SUCCESS CRITERIA

After testing, all of these should be TRUE:

- [ ] Body language scores vary naturally (30-95 range) based on actual posture/expressions
- [ ] Speech scores reflect ASR confidence (not stuck at 75)
- [ ] Content scores differentiate good vs. bad answers (20-40 gap)
- [ ] Empty answers immediately return 0/100 with error
- [ ] Final report uses per-answer scores (not just re-evaluating from scratch)
- [ ] Missing body language results in weight redistribution (not free 58 points)
- [ ] Console logs show capture/scoring happens at correct moments
- [ ] No silent failures (all errors logged to console)

---

## 📊 REGRESSION TEST

**Run this BEFORE pushing to production:**

1. Complete 3 full interviews (good, medium, poor)
2. Export scores to spreadsheet
3. Verify:
   - Good interview: Overall 70-90
   - Medium interview: Overall 50-70
   - Poor interview: Overall 20-50
4. Check Firestore: Scores saved correctly
5. Check admin dashboard: Scores displayed correctly

---

## 🐛 BUG REPORTING TEMPLATE

If you find issues during testing, report them with:

```
**Issue:** [Brief description]
**Test Scenario:** [Which scenario were you running?]
**Expected:** [What should have happened?]
**Actual:** [What actually happened?]
**Console Logs:** [Copy relevant console output]
**Browser:** [Chrome/Firefox/Safari + version]
**Camera/Mic:** [Working/Not working]
**Reproducible:** [Yes/No - how often?]
```

---

## 🎉 TESTING COMPLETE?

If all scenarios pass:
1. ✅ Mark this checklist complete
2. ✅ Update staging environment
3. ✅ Run user acceptance testing
4. ✅ Prepare for production deployment

**Next Steps:**
- Monitor production logs for first 24 hours
- Collect user feedback on scoring accuracy
- Iterate on rubrics based on real data
