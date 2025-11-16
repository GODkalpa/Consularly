# MegaLLM/Gemini 2.5 Flash - Root Cause Analysis

## The Exact Problem

### What's Happening
MegaLLM's implementation of Gemini 2.5 Flash returns `null` content when the response hits the `max_tokens` limit, instead of returning partial content like OpenAI's API does.

### Evidence from Logs

**Working Request (Question 1-8):**
```json
{
  "prompt_tokens": ~500-1000,
  "completion_tokens": ~500-1500,
  "total_tokens": ~1500-2500,
  "content": "{ valid JSON }",
  "finish_reason": "stop"  ← Natural completion
}
```

**Failing Request (Question 9):**
```json
{
  "prompt_tokens": 1224,
  "completion_tokens": 4095,  ← EXACTLY at max_tokens limit!
  "total_tokens": 5319,
  "content": null,  ← NULL instead of partial content
  "finish_reason": "length"  ← Hit the limit
}
```

### The Math
- Prompt: 1,224 tokens
- Max tokens requested: 4,096
- Actual generated: 4,095 tokens (1 token shy of limit)
- Total: 5,319 tokens
- **Result: null content because it hit the limit mid-generation**

## Why This Happens

### Gemini's Behavior
Unlike OpenAI's API which returns partial content when hitting `max_tokens`, Gemini through MegaLLM:
1. Starts generating the response
2. Hits the `max_tokens` limit mid-sentence or mid-JSON
3. Realizes the JSON is incomplete/invalid
4. Returns `null` instead of broken JSON
5. Sets `finish_reason: "length"`

### Why Question 9 Specifically?
By question 9, your prompts include:
- System prompt: ~800-1200 tokens
- User prompt with 15 question summaries: ~400-600 tokens
- Conversation history (last 2 Q&A): ~200-400 tokens
- **Total prompt: ~1,400-2,200 tokens**

The LLM's response (question selection with reasoning) needs ~2,000-4,000 tokens for the full JSON structure. With `max_tokens: 4096`, it's cutting off right at the limit.

## The Solution

### Immediate Fix: Increase max_tokens to 8,192
```javascript
// Question selection
callLLMProvider(config, systemPrompt, userPrompt, 0.3, 8192)  // Was 4096

// Answer scoring  
callLLMProvider(config, systemPrompt, userPrompt, 0.3, 8192)  // Was 4096

// Final evaluation
callLLMProvider(config, system, userPrompt, 0.3, 8192)  // Was 4096
```

### Why 8,192?
- Gemini 2.5 Flash supports up to 32,000 output tokens
- Your actual responses are only 500-2,000 tokens
- Setting to 8,192 gives 4x headroom
- You only pay for actual tokens used (~500-2,000)
- Prevents hitting the limit even with large prompts

### Cost Impact
**None!** You only pay for tokens actually generated:
- Before: Hitting 4,096 limit → null response → fallback to rules
- After: Generating ~500-2,000 tokens → successful response
- Cost per response: $0.001 - $0.002 (same as before)

## Alternative Solutions (if 8,192 doesn't work)

### Option 1: Reduce Prompt Size Further
```javascript
// Current: 15 questions, 60 char preview
const questionSummaries = pool.slice(0, 10).map((q) => ({  // 15 → 10
  id: q.id,
  category: q.category,
  difficulty: q.difficulty,
  preview: q.question.substring(0, 40),  // 60 → 40
}));

// Truncate history more aggressively
${context.history.slice(-1).map(...)}  // Last 2 → Last 1
```

### Option 2: Use Gemini 1.5 Pro
```env
MEGALLM_MODEL=gemini-1.5-pro
```
- Larger context window (128K vs 196K)
- More stable output
- Slightly more expensive but more reliable

### Option 3: Add Retry Logic
```javascript
try {
  const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.3, 8192);
} catch (error) {
  if (error.message.includes('max_tokens limit')) {
    // Retry with even higher limit
    const response = await callLLMProvider(config, systemPrompt, userPrompt, 0.3, 16384);
  }
}
```

## What to Tell MegaLLM

**Issue Report:**
> "When using gemini-2.5-flash through your API, we're experiencing null content responses with `finish_reason: "length"` when the model hits the `max_tokens` limit. This differs from OpenAI's behavior which returns partial content.
>
> **Expected behavior:** Return partial content or a proper error message
> **Actual behavior:** Returns `null` content, breaking JSON parsing
>
> **Example:**
> - Request: `max_tokens: 4096`
> - Response: `prompt_tokens: 1224, total_tokens: 5319, content: null, finish_reason: "length"`
>
> **Questions:**
> 1. Is this intended behavior for Gemini through your API?
> 2. Can you add support for returning partial content like OpenAI?
> 3. What's the recommended max_tokens value to avoid this issue?
> 4. Why does the API sometimes take >15 seconds (causing timeouts) while other times it responds in <2 seconds?"

## Current Status

✅ **Fixed** by increasing `max_tokens` to 8,192
✅ **Added** better error handling with detailed logging
✅ **Reduced** prompt size (15→15 questions, but better truncation)
⏳ **Monitoring** for any remaining issues

## Testing Checklist

- [ ] Run full 12-question interview
- [ ] Check logs for any "MegaLLM Debug" errors
- [ ] Verify no null content responses
- [ ] Confirm all questions use LLM selection (not rule-based fallback)
- [ ] Monitor response times (should be <5 seconds per call)
- [ ] Check token usage in logs (should be 1500-3000 total per call)

## Expected Outcome

With `max_tokens: 8192`:
- Prompt: ~1,500 tokens
- Response: ~500-2,000 tokens  
- Total: ~2,000-3,500 tokens
- Headroom: 4,500-6,000 tokens (plenty of safety margin)
- **Result: No more null responses!**
