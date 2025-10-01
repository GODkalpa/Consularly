# Windsurf AI Prompt: Migrate to Groq with Tier-Based LLM Routing

## Task Overview
Migrate our visa interview mock system from Gemini to a **tier-based LLM strategy** that uses different models based on interview complexity. UK interviews require more capable models due to higher complexity (700-800 token prompts, 8 red flags, £18k+ rules), while USA interviews work well with standard models (600 token prompts, 6 red flags, simpler patterns).

---

## Context & Problem Statement

### Current Issues:
- **Using Gemini 1.5 Flash**: Rate limit issues (115-136 interviews/day)
- **Single model for both routes**: Inefficient (UK needs better quality, USA is overserved)
- **No intelligent question selection**: Random selection from 100+ question bank
- **Missing route-specific optimizations**: UK and USA have fundamentally different requirements

### Interview Complexity Comparison:

| Aspect | UK Student Visa | USA F1 Visa |
|--------|----------------|-------------|
| **System Prompt Length** | 700-800 tokens | 600 tokens |
| **Red Flags** | 8 UK-specific | 6 Nepal-specific |
| **Token Usage** | ~48,150/interview | ~39,900/interview |
| **Scoring Strictness** | Extremely strict (35% refusal) | Very strict (30-40% refusal) |
| **Complexity Examples** | £18k maintenance + 28-day rule, module names vs generic terms, agent dependency detection | Dollar amounts, coached language detection, Nepal ties |
| **Required LLM Capability** | High (nuanced rule parsing) | Moderate (pattern matching) |

---

## Recommended Architecture

### **Unified Groq Approach** (Recommended - Simplest)

Use Groq for both routes with different models per use case:

```
ALL INTERVIEWS (UK + USA):

Question Selection (15 calls/interview):
├─ Model: Groq Llama 3.1 8B Instant
├─ Why: Lightweight task, fast selection
├─ Cost: FREE tier

Per-Answer Scoring (11 calls/interview):
├─ Model: Groq Llama 3.3 70B Versatile
├─ Why: Complex rubric evaluation, handles both UK and USA well
├─ Cost: FREE tier or $0.0026/interview (paid)

Final Evaluation (1 call/interview):
├─ Model: Groq Llama 3.3 70B Versatile  
├─ Why: Decision-making, handles both routes
├─ Cost: FREE tier or $0.0026/interview (paid)

TOTAL COST: $0.00 (FREE tier covers 533 interviews/day)
FALLBACK: Keep Gemini as backup
```

**Why This Works:**
- ✅ Llama 3.3 70B handles UK's complexity adequately
- ✅ Same model for both routes = simpler codebase
- ✅ Free tier covers both routes (533 interviews/day combined)
- ✅ 10x faster than Gemini (<1s vs 2-3s)
- ✅ Easy to upgrade UK to premium (Claude) later if needed

---

## Implementation Requirements

### 1. Environment Configuration

Add to `.env.local`:
```bash
# Primary Provider: Groq
GROQ_API_KEY=your_groq_key_here
LLM_MODEL_SCORING=llama-3.3-70b-versatile      # For scoring (UK + USA)
LLM_MODEL_QUESTIONS=llama-3.1-8b-instant       # For question selection

# Optional: Premium tier for UK (future upgrade path)
ANTHROPIC_API_KEY=your_claude_key_here         # Optional
USE_PREMIUM_UK=false                           # Set true to use Claude for UK

# Fallbacks (keep existing)
GEMINI_API_KEY=existing_key
OPENROUTER_API_KEY=existing_key
```

---

### 2. Create LLM Provider Selector

**File**: `src/lib/llm-provider-selector.ts`

**Purpose**: Route to appropriate LLM based on:
1. Interview route (UK vs USA)
2. Use case (question selection vs scoring vs final evaluation)
3. Available API keys
4. Optional premium tier for UK

**Key Features**:
- Export types: `InterviewRoute` = 'usa_f1' | 'uk_student'
- Export types: `LLMUseCase` = 'question_selection' | 'answer_scoring' | 'final_evaluation'
- Export interface: `LLMProviderConfig` with provider, model, apiKey, baseUrl, useGeminiFormat
- Export function: `selectLLMProvider(route, useCase)` returns config
- Export function: `callLLMProvider(config, systemPrompt, userPrompt, temperature, maxTokens)` makes API call

**Logic**:
1. **Question Selection**: Always use Llama 3.1 8B (fast + cheap)
2. **UK Scoring/Evaluation**: 
   - If `USE_PREMIUM_UK=true` + Claude key exists → Claude 3 Haiku
   - Else → Groq Llama 3.3 70B
