/**
 * UK Score Validator Module
 * 
 * Validates and corrects LLM scoring responses for UK interviews.
 * Addresses the zero-dimension pattern where domain dimensions return 0
 * for factual questions, tanking otherwise good scores.
 */

// ============================================================================
// Interfaces and Types
// ============================================================================

export interface UKRubricScores {
  communication: number;
  relevance: number;
  specificity: number;
  consistency: number;
  courseAndUniversityFit: number;
  financialRequirement: number;
  complianceAndIntent: number;
}

export interface ScoreValidationResult {
  isValid: boolean;
  hasZeroDimensionPattern: boolean;
  originalContentScore: number;
  correctedContentScore: number;
  excludedDimensions: string[];
  warnings: string[];
}

export interface ScoringAnomaly {
  questionIndex: number;
  score: number;
  wordCount: number;
  anomalyType: 'zero_dimension_pattern' | 'score_floor_applied' | 'consistency_correction' | 'asr_boost';
  originalScore?: number;
  correctedScore: number;
}

// ============================================================================
// Configuration
// ============================================================================

export const UK_SCORE_VALIDATION_CONFIG = {
  zeroDimensionPattern: {
    domainDimensions: ['courseAndUniversityFit', 'financialRequirement', 'complianceAndIntent'] as const,
    coreDimensions: ['communication', 'relevance', 'specificity', 'consistency'] as const,
    coreAverageThreshold: 60,  // Core avg must be >= 60 to trigger pattern detection
  },
  scoreFloors: {
    minimumWithAnswer: 30,     // Floor when answer has > 10 words
    minimumCoreHealthy: 50,    // Floor when core dimensions avg >= 70
  },
  consistencyThreshold: 30,    // Max allowed difference between LLM score and formula
  asrBoost: {
    confidenceThreshold: 0.5,
    scoreThreshold: 40,
    boostPercentage: 0.25,
  },
} as const;

// Export dimension arrays for external use
export const DOMAIN_DIMENSIONS = UK_SCORE_VALIDATION_CONFIG.zeroDimensionPattern.domainDimensions;
export const CORE_DIMENSIONS = UK_SCORE_VALIDATION_CONFIG.zeroDimensionPattern.coreDimensions;


// ============================================================================
// Core Functions
// ============================================================================

/**
 * Detects the zero-dimension pattern where domain dimensions are 0
 * but core dimensions are healthy (>= 60 average).
 * 
 * This pattern indicates the question doesn't relate to domain-specific
 * criteria (e.g., factual questions like "Which visa centre will you use?").
 * 
 * @param rubric - The UK rubric scores from LLM
 * @returns true if zero-dimension pattern is detected
 */
export function detectZeroDimensionPattern(rubric: UKRubricScores): boolean {
  const { domainDimensions, coreDimensions, coreAverageThreshold } = UK_SCORE_VALIDATION_CONFIG.zeroDimensionPattern;
  
  // Check if ALL domain dimensions are 0
  const allDomainZero = domainDimensions.every(dim => rubric[dim] === 0);
  
  if (!allDomainZero) {
    return false;
  }
  
  // Calculate core dimensions average
  const coreSum = coreDimensions.reduce((sum, dim) => sum + rubric[dim], 0);
  const coreAverage = coreSum / coreDimensions.length;
  
  // Pattern detected if core average is healthy (>= threshold)
  return coreAverage >= coreAverageThreshold;
}

/**
 * Calculates content score using only the four core dimensions.
 * Used when zero-dimension pattern is detected.
 * 
 * @param rubric - The UK rubric scores from LLM
 * @returns The average of core dimensions (equal weights: 0.25 each)
 */
export function calculateCoreOnlyScore(rubric: UKRubricScores): number {
  const { coreDimensions } = UK_SCORE_VALIDATION_CONFIG.zeroDimensionPattern;
  
  const coreSum = coreDimensions.reduce((sum, dim) => sum + rubric[dim], 0);
  return coreSum / coreDimensions.length;
}

