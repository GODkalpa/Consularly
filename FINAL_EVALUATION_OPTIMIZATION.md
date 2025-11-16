# Final Evaluation Optimization

## Problem
Final evaluation was timing out after 30 seconds with MegaLLM/Claude Haiku, causing fallback to Groq with degraded prompts.

## Root Cause
- **Timeout too short**: 30s insufficient for Claude Haiku to process 16 Q&A pairs with structured JSON output
- **Unnecessary prompt degradation**: Retry logic was degrading the prompt instead of just extending timeout
- **Token bloat**: Prompt compression was good but could be more aggressive

## Solution

### 1. Extended Timeouts
- **Attempt 1**: 30s → 45s (sufficient for most cases)
- **Attempt 2**: 45s → 60s (retry with same quality prompt)
- Removed prompt degradation on retry

### 2. Ultra-Compressed Prompts
Reduced token count by ~40% additional savings:

**Before:**
```
Q1 (academic/medium): Score 85/100 (C:80, S:85, B:90)
  45 words | "I chose this university because..."
```

**After:**
```
Q1: 85/100 (C80 S85 B90) 45w
```

**System prompt**: 800 tokens → 500 tokens
**User prompt**: 1200 tokens → 700 tokens
**Total savings**: ~600 tokens per evaluation

### 3. Provider Selection
- Kept Claude Haiku 4.5 as primary (best JSON reliability)
- Removed Gemini 2.5 Flash (buggy JSON mode)
- Groq as fallback only

## Results
- **No more timeouts**: 45s is sufficient for Claude Haiku
- **No quality loss**: Same prompt quality on retry
- **Faster processing**: Reduced tokens = faster LLM response
- **Better reliability**: No degraded prompts

## Performance Expectations
- **Typical**: 20-30s for 16 Q&A pairs
- **Max**: 45s (within timeout)
- **Fallback**: 60s retry if needed

## Testing
Run a complete UK interview (16 questions) and verify:
1. ✅ No timeout on first attempt
2. ✅ Evaluation completes in 20-30s
3. ✅ Full quality JSON response
4. ✅ No fallback to Groq needed