3. **USA Scoring/Evaluation**: Groq Llama 3.3 70B
4. **Fallback Chain**: Groq → Gemini → OpenRouter

**API Format Handling**:
- Groq: OpenAI-compatible (`/chat/completions`, `response_format: {type: 'json_object'}`)
- Claude: Anthropic format (`/messages`, system separate from messages)
- Gemini: Google format (`generateContent`, `responseMimeType: 'application/json'`)

---

### 3. Create Smart Question Selector

**File**: `src/lib/smart-question-selector.ts`

**Purpose**: Intelligently select from 100+ question bank and generate contextual follow-ups.

**Key Features**:

#### A. Route-Aware Question Bank
- Questions tagged with: `route: 'usa_f1' | 'uk_student' | 'both'`
- Filter available questions by route before selection

#### B. Route-Specific Follow-Up Detection

**UK Follow-Up Triggers** (8 patterns):
1. "business modules" without specific names → probe for module names
2. "sufficient funds" without £18,000 mention → probe for amount
3. "accommodation" without £/week → probe for specific plan
4. "agent told me" / "consultant said" → probe for independent knowledge
5. Work hours mentioned without 20h limit → probe for compliance
6. Generic university choice → probe for specific research/fit
7. Short answers (<20 words) for course questions → probe deeper
8. No 28-day bank statement mention in financial answers → probe for rule knowledge

**USA Follow-Up Triggers** (6 patterns):
1. "my parents will pay" without $ amount → probe for specifics
2. "sponsor" without occupation → probe for sponsor details
3. "scholarship" without amount → probe for funding breakdown
4. Coached phrases ("pursue dreams", "world-class") → probe for authentic reasoning
5. "maybe" / "thinking about" in return intent → probe for concrete plans
6. Short answers (<15 words) for academic questions → probe deeper

#### C. Intelligent Bank Selection

Use Llama 3.1 8B with prompts including:
- Route-specific guidance (UK: course modules, £18k, compliance | USA: $ amounts, Nepal ties, coached language)
- Category coverage tracking (financial, academic, intent, personal, post_study)
- Student profile relevance
- Progressive difficulty
- Available question summaries (id, category, difficulty, preview)

#### D. Graceful Fallbacks
- If LLM fails → rule-based selection (pick from least-covered category)
- If follow-up generation fails → generic route-specific template follow-ups

---

### 4. Update LLM Scoring Service

**File**: `src/lib/llm-scorer.ts`

**Required Changes**:

#### A. Replace Constructor
- Remove Gemini/OpenRouter priority logic
- Replace with `selectLLMProvider(route, 'answer_scoring')` call
- Pass `route` from `interviewContext.route`

#### B. Update scoreAnswer Method
```
1. Extract route from interviewContext
2. Call selectLLMProvider(route, 'answer_scoring')
3. Build route-specific system prompt (UK: 700-800 tokens, USA: 600 tokens)
4. Build user prompt with session memory
5. Call callLLMProvider(config, systemPrompt, userPrompt, 0.3, 1500)
6. Parse JSON response
7. If fails → fallback to heuristic scoring
```

#### C. Maintain Route-Specific Prompts
- UK system prompt: 8 red flags, £18k rules, module specificity, agent dependency
- USA system prompt: 6 red flags, $ amounts, Nepal ties, coached language

#### D. Maintain Route-Specific Rubrics
- UK: 7 dimensions (courseAndUniversityFit, financialRequirement, complianceAndIntent)
- USA: 7 dimensions (academicPreparedness, financialCapability, intentToReturn)

---

### 5. Update Final Evaluation API

**File**: `src/app/api/interview/final/route.ts`

**Required Changes**:

#### A. Update evaluateWithLLM Function
```
1. Extract route from request body
2. Call selectLLMProvider(route, 'final_evaluation')
3. Build route-specific final system prompt
   - UK: 600 tokens, decision thresholds (ALL dimensions ≥75 for acceptance)
   - USA: 450 tokens, different thresholds
4. Build user prompt with full transcript
5. Call callLLMProvider(config, systemPrompt, userPrompt, 0.3, 1200)
6. Parse JSON response
7. If fails → fallback to heuristic evaluation
```

#### B. Route-Specific Decision Logic
- UK: Requires ALL 5 dimensions ≥75 for "accepted"
- USA: Different threshold logic for 4 dimensions

---

### 6. Update Question Service

**File**: `src/lib/llm-service.ts`

**Required Changes**:

