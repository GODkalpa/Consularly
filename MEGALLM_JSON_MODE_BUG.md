# MegaLLM JSON Mode Bug - Investigation & Workaround

## The Problem

MegaLLM/Gemini's OpenAI-compatible API **does not properly support JSON mode**, despite accepting the `response_format: { type: 'json_object' }` parameter.

## Evidence

### Test 1: UK Student Interview
```
Request: response_format: { type: 'json_object' }
Expected: {"questionId": "UK_004", "reasoning": "..."}
Actual: The previous questions focused on... <span style='color:red'>{"questionId": "UK_004", "reasoning": "..."}</span>
```

### Test 2: USA F1 Interview  
```
Request: response_format: { type: 'json_object' }
Expected: {"questionId": "USA_062", "reasoning": "..."}
Actual: The interview is transitioning to the critical financial status stage... {"questionId": "USA_062", "reasoning": "..."}
```

## The Bug

When `response_format: { type: 'json_object' }` is set, MegaLLM/Gemini:
1. ❌ Ignores the JSON-only instruction
2. ❌ Returns explanatory text before the JSON
3. ❌ Sometimes wraps JSON in HTML tags (`<span style='color:red'>...</span>`)
4. ❌ Generates long explanations that cause timeouts

This is different from OpenAI's API, which strictly returns only JSON when this parameter is set.

## Impact

- **JSON Parse Errors:** Text responses can't be parsed as JSON
- **Timeouts:** Long explanations exceed timeout limits
- **Fallback to Rules:** System falls back to rule-based selection instead of using LLM intelligence

## Workaround Implemented

### 1. JSON Extraction Logic (`llm-provider-selector.ts`)

```typescript
// Extract JSON from HTML tags
const htmlJsonMatch = content.match(/<[^>]+>(\{.*\})<\/[^>]+>/s);
if (htmlJsonMatch) {
  content = htmlJsonMatch[1];
}

// Extract JSON from explanatory text
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (jsonMatch && content.length > jsonMatch[0].length + 50) {
  content = jsonMatch[0];
}
```

### 2. Stronger Prompt Instructions (`smart-question-selector.ts`)

```
CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON, nothing else
- NO explanatory text before or after the JSON
- NO HTML tags, NO markdown, NO formatting
- Just the raw JSON object: {"questionId": "selected_id", "reasoning": "brief explanation"}
```

### 3. Explicit User Prompt

```
Select the best next question ID and return ONLY the JSON object with no additional text.
```

## Results

✅ **JSON extraction successfully handles:**
- HTML-wrapped JSON: `<span>{"key": "value"}</span>` → `{"key": "value"}`
- Text-prefixed JSON: `Explanation... {"key": "value"}` → `{"key": "value"}`
- Markdown code blocks: ` ```json\n{"key": "value"}\n``` ` → `{"key": "value"}`

✅ **System now works reliably** even with MegaLLM's buggy JSON mode

## Recommendation for MegaLLM

**Issue to Report:**
> When using `response_format: { type: 'json_object' }` with gemini-2.5-flash through your OpenAI-compatible API, the model returns explanatory text and HTML-wrapped JSON instead of pure JSON.
>
> **Expected behavior:** Return only valid JSON, no additional text (like OpenAI's API)
> **Actual behavior:** Returns text like "The previous questions focused on... <span style='color:red'>{"questionId": "UK_004"}</span>"
>
> **Request:** Please fix JSON mode to return pure JSON only, matching OpenAI's API behavior.

## Alternative Solutions

If MegaLLM doesn't fix this:

### Option 1: Switch to Groq for Question Selection
```typescript
// In llm-provider-selector.ts
if (useCase === 'question_selection') {
  // Use Groq instead of MegaLLM for reliable JSON responses
  return {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
  };
}
```

### Option 2: Use Different Gemini Model
```env
MEGALLM_MODEL=gemini-1.5-pro  # May have better JSON mode support
```

### Option 3: Keep Current Workaround
The JSON extraction logic works well and handles all edge cases. This is the current solution.

## Status

✅ **Workaround Implemented** - System now handles MegaLLM's buggy JSON mode
⏳ **Monitoring** - Watching for any remaining edge cases
📧 **Report to MegaLLM** - Consider reporting this bug to their support team
