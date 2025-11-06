/**
 * Coaching Engine
 * Provides personalized coaching and improvement recommendations
 */

import modelAnswersData from '@/data/model-answers.json';
import type { InterviewResponse, PerAnswerScore } from '@/types/firestore';

export interface ModelAnswer {
  questionPattern: string;
  category: string;
  goodExample: string;
  poorExample: string;
  keyElements: string[];
  commonMistakes: string[];
}

export interface AnswerComparison {
  yourAnswer: string;
  modelAnswer: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  specificImprovements: string[];
  keyElementsPresent: string[];
  keyElementsMissing: string[];
}

export interface ActionPlan {
  priority: 'high' | 'medium' | 'low';
  area: string;
  currentLevel: string;
  targetLevel: string;
  timeframe: string;
  exercises: string[];
  successMetrics: string[];
}

export interface CoachingReport {
  overallFeedback: string;
  answerComparisons: AnswerComparison[];
  actionPlans: ActionPlan[];
  nextSessionRecommendations: {
    mode: string;
    difficulty: string;
    focusAreas: string[];
    reasoning: string;
  };
  estimatedImprovementPotential: number; // 0-100
}

const modelAnswers: ModelAnswer[] = modelAnswersData.modelAnswers as ModelAnswer[];

// ===== ANSWER COMPARISON =====

/**
 * Find best matching model answer for a question
 */
export function findMatchingModelAnswer(question: string): ModelAnswer | null {
  const q = question.toLowerCase();
  
  for (const model of modelAnswers) {
    const pattern = new RegExp(model.questionPattern, 'i');
    if (pattern.test(q)) {
      return model;
    }
  }
  
  return null;
}

/**
 * Compare student answer with model answer
 */
export function compareWithModelAnswer(
  question: string,
  studentAnswer: string,
  score?: PerAnswerScore
): AnswerComparison {
  const model = findMatchingModelAnswer(question);
  
  if (!model) {
    return {
      yourAnswer: studentAnswer,
      modelAnswer: 'Model answer not available for this question type',
      score: score?.overall || 0,
      strengths: [],
      weaknesses: [],
      specificImprovements: [],
      keyElementsPresent: [],
      keyElementsMissing: [],
    };
  }
  
  const answerLower = studentAnswer.toLowerCase();
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  const elementsPresent: string[] = [];
  const elementsMissing: string[] = [];
  
  // Check which key elements are present
  model.keyElements.forEach(element => {
    const elementWords = element.toLowerCase().split(/\s+/);
    const hasElement = elementWords.some(word => 
      word.length > 4 && answerLower.includes(word)
    );
    
    if (hasElement) {
      elementsPresent.push(element);
      strengths.push(`Included: ${element}`);
    } else {
      elementsMissing.push(element);
      improvements.push(`Add: ${element}`);
    }
  });
  
  // Check for common mistakes
  model.commonMistakes.forEach(mistake => {
    const mistakeWords = mistake.toLowerCase().split(/\s+/);
    const hasMistake = mistakeWords.some(word => 
      word.length > 4 && answerLower.includes(word)
    );
    
    if (hasMistake) {
      weaknesses.push(mistake);
    }
  });
  
  // Analyze answer length
  const wordCount = studentAnswer.split(/\s+/).length;
  if (wordCount >= 30 && wordCount <= 100) {
    strengths.push('Appropriate answer length (30-100 words)');
  } else if (wordCount < 20) {
    weaknesses.push('Answer too brief - provide more details');
    improvements.push('Expand your answer with specific examples');
  } else if (wordCount > 120) {
    weaknesses.push('Answer too long - be more concise');
    improvements.push('Focus on key points and eliminate rambling');
  }
  
  // Check for specificity
  const hasNumbers = /\d+/.test(studentAnswer);
  const hasDollar = /\$\s*\d+/.test(studentAnswer);
  const hasPercentage = /\d+\s*%/.test(studentAnswer);
  
  if (hasNumbers || hasDollar || hasPercentage) {
    strengths.push('Used specific numbers/amounts');
  } else if (model.category === 'financial') {
    weaknesses.push('Missing specific dollar amounts');
    improvements.push('Always state exact costs and amounts');
  }
  
  // Check for vague language
  const vaguePatterns = /(maybe|probably|i think|i guess|kind of|sort of)/gi;
  const vagueCount = (studentAnswer.match(vaguePatterns) || []).length;
  
  if (vagueCount === 0) {
    strengths.push('Confident, definitive language');
  } else if (vagueCount > 2) {
    weaknesses.push('Too much uncertain language (maybe, probably, I think)');
    improvements.push('Speak with more confidence and certainty');
  }
  
  return {
    yourAnswer: studentAnswer,
    modelAnswer: model.goodExample,
    score: score?.overall || 0,
    strengths,
    weaknesses,
    specificImprovements: improvements,
    keyElementsPresent: elementsPresent,
    keyElementsMissing: elementsMissing,
  };
}

