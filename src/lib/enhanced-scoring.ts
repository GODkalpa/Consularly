/**
 * Enhanced 12-Dimension Scoring System
 * Provides detailed, actionable feedback across content, delivery, and non-verbal dimensions
 */

export interface EnhancedScoreDimensions {
  // Content Dimensions (5)
  clarity: number;          // 0-100: Is the answer understandable?
  specificity: number;      // 0-100: Concrete details (names, numbers, dates)
  relevance: number;        // 0-100: Directly answers the question
  depth: number;            // 0-100: Goes beyond surface-level
  consistency: number;      // 0-100: Aligns with previous answers
  
  // Delivery Dimensions (4)
  fluency: number;          // 0-100: Words per minute, flow
  confidence: number;       // 0-100: ASR confidence, vocal strength
  pace: number;             // 0-100: Not too fast, not too slow
  articulation: number;     // 0-100: Filler words, clarity
  
  // Non-Verbal Dimensions (3)
  posture: number;          // 0-100: Upright, engaged
  eyeContact: number;       // 0-100: Looking at camera
  composure: number;        // 0-100: Calm under pressure
}

export interface DimensionFeedback {
  score: number;
  category: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  feedback: string;
  examples?: string[];
  improvementTip?: string;
}

export interface DetailedScoreReport {
  overall: number; // 0-100
  dimensions: EnhancedScoreDimensions;
  dimensionFeedback: Record<keyof EnhancedScoreDimensions, DimensionFeedback>;
  categoryScores: {
    content: number;    // Average of 5 content dimensions
    delivery: number;   // Average of 4 delivery dimensions
    nonVerbal: number;  // Average of 3 non-verbal dimensions
  };
  strengths: Array<{ dimension: string; score: number; feedback: string }>;
  weaknesses: Array<{ dimension: string; score: number; feedback: string }>;
  prioritizedImprovements: string[]; // Top 3 actionable improvements
}

// ===== SCORING WEIGHTS =====

export const DIMENSION_WEIGHTS = {
  // Content dimensions (60% total)
  clarity: 0.12,        // 12%
  specificity: 0.13,    // 13%
  relevance: 0.13,      // 13%
  depth: 0.11,          // 11%
  consistency: 0.11,    // 11%
  
  // Delivery dimensions (25% total)
  fluency: 0.07,        // 7%
  confidence: 0.07,     // 7%
  pace: 0.05,           // 5%
  articulation: 0.06,   // 6%
  
  // Non-verbal dimensions (15% total)
  posture: 0.05,        // 5%
  eyeContact: 0.05,     // 5%
  composure: 0.05,      // 5%
};

// ===== SCORING FUNCTIONS =====

/**
 * Calculate clarity score based on answer structure and coherence
 */
export function calculateClarityScore(
  answer: string,
  llmContentScore?: number
): number {
  const wordCount = answer.split(/\s+/).length;
  
  // Too short answers are unclear
  if (wordCount < 10) return 20;
  
  // Check for clear structure
  let score = llmContentScore || 50; // Start with LLM score if available
  
  // Bonus for complete sentences
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 2) score += 10;
  
  // Penalty for excessive filler words
  const fillerCount = (answer.match(/\b(um|uh|like|you know|basically|actually)\b/gi) || []).length;
  const fillerRate = fillerCount / wordCount;
  if (fillerRate > 0.1) score -= 20;
  else if (fillerRate > 0.05) score -= 10;
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate specificity score based on concrete details
 */
export function calculateSpecificityScore(answer: string): number {
  let score = 50;
  
  // Check for specific details
  const hasNumbers = /\d+/.test(answer);
  const hasDollarAmount = /\$\s*\d+|\d+\s*(dollar|USD)/i.test(answer);
  const hasNames = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(answer); // Proper names
  const hasPercentage = /\d+\s*%/.test(answer);
  const hasDate = /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|20\d{2})\b/i.test(answer);
  
  // Award points for specificity
  if (hasNumbers) score += 15;
  if (hasDollarAmount) score += 15;
  if (hasNames) score += 10;
  if (hasPercentage) score += 5;
  if (hasDate) score += 5;
  
  // Penalty for vague language
  const vaguePatterns = /(maybe|probably|i think|i guess|kind of|sort of|around|approximately)/gi;
  const vagueMatches = (answer.match(vaguePatterns) || []).length;
  if (vagueMatches > 2) score -= 15;
  else if (vagueMatches > 0) score -= 5;
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate relevance score (how well answer addresses the question)
 */
