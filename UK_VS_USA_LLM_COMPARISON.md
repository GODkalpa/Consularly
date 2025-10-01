# UK vs USA Interview LLM Usage Comparison
**Detailed Analysis of Different Requirements**

---

## Executive Summary

UK and USA interviews have **fundamentally different formats and LLM requirements**:

| Aspect | UK Student Visa | USA F1 Visa |
|--------|----------------|-------------|
| **Interview Format** | 30s Prep + 30s Answer phases | Direct Q&A (40s) |
| **LLM Complexity** | **Higher** (more rules) | **Lower** (simpler) |
| **Token Usage** | **~48,150 tokens/interview** | **~39,900 tokens/interview** |
| **System Prompt** | **700-800 tokens** | **600 tokens** |
| **Red Flags** | **8 UK-specific flags** | **6 Nepal-specific flags** |
| **Scoring Strictness** | **Extremely strict** (35% refusal rate) | **Very strict** (30-40% refusal) |
| **Financial Threshold** | £18,000+ (28-day rule) | Dollar amounts (sponsor income) |

**Recommendation**: Consider using **different LLM tiers** for UK (premium) vs USA (standard) due to complexity differences.

---

## Interview Format Differences

### 🇬🇧 **UK Student Visa Format**

#### Workflow
```
Question Display
    ↓
⏱️ 30s Prep Phase (no recording, show question)
    ↓
🎤 30s Answer Phase (STT + body language active)
    ↓
LLM Scoring (per answer)
    ↓
Next Question
```

#### Key Characteristics
- **Prep Time**: 30 seconds to think before answering
- **Answer Time**: 30 seconds to respond
- **Total per Q**: ~60 seconds + processing time
- **Recording**: Only during answer phase
- **UI Flow**: "Start Answer" button visible during prep
- **Typical Questions**: 8-12 questions
- **Interview Length**: 12-18 minutes

#### UK-Specific Requirements
1. **Course Knowledge**: Must name 3+ specific modules (not generic "business modules")
2. **Financial**: £18,000+ maintenance + 28-day bank balance rule
3. **Accommodation**: Specific location, cost/week, booking status
4. **Compliance**: 20 hours/week work limit, CAS requirements, ATAS
5. **Agent Dependency**: Heavy penalty for agent-led answers
6. **University Fit**: Must explain WHY this course fits background (not just ranking)

---

### 🇺🇸 **USA F1 Visa Format**

#### Workflow
```
Question Display
    ↓
🎤 40s Answer Phase (immediate recording, soft cap)
    ↓
⚠️ 30s Warning (if hitting time limit)
    ↓
LLM Scoring (per answer)
    ↓
Next Question
```

#### Key Characteristics
- **Prep Time**: None (immediate answer expected)
- **Answer Time**: 40 seconds soft cap (30s warning)
- **Total per Q**: ~40 seconds + processing time
- **Recording**: Starts immediately with question
- **UI Flow**: No prep button, direct recording
- **Typical Questions**: 8-10 questions
- **Interview Length**: 8-12 minutes

#### USA-Specific Requirements
1. **Financial Vagueness**: Must provide sponsor name, occupation, income amounts
2. **Coached Language**: Penalize generic phrases ("pursue my dreams", "world-class")
3. **Return Intent**: Concrete Nepal ties (family business, job offer, property)
4. **Academic Match**: Why THIS program at THIS university (not rankings)
5. **Relatives in US**: Major red flag if mentioned with weak home ties
6. **Contradictions**: Track financial amounts, sponsor details across answers

---

## LLM Prompt Complexity Analysis

### 🇬🇧 **UK System Prompt (Longer & More Complex)**

**Length**: 700-800 tokens (33% longer than USA)

**Complexity Factors**:
1. **8 Red Flags** with specific criteria:
   - Course knowledge gaps (3+ modules)
   - Financial vagueness (£18k + 28-day rule)
   - Work visa confusion (20h limit)
   - Accommodation ignorance (specific plan)
   - Agent dependency (red flag)
   - University choice weakness
   - Compliance ignorance (CAS, ATAS)
   - Contradictions

2. **Detailed Scoring Benchmarks** with UK-specific examples:
   - 90-100: "Names 4+ specific modules, £18,600 in Lloyds for 32 days, Student Castle Manchester £145/week confirmed"
   - 70-89: "2-3 modules named, knows £18k+ rule, general accommodation plan"
   - 50-69: "Vague on 1-2 areas, coached language, missing evidence"
   - 30-49: "Multiple red flags, agent-led answers, cannot explain fit"
   - 0-29: "No course knowledge, financial ignorance"

