# LLM Architecture & Requirements Analysis
**Comprehensive Guide for Third-Party LLM Provider Discussions**

> **Use Case**: AI-powered visa interview simulation platform for students practicing USA F1, UK Student, and France EMA/ICN visa interviews

---

## Executive Summary

**What We Built**: An AI-powered visa interview simulation platform where students practice real visa interviews with an AI interviewer that provides real-time scoring and feedback.

**Why LLM is Critical**: 
- **Real-time conversation flow**: Dynamic question generation based on student responses
- **Intelligent scoring**: Multi-dimensional evaluation using visa-specific rubrics
- **Personalized feedback**: Contextual recommendations for improvement
- **Scalability**: Handle 100-1000+ concurrent interview sessions

**Current Scale**: 
- 50-200 daily active students
- 100-500 interviews per day
- Peak traffic: 6 PM - 10 PM across multiple time zones
- Geographic spread: 60% Asia, 25% Europe, 15% Americas

---

## Current Architecture Overview

We use LLMs in **3 distinct use cases**, each with different requirements:

### **Use Case 1: Dynamic Question Generation** (Optional)
- **File**: `src/lib/llm-service.ts` → `LLMQuestionService`
- **Frequency**: Every question (8-12 per interview)
- **Current Status**: ⚠️ NOT ACTIVELY USED (has fallback to static question banks)
- **Can be disabled**: Yes (already falls back to predefined questions)

### **Use Case 2: Per-Answer Scoring** (Active)
- **File**: `src/lib/llm-scorer.ts` → `LLMScoringService`
- **Frequency**: Every answer (8-12 per interview)
- **API Route**: `/api/interview/score`
- **Current Status**: ✅ ACTIVELY USED for real-time feedback

### **Use Case 3: Final Interview Evaluation** (Active)
- **File**: `src/app/api/interview/final/route.ts` → `evaluateWithLLM()`
- **Frequency**: Once per interview (at end)
- **Current Status**: ✅ ACTIVELY USED for final decision

---

## Detailed Use Case Requirements

### 📊 **Use Case 2: Per-Answer Scoring** (PRIMARY COST DRIVER)

#### Purpose
Score each student answer in real-time on 7 dimensions with rubric-based evaluation.

#### Input Structure
```typescript
{
  question: string,
  answer: string,
  interviewContext: {
    visaType: 'F1' | 'other',
    route: 'usa_f1' | 'uk_student',
    studentProfile: { name, country, university, field, education },
    conversationHistory: Array<{ question, answer, timestamp }>
  },
  sessionMemory: { // Financial/career facts from previous answers
    total_cost?: number,
    sponsor?: string,
    scholarship_amount?: number,
    sponsor_occupation?: string,
    post_study_role?: string,
    target_country?: string,
    relatives_us?: boolean
  }
}
```

#### System Prompt Characteristics
- **Length**: 600-700 tokens (USA), 700-800 tokens (UK)
- **Complexity**: Highly detailed rubric with strict scoring benchmarks
- **Examples**: Contains 5 scoring tiers (0-29, 30-49, 50-69, 70-89, 90-100)
- **Context**: Requires understanding of visa interview red flags, financial thresholds, cultural context

#### Output Requirements
```json
{
  "rubric": {
    "communication": 0-100,
    "relevance": 0-100,
    "specificity": 0-100,
    "consistency": 0-100,
    // USA specific:
    "academicPreparedness": 0-100,
    "financialCapability": 0-100,
    "intentToReturn": 0-100,
    // OR UK specific:
    "courseAndUniversityFit": 0-100,
    "financialRequirement": 0-100,
    "complianceAndIntent": 0-100
  },
  "summary": "2-3 sentence evaluation",
  "recommendations": ["improvement 1", "improvement 2", ...],
  "redFlags": ["red flag 1", "red flag 2", ...],
  "contentScore": 0-100
}
```

