/**
 * UK Student (Pre-CAS / Credibility) Question Pool
 * Derived from real UK interview/pre-CAS screening themes.
 */

export type UKQuestionType = 'academic' | 'financial' | 'intent' | 'background' | 'follow-up'

export interface UKQuestionItem {
  question: string
  questionType: UKQuestionType
  difficulty?: 'easy' | 'medium' | 'hard'
  expectedAnswerLength?: 'short' | 'medium' | 'long'
}

export const UK_QUESTION_POOL: UKQuestionItem[] = [
  { question: "Which Visa Application Centre will you use to apply for your UK student visa? Please specify the city and centre name.", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'short' },
  { question: "How much did the total cost of studying in the UK influence your decision to choose this course and university?", questionType: 'financial', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "Have you ever received a visa refusal? If yes, explain when, where, and the reason.", questionType: 'follow-up', difficulty: 'medium', expectedAnswerLength: 'short' },
  { question: "What are the rules for international students working in the UK during term-time and vacations?", questionType: 'follow-up', difficulty: 'medium', expectedAnswerLength: 'short' },
  { question: "How will you use the contacts you make at university to help you after you finish your studies?", questionType: 'intent', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "How will what you learn in your course help you in your future job?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'long' },
  { question: "What unique opportunities or resources available in the UK will benefit your education?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "What specific skills or knowledge do you plan to develop in this course to support your career goals?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "What did you research and compare about different UK universities before deciding on this one?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "What were the benefits and drawbacks of other universities you considered before making your final decision?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "What amenities or features were you looking for in accommodation (e.g., private vs shared facilities) and what have you arranged so far?", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'short' },
  { question: "Do you intend to work while studying in the UK? If yes, how will you balance work and academic commitments?", questionType: 'follow-up', difficulty: 'medium', expectedAnswerLength: 'short' },
  { question: "Why is the UK's mix of cultures important in your choice to study there?", questionType: 'background', difficulty: 'easy', expectedAnswerLength: 'medium' },
  { question: "What professional and personal challenges do you expect after graduation, and how will you address them?", questionType: 'intent', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "How will your course be assessed (e.g., exams, coursework, projects)?", questionType: 'academic', difficulty: 'easy', expectedAnswerLength: 'short' },
  { question: "What is your estimated weekly living expense budget (food, travel, phone, study materials, socialising)?", questionType: 'financial', difficulty: 'medium', expectedAnswerLength: 'short' },
  { question: "What research have you done on the cost of living in the UK and in your city of study?", questionType: 'financial', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "Is the course you are applying to linked to your 5-year career plan? Explain the connection.", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "What is your most recent qualification, and how does it relate to this course and your future plans?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "Tell me about your recent studies and/or work. Why return to full-time education now?", questionType: 'background', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "How does this university's reputation and ranking influence your decision to study here?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'short' },
  { question: "Who is your education agent, and did they choose this university for you? What was your own decision process?", questionType: 'follow-up', difficulty: 'medium', expectedAnswerLength: 'short' },
  { question: "What other UK universities did you research for this course? Why is your chosen university the best fit?", questionType: 'academic', difficulty: 'medium', expectedAnswerLength: 'medium' },
  { question: "Can you compare Nepal's education system with the UK's and explain why the UK route is appropriate for you?", questionType: 'background', difficulty: 'medium', expectedAnswerLength: 'medium' },
]

export function ukFallbackQuestionByIndex(index: number): UKQuestionItem {
  const i = (index - 1) % UK_QUESTION_POOL.length
  return UK_QUESTION_POOL[i]
}
