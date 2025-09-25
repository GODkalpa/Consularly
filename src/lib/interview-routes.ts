import { mapQuestionTypeToF1Category } from './f1-questions-data'

// Types and helpers for multi-country interview routes
export type InterviewRoute = 'usa_f1' | 'uk_student'

export const routeDisplayName: Record<InterviewRoute, string> = {
  usa_f1: 'USA (F1 Student)',
  uk_student: 'UK (Student / Pre-CAS)',
}

// Prefer using country-specific category labels for the UI badge
export function mapQuestionTypeToCategory(route: InterviewRoute, questionType: string): string {
  if (route === 'usa_f1') return mapQuestionTypeToF1Category(questionType)
  // UK mapping
  const ukMap: Record<string, string> = {
    academic: 'Course & University Fit',
    financial: 'Financial Requirement',
    intent: 'Post-study Plans & Ties',
    background: 'Genuine Student & Background',
    'follow-up': 'Credibility Follow-up',
  }
  return ukMap[questionType] || 'Genuine Student & Background'
}

export function defaultVisaTypeForRoute(route: InterviewRoute): 'F1' | 'B1/B2' | 'H1B' | 'other' {
  switch (route) {
    case 'usa_f1':
      return 'F1'
    case 'uk_student':
      return 'other'
    default:
      return 'other'
  }
}
