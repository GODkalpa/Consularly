/**
 * Officer Persona Configurations
 * Defines different interviewer personalities and their behavioral patterns
 */

export type OfficerPersona = 'professional' | 'skeptical' | 'friendly' | 'strict';

export interface PersonaBehavior {
  persona: OfficerPersona;
  name: string;
  description: string;
  prevalence: number; // Percentage in real interviews
  characteristics: {
    patience: 'low' | 'medium' | 'high';
    interruptionProbability: number; // 0-1
    followUpFrequency: number; // 0-1
    contradictionDetection: boolean;
    rapidFireSequences: boolean;
    allowsRambling: boolean;
  };
  verbalCues: {
    positive: string[]; // Encouraging phrases
    neutral: string[]; // Transition phrases
    skeptical: string[]; // Doubtful/challenging phrases
    impatient: string[]; // Hurry-up phrases
  };
  pacing: {
    questionDelay: { min: number; max: number }; // Seconds between questions
    occasionalPauses: boolean; // Awkward silences
    rapidFireBursts: boolean; // Quick succession of questions
  };
  questionStyle: {
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    pressureQuestionFrequency: number; // 0-1
    followUpStyle: 'clarifying' | 'challenging' | 'supportive';
  };
}

// ===== PERSONA CONFIGURATIONS =====

