/**
 * Relevance Checker Service
 * Detects off-topic answers and calculates question-answer relevance
 */

export interface RelevanceResult {
  score: number; // 0-100
  overlap: number; // 0-1 (percentage of key terms found)
  keyTerms: string[];
  foundTerms: string[];
  missingTerms: string[];
  isOffTopic: boolean;
  penalty: number; // 0, 30, or higher
  warning?: string;
}

// Common stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'you', 'your', 'i', 'my', 'me',
  'we', 'our', 'have', 'had', 'do', 'does', 'can', 'could', 'would',
  'should', 'this', 'these', 'those', 'what', 'which', 'who', 'when',
  'where', 'why', 'how', 'am', 'been', 'being', 'or', 'but', 'if',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
]);

// Question-specific keywords that should carry more weight
const QUESTION_KEYWORDS = new Set([
  'why', 'what', 'how', 'when', 'where', 'who', 'which',
  'explain', 'describe', 'tell', 'discuss', 'elaborate'
]);

// Visa-specific important terms
const VISA_IMPORTANT_TERMS = new Set([
  'university', 'college', 'program', 'course', 'degree', 'study', 'studies',
  'major', 'field', 'academic', 'education', 'research',
  'financial', 'funds', 'money', 'sponsor', 'cost', 'tuition', 'fees',
  'family', 'parents', 'father', 'mother', 'ties', 'return', 'home',
  'career', 'job', 'work', 'employment', 'plan', 'goal', 'future',
  'visa', 'student', 'international', 'country'
]);

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract key terms from question
 * Focuses on nouns, verbs, and important visa-related terms
 */
export function extractKeyTerms(question: string): string[] {
  const normalized = normalizeText(question);
  const words = normalized.split(' ').filter(word => word.length > 0);

  const keyTerms = new Set<string>();

  // Add visa-specific important terms
  words.forEach(word => {
    if (VISA_IMPORTANT_TERMS.has(word)) {
      keyTerms.add(word);
    }
  });

  // Add non-stop words that are longer than 3 characters
  words.forEach(word => {
    if (!STOP_WORDS.has(word) && word.length > 3 && !QUESTION_KEYWORDS.has(word)) {
      keyTerms.add(word);
    }
  });

  // Extract multi-word phrases (bigrams) for better context
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i];
    const word2 = words[i + 1];

    // If both words are significant, create a bigram
    if (!STOP_WORDS.has(word1) && !STOP_WORDS.has(word2) &&
      (VISA_IMPORTANT_TERMS.has(word1) || VISA_IMPORTANT_TERMS.has(word2))) {
      keyTerms.add(`${word1} ${word2}`);
    }
  }

  return Array.from(keyTerms);
}

/**
 * Calculate overlap between question key terms and answer
 */
export function calculateOverlap(keyTerms: string[], answer: string): {
  found: string[];
  missing: string[];
  overlap: number;
} {
  const normalizedAnswer = normalizeText(answer);
  const found: string[] = [];
  const missing: string[] = [];

  keyTerms.forEach(term => {
    // Check for exact term or word boundary matches
    const pattern = term.includes(' ')
      ? new RegExp(`\\b${term}\\b`, 'i')
      : new RegExp(`\\b${term}\\w*\\b`, 'i'); // Allow word variations (e.g., "study" matches "studying")

    if (pattern.test(normalizedAnswer)) {
      found.push(term);
    } else {
      missing.push(term);
    }
  });

  const overlap = keyTerms.length > 0 ? found.length / keyTerms.length : 0;

  return { found, missing, overlap };
}

/**
 * Calculate semantic similarity using word vectors (simplified)
 * This is a basic implementation - in production, you might use embeddings
 */
export function calculateSemanticSimilarity(question: string, answer: string): number {
  const questionWords = new Set(normalizeText(question).split(' ').filter(w => !STOP_WORDS.has(w)));
  const answerWords = normalizeText(answer).split(' ').filter(w => !STOP_WORDS.has(w));

  // Count how many question words appear in answer
  let matchCount = 0;
  answerWords.forEach(word => {
    if (questionWords.has(word)) {
      matchCount++;
    }
  });

  // Calculate Jaccard similarity (using Array.from for TypeScript compatibility)
  const union = new Set([...Array.from(questionWords), ...answerWords]);
  return union.size > 0 ? matchCount / union.size : 0;
}

/**
 * Check if answer is relevant to question
 */
export function checkRelevance(question: string, answer: string): RelevanceResult {
  // Handle empty or very short answers
  if (!answer || answer.trim().length < 10) {
    return {
      score: 0,
      overlap: 0,
      keyTerms: [],
      foundTerms: [],
      missingTerms: [],
      isOffTopic: true,
      penalty: 100,
      warning: 'Answer is too short or empty'
    };
  }

  // Extract key terms from question
  const keyTerms = extractKeyTerms(question);

  // If no key terms found, use basic word overlap
  if (keyTerms.length === 0) {
    const similarity = calculateSemanticSimilarity(question, answer);
    return {
      score: Math.round(similarity * 100),
      overlap: similarity,
      keyTerms: [],
      foundTerms: [],
      missingTerms: [],
      isOffTopic: similarity < 0.1,
      penalty: similarity < 0.2 ? 50 : 0,
      warning: similarity < 0.2 ? 'Answer may not be relevant to question' : undefined
    };
  }

  // Calculate overlap with key terms
  const { found, missing, overlap } = calculateOverlap(keyTerms, answer);

  // Calculate semantic similarity as well
  const semanticSimilarity = calculateSemanticSimilarity(question, answer);

  // Combine both metrics (weighted average)
  const combinedScore = (overlap * 0.7 + semanticSimilarity * 0.3);

  // Determine if off-topic
  let isOffTopic = false;
  let penalty = 0;
  let warning: string | undefined;

  if (combinedScore < 0.1) {
    // Completely off-topic - less than 10% relevance
    isOffTopic = true;
    penalty = 30; // Reduced from 70 - let LLM handle the bulk of scoring
    warning = 'Answer appears to be off-topic or unrelated to the question';
  } else if (combinedScore < 0.3) {
    // Partially relevant but missing key points
    penalty = 10; // Reduced from 30
    warning = 'Answer is only partially relevant - missing key points from the question';
  } else if (combinedScore < 0.5) {
    // Somewhat relevant but could be better
    penalty = 5; // Reduced from 10
    warning = 'Answer could be more directly focused on the question';
  }

  return {
    score: Math.round(Math.max(0, combinedScore * 100 - penalty)),
    overlap,
    keyTerms,
    foundTerms: found,
    missingTerms: missing,
    isOffTopic,
    penalty,
    warning
  };
}

/**
 * Generate feedback based on relevance check
 */
export function generateRelevanceFeedback(result: RelevanceResult): string[] {
  const feedback: string[] = [];

  if (result.isOffTopic) {
    feedback.push('Your answer does not address the question asked.');
    if (result.missingTerms.length > 0) {
      feedback.push(`Missing key topics: ${result.missingTerms.slice(0, 3).join(', ')}`);
    }
  } else if (result.penalty > 20) {
    feedback.push('Your answer is partially relevant but misses important points.');
    if (result.missingTerms.length > 0) {
      feedback.push(`Consider addressing: ${result.missingTerms.slice(0, 3).join(', ')}`);
    }
  } else if (result.penalty > 0) {
    feedback.push('Try to focus more directly on the specific question asked.');
  }

  return feedback;
}

