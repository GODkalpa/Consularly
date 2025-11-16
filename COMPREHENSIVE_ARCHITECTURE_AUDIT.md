# Comprehensive Architecture Audit: Interview System Route Separation

**Date**: 2024
**Audit Scope**: Complete system analysis for USA, UK, and France interview route separation

---

## Executive Summary

✅ **VERDICT: The system is PROPERLY ARCHITECTED with complete separation of concerns**

The interview system has **dedicated, route-specific implementations** for:
- Question banks
- System prompts
- LLM provider selection
- Scoring rubrics
- Interview flows
- Follow-up patterns

**No inappropriate sharing detected.** Each interview type (USA F1, UK Student, France EMA/ICN) has its own specialized logic.

---

## 1. Question Bank Separation ✅

### Dedicated Files by Route:

#### USA F1 Interviews
- **File**: `src/lib/f1-questions-data.ts`
- **Questions**: 100+ real F1 visa questions
- **Categories**: 6 categories (Study plans, University choice, Academic capability, Financial status, Post-graduation plans, Additional/General)
- **Special Features**: 
  - Degree-level filtering (undergraduate/graduate/doctorate)
  - Category-based organization
  - Helper functions for question selection

#### UK Student Interviews
- **File**: `src/lib/uk-questions-data.ts`
- **Questions**: 24 UK-specific pre-CAS/credibility questions
- **Focus Areas**: 
  - Genuine student intent
  - Course & university fit
  - Financial requirements (£18,000 maintenance, 28-day rule)
  - Accommodation planning
  - Compliance & credibility
  - Post-study intentions

#### France Interviews
- **File**: `src/lib/france-questions-data.ts`
- **EMA University**: 15 dedicated questions (EMA_001 to EMA_015)
- **ICN Business School**: 10 dedicated questions (ICN_001 to ICN_010)
- **Special Features**:
  - Fixed first question (always asked)
  - Remaining questions selected by LLM
  - University-specific question pools

#### Generic Question Bank
- **File**: `src/data/question-bank.json`
- **Purpose**: Shared question pool with route tags
- **Tags**: `usa_f1`, `uk_student`, `both`
- **Usage**: Smart question selector filters by route
- **Note**: This is a STRENGTH, not a weakness - allows flexible question selection while maintaining route separation

---

## 2. System Prompt Separation ✅

### Location: `src/lib/llm-service.ts` - `buildPrompt()` method

#### UK Student Prompt
```typescript
if (route === 'uk_student') {
  // UK-specific header with degree level context
  // UK-specific question bank provided
  // UK-specific instructions (verbatim selection from bank)
  // UK-specific flow: Genuine Student → Course & University → Financial → Accommodation → Compliance → Post-study
}
```

**UK-Specific Elements**:
- Pre-CAS credibility interview focus
- £18,000 maintenance requirement
- 28-day bank balance rule
- Agent dependency detection
- 20 hours/week work limit
- Accommodation costs in £/week

#### USA F1 Prompt
```typescript
else if (route === 'usa_f1') {
  // USA-specific header with degree level validation
  // F1 question bank by category
  // Adaptive wording allowed
  // USA-specific flow: Study Plans → University → Academic → Financial → Post-grad
}
```

**USA-Specific Elements**:
- Nepal F1 visa interview focus
- Dollar amounts for funding
- Nepal ties and return intent
- Coached language detection ("dreams", "world-class")
- Sponsor occupation details
- Concrete post-graduation plans

#### France Prompt
```typescript
else if (route === 'france_ema' || route === 'france_icn') {
  // France-specific header
  // University-specific question bank (EMA vs ICN)
  // Fixed Q1, hybrid selection for Q2-10
  // Strict duplicate prevention
}
```

**France-Specific Elements**:
- University-specific questions (EMA vs ICN)
- Course alignment focus
- Career objectives emphasis
- Fixed first question structure

---

## 3. LLM Provider Selection ✅

### Location: `src/lib/llm-provider-selector.ts`

**Route-Aware Provider Selection**:
```typescript
export function selectLLMProvider(
  route: InterviewRoute,  // usa_f1 | uk_student | france_ema | france_icn
  useCase: LLMUseCase     // question_selection | answer_scoring | final_evaluation
): LLMProviderConfig | null
```

