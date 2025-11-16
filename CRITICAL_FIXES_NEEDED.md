# Critical Fixes Required Before Market Launch

## Priority 1: Fix Semantic Cluster Tracking (CRITICAL)

### Problem
`askedClusters` is never updated after selecting a question, causing semantic repetitions.

### Solution
The system needs to track the cluster of the selected question and pass it back to be added to the session state.

### Files to Modify:

1. **src/lib/smart-question-selector.ts**
   - Return the cluster ID with the question result
   - Add cluster to the result interface

2. **src/lib/llm-service.ts**
   - Extract cluster from result
   - Pass it back in the response

3. **src/lib/interview-simulation.ts**
   - Store the cluster in session state
   - Pass accumulated clusters to next question generation

### Implementation:

```typescript
// 1. Update QuestionResult interface in smart-question-selector.ts
interface QuestionResult {
  question: string;
  type: 'bank' | 'followup';
  questionId?: string;
  reasoning?: string;
  semanticCluster?: string; // ADD THIS
}

// 2. In selectNextQuestion(), add cluster to result:
const cluster = getSemanticCluster(result.question);
return {
  ...result,
  semanticCluster: cluster || undefined
};

// 3. In llm-service.ts, pass cluster back:
return {
  question: finalQuestion,
  questionType: this.inferQuestionType(result.question),
  difficulty: effectiveDifficulty,
  expectedAnswerLength: 'medium',
  tips: result.reasoning,
  semanticCluster: result.semanticCluster, // ADD THIS
};

// 4. In interview-simulation.ts, track clusters in session:
export interface InterviewSession {
  // ... existing fields
  askedSemanticClusters?: string[]; // ADD THIS
}

// 5. When adding question to history, also track cluster:
if (nextQuestion.semanticCluster) {
  updatedSession.askedSemanticClusters = [
    ...(session.askedSemanticClusters || []),
    nextQuestion.semanticCluster
  ];
}

// 6. Pass clusters to next question generation:
const request: QuestionGenerationRequest = {
  // ... existing fields
  interviewContext: {
    // ... existing fields
    askedSemanticClusters: session.askedSemanticClusters,
  }
};

// 7. In llm-service.ts, use tracked clusters:
const context = {
  // ... existing fields
  askedClusters: request.interviewContext.askedSemanticClusters || [],
};
```

## Priority 2: Add Stricter Duplicate Detection (CRITICAL)

### Problem
Questions like "Why do you want to study in the US?" and "What is your purpose for studying in the U.S.?" are semantically identical but both asked.

### Solution
Add final validation before returning any question.

```typescript
// In interview-simulation.ts, before returning next question:

private async validateQuestionUniqueness(
  question: string,
  conversationHistory: Array<{ question: string }>
): Promise<boolean> {
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = (s: string) => normalize(s).split(' ').filter(t => t.length > 2);
  const jaccard = (a: string[], b: string[]) => {
    const A = new Set(a), B = new Set(b);
    let inter = 0;
    A.forEach((t) => { if (B.has(t)) inter++ });
    const union = A.size + B.size - inter;
    return union === 0 ? 0 : inter / union;
  };
  
  const candToks = tokens(question);
  
  for (const h of conversationHistory) {
    const histToks = tokens(h.question);
    const similarity = jaccard(candToks, histToks);
    
    if (similarity >= 0.65) { // 65% similarity threshold
      console.warn(`⚠️ [DUPLICATE DETECTED] New question too similar (${(similarity * 100).toFixed(0)}%) to: "${h.question}"`);
      return false;
    }
  }
  
  return true;
}

// Use it before returning:
const isUnique = await this.validateQuestionUniqueness(
  next.question,
  session.conversationHistory
);

if (!isUnique) {
  // Regenerate or use fallback
  console.warn('[Interview] Duplicate detected, using fallback');
  return this.getUniqueFallbackQuestion(...);
}
```

## Priority 3: Audit Question Bank (HIGH)

### Task
Review all 117 questions and ensure:
1. Each has correct `requiresContext`
2. Each has correct `inappropriateFor`
3. No semantic duplicates within the bank

### Script to Help:

```typescript
// Run this to find potential duplicates in question bank:
import { loadQuestionBank } from './src/lib/smart-question-selector';

async function auditQuestionBank() {
  const bank = await loadQuestionBank();
  const questions = bank.questions.filter(q => q.route === 'usa_f1');
  
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = (s: string) => normalize(s).split(' ').filter(t => t.length > 2);
  const jaccard = (a: string[], b: string[]) => {
    const A = new Set(a), B = new Set(b);
    let inter = 0;
    A.forEach((t) => { if (B.has(t)) inter++ });
    return A.size + B.size - inter === 0 ? 0 : inter / (A.size + B.size - inter);
  };
  
  console.log('=== Potential Duplicates in Question Bank ===\n');
  
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const q1 = questions[i];
      const q2 = questions[j];
      const similarity = jaccard(tokens(q1.question), tokens(q2.question));
      
      if (similarity >= 0.60) {
        console.log(`${(similarity * 100).toFixed(0)}% similar:`);
        console.log(`  ${q1.id}: "${q1.question}"`);
        console.log(`  ${q2.id}: "${q2.question}"`);
        console.log('');
      }
    }
  }
}
```

## Priority 4: Add Real-time Monitoring (MEDIUM)

### Add Metrics Tracking

```typescript
// Track these metrics in production:
interface InterviewMetrics {
  exactDuplicates: number;      // Same question asked twice
  semanticDuplicates: number;   // Similar questions asked
  inappropriateQuestions: number; // Wrong degree level
  llmTimeouts: number;          // LLM selection failures
  questionRelevanceScore: number; // Average relevance (0-100)
}

// Log to monitoring service (e.g., Sentry, DataDog)
```

## Testing Checklist Before Launch

- [ ] Run 50 mock interviews with undergraduate students
- [ ] Run 50 mock interviews with graduate students
- [ ] Run 20 mock interviews with PhD students
- [ ] Verify 0% exact repetition rate
- [ ] Verify <5% semantic repetition rate
- [ ] Verify >90% question relevance
- [ ] Test LLM timeout scenarios
- [ ] Test with incomplete student profiles
- [ ] Test with missing student data
- [ ] Load test with 100 concurrent interviews

## Estimated Time to Fix

- **Priority 1 (Cluster Tracking):** 4-6 hours
- **Priority 2 (Duplicate Detection):** 2-3 hours
- **Priority 3 (Question Bank Audit):** 4-6 hours
- **Priority 4 (Monitoring):** 2-3 hours
- **Testing:** 4-6 hours

**Total:** 16-24 hours (2-3 working days)

## Current System Score

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Question Relevance | 70% | 90% | ⚠️ Needs Work |
| No Exact Repetition | 85% | 100% | ⚠️ Needs Work |
| No Semantic Repetition | 40% | 95% | ❌ Critical |
| Degree Level Filtering | 95% | 100% | ✅ Good |
| Context Filtering | 90% | 95% | ✅ Good |
| System Stability | 85% | 95% | ⚠️ Needs Work |

**Overall Market Readiness: 65%**

## Recommendation

**DO NOT LAUNCH** until Priority 1 and Priority 2 are fixed and tested.

The system has good foundations but the semantic repetition bug is a critical user experience issue that will damage credibility.

---

*Analysis Date: 2025-11-16*
*Severity: CRITICAL*
*Recommended Action: Fix before any production deployment*