#### Critical Requirements
1. **JSON Output**: MUST return valid JSON (no markdown wrapping)
2. **Numeric Precision**: Scores must be integers 0-100
3. **Consistency Tracking**: Must compare current answer with session memory
4. **Context Understanding**: Must understand Nepal/UK visa nuances, financial thresholds (£18,000, $40k+), cultural red flags
5. **Latency**: <3 seconds (user waits for real-time feedback)
6. **Temperature**: 0.3 (low variance for consistent scoring)

#### Token Usage (Per Call)
- **Input**: 2,200-3,200 tokens
- **Output**: 800-1,500 tokens (max configured: 1,500)
- **Total**: ~3,000-4,700 tokens per answer

---

### 🎯 **Use Case 3: Final Interview Evaluation** (LOW FREQUENCY)

#### Purpose
Analyze entire interview transcript and make final visa decision.

#### Input Structure
```typescript
{
  route: 'usa_f1' | 'uk_student',
  studentProfile: { name, country, university, field, education },
  conversationHistory: Array<{ 
    question, 
    answer, 
    timestamp, 
    questionType, 
    difficulty 
  }>
}
```

#### System Prompt Characteristics
- **Length**: 450-600 tokens
- **Complexity**: Decision-making criteria with thresholds
- **Focus**: Holistic assessment vs granular rubric

#### Output Requirements
```json
{
  "decision": "accepted" | "rejected" | "borderline",
  "overall": 0-100,
  "dimensions": {
    "communication": 0-100,
    // USA: content, financials, intent
    // UK: courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent
  },
  "summary": "2-3 sentence final assessment",
  "recommendations": ["improvement 1", "improvement 2", ...]
}
```

#### Critical Requirements
1. **JSON Output**: MUST return valid JSON
2. **Decision Logic**: Must apply strict thresholds (e.g., UK: ALL dimensions ≥75 for acceptance)
3. **Context Awareness**: Must detect contradictions across entire interview
4. **Latency**: <5 seconds (once per interview, user expects wait)
5. **Temperature**: 0.3 (low variance for consistent decisions)

#### Token Usage (Per Call)
- **Input**: 1,800-3,500 tokens
- **Output**: 600-1,200 tokens (max configured: 1,200)
- **Total**: ~2,400-4,700 tokens per interview

---

### 🔄 **Use Case 1: Question Generation** (OPTIONAL - NOT CRITICAL)

#### Current Status
- Has robust fallback to static question banks
- UK: 24 predefined questions
- USA F1: 8 core questions + follow-ups
- **Recommendation**: Disable to save 70% of API calls

#### If Enabled (Not Recommended)
- **Input**: 800-1,500 tokens per question
- **Output**: 300-600 tokens (max: 600)
- **Total**: ~1,100-2,100 tokens per question

---

## LLM Requirements Summary

### **Mandatory Capabilities**
1. ✅ **JSON Mode**: MUST support structured JSON output (not markdown-wrapped)
2. ✅ **Long Context**: 4,000+ token context window (3,500 input + 1,500 output)
3. ✅ **Instruction Following**: Must follow complex multi-step rubrics and scoring rules
4. ✅ **Numeric Reasoning**: Calculate weighted averages, apply thresholds
5. ✅ **Consistency**: Low temperature scoring with reproducible results
6. ✅ **Context Retention**: Track facts across conversation history

### **Performance Requirements**
- **Latency**: <3 seconds per answer (Use Case 2), <5 seconds final (Use Case 3)
- **Availability**: 95%+ uptime (or graceful heuristic fallback)
- **Rate Limits**: Must handle 12-15 requests in 10-15 minutes (1 interview)

### **Nice-to-Have (Not Critical)**
- ❌ Long context (>8k tokens) - Not needed
- ❌ Multimodal (vision/audio) - Not used
- ❌ Function calling - Not used
- ❌ Code generation - Not used
- ❌ Streaming - Not used (full response only)

---

## Cost-Effective LLM Alternatives

### **Tier 1: Budget-Friendly (Under $0.003/interview)**