#### A. Replace Question Generation
- Remove existing LLM generation logic
- Initialize `SmartQuestionSelector` with question bank
- Pass route + context to selector

#### B. Update getNextQuestion Method
```
1. Build StudentContext object with route, profile, history, askedQuestionIds, detectedRedFlags
2. Call selector.selectNextQuestion(context)
3. Return question string
4. Log: question type (bank vs followup) and reasoning
```

---

### 7. Question Bank Structure

**File**: `src/data/question-bank.json` (create if not exists)

**Required Structure**:
```json
{
  "questions": [
    {
      "id": "UK_FIN_001",
      "route": "uk_student",
      "category": "financial",
      "difficulty": "easy",
      "question": "What is the total cost of your education, including tuition and living expenses?",
      "keywords": ["cost", "tuition", "living expenses", "£18000", "maintenance"],
      "followUpTriggers": ["sufficient", "enough", "covered"]
    },
    {
      "id": "USA_FIN_001",
      "route": "usa_f1",
      "category": "financial",
      "difficulty": "easy",
      "question": "How will you finance your education in the United States?",
      "keywords": ["finance", "sponsor", "funding", "cost", "scholarship"],
      "followUpTriggers": ["parents will pay", "sufficient", "covered"]
    },
    {
      "id": "BOTH_ACD_001",
      "route": "both",
      "category": "academic",
      "difficulty": "medium",
      "question": "Why did you choose this specific field of study?",
      "keywords": ["field", "major", "program", "career", "interest"],
      "followUpTriggers": ["passion", "world-class", "best"]
    }
  ]
}
```

**Organization**:
- 100+ questions total
- 40-50 UK-specific questions
- 40-50 USA-specific questions
- 10-20 shared questions (route: "both")
- Balanced across 5 categories per route
- Mix of easy/medium/hard difficulty

---

## Testing Requirements

### Must Verify:

#### UK Interview Tests:
- [ ] Question selection prioritizes UK-specific questions from bank
- [ ] Follow-up generated when answer says "business modules" (no specifics)
- [ ] Follow-up generated when answer says "sufficient funds" (no £18,000)
- [ ] Follow-up generated when answer mentions agent/consultant
- [ ] Per-answer scoring uses UK rubric (courseAndUniversityFit, financialRequirement, complianceAndIntent)
- [ ] Scoring detects missing module names → low specificity score
- [ ] Scoring detects no £18k mention → low financialRequirement score
- [ ] Final evaluation applies UK thresholds (ALL dimensions ≥75 for acceptance)
- [ ] Uses Groq Llama 3.3 70B (or Claude if premium enabled)
- [ ] Fallback to Gemini works if Groq unavailable

#### USA Interview Tests:
- [ ] Question selection prioritizes USA-specific questions from bank
- [ ] Follow-up generated when answer says "parents will pay" (no $ amount)
- [ ] Follow-up generated when coached language detected ("pursue dreams")
- [ ] Follow-up generated when return intent vague ("maybe", "thinking about")
- [ ] Per-answer scoring uses USA rubric (academicPreparedness, financialCapability, intentToReturn)
- [ ] Scoring detects no $ amounts → low financialCapability score
- [ ] Scoring detects coached language → lower communication score
- [ ] Final evaluation applies USA thresholds (different from UK)
- [ ] Uses Groq Llama 3.3 70B
- [ ] Fallback to Gemini works if Groq unavailable

#### General Tests:
- [ ] Both routes complete interviews end-to-end
- [ ] Category balance maintained (financial, academic, intent, personal, post_study)
- [ ] No question repeated within same interview
- [ ] API calls complete in <1 second (Groq) vs 2-3s (Gemini)
- [ ] JSON output valid for all LLM responses
- [ ] Heuristic fallback works if all LLMs fail
- [ ] Session memory tracks route-specific facts (£ vs $, UK vs Nepal context)

---

## Implementation Priority

1. **HIGH**: Create `llm-provider-selector.ts` (unified LLM routing)
2. **HIGH**: Create `smart-question-selector.ts` (intelligent selection + follow-ups)
3. **HIGH**: Update `llm-scorer.ts` to use provider selector
4. **HIGH**: Update `interview/final/route.ts` to use provider selector
5. **HIGH**: Update `llm-service.ts` to use smart selector
6. **MEDIUM**: Create/organize `question-bank.json` with route tags
7. **MEDIUM**: Add environment variables and update `.env.example`
8. **LOW**: Update documentation with new architecture

---

## Expected Outcomes

