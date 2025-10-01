# Gemini API Usage Per Interview - Detailed Breakdown

## Overview
Your application makes **2 types of Gemini API calls** during each interview:
1. **Per-Answer Scoring** (during the interview) - via `LLMScoringService`
2. **Final Evaluation** (end of interview) - via `/api/interview/final`

---

## USA F1 Interview (8 Questions)

### Question Flow
Based on `f1-mvp-questions.ts`:
- **Core Questions**: 8 questions (fixed)
- **Potential Follow-ups**: Up to 2 additional questions if vague answers detected
- **Typical Total**: 8-10 questions per interview

### API Call #1: Per-Answer Scoring (8-10 calls)
**File**: `src/lib/llm-scorer.ts` → `scoreWithGemini()`

**Per Call Usage**:
- **Input Tokens** (estimated): 2,200-2,800 tokens per answer
  - System prompt: ~600 tokens (USA F1 strict scoring rubric)
  - Student profile + context: ~150 tokens
  - Conversation history: ~200-300 tokens (grows with each Q&A)
  - Current Q&A pair: ~100-400 tokens (depends on answer length)
  - Session memory context: ~100-200 tokens (financial facts, sponsor, etc.)
  
- **Output Tokens** (configured max): **1,500 tokens**
  - Returns: JSON with 7 rubric scores, summary, recommendations, red flags, contentScore

**Total for 8-10 answers**:
- Input: 17,600 - 28,000 tokens (avg ~22,800)
- Output: 12,000 - 15,000 tokens (avg ~13,500)
- **Combined**: ~36,300 tokens

---

### API Call #2: Final Evaluation (1 call at end)
**File**: `src/app/api/interview/final/route.ts` → `evaluateWithLLM()`

**Single Call Usage**:
- **Input Tokens** (estimated): 1,800-3,000 tokens
  - System prompt: ~450 tokens (USA F1 final decision criteria)
  - Student profile: ~150 tokens
  - Full interview transcript: ~1,200-2,400 tokens (all Q&A pairs)
  
- **Output Tokens** (configured max): **1,200 tokens**
  - Returns: JSON with decision, overall score, 4 dimensions, summary, recommendations

**Total for final**: ~3,000 - 4,200 tokens

---

## USA F1 TOTAL PER INTERVIEW

| Component | Input Tokens | Output Tokens | Total |
|-----------|--------------|---------------|-------|
| Per-Answer Scoring (8-10x) | 22,800 | 13,500 | 36,300 |
| Final Evaluation (1x) | 2,400 | 1,200 | 3,600 |
| **TOTAL** | **~25,200** | **~14,700** | **~39,900** |

---

## UK Student Interview (Variable Length)

### Question Flow
Based on `uk-questions-data.ts`:
- **Question Pool**: 24 pre-defined questions
- **Typical Interview**: 8-12 questions (similar to USA F1)
- **Prep Phase**: UK interviews include 60-second prep time before each answer
- **Longer Answers**: UK expects more detailed answers (course modules, financial specifics)

### API Call #1: Per-Answer Scoring (8-12 calls)
**File**: `src/lib/llm-scorer.ts` → `scoreWithGemini()`

**Per Call Usage**:
- **Input Tokens** (estimated): 2,500-3,200 tokens per answer
  - System prompt: ~700 tokens (UK pre-CAS strict rubric, longer than USA)
  - Student profile + context: ~150 tokens
  - Conversation history: ~200-400 tokens (grows with each Q&A)
  - Current Q&A pair: ~150-500 tokens (UK answers tend to be longer)
  - Session memory context: ~100-200 tokens (financial, accommodation, modules)
  
- **Output Tokens** (configured max): **1,500 tokens**
  - Returns: JSON with 7 UK-specific rubric scores, summary, recommendations, red flags

**Total for 8-12 answers**:
- Input: 20,000 - 38,400 tokens (avg ~29,200)
- Output: 12,000 - 18,000 tokens (avg ~15,000)
- **Combined**: ~44,200 tokens

---

### API Call #2: Final Evaluation (1 call at end)
**File**: `src/app/api/interview/final/route.ts` → `evaluateWithLLM()`

**Single Call Usage**:
- **Input Tokens** (estimated): 2,000-3,500 tokens
  - System prompt: ~600 tokens (UK pre-CAS final decision criteria)
  - Student profile: ~150 tokens
  - Full interview transcript: ~1,250-2,850 tokens (longer UK answers)
  
- **Output Tokens** (configured max): **1,200 tokens**
  - Returns: JSON with decision, overall score, 6 UK dimensions, summary, recommendations

