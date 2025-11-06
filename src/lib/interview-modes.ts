/**
 * Interview Modes Configuration
 * Defines different interview formats, difficulty levels, and practice modes
 */

export type InterviewMode = 'practice' | 'standard' | 'comprehensive' | 'stress_test';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type PracticeTopic = 'financial' | 'academic' | 'intent' | 'weak_areas';

export interface InterviewModeConfig {
  mode: InterviewMode;
  name: string;
  description: string;
  questionCount: number;
  estimatedDuration: number; // minutes
  timePerQuestion: number; // seconds
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  categoryRequirements: {
    category: string;
    minQuestions: number;
    maxQuestions: number;
  }[];
  features: {
    allowFollowUps: boolean;
    strictCategoryBalance: boolean;
    includePressureQuestions: boolean;
    includeRedFlagQuestions: boolean;
  };
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  description: string;
  timePerQuestion: number; // seconds
  officerPatience: 'low' | 'medium' | 'high';
  followUpFrequency: number; // 0-1, probability of follow-up
  questionTypes: {
    easy: number; // percentage
    medium: number;
    hard: number;
  };
  pressureLevel: number; // 1-5 scale
  features: {
    allowRambling: boolean;
    interruptsVagueAnswers: boolean;
    detectsContradictions: boolean;
    rapidFireSequences: boolean;
  };
}

export interface TopicDrillConfig {
  topic: PracticeTopic;
  name: string;
  description: string;
  questionCount: number;
  categories: string[];
  focusAreas: string[];
  tips: string[];
}

// ===== INTERVIEW MODE CONFIGURATIONS =====

export const INTERVIEW_MODES: Record<InterviewMode, InterviewModeConfig> = {
  practice: {
    mode: 'practice',
    name: 'Practice Mode',
    description: 'Quick 8-question practice session covering essential topics',
    questionCount: 8,
    estimatedDuration: 10,
    timePerQuestion: 60,
    difficultyDistribution: {
      easy: 50,
      medium: 40,
      hard: 10,
    },
    categoryRequirements: [
      { category: 'academic', minQuestions: 2, maxQuestions: 3 },
      { category: 'financial', minQuestions: 2, maxQuestions: 3 },
      { category: 'post_study', minQuestions: 1, maxQuestions: 2 },
      { category: 'general', minQuestions: 1, maxQuestions: 2 },
    ],
    features: {
      allowFollowUps: false,
      strictCategoryBalance: true,
      includePressureQuestions: false,
      includeRedFlagQuestions: false,
    },
  },

  standard: {
    mode: 'standard',
    name: 'Standard Mode',
    description: 'Realistic 12-question interview simulating typical embassy experience',
    questionCount: 12,
    estimatedDuration: 15,
    timePerQuestion: 50,
    difficultyDistribution: {
      easy: 25,
      medium: 55,
      hard: 20,
    },
    categoryRequirements: [
      { category: 'academic', minQuestions: 3, maxQuestions: 4 },
      { category: 'financial', minQuestions: 3, maxQuestions: 4 },
      { category: 'post_study', minQuestions: 2, maxQuestions: 3 },
      { category: 'general', minQuestions: 1, maxQuestions: 2 },
    ],
    features: {
      allowFollowUps: true,
      strictCategoryBalance: true,
      includePressureQuestions: false,
      includeRedFlagQuestions: true,
    },
  },

  comprehensive: {
    mode: 'comprehensive',
    name: 'Comprehensive Mode',
    description: 'In-depth 16-question interview covering all aspects thoroughly',
    questionCount: 16,
    estimatedDuration: 20,
    timePerQuestion: 45,
    difficultyDistribution: {
      easy: 20,
      medium: 50,
      hard: 30,
    },
    categoryRequirements: [
      { category: 'academic', minQuestions: 4, maxQuestions: 5 },
      { category: 'financial', minQuestions: 4, maxQuestions: 5 },
      { category: 'post_study', minQuestions: 3, maxQuestions: 4 },
      { category: 'visa_history', minQuestions: 1, maxQuestions: 2 },
      { category: 'general', minQuestions: 1, maxQuestions: 2 },
    ],
    features: {
      allowFollowUps: true,
      strictCategoryBalance: true,
      includePressureQuestions: true,
      includeRedFlagQuestions: true,
    },
  },

  stress_test: {
    mode: 'stress_test',
    name: 'Stress Test Mode',
    description: 'Challenging 20-question interview with rapid-fire and pressure questions',
    questionCount: 20,
    estimatedDuration: 25,
    timePerQuestion: 35,
    difficultyDistribution: {
      easy: 10,
      medium: 40,
      hard: 50,
    },
    categoryRequirements: [
      { category: 'academic', minQuestions: 4, maxQuestions: 6 },
      { category: 'financial', minQuestions: 5, maxQuestions: 7 },
      { category: 'post_study', minQuestions: 4, maxQuestions: 5 },
      { category: 'pressure', minQuestions: 2, maxQuestions: 4 },
      { category: 'red_flags', minQuestions: 1, maxQuestions: 3 },
    ],
    features: {
      allowFollowUps: true,
      strictCategoryBalance: false, // More unpredictable
      includePressureQuestions: true,
      includeRedFlagQuestions: true,
    },
  },
};

