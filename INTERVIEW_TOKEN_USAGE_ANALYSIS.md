# Interview Token Usage & Cost Analysis

## Overview
This document provides a comprehensive analysis of LLM token usage and AssemblyAI costs across all interview routes in the Consularly visa mockup system.

## Interview Routes

### Supported Countries & Routes
1. **USA F1** (`usa_f1`) - Nepal-focused F1 Student Visa
2. **UK Student** (`uk_student`) - UK Student/Pre-CAS Visa
3. **France EMA** (`france_ema`) - France EMA Business School
4. **France ICN** (`france_icn`) - France ICN Business School

---

## LLM Token Usage Structure

### Token Consumption Sources
Each interview session consumes LLM tokens across **3 primary use cases**:

#### 1. Question Selection (`question_selection`)
- **Frequency**: 1 call per question
- **Provider**: Groq Llama 3.1 8B Instant (optimized for speed)
- **Token Range**: 300-800 tokens per call
- **Purpose**: AI-driven intelligent question selection based on interview context
- **Configuration**: Always uses lightweight 8B model for 3-5x faster response times

#### 2. Answer Scoring (`answer_scoring`)
- **Frequency**: 1 call per student answer
- **Providers**: Route-dependent (see Provider Matrix below)
- **Token Range**: 1000-2000 tokens per call
- **Purpose**: Rubric-based scoring with route-specific criteria
- **Features**: Includes consistency checking, red flag detection, recommendation generation

#### 3. Final Evaluation (`final_evaluation`)
- **Frequency**: 1 call per completed interview
- **Providers**: Same as answer scoring
- **Token Range**: 2000-4000 tokens per call
- **Purpose**: Comprehensive final assessment with decision recommendation
- **Features**: Holistic analysis, detailed insights, strengths/weaknesses identification

### LLM Provider Configuration Matrix

#### Primary Provider: Groq (Cost-Optimized)
```
Question Selection (All Routes):
├── Model: llama-3.1-8b-instant
├── Speed: 3-5x faster than 70B models
├── Input Cost: ~$0.05 per 1K tokens
└── Output Cost: ~$0.08 per 1K tokens

Answer Scoring & Final Evaluation:
├── Model: llama-3.3-70b-versatile
├── Input Cost: ~$0.27 per 1K tokens
├── Output Cost: ~$1.10 per 1K tokens
└── Routes: USA F1, UK (default), France (default)
```

#### Premium Provider: Claude (Anthropic)
```
UK Premium Mode (USE_PREMIUM_UK=true):
├── Model: claude-3-haiku-20240307
├── Input Cost: ~$0.25 per 1K tokens
├── Output Cost: ~$1.25 per 1K tokens
└── Enhanced accuracy for UK visa criteria

France Premium Mode (USE_PREMIUM_FRANCE=true):
├── Model: claude-3-haiku-20240307
├── Input Cost: ~$0.25 per 1K tokens
├── Output Cost: ~$1.25 per 1K tokens
└── Optimized for France visa requirements
```

#### Fallback Providers
1. **Gemini**: gemini-2.0-flash-exp (~$0.075 per 1K tokens)
2. **OpenRouter**: meta-llama/llama-3.1-70b-instruct (variable pricing)

---

## Token Usage by Interview Route

### USA F1 Route (`usa_f1`) - Nepal F1 Student Visa
```
Interview Configuration:
├── Default Questions: 8
├── Interview Duration: 15-25 minutes
├── Total LLM Calls: 17 per interview
└── Specialized Features: Nepal-specific patterns, coached language detection

Token Breakdown:
├── Question Selection: 8 calls × 500 avg tokens = 4,000 tokens
├── Answer Scoring: 8 calls × 1,500 avg tokens = 12,000 tokens
└── Final Evaluation: 1 call × 3,000 avg tokens = 3,000 tokens

Total Tokens per Interview: ~19,000 tokens
Estimated Cost per Interview: $2.50 - $4.00 (Groq standard pricing)
Monthly Cost (1000 interviews): $2,500 - $4,000
```

### UK Student Route (`uk_student`) - UK Student/Pre-CAS Visa
```
Interview Configuration:
├── Default Questions: 16 (comprehensive format)
├── Interview Duration: 25-40 minutes
├── Total LLM Calls: 33 per interview
└── Specialized Features: £18k maintenance rule, 28-day bank rule, course specificity

Token Breakdown:
├── Question Selection: 16 calls × 500 avg tokens = 8,000 tokens
├── Answer Scoring: 16 calls × 1,500 avg tokens = 24,000 tokens
└── Final Evaluation: 1 call × 3,500 avg tokens = 3,500 tokens

Total Tokens per Interview: ~35,500 tokens
Standard Cost per Interview: $4.50 - $7.00 (Groq)
Premium Cost per Interview: $8.00 - $12.00 (Claude)
Monthly Cost (1000 interviews): $4,500 - $12,000
```