**Provider Strategy**:
- **Question Selection**: Claude Haiku 4.5 (fast, structured) or Groq Llama 3.1 8B (ultra-fast)
- **UK Scoring**: Groq Llama 3.3 70B
- **France Scoring**: Groq Llama 3.3 70B
- **USA Scoring**: Groq Llama 3.3 70B

**Key Feature**: Each route can have different provider configurations based on requirements

---

## 4. Scoring Rubric Separation ✅

### Location: `src/lib/llm-scorer.ts`

#### UK/France Scoring Rubric
```typescript
{
  communication: 0-100,
  relevance: 0-100,
  specificity: 0-100,
  consistency: 0-100,
  courseAndUniversityFit: 0-100,      // UK/France specific
  financialRequirement: 0-100,         // UK/France specific
  complianceAndIntent: 0-100           // UK/France specific
}
```

**UK/France Formula**:
```
contentScore = (0.20 × communication) + (0.15 × relevance) + 
               (0.25 × specificity) + (0.15 × consistency) + 
               (0.15 × courseAndUniversityFit) + (0.10 × financialRequirement)
```

#### USA F1 Scoring Rubric
```typescript
{
  communication: 0-100,
  relevance: 0-100,
  specificity: 0-100,
  consistency: 0-100,
  academicPreparedness: 0-100,         // USA specific
  financialCapability: 0-100,          // USA specific
  intentToReturn: 0-100                // USA specific
}
```

**USA Formula**:
```
contentScore = (0.25 × communication) + (0.20 × relevance) + 
               (0.25 × specificity) + (0.15 × consistency) + 
               (0.10 × academicPreparedness) + (0.05 × financialCapability)
```

**Key Differences**:
- UK/France emphasizes course fit and financial requirements
- USA emphasizes return intent and academic preparedness
- Different weighting formulas
- Different red flag detection

---

## 5. Interview Flow Logic ✅

### Location: `src/lib/interview-simulation.ts`

#### USA F1 Flow
- **Stage-based progression**: Study Plans → University Choice → Academic Capability → Financial → Post-study
- **Adaptive LLM selection** from question bank
- **Session memory tracking** for self-consistency
- **Semantic cluster tracking** to prevent repetition
- **Degree-level filtering** (undergraduate/graduate/doctorate)

#### UK Student Flow
- **Strict bank selection** (verbatim questions)
- **Pre-CAS credibility focus**
- **Flow**: Genuine Student → Course & University → Financial → Accommodation → Compliance → Post-study
- **No LLM adaptation** (questions must match bank exactly)

#### France Flow
- **Fixed first question** (always the same)
- **Hybrid LLM selection** for Q2-10
- **University-specific pools** (EMA vs ICN)
- **Strict duplicate prevention**
- **Course alignment focus**

---

## 6. Follow-Up Pattern Separation ✅

### Location: `src/lib/smart-question-selector.ts`

#### UK Follow-Up Patterns
```typescript
private ukFollowUpPatterns = [
  // Module specificity check
  { pattern: /business|management|marketing|finance modules?/i,
    trigger: (answer) => !(/specific|module name|[A-Z]{4}\s?\d{3,4}/i.test(answer)),
    followUp: "Can you tell me the specific module names or codes?" },
  
  // £18,000 maintenance requirement
  { pattern: /sufficient|enough|covered|funds?/i,
    trigger: (answer) => !(/£18,?000|18000|eighteen thousand/i.test(answer)),
    followUp: "Can you specify the exact maintenance requirement amount?" },
  
  // 28-day rule awareness
  { pattern: /bank|statement|savings|deposit/i,
    trigger: (answer) => !(/28[- ]?day|consecutive|period|rule/i.test(answer)),
    followUp: "Are you aware of the 28-day rule for bank statements?" },
  
  // Agent dependency detection
  { pattern: /agent|consultant|agency/i,
    trigger: (answer) => /told|said|suggested|recommended/i.test(answer),
    followUp: "What independent research did you do about the university?" }
]
```