### Performance Improvements:
- ✅ **3x higher rate limits**: 533 interviews/day (vs 115 with Gemini)
- ✅ **10x faster responses**: <1 second (vs 2-3s with Gemini)
- ✅ **Intelligent question selection**: Relevant to profile, not random
- ✅ **Dynamic follow-ups**: Probes vague/incomplete answers automatically
- ✅ **Route-optimized**: Different strategies for UK (complex) vs USA (simpler)

### Cost Analysis:
**Free Tier (Groq)**:
- Question selection: 15 calls × Llama 3.1 8B = FREE
- Answer scoring: 11 calls × Llama 3.3 70B = FREE
- Final evaluation: 1 call × Llama 3.3 70B = FREE
- **Total per interview**: 27 calls = FREE
- **Daily capacity**: 533 interviews (both routes combined)
- **Monthly capacity**: ~16,000 interviews

**Paid Tier** (if exceeded free tier):
- UK interview: ~$0.0032
- USA interview: ~$0.0032
- Even at 10,000 interviews/month: ~$32/month

**Optional Premium** (Claude for UK only):
- UK interview: ~$0.0263 (~₹2.20)
- USA interview: $0.00 (Groq free)
- Blended (50/50 mix): ~$0.0145/interview (~₹1.21)

### Quality Improvements:
- ✅ UK gets adequate complexity handling (Llama 3.3 70B sufficient)
- ✅ USA gets excellent quality (same model, less complex task)
- ✅ Smarter question flow (category balance, progressive difficulty)
- ✅ Better follow-ups (route-specific triggers and probes)
- ✅ Consistent scoring (route-aware rubrics and red flags)
- ✅ Easy upgrade path (switch UK to Claude if needed)

---

## Migration Notes

### Preserving Existing Functionality:
- ✅ Keep all existing heuristic scoring as fallback
- ✅ Maintain all route-specific system prompts (UK: 700-800 tokens, USA: 600 tokens)
- ✅ Preserve rubric dimensions and scoring formulas
- ✅ Keep session memory tracking (financial/career facts)
- ✅ Maintain red flag detection logic
- ✅ Keep Gemini/OpenRouter as fallback providers

### New Capabilities:
- ✅ Unified LLM interface (easy to swap providers)
- ✅ Route-aware question selection (100+ bank with tags)
- ✅ Intelligent follow-up generation (8 UK triggers, 6 USA triggers)
- ✅ Category balancing across interview
- ✅ Optional premium tier for UK (future upgrade path)

### Breaking Changes:
- ❌ None - all existing functionality preserved

---

## Additional Context

### Groq API Details:
- **Base URL**: `https://api.groq.com/openai/v1`
- **Format**: OpenAI-compatible
- **JSON Mode**: `response_format: { type: 'json_object' }`
- **Models**: 
  - `llama-3.1-8b-instant` (fast, cheap, for question selection)
  - `llama-3.3-70b-versatile` (powerful, for scoring/evaluation)
- **Free Tier**: 30 RPM, 14,400 RPD (no token limits)
- **Paid Tier**: $0.05/$0.08 per 1M tokens (8B), $0.59/$0.79 per 1M tokens (70B)

### Claude API Details (Optional Premium):
- **Base URL**: `https://api.anthropic.com/v1`
- **Format**: Anthropic-specific (system separate from messages)
- **Model**: `claude-3-haiku-20240307`
- **Pricing**: $0.25/$1.25 per 1M tokens
- **Best for**: Complex UK interviews (if Groq quality insufficient)

### Question Bank Best Practices:
- Tag all questions with accurate route ('usa_f1', 'uk_student', 'both')
- Include keywords for better LLM selection
- Add followUpTriggers for automatic detection
- Balance categories within each route (20% financial, 25% academic, 20% intent, 15% personal, 20% post_study)
- Mix difficulty levels (40% easy, 40% medium, 20% hard)

---

## Success Criteria

This migration is successful when:
1. ✅ UK interviews use appropriate LLM (70B or Claude)
2. ✅ USA interviews use appropriate LLM (70B)
3. ✅ Question selection is intelligent (not random)
4. ✅ Follow-ups generated for vague/incomplete answers
5. ✅ Rate limit issue resolved (533 vs 115 interviews/day)
6. ✅ Response latency improved (1s vs 2-3s)
7. ✅ All existing functionality preserved
8. ✅ Cost remains $0 on free tier
9. ✅ Easy to upgrade UK to premium if needed
10. ✅ Code is maintainable and well-documented

---

**Please implement these changes systematically, starting with the provider selector, then smart question selector, then updating the existing services to use them. Test each route (UK and USA) thoroughly before deploying.**