# Design Document

## Overview

This design addresses the critical bug where UK interview answers to factual questions receive extremely low scores (e.g., 32/100) despite being correct. The root cause is that the LLM returns 0 for domain-specific dimensions (courseAndUniversityFit, financialRequirement, complianceAndIntent) when those dimensions are not applicable to the question type. The scoring formula then averages these zeros, tanking the score.

The solution introduces:
1. Zero-dimension pattern detection to identify when domain dimensions are not applicable
2. Server-side score recalculation using only applicable dimensions
3. Consistency validation between rubric scores and contentScore
4. Improved final evaluation reporting to avoid misinterpreting scoring anomalies

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Answer Scoring Flow                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │   Answer     │───▶│   LLM        │───▶│   Score Validator            │  │
│  │   Received   │    │   Scorer     │    │   (NEW)                      │  │
│  └──────────────┘    └──────────────┘    └──────────────┬───────────────┘  │
│                                                          │                  │
│                                          ┌───────────────┴───────────────┐  │
│                                          │                               │  │
│                                          ▼                               ▼  │
│                              ┌──────────────────┐           ┌────────────┐  │
│                              │ Zero-Dimension   │           │ Normal     │  │
│                              │ Pattern Detected │           │ Scoring    │  │
│                              └────────┬─────────┘           └────────────┘  │
│                                       │                                     │
│                                       ▼                                     │
│                              ┌──────────────────┐                           │
│                              │ Recalculate with │                           │
│                              │ Core Dimensions  │                           │
│                              │ Only             │                           │
│                              └──────────────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Score Validator Module (NEW: `src/lib/uk-score-validator.ts`)

A new module that validates and corrects LLM scoring responses for UK interviews.

```typescript
interface ScoreValidationResult {
  isValid: boolean;
  hasZeroDimensionPattern: boolean;
  originalContentScore: number;
  correctedContentScore: number;
  excludedDimensions: string[];
  warnings: string[];
}

interface UKRubricScores {
  communication: number;
  relevance: number;
  specificity: number;
  consistency: number;
  courseAndUniversityFit: number;
  financialRequirement: number;
  complianceAndIntent: number;
}

// Core functions
function detectZeroDimensionPattern(rubric: UKRubricScores): boolean;
function calculateCoreOnlyScore(rubric: UKRubricScores): number;
function validateAndCorrectScore(rubric: UKRubricScores, llmContentScore: number, answerWordCount: number): ScoreValidationResult;
```

### 2. LLM Scorer Updates (`src/lib/llm-scorer.ts`)

Modify `parseResponse()` to integrate score validation:

```typescript
private parseResponse(content: string, answerWordCount: number): AIScoringLLMResponse {
  // ... existing parsing logic ...
  
  // NEW: Validate and correct UK scores
  if (this.isUKRoute) {
    const validation = validateAndCorrectScore(safeRubric, parsed.contentScore, answerWordCount);
    if (!validation.isValid) {
      console.warn('🔧 [Score Validator] Correcting score:', validation);
      safe.contentScore = validation.correctedContentScore;
    }
  }
  
  return safe;
}
```

### 3. Score Route Updates (`src/app/api/interview/score/route.ts`)

Add answer word count to LLM scorer call and handle validation results.

### 4. Final Evaluation Updates (`src/app/api/interview/final/route.ts`)

Update summary generation to detect and report scoring anomalies correctly.

## Data Models

### Score Validation Configuration
```typescript
interface UKScoreValidationConfig {
  zeroDimensionPattern: {
    domainDimensions: ['courseAndUniversityFit', 'financialRequirement', 'complianceAndIntent'];
    coreDimensions: ['communication', 'relevance', 'specificity', 'consistency'];
    coreAverageThreshold: 60;  // Core avg must be >= 60 to trigger pattern detection
  };
  scoreFloors: {
    minimumWithAnswer: 30;     // Floor when answer has > 10 words
    minimumCoreHealthy: 50;    // Floor when core dimensions avg >= 70
  };
  consistencyThreshold: 30;    // Max allowed difference between LLM score and formula
  asrBoost: {
    confidenceThreshold: 0.5;
    scoreThreshold: 40;
    boostPercentage: 0.25;
  };
}
```