export function calculateRelevanceScore(
  question: string,
  answer: string,
  llmRelevanceScore?: number
): number {
  if (llmRelevanceScore !== undefined) {
    return llmRelevanceScore; // Trust LLM if available
  }
  
  // Extract key words from question
  const questionWords = question.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4 && !['what', 'where', 'when', 'which', 'would', 'could', 'should'].includes(w));
  
  const answerLower = answer.toLowerCase();
  
  // Check how many question keywords appear in answer
  const matchCount = questionWords.filter(w => answerLower.includes(w)).length;
  const matchRate = questionWords.length > 0 ? matchCount / questionWords.length : 0.5;
  
  const baseScore = matchRate * 100;
  
  // Penalty for very short answers
  if (answer.split(/\s+/).length < 15) return Math.min(baseScore, 60);
  
  return Math.min(Math.max(baseScore, 30), 100);
}

/**
 * Calculate depth score (goes beyond surface-level)
 */
export function calculateDepthScore(answer: string, category?: string): number {
  const wordCount = answer.split(/\s+/).length;
  
  // Depth correlates with word count (to a point)
  let score = 40;
  if (wordCount >= 30) score += 20;
  if (wordCount >= 50) score += 20;
  if (wordCount >= 80) score += 10;
  if (wordCount > 120) score -= 10; // Too long = rambling
  
  // Check for depth indicators
  const hasExamples = /(for example|such as|like|specifically)/i.test(answer);
  const hasReasoning = /(because|since|due to|reason|therefore)/i.test(answer);
  const hasComparison = /(compared to|versus|rather than|instead of)/i.test(answer);
  const hasContext = /(background|experience|previously|history)/i.test(answer);
  
  if (hasExamples) score += 10;
  if (hasReasoning) score += 10;
  if (hasComparison) score += 5;
  if (hasContext) score += 5;
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate consistency score (aligns with previous answers)
 */
export function calculateConsistencyScore(
  currentAnswer: string,
  previousAnswers: string[],
  sessionMemory?: Record<string, any>
): number {
  // Default to good consistency if no previous context
  if (!previousAnswers || previousAnswers.length === 0) return 85;
  
  let score = 85; // Start optimistic
  
  // Check for obvious contradictions
  const allPreviousText = previousAnswers.join(' ').toLowerCase();
  const currentLower = currentAnswer.toLowerCase();
  
  // Look for numerical contradictions (different dollar amounts, years, etc.)
  const currentNumbers = Array.from(currentAnswer.matchAll(/\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)/g))
    .map(m => parseFloat(m[1].replace(/,/g, '')));
  const previousNumbers = Array.from(allPreviousText.matchAll(/\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)/g))
    .map(m => parseFloat(m[1].replace(/,/g, '')));
  
  // If same topic (financial, timeline) but different numbers = potential inconsistency
  if (currentNumbers.length > 0 && previousNumbers.length > 0) {
    const hasMatchingNumber = currentNumbers.some(cn => 
      previousNumbers.some(pn => Math.abs(cn - pn) / Math.max(cn, pn) < 0.1)
    );
    if (!hasMatchingNumber && currentNumbers[0] > 1000) {
      score -= 20; // Different major numbers is suspicious
    }
  }
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate fluency score (words per minute, flow)
 */
export function calculateFluencyScore(
  wordCount: number,
  durationSeconds: number
): number {
  if (durationSeconds === 0) return 50;
  
  const wpm = (wordCount / durationSeconds) * 60;
  
  // Optimal range: 120-160 WPM
  if (wpm >= 120 && wpm <= 160) return 90;
  if (wpm >= 100 && wpm <= 180) return 75;
  if (wpm >= 80 && wpm <= 200) return 60;
  if (wpm < 80) return Math.max(40, wpm / 2); // Too slow
  
  // Too fast (> 200 WPM)
  return Math.max(30, 100 - (wpm - 200) / 2);
}

