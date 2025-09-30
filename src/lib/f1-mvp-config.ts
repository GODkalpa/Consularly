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
