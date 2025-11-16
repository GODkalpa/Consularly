/**
 * France Student Visa Question Pools
 * EMA and ICN university-specific questions
 */

export type FranceUniversity = 'ema' | 'icn'

export type FranceQuestionType = 'academic' | 'financial' | 'intent' | 'background' | 'follow-up'

export interface FranceQuestionItem {
  id?: string // CRITICAL FIX: Add ID for question tracking
  question: string
  questionType: FranceQuestionType
  difficulty?: 'easy' | 'medium' | 'hard'
  expectedAnswerLength?: 'short' | 'medium' | 'long'
}

// EMA Interview Questions (15 total)
export const EMA_QUESTION_POOL: FranceQuestionItem[] = [
  { id: 'EMA_001', question: "Course Name / Course Duration / Tuition Fees / Awarding Body", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'medium' },
  { id: 'EMA_002', question: "Describe your academic and professional background.", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'long' },
  { id: 'EMA_003', question: "How does your academic and professional background align with the course that you have chosen?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'long' },
  { id: 'EMA_004', question: "Describe your career objectives.", questionType: 'intent', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'EMA_005', question: "How will this course help you in achieving your career objectives?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'long' },
  { id: 'EMA_006', question: "Why did you choose this course in particular?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'EMA_007', question: "Why did you choose France?", questionType: 'background', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'EMA_008', question: "Have you considered any other institutions other than EMA?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'short' },
  { id: 'EMA_009', question: "Have you previously applied/been refused a visa for France or any other country?", questionType: 'follow-up', difficulty: 'medium', expectedAnswerLength: 'short' },
  { id: 'EMA_010', question: "Have you ever been to France? What do you know of France as a place?", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'medium' },
  { id: 'EMA_011', question: "Will you be looking to work while in France?", questionType: 'intent', difficulty: 'easy', expectedAnswerLength: 'short' },
  { id: 'EMA_012', question: "Who will be sponsoring you?", questionType: 'financial', difficulty: 'easy', expectedAnswerLength: 'short' },
  { id: 'EMA_013', question: "If you are unsuccessful in your application to France, what is your backup plan?", questionType: 'intent', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'EMA_014', question: "How did you come to know about EMA?", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'short' },
  { id: 'EMA_015', question: "Why did you choose EMA?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
]

// ICN Interview Questions (10 total)
export const ICN_QUESTION_POOL: FranceQuestionItem[] = [
  { id: 'ICN_001', question: "First of all, tell us a bit about yourself. What is your academic background? (previous studies, current level of studies, field of studies)", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'long' },
  { id: 'ICN_002', question: "Why would you like to join ICN Business School and this programme?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'long' },
  { id: 'ICN_003', question: "Where do you see yourself in five years' time?", questionType: 'intent', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'ICN_004', question: "What is your main center of interest in life, and why?", questionType: 'background', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'ICN_005', question: "Which are the three main features of your personality that best describe you?", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'medium' },
  { id: 'ICN_006', question: "Have you ever travelled abroad? If so, in which countries and on which occasions?", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'short' },
  { id: 'ICN_007', question: "Tell us about an experience in which you really invested yourself and of which you are particularly proud.", questionType: 'background', difficulty: 'medium', expectedAnswerLength: 'long' },
  { id: 'ICN_008', question: "What courses or activities at ICN Business School could nourish your ambitions?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { id: 'ICN_009', question: "What are your motivations to join this programme?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'long' },
  { id: 'ICN_010', question: "What are your career or professional plans, and how can the Bachelor programme of ICN help you to achieve your goal?", questionType: 'intent', difficulty: 'medium', expectedAnswerLength: 'long' },
]

/**
 * Get the full question pool for a university
 */
export function getQuestionPoolForUniversity(university: FranceUniversity): FranceQuestionItem[] {
  return university === 'ema' ? EMA_QUESTION_POOL : ICN_QUESTION_POOL
}

/**
 * Get the first (fixed) question for a university
 * This question is ALWAYS asked first in every interview
 */
export function getFirstQuestionForUniversity(university: FranceUniversity): FranceQuestionItem {
  const pool = getQuestionPoolForUniversity(university)
  return pool[0]
}

/**
 * Get remaining questions (Q2 onwards) for AI selection
 * For EMA: returns questions 2-15 (14 questions)
 * For ICN: returns questions 2-10 (9 questions)
 */
export function getRemainingQuestionsForUniversity(university: FranceUniversity): FranceQuestionItem[] {
  const pool = getQuestionPoolForUniversity(university)
  return pool.slice(1) // Remove first question
}

/**
 * Fallback question by index for France interviews
 */
export function franceFallbackQuestionByIndex(index: number, university: FranceUniversity): FranceQuestionItem {
  const pool = getQuestionPoolForUniversity(university)
  const i = (index - 1) % pool.length
  return pool[i]
}


