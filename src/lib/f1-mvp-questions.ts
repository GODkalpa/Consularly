/**
 * F1 MVP Eight-Question Flow (Doc-Free, Window-Style)
 * Per MVP document section 3
 */

export interface F1MVPQuestion {
  id: string
  question: string
  questionType: 'academic' | 'financial' | 'intent' | 'background'
  memoryKeys?: string[]
  followUpIfVague?: string
  followUpIfNoNumber?: string
  followUpIfUSCentric?: string
}

/**
 * Core 8 questions for US F1 interviews (window-style, doc-free)
 * Cap at ≤10 total including follow-ups
 */
export const F1_MVP_CORE_QUESTIONS: F1MVPQuestion[] = [
  {
    id: 'q1_university_program',
    question: 'Why this university and program?',
    questionType: 'academic',
    memoryKeys: [],
    followUpIfVague: 'Name 2 specific features like a course, lab, professor, or track.',
  },
  {
    id: 'q2_total_cost',
    question: "What's your total first-year cost?",
    questionType: 'financial',
    memoryKeys: ['total_cost'],
    followUpIfNoNumber: "An estimate is fine, tuition plus living expenses.",
  },
  {
    id: 'q3_payment_plan',
    question: 'How will you pay for it?',
    questionType: 'financial',
    memoryKeys: ['sponsor', 'scholarship_amount', 'loan_amount'],
    followUpIfNoNumber: 'Approximate split, sponsor percentage, scholarship percentage, loan percentage?',
  },
  {
    id: 'q4_sponsor_occupation',
    question: 'What does your sponsor do?',
    questionType: 'financial',
    memoryKeys: ['sponsor_occupation'],
    followUpIfVague: 'Is that salary, business, or savings?',
  },
  {
    id: 'q5_background_fit',
    question: 'How does this program fit your background?',
    questionType: 'academic',
    memoryKeys: [],
    followUpIfVague: 'Give one past course or project that leads into this.',
  },
  {
    id: 'q6_post_graduation',
    question: 'What will you do after graduation?',
    questionType: 'intent',
    memoryKeys: ['post_study_role', 'target_country'],
    followUpIfUSCentric: 'Name a role and sector in Nepal you will target.',
  },
  {
    id: 'q7_relatives_us',
    question: 'Do you have relatives in the U.S.?',
    questionType: 'background',
    memoryKeys: ['relatives_us'],
    followUpIfVague: 'Who, and what status?',
  },
  {
    id: 'q8_final',
    question: 'Anything else I should know?',
    questionType: 'background',
    memoryKeys: [],
  },
]

/**
 * Get question by index (0-based)
 */
export function getF1MVPQuestion(index: number): F1MVPQuestion | undefined {
  return F1_MVP_CORE_QUESTIONS[index]
}

/**
 * Get total core question count
 */
export function getF1MVPQuestionCount(): number {
  return F1_MVP_CORE_QUESTIONS.length
}