// ===== ACTION PLAN GENERATION =====

/**
 * Generate personalized action plans based on interview performance
 */
export function generateActionPlans(
  responses: Array<{ question: string; answer: string; perf?: PerAnswerScore }>,
  overallScore: number
): ActionPlan[] {
  const plans: ActionPlan[] = [];
  
  // Analyze weak areas
  const categoryScores: Record<string, number[]> = {
    content: [],
    delivery: [],
    nonVerbal: [],
  };
  
  responses.forEach(r => {
    if (r.perf) {
      categoryScores.content.push(r.perf.categories.content);
      categoryScores.delivery.push(r.perf.categories.speech);
      categoryScores.nonVerbal.push(r.perf.categories.bodyLanguage);
    }
  });
  
  // Calculate average for each category
  const avgScores = {
    content: categoryScores.content.length > 0
      ? categoryScores.content.reduce((a, b) => a + b, 0) / categoryScores.content.length
      : 70,
    delivery: categoryScores.delivery.length > 0
      ? categoryScores.delivery.reduce((a, b) => a + b, 0) / categoryScores.delivery.length
      : 70,
    nonVerbal: categoryScores.nonVerbal.length > 0
      ? categoryScores.nonVerbal.reduce((a, b) => a + b, 0) / categoryScores.nonVerbal.length
      : 70,
  };
  
  // Generate plans for weak areas
  if (avgScores.content < 75) {
    plans.push({
      priority: avgScores.content < 60 ? 'high' : 'medium',
      area: 'Content Quality',
      currentLevel: avgScores.content < 60 ? 'Needs Significant Work' : 'Below Average',
      targetLevel: 'Good (80+)',
      timeframe: '1-2 weeks',
      exercises: [
        'Study model answers and note what makes them specific',
        'Practice stating exact numbers for all financial questions',
        'Write out answers to common questions with 3 specific details each',
        'Record yourself and count vague words - aim for zero',
        'Practice with a partner who challenges vague answers',
      ],
      successMetrics: [
        'Every answer includes at least 2 specific details (names, numbers, dates)',
        'Zero use of vague terms like "enough," "sufficient," "good"',
        'Can answer financial questions with exact dollar amounts',
      ],
    });
  }
  
  if (avgScores.delivery < 75) {
    plans.push({
      priority: avgScores.delivery < 60 ? 'high' : 'medium',
      area: 'Delivery & Speaking Skills',
      currentLevel: avgScores.delivery < 60 ? 'Needs Significant Work' : 'Below Average',
      targetLevel: 'Good (80+)',
      timeframe: '1-2 weeks',
      exercises: [
        'Practice speaking at 120-160 words per minute (use timer)',
        'Record yourself and identify filler words to eliminate',
        'Pause confidently instead of saying "um" or "uh"',
        'Practice answering in exactly 45 seconds',
        'Speak 10% louder than feels natural for confidence',
      ],
      successMetrics: [
        'Speaking pace consistently 120-160 WPM',
        'Filler word rate below 3%',
        'Answers between 30-60 seconds',
      ],
    });
  }
  
  if (avgScores.nonVerbal < 70) {
    plans.push({
      priority: 'medium',
      area: 'Body Language & Presence',
      currentLevel: 'Below Average',
      targetLevel: 'Good (75+)',
      timeframe: '1 week',
      exercises: [
        'Practice maintaining eye contact with camera for entire answer',
        'Record yourself and check posture - sit upright, shoulders back',
        'Practice in front of mirror to eliminate nervous gestures',
        'Smile naturally when greeting (sets positive tone)',
        'Control hand gestures - use purposefully, not nervously',
      ],
      successMetrics: [
        'Maintain eye contact 90%+ of the time',
        'Upright posture throughout interview',
        'Controlled, purposeful gestures only',
      ],
    });
  }
  
  // Overall improvement plan
  if (overallScore < 70) {
    plans.push({
      priority: 'high',
      area: 'Overall Interview Performance',
      currentLevel: 'Needs Improvement',
      targetLevel: 'Good (75+)',
      timeframe: '2-3 weeks',
      exercises: [
        'Complete 3-5 practice interviews per week',
        'Study feedback from each session before next one',
        'Focus on one weak area per session',
        'Practice with family/friends for realistic pressure',
        'Watch recordings of your interviews to self-evaluate',
      ],
      successMetrics: [
        'Average score above 75 for 3 consecutive interviews',
        'Consistent performance across all categories',
        'Positive improvement trend over time',
      ],
    });
  }
  
  return plans.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ===== NEXT SESSION RECOMMENDATIONS =====

/**
 * Recommend next interview session based on performance
 */
export function recommendNextSession(
  overallScore: number,
  categoryScores: { content: number; delivery: number; nonVerbal: number },
  completedModes: string[]
): CoachingReport['nextSessionRecommendations'] {
  // Determine difficulty
  let difficulty: string;
  let reasoning: string;
  
  if (overallScore < 60) {
    difficulty = 'easy';
    reasoning = 'Focus on building confidence with easier questions before increasing difficulty.';
  } else if (overallScore < 75) {
    difficulty = 'medium';
    reasoning = 'You\'re ready for realistic practice. Medium difficulty will prepare you well.';
  } else if (overallScore < 85) {
    difficulty = 'hard';
    reasoning = 'Strong performance! Challenge yourself with harder questions to prepare for any scenario.';
  } else {
    difficulty = 'expert';
    reasoning = 'Excellent work! Test yourself under maximum pressure to ensure readiness.';
  }
  
  // Determine mode
  let mode: string;
  const hasStressTested = completedModes.includes('stress_test');
  const hasComprehensive = completedModes.includes('comprehensive');
  
  if (overallScore >= 80 && !hasStressTested) {
    mode = 'stress_test';
    reasoning += ' Try Stress Test mode to simulate worst-case scenarios.';
  } else if (overallScore >= 70 && !hasComprehensive) {
    mode = 'comprehensive';
    reasoning += ' Practice with Comprehensive mode for thorough preparation.';
  } else if (overallScore < 70) {
    mode = 'practice';
    reasoning += ' Daily Practice mode will help build consistency.';
  } else {
    mode = 'standard';
    reasoning += ' Continue with Standard mode for balanced practice.';
  }
  
  // Determine focus areas
  const focusAreas: string[] = [];
  
  if (categoryScores.content < 75) {
    focusAreas.push('Content specificity and detail');
  }
  if (categoryScores.delivery < 75) {
    focusAreas.push('Speaking fluency and pace');
  }
  if (categoryScores.nonVerbal < 70) {
    focusAreas.push('Body language and confidence');
  }
  
  if (focusAreas.length === 0) {
    focusAreas.push('Maintaining consistency', 'Handling pressure questions');
  }
  
  return {
    mode,
    difficulty,
    focusAreas,
    reasoning,
  };
}

// ===== COMPLETE COACHING REPORT =====

/**
 * Generate complete coaching report
 */
export function generateCoachingReport(
  responses: Array<InterviewResponse & { question: string }>,
  overallScore: number,
  completedModes: string[] = []
): CoachingReport {
  // Generate answer comparisons
  const answerComparisons = responses.map(r => 
    compareWithModelAnswer(r.question, r.answer, r.perf)
  );
  
  // Calculate category averages
  const categoryScores = {
    content: 0,
    delivery: 0,
    nonVerbal: 0,
  };
  
  let validScores = 0;
  responses.forEach(r => {
    if (r.perf) {
      categoryScores.content += r.perf.categories.content;
      categoryScores.delivery += r.perf.categories.speech;
      categoryScores.nonVerbal += r.perf.categories.bodyLanguage;
      validScores++;
    }
  });
  
  if (validScores > 0) {
    categoryScores.content /= validScores;
    categoryScores.delivery /= validScores;
    categoryScores.nonVerbal /= validScores;
  }
  
  // Generate action plans
  const actionPlans = generateActionPlans(responses, overallScore);
  
  // Generate next session recommendations
  const nextSessionRecommendations = recommendNextSession(
    overallScore,
    categoryScores,
    completedModes
  );
  
  // Calculate improvement potential
  const improvementPotential = Math.min(
    100,
    Math.round((100 - overallScore) * 0.7) + 20 // 70% of gap + 20 base
  );
  
  // Generate overall feedback
  let overallFeedback = '';
  
  if (overallScore >= 90) {
    overallFeedback = 'Outstanding performance! You\'re well-prepared for your actual interview. Focus on maintaining this level and practicing under various conditions.';
  } else if (overallScore >= 80) {
    overallFeedback = 'Strong performance! You have a solid foundation. Work on the specific areas identified below to reach excellence.';
  } else if (overallScore >= 70) {
    overallFeedback = 'Good progress! You\'re on the right track but need more practice in key areas. Focus on specificity and confidence.';
  } else if (overallScore >= 60) {
    overallFeedback = 'You\'re making progress but need significant improvement. Study the model answers carefully and practice daily.';
  } else {
    overallFeedback = 'Your interview needs substantial work. Don\'t be discouraged - focus on one area at a time and you\'ll see improvement. Start with content specificity.';
  }
  
  return {
    overallFeedback,
    answerComparisons,
    actionPlans,
    nextSessionRecommendations,
    estimatedImprovementPotential: improvementPotential,
  };
}