### Scoring Anomaly Detection
```typescript
interface ScoringAnomaly {
  questionIndex: number;
  score: number;
  wordCount: number;
  anomalyType: 'zero_dimension_pattern' | 'score_floor_applied' | 'consistency_correction';
  originalScore?: number;
  correctedScore: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Zero-Dimension Pattern Detection
*For any* UK rubric where all three domain dimensions (courseAndUniversityFit, financialRequirement, complianceAndIntent) are 0 AND the average of core dimensions (communication, relevance, specificity, consistency) is 60 or higher, the system SHALL detect this as a zero-dimension pattern.
**Validates: Requirements 1.1**

### Property 2: Core-Only Score Calculation
*For any* UK rubric with a detected zero-dimension pattern, the recalculated content score SHALL equal the average of the four core dimensions (communication + relevance + specificity + consistency) / 4.
**Validates: Requirements 1.2, 1.3**

### Property 3: Content Score Override for Zero LLM Score
*For any* UK rubric where the LLM returns contentScore of 0 but core dimensions average 60 or higher, the final content score SHALL be the core dimension average (not 0).
**Validates: Requirements 1.4**

### Property 4: Weight Redistribution Sums to One
*For any* UK scoring calculation where domain dimensions are excluded, the redistributed weights of remaining dimensions SHALL sum to 1.0.
**Validates: Requirements 2.4**

### Property 5: Scoring Anomaly Detection
*For any* per-answer score below 40 where the answer word count exceeds 10, the system SHALL flag this as a potential scoring anomaly.
**Validates: Requirements 3.2**

### Property 6: No False "Zero Words" Claims
*For any* final evaluation summary where a scoring anomaly was detected for a question, the summary SHALL NOT contain the phrase "zero words recorded" for that question.
**Validates: Requirements 3.4**

### Property 7: Content Score Floor with Healthy Core
*For any* UK rubric where core dimension scores average 70 or higher, the final content score SHALL be at least 50.
**Validates: Requirements 4.1**

### Property 8: Consistency Correction
*For any* UK rubric where the LLM contentScore differs from the weighted formula result by more than 30 points, the system SHALL use the formula-calculated score.
**Validates: Requirements 4.2**

### Property 9: Minimum Floor with Answer Present
*For any* UK scoring where the LLM returns contentScore of 0 but the answer has more than 10 words, the final content score SHALL be at least 30.
**Validates: Requirements 5.2**

### Property 10: ASR Low Confidence Boost
*For any* UK scoring where ASR confidence is below 0.5 AND content score is below 40, the final score SHALL be boosted by 25%.
**Validates: Requirements 5.3**

## Error Handling

1. **All Dimensions Zero**: When LLM returns 0 for all dimensions (core and domain), fall back to heuristic scoring based on answer length and keyword presence.

2. **Parse Failure**: When LLM response cannot be parsed, use existing heuristic fallback with neutral baseline scores.

3. **Validation Failure**: When score validation detects multiple anomalies, log detailed diagnostics and apply conservative corrections.

4. **ASR Confidence Missing**: When ASR confidence is not provided, assume 0.75 (reasonable default) rather than applying boost.

## Testing Strategy

### Unit Tests
- Test `detectZeroDimensionPattern()` with various rubric combinations
- Test `calculateCoreOnlyScore()` with known inputs
- Test `validateAndCorrectScore()` with edge cases (all zeros, mixed zeros, healthy scores)
- Test weight redistribution math

### Property-Based Tests
Using fast-check for TypeScript:

1. **Property 1**: Generate random rubrics with domain=0 and core>=60, verify pattern detected
2. **Property 2**: Generate zero-dimension rubrics, verify score equals core average
3. **Property 3**: Generate rubrics with contentScore=0 and core>=60, verify override
4. **Property 4**: Generate any exclusion scenario, verify weights sum to 1.0
5. **Property 5**: Generate scores<40 with wordCount>10, verify anomaly flagged
6. **Property 6**: Generate anomaly scenarios, verify summary text
7. **Property 7**: Generate rubrics with core>=70, verify score>=50
8. **Property 8**: Generate inconsistent scores (diff>30), verify correction
9. **Property 9**: Generate contentScore=0 with wordCount>10, verify floor=30
10. **Property 10**: Generate ASR<0.5 and score<40, verify 25% boost

### Integration Tests
- End-to-end test with mock LLM returning zero-dimension pattern
- Test final evaluation with scoring anomalies
- Test score route with various ASR confidence levels