// ===== DIFFICULTY LEVEL CONFIGURATIONS =====

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    name: 'Beginner',
    description: 'Patient officer with straightforward questions and ample time',
    timePerQuestion: 60,
    officerPatience: 'high',
    followUpFrequency: 0.2,
    questionTypes: {
      easy: 60,
      medium: 30,
      hard: 10,
    },
    pressureLevel: 1,
    features: {
      allowRambling: true,
      interruptsVagueAnswers: false,
      detectsContradictions: false,
      rapidFireSequences: false,
    },
  },

  medium: {
    level: 'medium',
    name: 'Intermediate',
    description: 'Professional officer with balanced mix of question types',
    timePerQuestion: 45,
    officerPatience: 'medium',
    followUpFrequency: 0.4,
    questionTypes: {
      easy: 30,
      medium: 50,
      hard: 20,
    },
    pressureLevel: 2,
    features: {
      allowRambling: true,
      interruptsVagueAnswers: false,
      detectsContradictions: true,
      rapidFireSequences: false,
    },
  },

  hard: {
    level: 'hard',
    name: 'Advanced',
    description: 'Skeptical officer with challenging questions and faster pacing',
    timePerQuestion: 30,
    officerPatience: 'medium',
    followUpFrequency: 0.6,
    questionTypes: {
      easy: 15,
      medium: 45,
      hard: 40,
    },
    pressureLevel: 4,
    features: {
      allowRambling: false,
      interruptsVagueAnswers: true,
      detectsContradictions: true,
      rapidFireSequences: true,
    },
  },

  expert: {
    level: 'expert',
    name: 'Master',
    description: 'Unpredictable officer testing composure under maximum pressure',
    timePerQuestion: 25,
    officerPatience: 'low',
    followUpFrequency: 0.8,
    questionTypes: {
      easy: 10,
      medium: 30,
      hard: 60,
    },
    pressureLevel: 5,
    features: {
      allowRambling: false,
      interruptsVagueAnswers: true,
      detectsContradictions: true,
      rapidFireSequences: true,
    },
  },
};

// ===== TOPIC DRILL CONFIGURATIONS =====