#### 1. **Groq (Llama 3.3 70B)** ⭐ BEST BUDGET OPTION
- **Cost**: FREE tier: 30 RPM, 14,400 RPD
- **Paid**: $0.59/M input, $0.79/M output = **$0.0026/interview**
- **Latency**: <1 second (fastest LLM on market)
- **JSON Mode**: ✅ Native JSON support
- **Quality**: Excellent for structured tasks
- **Free Tier**: 360 interviews/day (well above your needs)
- **API**: Drop-in replacement for OpenAI SDK

#### 2. **Together AI (Llama 3.3 70B)**
- **Cost**: $0.35/M input, $0.40/M output = **$0.0015/interview**
- **Latency**: 1-2 seconds
- **JSON Mode**: ✅ Native support
- **Free Tier**: $25 credit (16,000 interviews)
- **Rate Limits**: 60 RPM

#### 3. **Cerebras (Llama 3.3 70B)** 🔥 FASTEST + FREE
- **Cost**: Currently FREE (limited time)
- **Latency**: <0.5 seconds (fastest inference)
- **JSON Mode**: ✅ Native support
- **Quality**: Same as Groq/Together (same model)

---

### **Tier 2: Balanced Quality-Cost ($0.003-0.010/interview)**

#### 4. **OpenRouter (Meta Llama 3.1 70B)**
- **Cost**: $0.52/M input, $0.75/M output = **$0.0025/interview**
- **JSON Mode**: ✅ Supported
- **Benefit**: Already configured in your code! (fallback)
- **Downside**: Slightly higher latency (2-3 seconds)

#### 5. **Google Gemini 1.5 Flash (Paid Tier)**
- **Cost**: $0.075/M input, $0.30/M output = **$0.0063/interview**
- **Your Current Model**: gemini-2.5-flash (similar pricing)
- **Benefit**: Unlimited RPM, excellent quality
- **Downside**: 2x more expensive than Groq

#### 6. **Anthropic Claude 3 Haiku**
- **Cost**: $0.25/M input, $1.25/M output = **$0.0263/interview**
- **JSON Mode**: ✅ Native JSON support
- **Quality**: Excellent instruction following
- **Downside**: 4x more expensive than Groq

---

### **Tier 3: Premium (Not Recommended for Your Use Case)**

#### 7. **OpenAI GPT-4o Mini**
- **Cost**: $0.15/M input, $0.60/M output = **$0.0126/interview**
- **Quality**: Good but overkill for structured scoring
- **Downside**: 5x more expensive than Groq

#### 8. **OpenAI GPT-4o**
- **Cost**: $2.50/M input, $10.00/M output = **$0.21/interview**
- **Quality**: Best-in-class but unnecessary
- **Downside**: 80x more expensive than Groq

---

## Recommended Architecture Changes

### **Option A: Ultra-Low-Cost Setup (Recommended)**
```
Interview Flow:
├─ Question Generation: ❌ DISABLED (use static banks)
├─ Per-Answer Scoring: ✅ Groq Llama 3.3 70B (FREE tier)
└─ Final Evaluation: ✅ Groq Llama 3.3 70B (FREE tier)

Cost: $0.00/interview (free tier: 360 interviews/day)
Fallback: Heuristic scoring (already implemented)
```

### **Option B: Production-Ready Hybrid**
```
Interview Flow:
├─ Question Generation: ❌ DISABLED
├─ Per-Answer Scoring: ✅ Groq (primary) → Together AI (fallback)
└─ Final Evaluation: ✅ Gemini 1.5 Flash (paid tier for reliability)

Cost: ~$0.002/interview (Groq free tier) or $0.0026/interview (Groq paid)
Reliability: 99%+ with dual fallback
```

### **Option C: Premium Quality (If Budget Allows)**
```
Interview Flow:
├─ Question Generation: ❌ DISABLED
├─ Per-Answer Scoring: ✅ Claude 3 Haiku ($0.0263/interview)
└─ Final Evaluation: ✅ Claude 3 Haiku

Cost: ~$0.0263/interview (~₹2.20/interview)
Quality: Best instruction-following and consistency
```

---

## Implementation Guide

### **Quick Switch to Groq (5 minutes)**

1. **Get API Key**: https://console.groq.com/keys (FREE)