export const OFFICER_PERSONAS: Record<OfficerPersona, PersonaBehavior> = {
  professional: {
    persona: 'professional',
    name: 'Professional Officer',
    description: 'Balanced, methodical interviewer following standard procedures',
    prevalence: 40, // 40% of real interviews
    characteristics: {
      patience: 'medium',
      interruptionProbability: 0.1,
      followUpFrequency: 0.4,
      contradictionDetection: true,
      rapidFireSequences: false,
      allowsRambling: true,
    },
    verbalCues: {
      positive: [
        'Okay, good.',
        'I see.',
        'Understood.',
        'That makes sense.',
      ],
      neutral: [
        'Next question...',
        'Let me ask you about...',
        'Moving on...',
        'Okay.',
      ],
      skeptical: [
        'Can you clarify that?',
        'I need more specific information.',
        'That seems vague.',
      ],
      impatient: [
        'Please be brief.',
        'Get to the point.',
        'Time is limited.',
      ],
    },
    pacing: {
      questionDelay: { min: 3, max: 6 },
      occasionalPauses: false,
      rapidFireBursts: false,
    },
    questionStyle: {
      preferredDifficulty: 'medium',
      pressureQuestionFrequency: 0.2,
      followUpStyle: 'clarifying',
    },
  },

  skeptical: {
    persona: 'skeptical',
    name: 'Skeptical Officer',
    description: 'Questions everything, looking for inconsistencies and red flags',
    prevalence: 30, // 30% of real interviews
    characteristics: {
      patience: 'medium',
      interruptionProbability: 0.3,
      followUpFrequency: 0.7,
      contradictionDetection: true,
      rapidFireSequences: true,
      allowsRambling: false,
    },
    verbalCues: {
      positive: [
        'Hmm, okay.',
        'I see.',
      ],
      neutral: [
        'Tell me more.',
        'Explain that.',
        'Go on.',
      ],
      skeptical: [
        'I\'m not convinced.',
        'That doesn\'t add up.',
        'Really?',
        'Are you sure about that?',
        'That contradicts what you said earlier.',
        'I need proof.',
        'Show me the documents.',
        'That sounds rehearsed.',
      ],
      impatient: [
        'Answer the question.',
        'Stop avoiding.',
        'Be specific.',
        'Give me numbers.',
      ],
    },
    pacing: {
      questionDelay: { min: 2, max: 4 },
      occasionalPauses: true, // Creates tension
      rapidFireBursts: true,
    },
    questionStyle: {
      preferredDifficulty: 'hard',
      pressureQuestionFrequency: 0.5,
      followUpStyle: 'challenging',
    },
  },

  friendly: {
    persona: 'friendly',
    name: 'Friendly Officer',
    description: 'Warm, encouraging interviewer putting candidates at ease',
    prevalence: 20, // 20% of real interviews
    characteristics: {
      patience: 'high',
      interruptionProbability: 0.05,
      followUpFrequency: 0.3,
      contradictionDetection: false,
      rapidFireSequences: false,
      allowsRambling: true,
    },
    verbalCues: {
      positive: [
        'Great!',
        'That\'s wonderful.',
        'Excellent choice.',
        'Good to hear.',
        'I\'m happy for you.',
        'Sounds exciting!',
        'That\'s impressive.',
      ],
      neutral: [
        'Tell me about...',
        'I\'d like to know...',
        'Can you share...',
        'Let\'s talk about...',
      ],
      skeptical: [
        'Can you help me understand...',
        'Just to clarify...',
        'Could you explain a bit more...',
      ],
      impatient: [
        // Friendly officers rarely show impatience
        'Let\'s move forward.',
      ],
    },
    pacing: {
      questionDelay: { min: 4, max: 8 },
      occasionalPauses: false,
      rapidFireBursts: false,
    },
    questionStyle: {
      preferredDifficulty: 'easy',
      pressureQuestionFrequency: 0.1,
      followUpStyle: 'supportive',
    },
  },

  strict: {
    persona: 'strict',
    name: 'Strict Officer',
    description: 'No-nonsense, demanding officer with high standards',
    prevalence: 10, // 10% of real interviews (high-risk cases)
    characteristics: {
      patience: 'low',
      interruptionProbability: 0.5,
      followUpFrequency: 0.8,
      contradictionDetection: true,
      rapidFireSequences: true,
      allowsRambling: false,
    },
    verbalCues: {
      positive: [
        'Acceptable.',
        'Fine.',
      ],
      neutral: [
        'Next.',
        'Continue.',
        'And?',
      ],
      skeptical: [
        'Not good enough.',
        'Insufficient.',
        'That\'s unclear.',
        'Wrong answer.',
        'Try again.',
        'Be precise.',
        'I need exact numbers.',
        'That\'s not what I asked.',
      ],
      impatient: [
        'Hurry up.',
        'I don\'t have all day.',
        'Answer now.',
        'Stop wasting time.',
        'Get to the point immediately.',
      ],
    },
    pacing: {
      questionDelay: { min: 1, max: 3 },
      occasionalPauses: true, // Intimidation tactic
      rapidFireBursts: true,
    },
    questionStyle: {
      preferredDifficulty: 'hard',
      pressureQuestionFrequency: 0.7,
      followUpStyle: 'challenging',
    },
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get persona configuration
 */
export function getPersonaConfig(persona: OfficerPersona): PersonaBehavior {
  return OFFICER_PERSONAS[persona];
}

/**
 * Select a random verbal cue based on context
 */
export function getVerbalCue(
  persona: OfficerPersona,
  type: 'positive' | 'neutral' | 'skeptical' | 'impatient',
  answerQuality?: 'good' | 'vague' | 'off_topic' | 'too_long'
): string | null {
  const config = getPersonaConfig(persona);
  
  // Adjust cue type based on answer quality
  if (answerQuality === 'vague') {
    type = 'skeptical';
  } else if (answerQuality === 'too_long' && config.characteristics.patience === 'low') {
    type = 'impatient';
  } else if (answerQuality === 'good' && persona === 'friendly') {
    type = 'positive';
  }
  
  const cues = config.verbalCues[type];
  if (!cues || cues.length === 0) return null;
  
  // Return random cue from the category
  return cues[Math.floor(Math.random() * cues.length)];
}

/**
 * Calculate delay before next question based on persona
 */
export function getQuestionDelay(persona: OfficerPersona, isRapidFire: boolean = false): number {
  const config = getPersonaConfig(persona);
  
  if (isRapidFire && config.pacing.rapidFireBursts) {
    return 1; // Immediate follow-up
  }
  
  const { min, max } = config.pacing.questionDelay;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Determine if officer should interrupt based on answer length
 */
export function shouldInterrupt(
  persona: OfficerPersona,
  answerLength: number, // in words
  answerDuration: number // in seconds
): boolean {
  const config = getPersonaConfig(persona);
  
  // Never interrupt short answers
  if (answerLength < 30) return false;
  
  // Strict and skeptical officers interrupt rambling
  if (config.characteristics.patience === 'low' && answerLength > 80) {
    return Math.random() < config.characteristics.interruptionProbability;
  }
  
  if (answerDuration > 45 && !config.characteristics.allowsRambling) {
    return Math.random() < 0.7; // High chance of interruption
  }
  
  return Math.random() < config.characteristics.interruptionProbability;
}

/**
 * Determine if a follow-up question should be asked
 */
export function shouldAskFollowUp(
  persona: OfficerPersona,
  answerQuality: 'good' | 'vague' | 'off_topic' | 'incomplete',
  answerLength: number
): boolean {
  const config = getPersonaConfig(persona);
  
  // Always follow up on vague or incomplete answers
  if (answerQuality === 'vague' || answerQuality === 'incomplete') {
    return Math.random() < Math.min(config.characteristics.followUpFrequency * 1.5, 1);
  }
  
  // Off-topic answers trigger follow-ups for skeptical personas
  if (answerQuality === 'off_topic' && (persona === 'skeptical' || persona === 'strict')) {
    return Math.random() < 0.8;
  }
  
  // Good answers might still get follow-ups based on persona
  if (answerQuality === 'good') {
    return Math.random() < config.characteristics.followUpFrequency * 0.5;
  }
  
  return Math.random() < config.characteristics.followUpFrequency;
}

/**
 * Check if persona should detect contradictions
 */
export function shouldDetectContradiction(persona: OfficerPersona): boolean {
  const config = getPersonaConfig(persona);
  return config.characteristics.contradictionDetection;
}

/**
 * Get question difficulty bias for persona
 */
export function getDifficultyBias(persona: OfficerPersona): {
  easy: number;
  medium: number;
  hard: number;
} {
  const config = getPersonaConfig(persona);
  
  const biases: Record<'easy' | 'medium' | 'hard', { easy: number; medium: number; hard: number }> = {
    easy: { easy: 60, medium: 30, hard: 10 },
    medium: { easy: 25, medium: 55, hard: 20 },
    hard: { easy: 10, medium: 35, hard: 55 },
  };
  
  return biases[config.questionStyle.preferredDifficulty];
}

/**
 * Determine if persona should use rapid-fire sequence
 */
export function shouldUseRapidFire(persona: OfficerPersona, questionNumber: number): boolean {
  const config = getPersonaConfig(persona);
  
  if (!config.pacing.rapidFireBursts) return false;
  
  // Stress test: 20% chance of rapid-fire after question 5
  if (questionNumber > 5 && (persona === 'strict' || persona === 'skeptical')) {
    return Math.random() < 0.2;
  }
  
  return false;
}

/**
 * Get persona description for UI display
 */
export function getPersonaDescription(persona: OfficerPersona): string {
  const config = getPersonaConfig(persona);
  return `${config.name}: ${config.description} (${config.prevalence}% of real interviews)`;
}

/**
 * Select random persona weighted by prevalence
 */
export function selectRandomPersona(): OfficerPersona {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [key, config] of Object.entries(OFFICER_PERSONAS)) {
    cumulative += config.prevalence;
    if (rand <= cumulative) {
      return key as OfficerPersona;
    }
  }
  
  return 'professional'; // Fallback
}

/**
 * Get follow-up question prompt context based on persona
 */
export function getFollowUpContext(
  persona: OfficerPersona,
  reason: 'vague' | 'contradiction' | 'clarification' | 'deep_dive'
): string {
  const config = getPersonaConfig(persona);
  
  const contexts: Record<typeof reason, Record<typeof config.questionStyle.followUpStyle, string>> = {
    vague: {
      clarifying: 'The answer was too vague. Ask for specific details, numbers, or examples.',
      challenging: 'The answer was evasive. Push for concrete information and don\'t accept generalities.',
      supportive: 'The answer needs more detail. Gently encourage them to elaborate with specific information.',
    },
    contradiction: {
      clarifying: 'There\'s an inconsistency with earlier statements. Politely point it out and ask for clarification.',
      challenging: 'Earlier they said something different. Directly challenge the contradiction.',
      supportive: 'Help them notice the inconsistency and give them a chance to clarify.',
    },
    clarification: {
      clarifying: 'Something isn\'t clear. Ask for more explanation.',
      challenging: 'The explanation is insufficient. Demand better clarity.',
      supportive: 'Ask them to help you understand better.',
    },
    deep_dive: {
      clarifying: 'Probe deeper into this topic with a related follow-up question.',
      challenging: 'Test their knowledge with a harder follow-up question.',
      supportive: 'Show interest and ask them to share more about this.',
    },
  };
  
  return contexts[reason][config.questionStyle.followUpStyle];
}