3. **UK-Specific Context**:
   - Pre-CAS credibility interview standards
   - 35% visa refusal rate
   - Home Office evaluation criteria
   - Genuine student test

**Sample UK System Prompt Excerpt**:
```
You are a STRICT UK Home Office credibility evaluator with 15+ years 
of pre-CAS interview experience.

CRITICAL UK RED FLAGS (instant score reduction):
1. **Course Knowledge Gaps**: Cannot name 3+ specific modules from 
   course syllabus (not generic "business modules")
2. **Financial Vagueness**: Doesn't mention £18,000+ maintenance 
   requirement OR 28-day bank balance rule
3. **Work Visa Confusion**: Doesn't know 20 hours/week limit during 
   term, or confuses Student vs Graduate route
...
```

---

### 🇺🇸 **USA System Prompt (Shorter & Simpler)**

**Length**: 600 tokens

**Complexity Factors**:
1. **6 Red Flags** with simpler criteria:
   - Financial vagueness (no amounts)
   - Coached language (generic phrases)
   - No return intent (weak Nepal ties)
   - Academic mismatch (can't explain program fit)
   - Contradictions (changing amounts)
   - Unrealistic plans (US-only career)

2. **Simpler Scoring Benchmarks** with Nepal-specific examples:
   - 90-100: "$45,000/year, father: civil engineer Rs. 8M/year, return to TCS Nepal"
   - 70-89: "Some specifics, minor gaps, mostly clear"
   - 50-69: "Vague on 1-2 areas, coached language"
   - 30-49: "Multiple red flags, contradictions"
   - 0-29: "Major red flags, incoherent"

3. **Nepal-Specific Context**:
   - US Embassy Nepal standards
   - 30-40% F1 rejection rate
   - Common Nepal F1 patterns

**Sample USA System Prompt Excerpt**:
```
You are a STRICT US Embassy Nepal F1 visa officer with 10+ years 
of interview experience.

COMMON NEPAL F1 RED FLAGS (automatically reduce scores):
1. **Financial vagueness**: Says "my father will sponsor" WITHOUT 
   amount, occupation, income proof
2. **Coached language**: Generic phrases like "pursue my dreams", 
   "world-class education", "cutting-edge"
...
```

---

## Rubric Dimension Differences

### 🇬🇧 **UK Rubric (7 Dimensions)**

```json
{
  "rubric": {
    "communication": 0-100,        // 20% weight
    "relevance": 0-100,            // 15% weight
    "specificity": 0-100,          // 25% weight (highest)
    "consistency": 0-100,          // 15% weight (baseline 65)
    "courseAndUniversityFit": 0-100,     // 15% weight (UK-specific)
    "financialRequirement": 0-100,       // 10% weight (UK-specific)
    "complianceAndIntent": 0-100         // Evaluated in final (UK-specific)
  }
}
```

**UK-Specific Dimensions**:

1. **courseAndUniversityFit** (replaces academicPreparedness):
   - Must name 3+ modules by name (not categories)
   - Explain course fit with background/career
   - Show independent research (faculty, facilities)
   - Penalty: -65 for no module names

2. **financialRequirement** (replaces financialCapability):
   - £18,000+ maintenance amount (London higher)
   - Explicit 28-day bank balance rule
   - Tuition + living cost breakdown
   - Penalty: -70 for vague "sufficient funds"

3. **complianceAndIntent** (replaces intentToReturn):
   - 20 hours/week work limit understanding
   - CAS requirements, ATAS if needed
   - Attendance monitoring awareness
   - Post-study: return home OR Graduate Route
   - Penalty: -65 for work rule confusion

**Scoring Formula**:
```
contentScore = (0.20 × communication) + (0.15 × relevance) 
             + (0.25 × specificity) + (0.15 × consistency) 
             + (0.15 × courseAndUniversityFit) 
             + (0.10 × financialRequirement)
```

**Neutral Baseline**: 65 for consistency (stricter than USA)

---

### 🇺🇸 **USA Rubric (7 Dimensions)**

```json
{
  "rubric": {
    "communication": 0-100,        // 25% weight
    "relevance": 0-100,            // 20% weight
    "specificity": 0-100,          // 25% weight
    "consistency": 0-100,          // 15% weight (baseline 70)
    "academicPreparedness": 0-100,       // 10% weight (USA-specific)
    "financialCapability": 0-100,        // 5% weight (USA-specific)
    "intentToReturn": 0-100              // 0% weight (final only)
  }
}
```

**USA-Specific Dimensions**:

1. **academicPreparedness**:
   - WHY this program at THIS university (not rankings)
   - Link to background and career goals
   - Penalty: -50 for generic "world-class faculty"

2. **financialCapability**:
   - Specific dollar amounts ($40k-$50k typical)
   - Sponsor name, occupation, income
   - Penalty: -60 for "sufficient funds" without numbers

3. **intentToReturn**:
   - Concrete Nepal ties (family business, job offer)
   - Post-graduation Nepal plans
   - Penalty: -90 if relatives in US with weak ties
   - **Note**: 0% weight in per-answer score (only final)

**Scoring Formula**:
```
contentScore = (0.25 × communication) + (0.20 × relevance) 
             + (0.25 × specificity) + (0.15 × consistency) 
             + (0.10 × academicPreparedness) 
             + (0.05 × financialCapability)
```

**Neutral Baseline**: 70 for consistency (more lenient than UK)

---

## Token Usage Breakdown (Per Interview)

### 🇬🇧 **UK Interview: ~48,150 tokens**

#### Per-Answer Scoring (8-12 calls)
**Input per answer**: 2,500-3,200 tokens
- System prompt: **~750 tokens** (UK-specific, longer)
- Student profile: ~150 tokens
- Conversation history: ~200-400 tokens (grows)
- Current Q&A: ~150-500 tokens (UK answers longer)
- Session memory: ~100-200 tokens
- UK rubric explanation: **~450 tokens** (detailed)

**Output per answer**: 800-1,500 tokens
- 7 UK-specific rubric scores
- UK-focused summary
- UK-specific recommendations
- UK red flags

**Per-answer total**: 3,300-4,700 tokens × 10 = **~44,200 tokens**

#### Final Evaluation (1 call)
**Input**: 2,000-3,500 tokens
- System prompt: ~600 tokens (UK final decision)
- Student profile: ~150 tokens
- Full transcript: ~1,250-2,850 tokens (longer UK answers)

**Output**: 600-1,200 tokens
- 6 UK dimensions for final
- Decision + summary

**Final total**: ~3,950 tokens

**UK GRAND TOTAL**: **~48,150 tokens/interview**

---

### 🇺🇸 **USA Interview: ~39,900 tokens**

#### Per-Answer Scoring (8-10 calls)
**Input per answer**: 2,200-2,800 tokens
- System prompt: **~600 tokens** (USA-specific, shorter)
- Student profile: ~150 tokens
- Conversation history: ~200-300 tokens
- Current Q&A: ~100-400 tokens (USA answers shorter)
- Session memory: ~100-200 tokens
- USA rubric explanation: **~350 tokens** (simpler)

**Output per answer**: 800-1,500 tokens
- 7 USA-specific rubric scores
- USA-focused summary
- USA-specific recommendations
- Nepal F1 red flags

**Per-answer total**: 3,000-4,300 tokens × 9 = **~36,300 tokens**

#### Final Evaluation (1 call)
**Input**: 1,800-3,000 tokens
- System prompt: ~450 tokens (USA final decision)
- Student profile: ~150 tokens
- Full transcript: ~1,200-2,400 tokens (shorter USA answers)

**Output**: 600-1,200 tokens
- 4 USA dimensions for final
- Decision + summary

**Final total**: ~3,600 tokens

**USA GRAND TOTAL**: **~39,900 tokens/interview**

---

## LLM Requirements Comparison

### 🇬🇧 **UK Interview LLM Needs**

#### Higher Complexity Requirements
1. **Longer Context Understanding**:
   - Must parse 700-800 token system prompt
   - Track 8 distinct red flags
   - Understand UK-specific terminology (CAS, ATAS, Graduate Route, 28-day rule)

2. **Domain Expertise**:
   - UK university system knowledge
   - UK visa compliance rules (20h work limit)
   - Financial thresholds (£18k London, varies by city)
   - Pre-CAS credibility assessment standards

3. **Nuanced Scoring**:
   - Distinguish "Data Analytics" vs "business modules" (specific vs generic)
   - Detect agent dependency vs independent research
   - Understand £18,600 for 32 days vs vague "sufficient funds"

4. **Stricter Baseline**:
   - Neutral consistency: 65/100 (tougher starting point)
   - Multiple penalty tiers (-25, -40, -65, -70, -85)

**Recommended LLM Tier**: **Premium** (Claude Haiku, GPT-4o Mini, or Gemini Flash paid)

**Why**: UK prompts require better instruction-following and domain understanding.

---

### 🇺🇸 **USA Interview LLM Needs**

#### Moderate Complexity Requirements
1. **Standard Context Understanding**:
   - Parse 600 token system prompt
   - Track 6 red flags
   - Understand Nepal-specific context (relatives in US, return intent)

2. **Domain Expertise**:
   - US university system knowledge
   - Nepal F1 visa patterns
   - Dollar amount reasoning ($40-50k range)
   - Common coached phrases

3. **Straightforward Scoring**:
   - Simpler binary checks (has amount vs no amount)
   - Coached language detection (generic phrases)
   - Nepal ties evaluation

4. **Moderate Baseline**:
   - Neutral consistency: 70/100 (easier starting point)
   - Fewer penalty tiers

**Recommended LLM Tier**: **Standard** (Groq Llama 3.3 70B, Together AI, Gemini free)

**Why**: USA prompts work well with standard instruction-following models.

---

## Cost Optimization Strategies

### **Strategy 1: Tier-Based Routing** (Recommended)

Use different LLM tiers based on interview type:

```
UK Interview:
├─ Per-Answer: Claude 3 Haiku ($0.0263/interview)
└─ Final: Claude 3 Haiku

USA Interview:
├─ Per-Answer: Groq Llama 3.3 70B (FREE or $0.0026/interview)
└─ Final: Groq Llama 3.3 70B
```

**Cost per interview**:
- UK: $0.0263 (~₹2.20) - Premium quality justified by complexity
- USA: $0.00-0.0026 (~₹0-0.22) - Free tier sufficient

**Blended average** (50/50 mix): ~$0.0145/interview (~₹1.21)

**Annual cost** (1,000 interviews, 50% UK / 50% USA):
- UK: 500 × $0.0263 = **$13.15**
- USA: 500 × $0.0026 = **$1.30**
- **Total: $14.45/year** (~₹1,210)

---

### **Strategy 2: Unified Budget Tier**

Use same mid-tier LLM for both:

```
Both UK & USA:
├─ Per-Answer: Groq Llama 3.3 70B (FREE or $0.0026/interview)
└─ Final: Groq Llama 3.3 70B
```

**Cost per interview**: $0.00-0.0026 (~₹0-0.22)

**Annual cost** (1,000 interviews): **$0-2.60/year** (~₹0-217)

**Trade-off**: Slight quality reduction for UK (still acceptable for mock interviews)

---

### **Strategy 3: Hybrid Premium**

Premium for both, ultimate quality:

```
Both UK & USA:
├─ Per-Answer: Claude 3 Haiku ($0.0263/interview)
└─ Final: Claude 3 Haiku
```

**Cost per interview**: $0.0263 (~₹2.20)

**Annual cost** (1,000 interviews): **$26.30/year** (~₹2,200)

**Benefit**: Best instruction-following, most consistent scoring

---

## Implementation Recommendation

### **Best Approach: Tier-Based Routing**

```typescript
// In llm-scorer.ts and final route.ts

function selectLLMProvider(route: 'uk_student' | 'usa_f1') {
  if (route === 'uk_student') {
    // UK: Use premium for higher complexity
    return {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1'
    }
  } else {
    // USA: Use budget-friendly for standard complexity
    return {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1'
    }
  }
}
```

**Benefits**:
1. ✅ Optimized cost-to-quality ratio
2. ✅ UK gets premium quality it needs
3. ✅ USA stays in free tier (360 interviews/day)
4. ✅ Blended cost: ~$0.0145/interview
5. ✅ Respects complexity differences

---

## Final Recommendations

### For Current Free Tier Issues:

**Immediate Fix (Same LLM for both)**:
- Switch both UK + USA to **Groq Llama 3.3 70B**
- Cost: FREE (360 interviews/day limit)
- Speed: 10x faster than Gemini
- Trade-off: Slight quality drop for UK complexity

**Production Fix (Tier-Based)**:
- UK → **Claude 3 Haiku** ($0.0263/interview)
- USA → **Groq free tier** ($0.00/interview)
- Blended: ~$0.0145/interview
- Best quality-to-cost ratio

### Comparison Table

| Strategy | UK Cost | USA Cost | Blended | UK Quality | USA Quality |
|----------|---------|----------|---------|------------|-------------|
| **Current (Gemini free)** | $0.00 | $0.00 | $0.00 | ⭐⭐⭐ | ⭐⭐⭐ |
| **All Groq (free)** | $0.00 | $0.00 | $0.00 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Tier-Based** ⭐ | $0.0263 | $0.00 | $0.0145 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **All Premium** | $0.0263 | $0.0263 | $0.0263 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Winner**: **Tier-Based** (optimal cost + quality for each route)

---

## Key Takeaways

1. **UK interviews are 20% more token-intensive** (~48k vs ~40k)
2. **UK system prompts are 33% longer** (750 vs 600 tokens)
3. **UK requires higher LLM capability** (more complex rules, stricter scoring)
4. **USA works well with budget LLMs** (simpler patterns, shorter prompts)
5. **Tier-based routing optimizes cost** (premium for UK, free for USA)

Would you like me to implement the tier-based routing system?