### France EMA Route (`france_ema`) - France EMA Business School
```
Interview Configuration:
├── Default Questions: 12-14
├── Interview Duration: 20-30 minutes
├── Total LLM Calls: 25-29 per interview
└── Specialized Features: EMA-specific curriculum, French visa requirements

Token Breakdown:
├── Question Selection: 13 calls × 500 avg tokens = 6,500 tokens
├── Answer Scoring: 13 calls × 1,500 avg tokens = 19,500 tokens
└── Final Evaluation: 1 call × 3,200 avg tokens = 3,200 tokens

Total Tokens per Interview: ~29,200 tokens
Standard Cost per Interview: $3.50 - $5.50 (Groq)
Premium Cost per Interview: $6.50 - $10.00 (Claude)
Monthly Cost (1000 interviews): $3,500 - $10,000
```

### France ICN Route (`france_icn`) - France ICN Business School
```
Interview Configuration:
├── Default Questions: 12-14
├── Interview Duration: 20-30 minutes
├── Total LLM Calls: 25-29 per interview
└── Specialized Features: ICN-specific curriculum, French visa requirements

Token Breakdown:
├── Question Selection: 13 calls × 500 avg tokens = 6,500 tokens
├── Answer Scoring: 13 calls × 1,500 avg tokens = 19,500 tokens
└── Final Evaluation: 1 call × 3,200 avg tokens = 3,200 tokens

Total Tokens per Interview: ~29,200 tokens
Standard Cost per Interview: $3.50 - $5.50 (Groq)
Premium Cost per Interview: $6.50 - $10.00 (Claude)
Monthly Cost (1000 interviews): $3,500 - $10,000
```

---

## AssemblyAI Usage & Costs

### Real-Time Speech-to-Text Service
AssemblyAI provides real-time speech transcription during interviews with the following characteristics:

```
Service Configuration:
├── Connection: WebSocket Streaming API v3
├── Sample Rate: 16,000 Hz (adjustable based on device)
├── Encoding: PCM S16LE
├── Language Detection: Enabled by default
└── Session Token: Server-generated, 60-600 seconds expiry
```

### AssemblyAI Cost Structure
```
Real-Time Streaming Pricing:
├── Base Rate: $0.17 per minute of audio
├── Language Detection: Included at no extra cost
├── Confidence Scoring: Included at no extra cost
└── Session Setup: No additional charges
```

### AssemblyAI Usage by Route

#### USA F1 Route
```
Audio Processing:
├── Average Duration: 15-25 minutes per interview
├── Cost per Interview: $2.55 - $4.25
└── Monthly Cost (1000 interviews): $2,550 - $4,250
```

#### UK Student Route
```
Audio Processing:
├── Average Duration: 25-40 minutes per interview
├── Cost per Interview: $4.25 - $6.80
└── Monthly Cost (1000 interviews): $4,250 - $6,800
```

#### France Routes (EMA & ICN)
```
Audio Processing:
├── Average Duration: 20-30 minutes per interview
├── Cost per Interview: $3.40 - $5.10
└── Monthly Cost (1000 interviews): $3,400 - $5,100
```

### AssemblyAI Features Utilized
1. **Real-Time Transcription**: Live speech-to-text during interviews
2. **Language Detection**: Automatic detection of non-English speech with penalties
3. **Confidence Scoring**: Used in performance scoring algorithms
4. **Session Management**: Automatic session lifecycle management
5. **Error Handling**: Robust fallback mechanisms for connection issues

---

## Total Cost Analysis

### Combined Costs per Interview Route (LLM + AssemblyAI)

#### USA F1 Route
```
Standard Configuration:
├── LLM Costs: $2.50 - $4.00
├── AssemblyAI Costs: $2.55 - $4.25
├── Total per Interview: $5.05 - $8.25
└── Monthly (1000 interviews): $5,050 - $8,250
```

#### UK Student Route
```
Standard Configuration:
├── LLM Costs: $4.50 - $7.00
├── AssemblyAI Costs: $4.25 - $6.80
├── Total per Interview: $8.75 - $13.80
└── Monthly (1000 interviews): $8,750 - $13,800

Premium Configuration (Claude):
├── LLM Costs: $8.00 - $12.00
├── AssemblyAI Costs: $4.25 - $6.80
├── Total per Interview: $12.25 - $18.80
└── Monthly (1000 interviews): $12,250 - $18,800
```