/**
 * Calculate confidence score from ASR confidence
 */
export function calculateConfidenceScore(asrConfidence?: number): number {
  if (asrConfidence === undefined || asrConfidence === null) return 70; // Assume reasonable
  
  // ASR confidence is typically 0-1, convert to 0-100
  const confidence = asrConfidence > 1 ? asrConfidence : asrConfidence * 100;
  
  // High ASR confidence = clear speech = confident delivery
  return Math.min(Math.max(confidence, 30), 100);
}

/**
 * Calculate pace score (not too fast, not too slow)
 */
export function calculatePaceScore(wpm: number): number {
  // Ideal: 120-160 WPM
  if (wpm >= 120 && wpm <= 160) return 95;
  if (wpm >= 100 && wpm <= 180) return 80;
  if (wpm >= 80 && wpm <= 200) return 65;
  if (wpm < 60) return 40; // Too slow
  if (wpm > 220) return 35; // Too fast
  
  // Gradual penalties
  if (wpm < 80) return 50 + (wpm - 60) / 2;
  if (wpm > 200) return 65 - (wpm - 200) / 4;
  
  return 70;
}

/**
 * Calculate articulation score (filler words, clarity)
 */
export function calculateArticulationScore(
  answer: string,
  asrConfidence?: number
): number {
  const words = answer.split(/\s+/);
  const wordCount = words.length;
  
  // Count filler words
  const fillers = (answer.match(/\b(um|uh|like|you know|basically|actually|literally|kind of|sort of)\b/gi) || []);
  const fillerCount = fillers.length;
  const fillerRate = fillerCount / Math.max(wordCount, 1);
  
  // Base score from ASR confidence (clear speech)
  let score = asrConfidence ? asrConfidence * 100 : 70;
  
  // Penalize filler words
  if (fillerRate < 0.03) score += 10; // Very clean
  else if (fillerRate < 0.05) score += 0; // Acceptable
  else if (fillerRate < 0.10) score -= 15;
  else score -= 30; // Excessive fillers
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate posture score from body language data
 */
export function calculatePostureScore(bodyLanguageScore?: number): number {
  if (bodyLanguageScore === undefined || bodyLanguageScore === null) return 70;
  
  // Body language score is typically 0-100
  // Good posture contributes significantly to overall body language
  return Math.min(Math.max(bodyLanguageScore, 30), 100);
}

/**
 * Calculate eye contact score from body language data
 */
export function calculateEyeContactScore(bodyLanguageScore?: number): number {
  if (bodyLanguageScore === undefined || bodyLanguageScore === null) return 70;
  
  // Eye contact is a major component of body language score
  return Math.min(Math.max(bodyLanguageScore, 30), 100);
}

/**
 * Calculate composure score (calm under pressure)
 */
export function calculateComposureScore(
  bodyLanguageScore?: number,
  fillerRate?: number
): number {
  let score = 75; // Default to reasonable composure
  
  // Body language contributes
  if (bodyLanguageScore !== undefined) {
    score = bodyLanguageScore;
  }
  
  // High filler rate indicates nervousness
  if (fillerRate !== undefined) {
    if (fillerRate > 0.10) score -= 20;
    else if (fillerRate > 0.05) score -= 10;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate all 12 dimensions for an answer
 */
export function calculateEnhancedScores(params: {
  question: string;
  answer: string;
  previousAnswers?: string[];
  duration?: number; // seconds
  asrConfidence?: number;
  bodyLanguageScore?: number;
  llmContentScore?: number;
  llmRelevanceScore?: number;
  sessionMemory?: Record<string, any>;
  category?: string;
}): EnhancedScoreDimensions {
  const {
    question,
    answer,
    previousAnswers = [],
    duration = 30,
    asrConfidence,
    bodyLanguageScore,
    llmContentScore,
    llmRelevanceScore,
    sessionMemory,
    category,
  } = params;
  
  const wordCount = answer.split(/\s+/).length;
  const wpm = duration > 0 ? (wordCount / duration) * 60 : 120;
  const fillerCount = (answer.match(/\b(um|uh|like|you know|basically|actually)\b/gi) || []).length;
  const fillerRate = fillerCount / Math.max(wordCount, 1);
  
  return {
    // Content dimensions
    clarity: calculateClarityScore(answer, llmContentScore),
    specificity: calculateSpecificityScore(answer),
    relevance: calculateRelevanceScore(question, answer, llmRelevanceScore),
    depth: calculateDepthScore(answer, category),
    consistency: calculateConsistencyScore(answer, previousAnswers, sessionMemory),
    
    // Delivery dimensions
    fluency: calculateFluencyScore(wordCount, duration),
    confidence: calculateConfidenceScore(asrConfidence),
    pace: calculatePaceScore(wpm),
    articulation: calculateArticulationScore(answer, asrConfidence),
    
    // Non-verbal dimensions
    posture: calculatePostureScore(bodyLanguageScore),
    eyeContact: calculateEyeContactScore(bodyLanguageScore),
    composure: calculateComposureScore(bodyLanguageScore, fillerRate),
  };
}

/**
 * Calculate overall score from 12 dimensions using weights
 */
export function calculateWeightedOverallScore(dimensions: EnhancedScoreDimensions): number {
  let weightedSum = 0;
  
  for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const score = dimensions[dimension as keyof EnhancedScoreDimensions];
    weightedSum += score * weight;
  }
  
  return Math.round(weightedSum);
}

/**
 * Generate detailed feedback for each dimension
 */
export function generateDimensionFeedback(
  dimension: keyof EnhancedScoreDimensions,
  score: number
): DimensionFeedback {
  const category: DimensionFeedback['category'] = 
    score >= 85 ? 'excellent' :
    score >= 70 ? 'good' :
    score >= 50 ? 'needs_improvement' : 'poor';
  
  const feedbackMap: Record<keyof EnhancedScoreDimensions, Record<DimensionFeedback['category'], string>> = {
    clarity: {
      excellent: 'Your answer was crystal clear and well-structured.',
      good: 'Your answer was generally clear but could be more concise.',
      needs_improvement: 'Your answer lacked clear structure. Organize thoughts before speaking.',
      poor: 'Your answer was confusing and hard to follow.',
    },
    specificity: {
      excellent: 'Excellent use of specific details, numbers, and examples.',
      good: 'Good specificity, but a few more concrete details would strengthen your answer.',
      needs_improvement: 'Your answer was too general. Include specific numbers, names, and dates.',
      poor: 'Answer was extremely vague. Always provide concrete details.',
    },
    relevance: {
      excellent: 'You directly answered the question with perfect relevance.',
      good: 'Your answer was relevant but included some tangential information.',
      needs_improvement: 'Your answer partially addressed the question but went off-topic.',
      poor: 'Your answer did not address the question asked.',
    },
    depth: {
      excellent: 'You provided comprehensive, multi-layered answers with context and examples.',
      good: 'Good depth, but could elaborate more on key points.',
      needs_improvement: 'Your answers were surface-level. Go deeper with reasoning and examples.',
      poor: 'Answers were too shallow. Provide more substance and explanation.',
    },
    consistency: {
      excellent: 'All your answers were perfectly consistent with each other.',
      good: 'Generally consistent, with minor variations.',
      needs_improvement: 'Some inconsistencies detected. Ensure all answers align.',
      poor: 'Major contradictions found. Be truthful and remember what you said.',
    },
    fluency: {
      excellent: 'Perfect speaking pace with natural flow.',
      good: 'Good fluency with occasional minor hesitations.',
      needs_improvement: 'Speaking was somewhat choppy. Practice for smoother delivery.',
      poor: 'Speech was very hesitant and difficult to follow.',
    },
    confidence: {
      excellent: 'You spoke with strong, clear confidence throughout.',
      good: 'Generally confident, with a few moments of uncertainty.',
      needs_improvement: 'Voice lacked confidence. Speak louder and more assertively.',
      poor: 'Very weak vocal confidence. Practice speaking more assertively.',
    },
    pace: {
      excellent: 'Perfect speaking pace - neither too fast nor too slow.',
      good: 'Good pace, with occasional speed variations.',
      needs_improvement: 'Speaking too fast/slow. Aim for 120-160 words per minute.',
      poor: 'Pace was extremely poor. Significantly adjust your speaking speed.',
    },
    articulation: {
      excellent: 'Excellent articulation with minimal filler words.',
      good: 'Good articulation, but reduce filler words (um, uh, like).',
      needs_improvement: 'Too many filler words. Pause instead of saying "um."',
      poor: 'Excessive filler words made speech hard to understand.',
    },
    posture: {
      excellent: 'Maintained upright, engaged posture throughout.',
      good: 'Generally good posture with minor slumping.',
      needs_improvement: 'Posture needs improvement. Sit upright and face camera.',
      poor: 'Poor posture throughout. Maintain professional stance.',
    },
    eyeContact: {
      excellent: 'Maintained strong eye contact with camera throughout.',
      good: 'Good eye contact, with occasional looking away.',
      needs_improvement: 'Limited eye contact. Look directly at camera more.',
      poor: 'Very poor eye contact. Practice looking at camera consistently.',
    },
    composure: {
      excellent: 'Remained calm and composed under pressure.',
      good: 'Generally composed, with minor nervousness.',
      needs_improvement: 'Showed signs of stress. Practice relaxation techniques.',
      poor: 'Appeared very nervous. Work on managing interview anxiety.',
    },
  };
  
  return {
    score,
    category,
    feedback: feedbackMap[dimension][category],
  };
}

/**
 * Generate complete detailed score report
 */
export function generateDetailedScoreReport(
  dimensions: EnhancedScoreDimensions
): DetailedScoreReport {
  const overall = calculateWeightedOverallScore(dimensions);
  
  // Calculate category averages
  const contentDimensions = ['clarity', 'specificity', 'relevance', 'depth', 'consistency'] as const;
  const deliveryDimensions = ['fluency', 'confidence', 'pace', 'articulation'] as const;
  const nonVerbalDimensions = ['posture', 'eyeContact', 'composure'] as const;
  
  const contentScore = Math.round(
    contentDimensions.reduce((sum, dim) => sum + dimensions[dim], 0) / contentDimensions.length
  );
  
  const deliveryScore = Math.round(
    deliveryDimensions.reduce((sum, dim) => sum + dimensions[dim], 0) / deliveryDimensions.length
  );
  
  const nonVerbalScore = Math.round(
    nonVerbalDimensions.reduce((sum, dim) => sum + dimensions[dim], 0) / nonVerbalDimensions.length
  );
  
  // Generate feedback for each dimension
  const dimensionFeedback: Record<keyof EnhancedScoreDimensions, DimensionFeedback> = {} as any;
  for (const [dimension, score] of Object.entries(dimensions)) {
    dimensionFeedback[dimension as keyof EnhancedScoreDimensions] = 
      generateDimensionFeedback(dimension as keyof EnhancedScoreDimensions, score);
  }
  
  // Identify strengths and weaknesses
  const sortedDimensions = Object.entries(dimensions)
    .sort(([, a], [, b]) => b - a);
  
  const strengths = sortedDimensions
    .slice(0, 3)
    .filter(([, score]) => score >= 75)
    .map(([dim, score]) => ({
      dimension: dim,
      score,
      feedback: dimensionFeedback[dim as keyof EnhancedScoreDimensions].feedback,
    }));
  
  const weaknesses = sortedDimensions
    .slice(-3)
    .filter(([, score]) => score < 70)
    .map(([dim, score]) => ({
      dimension: dim,
      score,
      feedback: dimensionFeedback[dim as keyof EnhancedScoreDimensions].feedback,
    }))
    .reverse(); // Show weakest first
  
  // Generate prioritized improvements
  const prioritizedImprovements = weaknesses
    .slice(0, 3)
    .map(w => `Focus on ${w.dimension}: ${dimensionFeedback[w.dimension as keyof EnhancedScoreDimensions].feedback}`);
  
  return {
    overall,
    dimensions,
    dimensionFeedback,
    categoryScores: {
      content: contentScore,
      delivery: deliveryScore,
      nonVerbal: nonVerbalScore,
    },
    strengths,
    weaknesses,
    prioritizedImprovements,
  };
}

