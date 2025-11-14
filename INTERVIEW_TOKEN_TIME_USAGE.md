# Interview Token Usage & Time Analysis

## Overview
This document provides token usage and time consumption data across all interview routes in the Consularly visa mockup system.

## Interview Routes

### Supported Countries & Routes
1. **USA F1** (`usa_f1`) - Nepal-focused F1 Student Visa
2. **UK Student** (`uk_student`) - UK Student/Pre-CAS Visa
3. **France EMA** (`france_ema`) - France EMA Business School
4. **France ICN** (`france_icn`) - France ICN Business School

---

## LLM Token Usage

### Token Consumption Sources
Each interview session consumes LLM tokens across **3 primary use cases**:

#### 1. Question Selection
- **Frequency**: 1 call per question
- **Token Range**: 300-800 tokens per call
- **Average**: ~500 tokens per call

#### 2. Answer Scoring
- **Frequency**: 1 call per student answer
- **Token Range**: 1000-2000 tokens per call
- **Average**: ~1,500 tokens per call

#### 3. Final Evaluation
- **Frequency**: 1 call per completed interview
- **Token Range**: 2000-4000 tokens per call
- **Average**: Variable by route (see breakdown below)

---

## Token Usage by Interview Route

### USA F1 Route (`usa_f1`)
```
Interview Configuration:
├── Questions per Interview: 8
├── Total LLM Calls: 17 per interview
└── Interview Duration: 15-25 minutes

Token Breakdown:
├── Question Selection: 8 calls × 500 tokens = 4,000 tokens
├── Answer Scoring: 8 calls × 1,500 tokens = 12,000 tokens
└── Final Evaluation: 1 call × 3,000 tokens = 3,000 tokens

Total LLM Tokens per Interview: 19,000 tokens
```

### UK Student Route (`uk_student`)
```
Interview Configuration:
├── Questions per Interview: 16
├── Total LLM Calls: 33 per interview
└── Interview Duration: 25-40 minutes

Token Breakdown:
├── Question Selection: 16 calls × 500 tokens = 8,000 tokens
├── Answer Scoring: 16 calls × 1,500 tokens = 24,000 tokens
└── Final Evaluation: 1 call × 3,500 tokens = 3,500 tokens

Total LLM Tokens per Interview: 35,500 tokens
```

### France EMA Route (`france_ema`)
```
Interview Configuration:
├── Questions per Interview: 12-14 (avg 13)
├── Total LLM Calls: 27 per interview
└── Interview Duration: 20-30 minutes

Token Breakdown:
├── Question Selection: 13 calls × 500 tokens = 6,500 tokens
├── Answer Scoring: 13 calls × 1,500 tokens = 19,500 tokens
└── Final Evaluation: 1 call × 3,200 tokens = 3,200 tokens

Total LLM Tokens per Interview: 29,200 tokens
```

### France ICN Route (`france_icn`)
```
Interview Configuration:
├── Questions per Interview: 12-14 (avg 13)
├── Total LLM Calls: 27 per interview
└── Interview Duration: 20-30 minutes

Token Breakdown:
├── Question Selection: 13 calls × 500 tokens = 6,500 tokens
├── Answer Scoring: 13 calls × 1,500 tokens = 19,500 tokens
└── Final Evaluation: 1 call × 3,200 tokens = 3,200 tokens

Total LLM Tokens per Interview: 29,200 tokens
```

---

## AssemblyAI Time Usage

### Real-Time Speech-to-Text Processing

#### USA F1 Route
```
Audio Processing Time:
├── Average Duration: 15-25 minutes per interview
├── Minimum Duration: 15 minutes
└── Maximum Duration: 25 minutes
```

#### UK Student Route
```
Audio Processing Time:
├── Average Duration: 25-40 minutes per interview
├── Minimum Duration: 25 minutes
└── Maximum Duration: 40 minutes
```

#### France EMA Route
```
Audio Processing Time:
├── Average Duration: 20-30 minutes per interview
├── Minimum Duration: 20 minutes
└── Maximum Duration: 30 minutes
```

#### France ICN Route
```
Audio Processing Time:
├── Average Duration: 20-30 minutes per interview
├── Minimum Duration: 20 minutes
└── Maximum Duration: 30 minutes
```

### AssemblyAI Features Active During Processing
1. **Real-Time Transcription**: Continuous speech-to-text throughout interview
2. **Language Detection**: Automatic detection of non-English speech
3. **Confidence Scoring**: Generated for each transcription segment
4. **Session Management**: WebSocket connection maintained for full duration

---

## Usage Summary Table

| Route | Questions | LLM Calls | LLM Tokens | Audio Time (min) |
|-------|-----------|-----------|------------|------------------|
| USA F1 | 8 | 17 | 19,000 | 15-25 |
| UK Student | 16 | 33 | 35,500 | 25-40 |
| France EMA | 13 | 27 | 29,200 | 20-30 |
| France ICN | 13 | 27 | 29,200 | 20-30 |

---

## Monthly Usage Projections (1000 Interviews)

### LLM Token Usage
```
USA F1: 19,000,000 tokens/month
UK Student: 35,500,000 tokens/month
France EMA: 29,200,000 tokens/month
France ICN: 29,200,000 tokens/month
```

### AssemblyAI Processing Time
```
USA F1: 15,000-25,000 minutes/month
UK Student: 25,000-40,000 minutes/month
France EMA: 20,000-30,000 minutes/month
France ICN: 20,000-30,000 minutes/month
```

---

## Token Usage Patterns

### By Use Case (Across All Routes)
```
Question Selection: 15-25% of total tokens
Answer Scoring: 65-70% of total tokens
Final Evaluation: 10-15% of total tokens
```

### By Route Complexity
```
Most Token-Intensive: UK Student (35,500 tokens)
Moderate Usage: France Routes (29,200 tokens each)
Most Efficient: USA F1 (19,000 tokens)
```

### Time Usage Patterns
```
Longest Interviews: UK Student (25-40 min)
Moderate Duration: France Routes (20-30 min)
Shortest Interviews: USA F1 (15-25 min)
```