#### France Routes (EMA & ICN)
```
Standard Configuration:
├── LLM Costs: $3.50 - $5.50
├── AssemblyAI Costs: $3.40 - $5.10
├── Total per Interview: $6.90 - $10.60
└── Monthly (1000 interviews): $6,900 - $10,600

Premium Configuration (Claude):
├── LLM Costs: $6.50 - $10.00
├── AssemblyAI Costs: $3.40 - $5.10
├── Total per Interview: $9.90 - $15.10
└── Monthly (1000 interviews): $9,900 - $15,100
```

### System-Wide Projections (Mixed Usage)
```
Conservative Estimate (Standard Providers):
├── Monthly Cost: $25,000 - $35,000
├── Per Interview Average: $7.50 - $10.50
└── Annual Cost: $300,000 - $420,000

Premium Estimate (With Claude):
├── Monthly Cost: $40,000 - $60,000
├── Per Interview Average: $12.00 - $18.00
└── Annual Cost: $480,000 - $720,000
```

---

## Optimization Opportunities

### Current Optimizations
1. **Fast Question Selection**: Uses 8B model instead of 70B (3-5x cost reduction)
2. **Provider Fallbacks**: Automatic failover to cheaper providers
3. **Timeout Controls**: Prevents hanging requests and cost overruns
4. **Heuristic Fallbacks**: No LLM cost when AI services fail

### Recommended Optimizations
1. **Token Usage Monitoring**: Implement real-time token tracking and alerts
2. **Batch Processing**: Pre-generate question pools to reduce real-time calls
3. **Smart Caching**: Cache similar answer patterns and scoring results
4. **Dynamic Provider Selection**: Route to cheapest available provider based on load
5. **Interview Length Optimization**: Optimize question count vs. accuracy trade-offs

### Cost Reduction Strategies
1. **Selective Premium Usage**: Use premium providers only for critical decisions
2. **Question Pool Pre-Generation**: Reduce real-time question selection calls
3. **Answer Classification**: Use heuristics for obvious cases, LLM for borderline
4. **Audio Quality Optimization**: Reduce AssemblyAI costs through better audio preprocessing

---

## Environment Variables

### LLM Provider Configuration
```bash
# Primary Provider (Groq)
GROQ_API_KEY=your_groq_api_key
LLM_MODEL_QUESTIONS=llama-3.1-8b-instant
LLM_MODEL_SCORING=llama-3.3-70b-versatile

# Premium Providers
USE_PREMIUM_UK=true/false
USE_PREMIUM_FRANCE=true/false
ANTHROPIC_API_KEY=your_claude_api_key

# Fallback Providers
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### AssemblyAI Configuration
```bash
# AssemblyAI Real-Time Transcription
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

---

## Monitoring & Analytics

### Recommended Metrics
1. **Token Usage per Route**: Track consumption patterns by country
2. **Cost per Interview**: Monitor real-time costs and budget adherence
3. **Provider Performance**: Response times and accuracy by provider
4. **Audio Quality Metrics**: AssemblyAI confidence scores and accuracy
5. **Error Rates**: LLM and AssemblyAI failure rates and fallback usage

### Dashboard Requirements
- Real-time cost tracking
- Token usage trends
- Provider performance comparison
- Route-specific analytics
- Budget alerts and thresholds

---

## Technical Implementation Notes

### Token Tracking Implementation
Currently, token usage is tracked at the provider level but not actively logged or monitored. Each LLM response includes usage metadata:

```typescript
interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### AssemblyAI Session Management
- Server-side token generation for security
- Automatic session lifecycle management
- Real-time audio streaming with WebSocket
- Language detection and confidence scoring integrated

### Cost Calculation Formulas
```
LLM Cost = (input_tokens * input_rate) + (output_tokens * output_rate)
AssemblyAI Cost = audio_duration_minutes * $0.17
Total Interview Cost = LLM_Cost + AssemblyAI_Cost
```

---

## Summary

The current system is well-architected with multiple provider fallbacks and route-specific optimizations. The UK route is the most expensive due to its comprehensive 16-question format, consuming nearly 2x the tokens of the USA route. AssemblyAI costs are relatively consistent across routes, primarily driven by interview duration rather than complexity.

**Key Findings:**
- UK interviews are the most expensive ($8.75-$18.80 per interview)
- USA F1 interviews are the most cost-efficient ($5.05-$8.25 per interview)
- France routes fall in the middle range ($6.90-$15.10 per interview)
- System-wide monthly costs range from $25K-$60K depending on configuration
- AssemblyAI represents 30-50% of total per-interview costs

**Immediate Actions Recommended:**
1. Implement real-time token usage monitoring
2. Add cost alerting and budget controls
3. Optimize UK route question count vs. accuracy trade-off
4. Consider selective premium provider usage based on student profiles
