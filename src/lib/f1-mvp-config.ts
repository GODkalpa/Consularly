/**
 * F1 MVP Unified Configuration
 * Single source of truth per MVP document section 8
 */

export const F1_MVP_SCORING_CONFIG = {
  /**
   * Per-answer scoring weights
   */
  weights: {
    content: 0.7,
    speech: 0.2,
    body: 0.1,
  },

  /**
   * Body language tracking
   */
  bodyEnabledDefault: true,
  bodyWeightWhenDisabled: 0, // Audio-only mode sets body weight to 0 without penalty

  /**
   * Content sub-metrics weights (sum to 1.0)
   */
  contentWeights: {
    relevance: 0.25,
    specificity: 0.25,
    selfConsistency: 0.25,
    plausibility: 0.25,
  },

  /**
   * Speech sub-metrics weights (sum to 1.0)
   */
  speechWeights: {
    fluency: 0.5,
    clarity: 0.3,
    tone: 0.2,
  },

  /**
   * Body sub-metrics weights (sum to 1.0)
   */
  bodyWeights: {
    posture: 0.45,
    expressions: 0.35,
    gestures: 0.20,
  },

  /**
   * Session roll-up bonuses and penalties
   */
  session: {
    bonuses: {
      brevity: 3, // +3 if avg answers are 1–2 sentences and ≤35s
      financeNumbers: 2, // +2 if finance answers include both total and numeric split
    },
    penalties: {
      majorContradictions: 5, // −5 if ≥2 major contradictions vs session memory
    },
  },

  /**
   * Outcome thresholds
   */
  thresholds: {
    green: 80, // ≥80: strong & consistent
    amber: 65, // 65–79: needs 2–3 concrete fixes
    // <65: red flags + targeted drills
  },

  /**
   * Timing settings (seconds)
   */
  timing: {
    perQuestionSoftCap: 40, // Soft 40s timer per question
    warnAt: 30, // Warning at 30s
    interruptAt: 30, // Officer interrupt at ~25–30s
    totalSessionCap: 240, // 4 minutes total (2–5 min range)
  },

  /**
   * Question flow settings
   */
  flow: {
    minQuestions: 5,
    maxQuestions: 10, // Cap total including follow-ups
    coreQuestions: 8, // Core question count
  },
} as const

/**
 * Calculate per-answer score using MVP formula
 */
export function calculateMVPAnswerScore(
  contentScore: number,
  speechScore: number,
  bodyScore: number,
  bodyEnabled: boolean = true
): number {
  const weights = F1_MVP_SCORING_CONFIG.weights
  
  if (!bodyEnabled) {
    // Audio-only mode: redistribute body weight to content
    const adjustedContentWeight = weights.content + weights.body
    return adjustedContentWeight * contentScore + weights.speech * speechScore
  }
  
  return (
    weights.content * contentScore +
    weights.speech * speechScore +
    weights.body * bodyScore
  )
}

/**
 * Determine outcome category based on overall score
 */
export function getOutcomeCategory(
  overallScore: number
): 'green' | 'amber' | 'red' {
  const { thresholds } = F1_MVP_SCORING_CONFIG
  
  if (overallScore >= thresholds.green) return 'green'
  if (overallScore >= thresholds.amber) return 'amber'
  return 'red'
}


/**
 * UK Student Visa Scoring Configuration
 * Balanced scoring with fairer thresholds and reduced penalties
 */
