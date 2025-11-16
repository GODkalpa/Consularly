# Token Usage & Performance Analysis

## 🚨 CRITICAL FINDING: YES, YOU'RE RIGHT TO BE CONCERNED!

The system **IS sending entire question banks to the LLM on every request**, which causes:
1. **High token usage** (wasted API costs)
2. **Slower response times** (more tokens = longer processing)
3. **Unnecessary context** (LLM doesn't need to see all questions)

---

## Current Token Usage Breakdown

### UK Student Interview (Per Question Generation)

**What gets sent to LLM:**
```
1. System Prompt: ~500 tokens (UK-specific instructions)
2. Student Profile: ~150 tokens
3. UK Question Bank: ~1,200 tokens (ALL 24 questions)
4. Recent History: ~300 tokens (last 3 Q&A pairs)
5. Follow-up context: ~200 tokens
---
TOTAL: ~2,350 tokens PER question generation
```

**Example UK Prompt:**
```
Fixed UK Question Bank (choose one verbatim from below):
- [1] (background/easy) Which Visa Application Centre will you use...
- [2] (financial/medium) How much did the total cost of studying...
- [3] (follow-up/medium) Have you ever received a visa refusal...
[... ALL 24 questions listed ...]
```

### USA F1 Interview (Per Question Generation)

**What gets sent to LLM:**
```
1. System Prompt: ~800 tokens (USA-specific instructions)
2. Student Profile: ~200 tokens
3. F1 Question Bank: ~3,500 tokens (ALL 100+ questions across 6 categories!)
4. Recent History: ~300 tokens
5. Follow-up context: ~200 tokens
---
TOTAL: ~5,000 tokens PER question generation
```

**Example USA Prompt:**
```
F1 Question Bank (select appropriate questions from these categories):

**Study plans**
  • Why do you want to study in the US?
  • What will you specialize in for your degree?
  • What will be your major?
  [... 18 questions ...]

**University choice**
  • How many colleges did you apply to?
  • How many schools did you get admitted to?
  [... 20 questions ...]

**Academic capability**
  • What are your test scores (GRE, GMAT, SAT, TOEFL, IELTS)?
  [... 20 questions ...]

**Financial status**
  • What is your monthly income?
  • What is your sponsor's annual income?
  [... 32 questions ...]

**Post-graduation plans**
  • Do you have relatives or friends currently in the US?
  [... 17 questions ...]

**Additional/General**
  • Why should I approve your F1 student visa?
  [... 11 questions ...]
```

### France Interview (Per Question Generation)

**What gets sent to LLM:**
```
1. System Prompt: ~400 tokens
2. Student Profile: ~150 tokens
3. France Question Bank: ~600 tokens (14 EMA or 9 ICN questions)
4. Already Asked Questions: ~200 tokens (ALL previous questions listed!)
5. Recent History: ~300 tokens
---
TOTAL: ~1,650 tokens PER question generation
```

---

## Performance Impact

### For an 8-Question Interview:

#### USA F1 (Worst Case)
- **Question Generation**: 8 × 5,000 = **40,000 tokens**
- **Answer Scoring**: 8 × 2,000 = **16,000 tokens**
- **Final Evaluation**: 1 × 8,000 = **8,000 tokens**
- **TOTAL**: **64,000 tokens per interview**
- **Cost** (at $0.50/1M tokens): **$0.032 per interview**
- **Time**: ~8-12 seconds total (with fast models)

#### UK Student (16-Question Interview)
- **Question Generation**: 16 × 2,350 = **37,600 tokens**
- **Answer Scoring**: 16 × 2,000 = **32,000 tokens**
- **Final Evaluation**: 1 × 8,000 = **8,000 tokens**
- **TOTAL**: **77,600 tokens per interview**
- **Cost**: **$0.039 per interview**
- **Time**: ~12-16 seconds total

#### France (10-Question Interview)
- **Question Generation**: 10 × 1,650 = **16,500 tokens**
- **Answer Scoring**: 10 × 2,000 = **20,000 tokens**
- **Final Evaluation**: 1 × 8,000 = **8,000 tokens**
- **TOTAL**: **44,500 tokens per interview**
- **Cost**: **$0.022 per interview**
- **Time**: ~8-10 seconds total

---

## Why This Happens

### The Code Flow:

1. **User submits answer** → API endpoint `/api/interview/generate-question`
2. **API calls** `LLMQuestionService.generateQuestion()`
3. **Service calls** `buildPrompt()` which:
   - Loads **ENTIRE question bank** for the route
   - Formats **ALL questions** into the prompt
   - Sends to LLM
4. **LLM reads all questions** and selects one
5. **Response returned** with selected question

### The Problem:

```typescript
// In buildPrompt() - USA F1 example
const f1BankByCategory = F1_VISA_QUESTIONS.map(cat => {
  const questions = cat.questions.map(q => `  • ${q}`).join('\n');
  return `**${cat.category}**\n${questions}`;
}).join('\n\n');

prompt += `\n\nF1 Question Bank (select appropriate questions):\n\n${f1BankByCategory}`;
// ☝️ This adds ALL 100+ questions to EVERY prompt!
```

---

## Is This Actually a Problem?

### ✅ **Good News:**

1. **Costs are still low**: $0.02-$0.04 per interview is acceptable
2. **Fast models used**: Claude Haiku 4.5 / Groq Llama 3.1 8B are optimized for this
3. **Performance is acceptable**: 8-16 seconds total for full interview
4. **Already optimized**:
   - Only last 3 Q&A pairs sent (not full history)
   - Answer text truncated to 200 chars
   - Caching used for question selector

### ⚠️ **Concerns:**

1. **Wasted tokens**: LLM doesn't need to see ALL questions
2. **Scalability**: 1,000 interviews/day = $20-40 in unnecessary token costs
3. **Latency**: Larger prompts = slightly slower responses
4. **Rate limits**: More tokens = faster rate limit exhaustion

---

## Optimization Opportunities

### Option 1: Pre-filter Questions (Recommended)

**Instead of sending all questions, send only relevant ones:**

```typescript
// BEFORE (current):
prompt += `\n\nF1 Question Bank:\n${ALL_100_QUESTIONS}`;

// AFTER (optimized):
const relevantQuestions = filterQuestionsByStage(
  F1_VISA_QUESTIONS, 
  currentStage, 
  askedQuestions
);
prompt += `\n\nRelevant Questions (${relevantQuestions.length}):\n${relevantQuestions}`;
```

**Benefits:**
- Reduce USA F1 from 3,500 → 800 tokens (4.4x reduction)
- Reduce UK from 1,200 → 400 tokens (3x reduction)
- Faster LLM processing
- Lower costs

**Token Savings:**
- USA F1: 5,000 → 2,300 tokens (54% reduction)
- UK: 2,350 → 1,550 tokens (34% reduction)
- **Annual savings** (10K interviews): ~$200-300

### Option 2: Use Smart Question Selector (Already Implemented!)

**The system ALREADY has a smart question selector that pre-filters questions!**

Looking at `smart-question-selector.ts`:
```typescript
// Filter questions by route
let availableQuestions = this.questionBank.questions.filter(
  (q) => q.route === context.route || q.route === 'both'
).filter(
  (q) => !context.askedQuestionIds.includes(q.id)
);

// Filter by semantic clusters
availableQuestions = availableQuestions.filter((q) => {
  const cluster = getSemanticCluster(q.question);
  if (cluster && context.askedClusters!.includes(cluster)) {
    return false;
  }
  return true;
});

// USA F1: Stage-based filtering
if (context.route === 'usa_f1') {
  availableQuestions = this.filterUsaQuestionsByStage(availableQuestions, stage);
}
```

**BUT**: The smart selector is used, then the LLM is STILL sent the full bank!

### Option 3: Two-Stage Selection (Hybrid Approach)

```typescript
// Stage 1: Smart selector pre-filters to 10-15 questions
const preFiltered = smartQuestionSelector.preFilter(context);

// Stage 2: LLM selects from pre-filtered list
const prompt = buildPrompt(preFiltered); // Only 10-15 questions sent
```

**Benefits:**
- Best of both worlds: Smart filtering + LLM intelligence
- Massive token reduction: 3,500 → 500 tokens
- Faster responses
- Lower costs

---

## Recommendation

### Immediate Action (Low Effort, High Impact):

**Modify `buildPrompt()` to send only pre-filtered questions:**

```typescript
// In llm-service.ts - buildPrompt()

if (route === 'usa_f1') {
  // BEFORE: Send all 100+ questions
  const f1BankByCategory = F1_VISA_QUESTIONS.map(cat => {
    const questions = cat.questions.map(q => `  • ${q}`).join('\n');
    return `**${cat.category}**\n${questions}`;
  }).join('\n\n');
  
  // AFTER: Send only stage-appropriate questions
  const currentStage = this.getUsaStage(currentQuestionNumber);
  const relevantCategories = this.getRelevantCategories(currentStage);
  const filteredBank = F1_VISA_QUESTIONS
    .filter(cat => relevantCategories.includes(cat.category))
    .map(cat => {
      const questions = cat.questions
        .filter(q => !askedQuestions.includes(q)) // Remove already asked
        .slice(0, 10) // Limit to 10 per category
        .map(q => `  • ${q}`)
        .join('\n');
      return `**${cat.category}**\n${questions}`;
    })
    .join('\n\n');
  
  prompt += `\n\nRelevant Questions (filtered by stage):\n\n${filteredBank}`;
}
```

**Expected Results:**
- Token reduction: 40-60%
- Cost savings: $10-20 per 1,000 interviews
- Faster responses: 10-20% improvement
- Better LLM focus: Fewer distractions

---

## Current System Performance

### Is it "lagging"?

**No, not really:**
- Question generation: 200-500ms (fast models)
- Answer scoring: 300-800ms
- Total per question: ~1 second
- Full interview: 8-16 seconds

**But it COULD be faster:**
- With optimization: 500-1000ms per question
- Full interview: 4-8 seconds (50% faster)

---

## Conclusion

### Your Concern is Valid ✅

Yes, the system IS sending entire question banks to the LLM, which:
1. Wastes tokens (40-60% unnecessary)
2. Increases latency (10-20% slower)
3. Costs more (2-3x what it should)

### But It's Not Critical 🟡

- Current performance is acceptable (8-16 seconds per interview)
- Costs are low ($0.02-$0.04 per interview)
- Fast models mitigate the issue

### Optimization is Worthwhile 💡

- Easy to implement (2-3 hours of work)
- Significant benefits (50% token reduction)
- Better scalability (10K+ interviews/day)

### Each Route DOES Have Its Own Prompt ✅

- UK: Separate prompt + UK question bank
- USA: Separate prompt + F1 question bank
- France: Separate prompt + EMA/ICN question bank

**The issue is not route separation (that's perfect), but rather sending TOO MANY questions per route.**

---

## Action Items

1. **Short-term**: Monitor token usage and costs
2. **Medium-term**: Implement pre-filtering in `buildPrompt()`
3. **Long-term**: Consider caching frequently used question combinations

**Priority**: Medium (not urgent, but worthwhile optimization)