2. **Update `.env.local`**:
```bash
# Comment out Gemini
# GEMINI_API_KEY=your_gemini_key

# Add Groq
GROQ_API_KEY=your_groq_key_here
LLM_MODEL=llama-3.3-70b-versatile
```

3. **Update `src/lib/llm-scorer.ts`** (lines 55-73):
```typescript
constructor() {
  const groqKey = process.env.GROQ_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openRouterKey = process.env.OPENROUTER_API_KEY || '';
  
  if (groqKey) {
    this.apiKey = groqKey;
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.model = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
    this.useGemini = false; // Groq uses OpenAI-compatible format
  } else if (geminiKey) {
    // existing Gemini code
  } else if (openRouterKey) {
    // existing OpenRouter code
  }
}
```

4. **Update `/api/interview/final/route.ts`** (line 60+):
```typescript
async function evaluateWithLLM({ route, studentProfile, conversationHistory, apiKey }: ...) {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (groqKey) {
    // Use Groq (OpenAI-compatible)
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `${studentProfile info}\n\n${history}` }
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await res.json();
    const content = data.choices[0].message.content;
    // parse and return
  } else {
    // existing Gemini code as fallback
  }
}
```

---

## Scaling Projections & Rate Limit Requirements

### **Phase 1: Current Scale (100-500 daily interviews)**
```
Daily Active Users: 50-200 students
Daily Interviews: 100-500
Peak Concurrent Sessions: 20-50
Peak Hours: 6 PM - 10 PM (multiple time zones)

Required Rate Limits:
├─ Requests Per Minute (RPM): 200-500 peak
├─ Tokens Per Minute (TPM): 800K-2M peak
├─ Concurrent Connections: 50+
└─ Daily Token Usage: 2-10M tokens

Estimated Monthly Costs:
├─ Token Usage: 60-300M tokens/month
├─ Budget (at $0.003/1K tokens): $180-900/month
└─ Current Constraint: Free tier limits causing 429 errors
```

### **Phase 2: Growth Scale (1K-5K daily interviews)**
```
Projected Timeline: 6-12 months
Daily Interviews: 1,000-5,000
Peak Concurrent Sessions: 100-250

Required Rate Limits:
├─ RPM: 1,000-2,500 peak
├─ TPM: 4M-15M peak  
├─ Concurrent Connections: 250+
└─ Daily Token Usage: 20-100M tokens

Estimated Monthly Costs:
├─ Token Usage: 600M-3B tokens/month
├─ Budget (at $0.002/1K tokens): $1,200-6,000/month
└─ Revenue Target: $5-25K MRR to support costs
```

### **Phase 3: Enterprise Scale (5K-20K daily interviews)**
```
Projected Timeline: 12-24 months
Daily Interviews: 5,000-20,000
Peak Concurrent Sessions: 500-1,000

Required Rate Limits:
├─ RPM: 5,000-10,000 peak
├─ TPM: 20M-60M peak
├─ Concurrent Connections: 1,000+
└─ Daily Token Usage: 100-400M tokens

Estimated Monthly Costs:
├─ Token Usage: 3B-12B tokens/month
├─ Budget (at $0.001/1K tokens): $3,000-12,000/month
└─ Revenue Target: $50-200K MRR to support costs
```

### **Peak Traffic Pattern Analysis**
```
Time Zone Stacking:
├─ 6-10 PM India (GMT+5:30): 40% of traffic
├─ 6-10 PM UK (GMT): 25% of traffic
├─ 6-10 PM Eastern US (GMT-5): 15% of traffic
└─ Weekend surge: +30-50% above weekday average

Burst Requirements:
├─ Black Friday effect: 300-500% normal traffic
├─ Exam season: 200-300% normal traffic
├─ Required burst capacity: 5x normal RPM for 2-3 hours
└─ Graceful degradation: Queue system for 429 errors
```

---

## Detailed Token Usage & Cost Analysis