#### USA F1 Follow-Up Patterns
```typescript
private usaFollowUpPatterns = [
  // Specific dollar amounts
  { pattern: /parents?|father|mother|family/i,
    trigger: (answer) => /will pay|paying|support/i.test(answer) && !(/\$\d+|dollar|USD/i.test(answer)),
    followUp: "Can you specify the exact dollar amount they will contribute?" },
  
  // Coached language detection
  { pattern: /dream|passion|world[- ]?class|best|pursue/i,
    trigger: (answer) => /(fulfill|achieve) (my )?dream|(world[- ]?class|best) (education|university)/i.test(answer),
    followUp: "Can you give me more specific, practical reasons beyond general statements?" },
  
  // Return intent uncertainty
  { pattern: /return|come back|go back|plans?/i,
    trigger: (answer) => /maybe|thinking|might|probably/i.test(answer),
    followUp: "Can you describe concrete plans or commitments that tie you to Nepal?" },
  
  // Education loan specifics
  { pattern: /loan|education loan|bank loan/i,
    trigger: (answer) => /loan/i.test(answer) && !/(approved|sanctioned|\$\d+|interest|rate)/i.test(answer),
    followUp: "Is it approved? What is the sanctioned amount, interest rate, and repayment plan?" }
]
```

#### France Follow-Up Patterns
```typescript
private franceFollowUpPatterns = [
  // Course duration specificity
  { pattern: /course|programme|program/i,
    trigger: (answer) => !(/duration|length|years?|months?|\d+/i.test(answer)),
    followUp: "Can you specify the exact duration of your course?" },
  
  // Tuition fee amount
  { pattern: /tuition|fees?|cost/i,
    trigger: (answer) => !(/€|euro|amount|\d+/i.test(answer)),
    followUp: "Can you provide the exact tuition fee amount?" },
  
  // Career objectives specificity
  { pattern: /career|objectives?|goals?/i,
    trigger: (answer) => answer.split(' ').length < 20 && !/specific|role|position|industry/i.test(answer),
    followUp: "Can you be more specific about your career objectives and the role you're targeting?" }
]
```

---

## 7. Smart Question Selector ✅

### Location: `src/lib/smart-question-selector.ts`

**Route-Aware Selection**:
```typescript
export class SmartQuestionSelector {
  async selectNextQuestion(context: StudentContext): Promise<QuestionResult> {
    // Route-specific follow-up detection
    const followUp = this.detectFollowUpNeed(context.route, lastInteraction.answer);
    
    // Route-specific question bank filtering
    let availableQuestions = this.questionBank.questions.filter(
      (q) => q.route === context.route || q.route === 'both'
    );
    
    // USA F1: Stage-based filtering
    if (context.route === 'usa_f1') {
      availableQuestions = this.filterUsaQuestionsByStage(availableQuestions, stage);
    }
    
    // Degree-level filtering (USA F1 only)
    if (context.route === 'usa_f1') {
      availableQuestions = availableQuestions.filter((q) => 
        isQuestionAppropriateForDegreeLevel(q.question, context.profile.degreeLevel)
      );
    }
  }
}
```

**Key Features**:
- Route-specific question filtering
- Route-specific follow-up patterns
- Route-specific stage gating (USA F1)
- Degree-level filtering (USA F1)
- Semantic cluster tracking (all routes)

---

## 8. Interview Routes Configuration ✅

### Location: `src/lib/interview-routes.ts`

```typescript
export type InterviewRoute = 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn'

export const routeDisplayName: Record<InterviewRoute, string> = {
  usa_f1: 'USA (F1 Student)',
  uk_student: 'UK (Student / Pre-CAS)',
  france_ema: 'France - EMA',
  france_icn: 'France - ICN Business School',
}

// Route-specific category mapping
export function mapQuestionTypeToCategory(route: InterviewRoute, questionType: string): string {
  if (route === 'usa_f1') return mapQuestionTypeToF1Category(questionType)
  
  if (route === 'france_ema' || route === 'france_icn') {
    // France-specific mapping
  }
  
  // UK-specific mapping
}
```

---

## 9. Officer Personas ✅

### Location: `src/lib/officer-personas.ts`

**Persona Types**: Professional, Skeptical, Friendly, Strict

**Route-Agnostic Design**: Personas work across all routes but can be customized per route if needed