export const UK_SCORING_CONFIG = {
  /**
   * Per-answer scoring weights (same as F1)
   */
  weights: {
    content: 0.7,
    speech: 0.2,
    body: 0.1,
  },

  /**
   * UK Content sub-metrics weights (sum to 1.0)
   * All 7 dimensions included with balanced weights (none > 0.25)
   */
  contentWeights: {
    communication: 0.15,
    relevance: 0.15,
    specificity: 0.20,
    consistency: 0.15,
    courseAndUniversityFit: 0.15,
    financialRequirement: 0.10,
    complianceAndIntent: 0.10,
  },

  /**
   * UK Decision thresholds (more achievable than before)
   */
  thresholds: {
    accepted: 70,     // Reduced from 75 - achievable with strong performance
    borderline: 50,   // Reduced from 55 - fairer threshold
    // Below 50: rejected
  },

  /**
   * Scoring configuration
   * NOTE: LLM now scores on actual merit (0-100) without artificial caps
   * These values are kept for reference but LLM uses full range scoring
   */
  scoring: {
    maxPenaltyPerDimension: -40,  // Maximum penalty for any single issue
    baseline: 0,                   // No artificial baseline - score on merit
    // Reference benchmarks (LLM uses these as guidelines, not hard rules)
    benchmarks: {
      perfect: 95,                 // 95-100: Perfect answer with all details
      excellent: 85,               // 85-94: Excellent answer
      good: 75,                    // 75-84: Good answer
      acceptable: 65,              // 65-74: Acceptable answer
      needsWork: 50,               // 50-64: Needs improvement
    },
  },

  /**
   * ASR confidence handling
   */
  asrTolerance: {
    lowConfidenceThreshold: 0.7,   // Below this, reduce penalties
    penaltyReduction: 0.20,        // Reduce penalties by 20% for low ASR confidence
  },

  /**
   * Score consistency validation
   */
  consistency: {
    maxDiscrepancy: 10,            // Final score should be within 10 points of per-answer avg (for 75+ avg)
    warningThreshold: 15,          // Log warning if discrepancy exceeds this
    perAnswerWeight: 0.80,         // Weight per-answer average at 80%
    dimensionMinWeight: 0.20,      // Weight dimension minimums at 20%
  },
} as const

/**
 * Calculate UK content score using all 7 dimensions
 */
export function calculateUKContentScore(rubric: {
  communication: number;
  relevance: number;
  specificity: number;
  consistency: number;
  courseAndUniversityFit: number;
  financialRequirement: number;
  complianceAndIntent: number;
}): number {
  const weights = UK_SCORING_CONFIG.contentWeights;
  
  return (
    weights.communication * rubric.communication +
    weights.relevance * rubric.relevance +
    weights.specificity * rubric.specificity +
    weights.consistency * rubric.consistency +
    weights.courseAndUniversityFit * rubric.courseAndUniversityFit +
    weights.financialRequirement * rubric.financialRequirement +
    weights.complianceAndIntent * rubric.complianceAndIntent
  );
}

/**
 * Determine UK decision based on score and thresholds
 */
export function getUKDecision(
  overallScore: number,
  minDimensionScore?: number
): 'accepted' | 'borderline' | 'rejected' {
  const { thresholds, consistency } = UK_SCORING_CONFIG;
  
  // If dimension minimum is provided, use weighted calculation
  if (minDimensionScore !== undefined) {
    const weightedScore = 
      consistency.perAnswerWeight * overallScore + 
      consistency.dimensionMinWeight * minDimensionScore;
    
    if (weightedScore >= thresholds.accepted) return 'accepted';
    if (weightedScore >= thresholds.borderline) return 'borderline';
    return 'rejected';
  }
  
  // Simple threshold check
  if (overallScore >= thresholds.accepted) return 'accepted';
  if (overallScore >= thresholds.borderline) return 'borderline';
  return 'rejected';
}

/**
 * Check if score discrepancy warrants a warning
 */
export function checkScoreDiscrepancy(
  perAnswerAverage: number,
  finalScore: number
): { hasWarning: boolean; discrepancy: number; message?: string } {
  const discrepancy = Math.abs(perAnswerAverage - finalScore);
  const { consistency } = UK_SCORING_CONFIG;
  
  if (discrepancy > consistency.warningThreshold) {
    return {
      hasWarning: true,
      discrepancy,
      message: `Score discrepancy of ${discrepancy} points exceeds warning threshold of ${consistency.warningThreshold}. Per-answer avg: ${Math.round(perAnswerAverage)}, Final: ${Math.round(finalScore)}`
    };
  }
  
  // For high-performing candidates (75+), enforce stricter consistency
  if (perAnswerAverage >= 75 && discrepancy > consistency.maxDiscrepancy) {
    return {
      hasWarning: true,
      discrepancy,
      message: `High-performer score discrepancy: ${discrepancy} points exceeds max of ${consistency.maxDiscrepancy} for 75+ average`
    };
  }
  
  return { hasWarning: false, discrepancy };
}