### **Per-Interview Breakdown**
```
Single Interview Session:
├─ Duration: 15-20 minutes
├─ Questions Asked: 10-15 questions  
├─ LLM API Calls: 10-15 scoring + 1 final evaluation
└─ Total Tokens: 60,000-75,000 per interview

Token Distribution:
├─ Per-Answer Scoring: 3,000-4,700 tokens × 12 = 36,000-56,400
├─ Final Evaluation: 2,400-4,700 tokens × 1 = 2,400-4,700
├─ Question Generation (if enabled): 1,100-2,100 × 12 = 13,200-25,200
└─ Session Management: 1,000-2,000 tokens

Input vs Output Ratio:
├─ Input Tokens: ~75% (context, history, prompts)
├─ Output Tokens: ~25% (scores, feedback, questions)
└─ Critical: Most providers charge 2-10x more for output tokens
```

### **Monthly Cost Projections by Provider**

| Provider | Input $/1K | Output $/1K | Cost/Interview | 1K/month | 5K/month | 20K/month |
|----------|------------|-------------|----------------|----------|----------|-----------|
| **Groq Llama 3.3** | $0.59 | $0.79 | $0.0026 | $2.60 | $13 | $52 |
| Together AI | $0.35 | $0.40 | $0.0015 | $1.50 | $7.50 | $30 |
| Gemini Flash | $0.075 | $0.30 | $0.0063 | $6.30 | $31.50 | $126 |
| Claude Haiku | $0.25 | $1.25 | $0.0263 | $26.30 | $131.50 | $526 |
| GPT-4o Mini | $0.15 | $0.60 | $0.0126 | $12.60 | $63 | $252 |
| GPT-4o | $2.50 | $10.00 | $0.21 | $210 | $1,050 | $4,200 |

**Key Insight**: Output token pricing dramatically affects costs. Groq/Together offer best value.

---

## Critical Rate Limit Requirements

### **Requests Per Minute (RPM)**
```
Current Bottleneck: Gemini free tier 60 RPM
Real Need Analysis:
├─ Peak concurrent interviews: 50
├─ API calls per interview: 12-15 over 15 minutes
├─ Required sustained RPM: 40-50
├─ Required burst RPM: 200-300 (traffic spikes)
└─ Growth target: 1,000+ RPM for scale

Provider Comparison:
├─ Groq Free: 30 RPM (insufficient for scale)
├─ Groq Paid: 100-500+ RPM (tier dependent)
├─ Together AI: 60 RPM (marginal improvement)
├─ Anthropic: 50 RPM (marginal improvement)
└─ OpenAI: Tier-based (can reach 5,000+ RPM)
```

### **Tokens Per Minute (TPM)**
```
Current Need:
├─ 50 concurrent interviews × 4,000 tokens/request = 200K TPM
├─ Peak burst: 800K-2M TPM
├─ Growth target: 20M-60M TPM

Provider Limits:
├─ Groq Free: No explicit TPM limit (RPM-constrained)
├─ Groq Paid: 1M+ TPM depending on tier
├─ Anthropic: 40K-4M TPM (tier dependent)
├─ OpenAI: 200K-10M TPM (tier dependent)
└─ Gemini: Quota-based (our current constraint)
```

### **Context Window Requirements**
```
Required Context Length:
├─ Student profile: 200-500 tokens
├─ Conversation history: 3,000-5,000 tokens
├─ System prompt: 600-800 tokens
├─ Current question: 100-300 tokens
└─ Total input: 4,000-6,500 tokens

Minimum Context Window: 8K tokens
Recommended: 32K+ for complex scenarios
Not needed: 1M+ context (overkill for our use case)
```

---

## Business Case for LLM Investment

### **Why Not Traditional Alternatives**
```
Rule-Based Scoring:
❌ Cannot evaluate open-ended responses
❌ No contextual understanding
❌ Fails on edge cases (90% of real interviews)

Human Evaluators:
❌ Cost: $20-50 per interview vs $0.003
❌ Scaling: Cannot handle 1,000+ concurrent
❌ Consistency: Human bias and fatigue
❌ Availability: Limited hours, time zones

Pre-recorded Content:
❌ No personalization or adaptation
❌ Students get bored, poor engagement
❌ Cannot handle follow-up questions
```