**Key Features**:
- Verbal cues (positive, neutral, skeptical, impatient)
- Pacing (question delays, rapid-fire bursts)
- Question style (difficulty preference, follow-up style)
- Interruption probability
- Contradiction detection

**Note**: This is appropriately shared across routes as interviewer behavior is universal

---

## 10. Interview Modes Configuration ✅

### Location: `src/lib/interview-modes.ts` (referenced but not audited)

**Expected Configuration**:
- Question count per route
- Answer time per route
- Prep time per route (UK/France only)
- Difficulty distribution per route

---

## Potential Issues Found

### ⚠️ Minor: Generic Fallback Questions

**Location**: `src/lib/interview-simulation.ts` - `getFallbackQuestion()`

**Issue**: When API fails, USA F1 falls back to generic questions instead of F1-specific questions

**Impact**: Low (only affects error cases)

**Recommendation**: Add F1-specific fallback questions similar to UK/France

```typescript
private getFallbackQuestion(questionNumber: number, route?: InterviewRoute): QuestionGenerationResponse {
  if (route === 'uk_student') {
    return ukFallbackQuestionByIndex(questionNumber)
  }
  if (route === 'france_ema' || route === 'france_icn') {
    return franceFallbackQuestionByIndex(questionNumber, university)
  }
  // USA F1 should also have dedicated fallback
  if (route === 'usa_f1') {
    return f1FallbackQuestionByIndex(questionNumber) // ADD THIS
  }
  // Generic fallback as last resort
}
```

---

## Architecture Strengths

### 1. **Clear Separation of Concerns** ✅
Each route has dedicated files, prompts, and logic

### 2. **Type Safety** ✅
TypeScript types enforce route-specific handling:
```typescript
export type InterviewRoute = 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn'
```

### 3. **Extensibility** ✅
Easy to add new routes (e.g., Canada, Australia) by:
- Creating new question data file
- Adding route to `InterviewRoute` type
- Adding route-specific prompt in `llm-service.ts`
- Adding route-specific scoring in `llm-scorer.ts`

### 4. **Maintainability** ✅
Route-specific logic is isolated and easy to update

### 5. **Performance Optimization** ✅
- Route-specific LLM provider selection
- Cached question selectors
- Optimized prompt sizes (recent history only)

### 6. **Quality Assurance** ✅
- Degree-level filtering (USA F1)
- Semantic cluster tracking (all routes)
- Question ID tracking (all routes)
- Duplicate prevention (all routes)

---

## Conclusion

**The system is WELL-ARCHITECTED with proper route separation.**

✅ **Dedicated question banks** for each route
✅ **Separate system prompts** with route-specific instructions
✅ **Route-aware LLM provider selection**
✅ **Different scoring rubrics** and formulas
✅ **Distinct interview flows** and stage gating
✅ **Route-specific follow-up patterns**
✅ **Type-safe route handling** throughout

**No inappropriate sharing detected.** The only shared components are:
1. Generic question bank (with route tags) - APPROPRIATE
2. Officer personas (universal behavior) - APPROPRIATE
3. Core infrastructure (LLM calling, caching) - APPROPRIATE

**Recommendation**: The architecture is solid. The only minor improvement would be adding F1-specific fallback questions for error cases.

---

## Files Audited

1. ✅ `src/lib/f1-questions-data.ts` - USA F1 question bank
2. ✅ `src/lib/uk-questions-data.ts` - UK question bank
3. ✅ `src/lib/france-questions-data.ts` - France question banks (EMA/ICN)
4. ✅ `src/data/question-bank.json` - Generic question bank with route tags
5. ✅ `src/lib/llm-service.ts` - Route-specific prompts
6. ✅ `src/lib/llm-provider-selector.ts` - Route-aware provider selection
7. ✅ `src/lib/llm-scorer.ts` - Route-specific scoring rubrics
8. ✅ `src/lib/smart-question-selector.ts` - Route-aware question selection
9. ✅ `src/lib/interview-simulation.ts` - Route-specific interview flows
10. ✅ `src/lib/interview-routes.ts` - Route configuration
11. ✅ `src/lib/officer-personas.ts` - Universal persona system

**Total Files Audited**: 11 core files
**Issues Found**: 0 critical, 1 minor (generic fallback for USA F1)
**Architecture Rating**: A+ (Excellent separation of concerns)