**Total for final**: ~3,200 - 4,700 tokens

---

## UK STUDENT TOTAL PER INTERVIEW

| Component | Input Tokens | Output Tokens | Total |
|-----------|--------------|---------------|-------|
| Per-Answer Scoring (8-12x) | 29,200 | 15,000 | 44,200 |
| Final Evaluation (1x) | 2,750 | 1,200 | 3,950 |
| **TOTAL** | **~31,950** | **~16,200** | **~48,150** |

---

## Gemini Free Tier Limits (as of 2025)

**Gemini 2.5 Flash Free Tier**:
- **15 requests per minute (RPM)**
- **1 million tokens per minute (TPM)**
- **1,500 requests per day (RPD)**

### Rate Limit Analysis

#### USA F1 Interview (~40,000 tokens)
- **Duration**: ~8-12 minutes (typical interview length)
- **API Calls**: 9-11 calls (8-10 answers + 1 final)
- **Token Usage**: ~40k tokens over ~10 minutes
- **Requests**: Well within 15 RPM ✅
- **Tokens**: ~4k tokens/min (well below 1M TPM) ✅

#### UK Student Interview (~48,000 tokens)
- **Duration**: ~12-18 minutes (longer prep + answer phases)
- **API Calls**: 9-13 calls (8-12 answers + 1 final)
- **Token Usage**: ~48k tokens over ~15 minutes
- **Requests**: Well within 15 RPM ✅
- **Tokens**: ~3.2k tokens/min (well below 1M TPM) ✅

### **When You'll Hit Rate Limits**

You'll hit limits if:

1. **Multiple concurrent interviews** in the same minute:
   - 2-3 students answering questions simultaneously = **10-20 RPM** ⚠️
   - 5+ concurrent students = **Rate limit exceeded** ❌

2. **Daily interview volume**:
   - **USA F1**: ~136 interviews/day max (1,500 RPD ÷ 11 calls)
   - **UK**: ~115 interviews/day max (1,500 RPD ÷ 13 calls)

3. **Burst scenarios**:
   - Students clicking "Next" rapidly (multiple answers in same minute)
   - Backend retries on failed requests

---

## Optimization Recommendations

### Immediate (to reduce rate limits):

1. **Batch Processing with Delay**:
   ```typescript
   // Add 4-6 second delay between API calls
   await new Promise(r => setTimeout(r, 4000))
   ```

2. **Disable Per-Answer Scoring** (reduces calls by 80%):
   - Only use final evaluation (1 call vs 9-13 calls)
   - Show generic "Answer recorded" feedback during interview
   - Saves ~35k-44k tokens per interview

3. **Queue System for Concurrent Users**:
   - Serialize API calls across all active interviews
   - Ensure <15 requests/min globally

### Long-term Solutions:

1. **Upgrade to Gemini Paid Tier**:
   - **Pay-as-you-go**: No RPM limits, ~$0.50 per interview
   - **Gemini Pro**: Higher RPM (360 RPM)

2. **Use OpenRouter as Fallback** (already configured):
   - Your code supports `OPENROUTER_API_KEY`
   - Automatically falls back if Gemini fails

3. **Hybrid Scoring**:
   - Use heuristic scoring (already in code) for practice sessions
   - Use LLM scoring only for "official" mock interviews

4. **Caching Strategy**:
   - Cache system prompts (saves ~600-700 tokens per call)
   - Use Gemini's built-in context caching feature

---

## Token Cost Estimates (if using paid tier)

**Gemini 2.5 Flash Pricing** (as of 2025):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

### Cost Per Interview:

| Route | Input Cost | Output Cost | Total Cost |
|-------|------------|-------------|------------|
| USA F1 | $0.0019 | $0.0044 | **$0.0063** (~₹0.53) |
| UK Student | $0.0024 | $0.0049 | **$0.0073** (~₹0.61) |

**Very affordable** if you hit free tier limits!

---

## Current Bottleneck: Rate Limits (RPM)

**Your main issue is NOT token usage, but Request Per Minute (RPM)**.

**Solutions**:
1. Add 4-second delays between calls (ensures <15 RPM)
2. Queue concurrent interviews
3. Disable real-time per-answer scoring (only show final report)

---

## Monitoring Dashboard (Recommended)

Track in your admin panel:
- API calls per minute (should stay <15)
- Failed requests (429 errors = rate limit hit)
- Token usage per interview
- Queue depth (if implemented)

Let me know if you want me to implement any of these optimizations!