export const TOPIC_DRILLS: Record<PracticeTopic, TopicDrillConfig> = {
  financial: {
    topic: 'financial',
    name: 'Financial Deep Dive',
    description: 'Focus exclusively on funding, sponsors, and financial capability',
    questionCount: 10,
    categories: ['financial'],
    focusAreas: [
      'Total program costs',
      'Sponsor details and income',
      'Source of funds',
      'Loan/scholarship details',
      'Financial backup plans',
    ],
    tips: [
      'Always mention exact dollar amounts',
      'Know your sponsor\'s occupation and income',
      'Explain the source of all funds clearly',
      'Have a backup plan if primary funding fails',
      'Show financial documents confidently',
    ],
  },

  academic: {
    topic: 'academic',
    name: 'Academic Excellence',
    description: 'Deep dive into study plans, university choice, and academic background',
    questionCount: 10,
    categories: ['academic'],
    focusAreas: [
      'Program details and curriculum',
      'University selection rationale',
      'Academic qualifications',
      'Study methodology',
      'Post-graduation application',
    ],
    tips: [
      'Research specific program features',
      'Mention professors or courses by name',
      'Explain gaps in education history',
      'Connect program to career goals',
      'Show genuine academic interest',
    ],
  },

  intent: {
    topic: 'intent',
    name: 'Return Intent Mastery',
    description: 'Practice demonstrating strong ties to home country and return plans',
    questionCount: 10,
    categories: ['post_study'],
    focusAreas: [
      'Specific career plans in home country',
      'Family and property ties',
      'Job market understanding',
      'Concrete return timeline',
      'Evidence of commitments',
    ],
    tips: [
      'Name specific companies or roles',
      'Mention family obligations',
      'Show property or business ties',
      'Avoid mentioning US job market',
      'Be specific about return timeline',
    ],
  },

  weak_areas: {
    topic: 'weak_areas',
    name: 'Weak Areas Focus',
    description: 'AI-recommended questions based on your previous performance',
    questionCount: 10,
    categories: [], // Dynamically determined
    focusAreas: [], // Dynamically determined
    tips: [
      'Review your previous interview feedback',
      'Focus on categories where you scored lowest',
      'Practice specific, detailed answers',
      'Eliminate filler words and hesitation',
      'Build confidence through repetition',
    ],
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get mode configuration by name
 */
export function getModeConfig(mode: InterviewMode): InterviewModeConfig {
  return INTERVIEW_MODES[mode];
}

/**
 * Get difficulty configuration by level
 */
export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  return DIFFICULTY_LEVELS[level];
}

/**
 * Get topic drill configuration
 */
export function getTopicDrillConfig(topic: PracticeTopic): TopicDrillConfig {
  return TOPIC_DRILLS[topic];
}

/**
 * Calculate effective time per question based on mode and difficulty
 */
export function getEffectiveTimePerQuestion(
  mode: InterviewMode,
  difficulty?: DifficultyLevel
): number {
  const modeConfig = getModeConfig(mode);
  
  if (!difficulty) {
    return modeConfig.timePerQuestion;
  }
  
  const difficultyConfig = getDifficultyConfig(difficulty);
  return difficultyConfig.timePerQuestion;
}

/**
 * Get recommended question distribution for a mode
 */
export function getQuestionDistribution(mode: InterviewMode, difficulty?: DifficultyLevel): {
  easy: number;
  medium: number;
  hard: number;
} {
  const modeConfig = getModeConfig(mode);
  
  if (!difficulty) {
    return modeConfig.difficultyDistribution;
  }
  
  const difficultyConfig = getDifficultyConfig(difficulty);
  return difficultyConfig.questionTypes;
}

/**
 * Check if a question category is allowed for the current mode
 */
export function isCategoryAllowedForMode(
  category: string,
  mode: InterviewMode
): boolean {
  const modeConfig = getModeConfig(mode);
  
  // Check if category is in requirements
  const hasRequirement = modeConfig.categoryRequirements.some(
    req => req.category === category || req.category === 'general'
  );
  
  // Special cases
  if (category === 'pressure' && !modeConfig.features.includePressureQuestions) {
    return false;
  }
  
  if (category === 'red_flags' && !modeConfig.features.includeRedFlagQuestions) {
    return false;
  }
  
  return hasRequirement || category === 'academic' || category === 'financial' || category === 'post_study';
}

/**
 * Get category quota for mode
 */
export function getCategoryQuota(
  category: string,
  mode: InterviewMode
): { min: number; max: number } | null {
  const modeConfig = getModeConfig(mode);
  const requirement = modeConfig.categoryRequirements.find(
    req => req.category === category
  );
  
  if (requirement) {
    return {
      min: requirement.minQuestions,
      max: requirement.maxQuestions,
    };
  }
  
  return null;
}

/**
 * Validate if an interview configuration is valid
 */
export function validateInterviewConfig(
  mode: InterviewMode,
  difficulty?: DifficultyLevel,
  topicDrill?: PracticeTopic
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check mode exists
  if (!INTERVIEW_MODES[mode]) {
    errors.push(`Invalid interview mode: ${mode}`);
  }
  
  // Check difficulty if provided
  if (difficulty && !DIFFICULTY_LEVELS[difficulty]) {
    errors.push(`Invalid difficulty level: ${difficulty}`);
  }
  
  // Check topic drill if provided
  if (topicDrill && !TOPIC_DRILLS[topicDrill]) {
    errors.push(`Invalid topic drill: ${topicDrill}`);
  }
  
  // Topic drills should use practice mode
  if (topicDrill && mode !== 'practice') {
    errors.push('Topic drills should use practice mode');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get interview description for UI
 */
export function getInterviewDescription(
  mode: InterviewMode,
  difficulty?: DifficultyLevel,
  topicDrill?: PracticeTopic
): string {
  const modeConfig = getModeConfig(mode);
  
  if (topicDrill) {
    const drillConfig = getTopicDrillConfig(topicDrill);
    return `${drillConfig.name}: ${drillConfig.description}`;
  }
  
  if (difficulty) {
    const diffConfig = getDifficultyConfig(difficulty);
    return `${modeConfig.name} (${diffConfig.name}): ${modeConfig.description}`;
  }
  
  return `${modeConfig.name}: ${modeConfig.description}`;
}