/**
 * Calculates the weighted formula result for UK content score.
 * Uses the standard UK weights from f1-mvp-config.
 * 
 * @param rubric - The UK rubric scores from LLM
 * @returns The weighted content score
 */
export function calculateWeightedScore(rubric: UKRubricScores): number {
  // Standard UK weights (from UK_SCORING_CONFIG.contentWeights)
  const weights = {
    communication: 0.15,
    relevance: 0.15,
    specificity: 0.20,
    consistency: 0.15,
    courseAndUniversityFit: 0.15,
    financialRequirement: 0.10,
    complianceAndIntent: 0.10,
  };
  
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
 * Validates and corrects LLM scoring response for UK interviews.
 * 
 * Handles multiple correction scenarios:
 * 1. Zero-dimension pattern: Recalculates using core dimensions only
 * 2. Zero contentScore with healthy core: Overrides with core average
 * 3. Floor scores based on answer word count
 * 4. Consistency check between LLM score and formula result
 * 
 * @param rubric - The UK rubric scores from LLM
 * @param llmContentScore - The contentScore returned by LLM
 * @param answerWordCount - Number of words in the answer
 * @returns Validation result with corrections and warnings
 */
export function validateAndCorrectScore(
  rubric: UKRubricScores,
  llmContentScore: number,
  answerWordCount: number
): ScoreValidationResult {
  const warnings: string[] = [];
  const excludedDimensions: string[] = [];
  let correctedContentScore = llmContentScore;
  let isValid = true;
  
  // Calculate core dimensions average
  const coreAverage = calculateCoreOnlyScore(rubric);
  
  // Check for zero-dimension pattern
  const hasZeroDimensionPattern = detectZeroDimensionPattern(rubric);
  
  if (hasZeroDimensionPattern) {
    isValid = false;
    excludedDimensions.push(...DOMAIN_DIMENSIONS);
    correctedContentScore = coreAverage;
    warnings.push(
      `Zero-dimension pattern detected: domain dimensions are 0 but core avg is ${coreAverage.toFixed(1)}. ` +
      `Recalculating with core dimensions only.`
    );
    console.log('🔧 [Score Validator] Zero-dimension pattern detected:', {
      domainScores: {
        courseAndUniversityFit: rubric.courseAndUniversityFit,
        financialRequirement: rubric.financialRequirement,
        complianceAndIntent: rubric.complianceAndIntent,
      },
      coreAverage,
      originalScore: llmContentScore,
      correctedScore: correctedContentScore,
    });
  }
  
  // Check for contentScore=0 with healthy core dimensions (Requirement 1.4)
  if (llmContentScore === 0 && coreAverage >= UK_SCORE_VALIDATION_CONFIG.zeroDimensionPattern.coreAverageThreshold) {
    isValid = false;
    correctedContentScore = coreAverage;
    warnings.push(
      `LLM returned contentScore=0 but core dimensions avg is ${coreAverage.toFixed(1)}. ` +
      `Overriding with core average.`
    );
    console.log('🔧 [Score Validator] Zero contentScore override:', {
      originalScore: 0,
      coreAverage,
      correctedScore: correctedContentScore,
    });
  }
  
  // Check for content score floor with healthy core (Requirement 4.1)
  // If core dimensions average >= 70, content score must be at least 50
  if (coreAverage >= 70 && correctedContentScore < UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumCoreHealthy) {
    isValid = false;
    const previousScore = correctedContentScore;
    correctedContentScore = UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumCoreHealthy;
    warnings.push(
      `Core dimensions avg is ${coreAverage.toFixed(1)} (>=70) but content score was ${previousScore}. ` +
      `Applying floor of ${UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumCoreHealthy}.`
    );
    console.log('🔧 [Score Validator] Healthy core floor applied:', {
      coreAverage,
      previousScore,
      floorApplied: UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumCoreHealthy,
    });
  }
  
  // Check for minimum floor with answer present (Requirement 5.2)
  // If answer has > 10 words but contentScore is 0, apply minimum floor
  if (answerWordCount > 10 && correctedContentScore < UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumWithAnswer) {
    isValid = false;
    const previousScore = correctedContentScore;
    correctedContentScore = UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumWithAnswer;
    warnings.push(
      `Answer has ${answerWordCount} words but content score was ${previousScore}. ` +
      `Applying minimum floor of ${UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumWithAnswer}.`
    );
    console.log('🔧 [Score Validator] Minimum floor applied:', {
      wordCount: answerWordCount,
      previousScore,
      floorApplied: UK_SCORE_VALIDATION_CONFIG.scoreFloors.minimumWithAnswer,
    });
  }
  
  // Check consistency between LLM score and formula result (Requirement 4.2)
  const formulaScore = hasZeroDimensionPattern ? coreAverage : calculateWeightedScore(rubric);
  const scoreDifference = Math.abs(llmContentScore - formulaScore);
  
  if (scoreDifference > UK_SCORE_VALIDATION_CONFIG.consistencyThreshold && !hasZeroDimensionPattern) {
    isValid = false;
    // Use formula-calculated score if difference is too large
    if (correctedContentScore === llmContentScore) {
      correctedContentScore = formulaScore;
    }
    warnings.push(
      `LLM contentScore (${llmContentScore}) differs from formula result (${formulaScore.toFixed(1)}) ` +
      `by ${scoreDifference.toFixed(1)} points (threshold: ${UK_SCORE_VALIDATION_CONFIG.consistencyThreshold}). ` +
      `Using formula-calculated score.`
    );
    console.warn('⚠️ [Score Validator] Consistency correction:', {
      llmScore: llmContentScore,
      formulaScore,
      difference: scoreDifference,
      correctedScore: correctedContentScore,
    });
  }
  
  return {
    isValid,
    hasZeroDimensionPattern,
    originalContentScore: llmContentScore,
    correctedContentScore: Math.round(correctedContentScore),
    excludedDimensions,
    warnings,
  };
}


// ============================================================================
// Weight Redistribution
// ============================================================================

/**
 * Standard UK content weights (from UK_SCORING_CONFIG.contentWeights)
 */
export const UK_CONTENT_WEIGHTS: Record<keyof UKRubricScores, number> = {
  communication: 0.15,
  relevance: 0.15,
  specificity: 0.20,
  consistency: 0.15,
  courseAndUniversityFit: 0.15,
  financialRequirement: 0.10,
  complianceAndIntent: 0.10,
};

/**
 * Redistributes weights when dimensions are excluded.
 * Ensures weights sum to 1.0 by proportionally redistributing
 * excluded dimension weights to remaining dimensions.
 * 
 * @param excludedDimensions - Array of dimension names to exclude
 * @returns New weights object with redistributed values
 */
export function redistributeWeights(
  excludedDimensions: string[]
): Record<keyof UKRubricScores, number> {
  const allDimensions = Object.keys(UK_CONTENT_WEIGHTS) as (keyof UKRubricScores)[];
  
  // Calculate total weight of excluded dimensions
  const excludedWeight = excludedDimensions.reduce((sum, dim) => {
    const key = dim as keyof UKRubricScores;
    return sum + (UK_CONTENT_WEIGHTS[key] || 0);
  }, 0);
  
  // Calculate total weight of remaining dimensions
  const remainingDimensions = allDimensions.filter(dim => !excludedDimensions.includes(dim));
  const remainingWeight = 1 - excludedWeight;
  
  // If no remaining dimensions, return original weights (edge case)
  if (remainingDimensions.length === 0 || remainingWeight <= 0) {
    return { ...UK_CONTENT_WEIGHTS };
  }
  
  // Calculate redistribution factor
  const redistributionFactor = 1 / remainingWeight;
  
  // Build new weights object
  const newWeights: Record<keyof UKRubricScores, number> = {
    communication: 0,
    relevance: 0,
    specificity: 0,
    consistency: 0,
    courseAndUniversityFit: 0,
    financialRequirement: 0,
    complianceAndIntent: 0,
  };
  
  for (const dim of allDimensions) {
    if (excludedDimensions.includes(dim)) {
      newWeights[dim] = 0;
    } else {
      newWeights[dim] = UK_CONTENT_WEIGHTS[dim] * redistributionFactor;
    }
  }
  
  return newWeights;
}

/**
 * Calculates content score with redistributed weights.
 * Used when some dimensions are excluded (e.g., zero-dimension pattern).
 * 
 * @param rubric - The UK rubric scores
 * @param excludedDimensions - Dimensions to exclude from calculation
 * @returns The weighted content score with redistributed weights
 */
export function calculateScoreWithRedistribution(
  rubric: UKRubricScores,
  excludedDimensions: string[]
): number {
  const weights = redistributeWeights(excludedDimensions);
  
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

// ============================================================================
// Anomaly Detection
// ============================================================================

/**
 * Detects if a score represents a scoring anomaly.
 * An anomaly is when score < 40 but answer has > 10 words.
 * 
 * @param score - The per-answer score
 * @param wordCount - Number of words in the answer
 * @returns true if this is a scoring anomaly
 */
export function detectScoringAnomaly(score: number, wordCount: number): boolean {
  return score < 40 && wordCount > 10;
}

/**
 * Creates a scoring anomaly record.
 * 
 * @param questionIndex - Index of the question
 * @param score - The score that was assigned
 * @param wordCount - Number of words in the answer
 * @param anomalyType - Type of anomaly detected
 * @param originalScore - Original score before correction (if applicable)
 * @param correctedScore - Score after correction
 * @returns ScoringAnomaly object
 */
export function createScoringAnomaly(
  questionIndex: number,
  score: number,
  wordCount: number,
  anomalyType: ScoringAnomaly['anomalyType'],
  originalScore: number | undefined,
  correctedScore: number
): ScoringAnomaly {
  return {
    questionIndex,
    score,
    wordCount,
    anomalyType,
    originalScore,
    correctedScore,
  };
}

// ============================================================================
// ASR Boost
// ============================================================================

/**
 * Applies ASR low confidence boost to content score.
 * When ASR confidence is below threshold AND content score is below threshold,
 * boost the score by the configured percentage.
 * 
 * @param contentScore - The current content score
 * @param asrConfidence - ASR confidence value (0-1)
 * @returns Object with boosted score and whether boost was applied
 */
export function applyASRBoost(
  contentScore: number,
  asrConfidence: number
): { score: number; boosted: boolean; boostAmount: number } {
  const { confidenceThreshold, scoreThreshold, boostPercentage } = UK_SCORE_VALIDATION_CONFIG.asrBoost;
  
  if (asrConfidence < confidenceThreshold && contentScore < scoreThreshold) {
    const boostAmount = contentScore * boostPercentage;
    const boostedScore = Math.round(contentScore + boostAmount);
    
    console.log('🎤 [ASR Boost] Applied:', {
      originalScore: contentScore,
      asrConfidence,
      boostPercentage: `${boostPercentage * 100}%`,
      boostAmount,
      boostedScore,
    });
    
    return {
      score: boostedScore,
      boosted: true,
      boostAmount,
    };
  }
  
  return {
    score: contentScore,
    boosted: false,
    boostAmount: 0,
  };
}

// ============================================================================
// All-Zero Rubric Detection
// ============================================================================

/**
 * Detects if all rubric dimensions are zero.
 * This indicates a complete scoring failure that requires heuristic fallback.
 * 
 * @param rubric - The UK rubric scores
 * @returns true if all dimensions are 0
 */
export function detectAllZeroRubric(rubric: UKRubricScores): boolean {
  return (
    rubric.communication === 0 &&
    rubric.relevance === 0 &&
    rubric.specificity === 0 &&
    rubric.consistency === 0 &&
    rubric.courseAndUniversityFit === 0 &&
    rubric.financialRequirement === 0 &&
    rubric.complianceAndIntent === 0
  );
}
