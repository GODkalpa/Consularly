# MegaLLM API Issue Report

## Issue Summary
Getting `null` content with `finish_reason: "length"` when using `gemini-2.5-flash` model, causing application failures.

## Error Pattern

### Working Request (Question 1)
```json
{
  "prompt_tokens": ~500,
  "total_tokens": ~1500,
  "content": "{ valid JSON response }",
  "finish_reason": "stop"
}
```
✅ **Works fine**

### Failing Request (Question 2+)
```json
{
  "id": "chatcmpl-1763274267385-j5083wf",
  "object": "chat.completion",
  "created": 1763274267,
  "model": "gemini-2.5-flash",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": null  ← NULL CONTENT
    },
    "finish_reason": "length",  ← HITTING LIMIT
    "logprobs": null
  }],
  "usage": {
    "prompt_tokens": 1374,
    "total_tokens": 3421  ← EXCEEDS LIMIT
  }
}
```
❌ **Fails - returns null**

## The Problem

**Pattern observed:**
- First API call works fine (small prompt ~500 tokens)
- Subsequent calls fail as prompt grows (includes conversation history)
- By question 2-3, prompt reaches ~1,374 tokens
- Total tokens hit 3,421, which seems to exceed a limit
- Response returns `null` content instead of partial content

## Questions for MegaLLM

### 1. What is the actual context window for gemini-2.5-flash?
- Is it 4,096 tokens total (input + output)?
- Or is there a different limit?

### 2. Why does `content` return `null` instead of partial content?
- When hitting `finish_reason: "length"`, shouldn't we get partial content up to the limit?
- OpenAI's API returns partial content when hitting max_tokens

### 3. What should we set for `max_tokens`?
Our current configuration:
```javascript
{
  model: "gemini-2.5-flash",
  messages: [
    { role: "system", content: systemPrompt },  // ~800-1200 tokens
    { role: "user", content: userPrompt }       // ~500-2000 tokens (grows with history)
  ],
  temperature: 0.3,
  max_tokens: 4096  // What should this be?
}
```

### 4. Why is the API ignoring max_tokens?
- We set `max_tokens: 4096`
- API returned `total_tokens: 5319` (1,223 tokens MORE than requested!)
- This suggests the API is not respecting the max_tokens parameter

### 5. Why the intermittent timeouts?
- Question 9 took >15 seconds and timed out
- Other questions with similar prompts completed in <2 seconds
- Is there rate limiting or throttling happening?

## Our Use Case

**Application:** Visa interview simulation system
**API calls per interview:** ~25 calls (8-16 questions × 2 calls each + 1 final)
**Expected response:** Structured JSON (200-500 tokens typically)

**Current workaround:**
- Reduced question summaries from 20 to 15
- Truncated conversation history to last 2 Q&A pairs
- Increased max_tokens to 4,096
- Still experiencing failures

## Request

Please clarify:
1. Exact token limits for gemini-2.5-flash (input, output, total)
2. Why null content instead of partial content on length limit
3. Recommended max_tokens configuration
4. Whether we should switch to a different model with larger context window

## API Configuration

```
Base URL: https://ai.megallm.io/v1
Model: gemini-2.5-flash
API Key: sk-mega-5fcfebb21ffa2a466bbcdfed17e73eeb01bdd003ed4ff76e4ec5d78ece251500
```

## Impact

This is blocking our production deployment. Every interview fails after 1-2 questions due to null responses.

---

**Contact:** [Your email/contact info]
**Date:** November 16, 2025