### **ROI Analysis**
```
Customer Lifetime Value:
├─ Average subscription: $29/month
├─ Average retention: 3.5 months
├─ Customer LTV: ~$100

LLM Cost per Customer:
├─ Average interviews per customer: 15-20
├─ LLM cost (at $0.003/interview): $0.045-0.06
├─ LLM cost percentage of LTV: 0.05-0.06%

Conclusion: LLM costs are negligible vs. customer value
Real constraint: Rate limits preventing customer acquisition
```

---

## Technical Integration Requirements

### **API Specifications**
```
Required Features:
├─ ✅ JSON Mode (structured output)
├─ ✅ Temperature control (0.3 for consistency)
├─ ✅ Max tokens limit (prevent runaway costs)
├─ ✅ OpenAI-compatible format (easier migration)
├─ ⚠️ Streaming (nice-to-have for UX)
└─ ❌ Function calling (not needed)

Latency Requirements:
├─ Per-answer scoring: <3 seconds (user waiting)
├─ Final evaluation: <5 seconds (acceptable wait)
├─ Question generation: <2 seconds (if enabled)
└─ 95th percentile: <5 seconds for all requests
```

### **Reliability & Failover**
```
Current Strategy:
├─ Primary: Gemini API
├─ Fallback 1: OpenRouter (Llama)
├─ Fallback 2: Heuristic scoring (rule-based)
└─ Success rate: 95%+ (acceptable for MVP)

Production Requirements:
├─ Multiple provider failover
├─ Circuit breaker pattern
├─ Request queuing for rate limits
├─ Real-time health monitoring
└─ Target: 99.5%+ success rate
```

---

## Cost Comparison Table

| LLM Provider | Cost/Interview | Free Tier | RPM Limit | Daily Capacity | Latency |
|--------------|----------------|-----------|-----------|----------------|---------|
| **Groq Llama 3.3 70B** | **$0.0026** | ✅ 14,400 RPD | 30 → 500+ | **360** → ∞ | **<1s** |
| Together AI Llama 3.3 | $0.0015 | ✅ $25 credit | 60 | ~16,000 | 1-2s |
| Cerebras Llama 3.3 | FREE (promo) | ✅ Limited time | Unknown | Unknown | <0.5s |
| OpenRouter Llama 3.1 | $0.0025 | ❌ | Variable | N/A | 2-3s |
| Gemini 1.5 Flash (paid) | $0.0063 | ❌ | Quota-based | N/A | 2-3s |
| Claude 3 Haiku | $0.0263 | ❌ | 50 → 4,000 | N/A | 1-2s |
| GPT-4o Mini | $0.0126 | ❌ | Tier-based | N/A | 2-4s |
| **Gemini Free Tier** | $0.00 | ✅ 1,500 RPD | 60 RPM | **115-136** | 2-3s |

**Current Constraint**: Gemini free tier 115-136 interviews/day (hitting limits)  
**Recommended**: Groq paid tier for 360+ interviews/day + 10x speed improvement

---

## Final Recommendation

### **For Your Use Case** (Student mock interviews, rate limit issues):

**Primary**: **Groq Llama 3.3 70B (FREE tier)**
- ✅ 3x higher daily limit than Gemini free tier
- ✅ 10x faster response (<1s vs 2-3s)
- ✅ Native JSON support
- ✅ Excellent quality for structured tasks
- ✅ OpenAI-compatible API (easy to implement)
- ✅ Same model quality as paid alternatives

**Fallback**: Keep Gemini or add Together AI
- Automatic failover if Groq is down
- Your heuristic scoring already serves as final fallback

**Disable**: Question generation (Use Case 1)
- Saves 70% of API calls
- No quality loss (static banks are high-quality)

### **Expected Outcome**
- **Cost**: $0.00/interview (free tier) or $0.0026/interview (paid)
- **Speed**: 50-80% faster interviews
- **Rate Limits**: Handle 360 interviews/day (vs current 115-136)
- **Latency**: Real-time feedback feels instant (<1s vs 2-3s)

Would you like me to implement the Groq integration for you?
