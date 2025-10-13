import { mapQuestionTypeToF1Category } from './f1-questions-data'
import { FranceUniversity } from './france-questions-data'

// Types and helpers for multi-country interview routes
export type InterviewRoute = 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn'

export const routeDisplayName: Record<InterviewRoute, string> = {
  usa_f1: 'USA (F1 Student)',
  uk_student: 'UK (Student / Pre-CAS)',
  france_ema: 'France - EMA',
  france_icn: 'France - ICN Business School',
}

// Prefer using country-specific category labels for the UI badge
export function mapQuestionTypeToCategory(route: InterviewRoute, questionType: string): string {
  if (route === 'usa_f1') return mapQuestionTypeToF1Category(questionType)
  
  // France mapping (similar to UK)
  if (route === 'france_ema' || route === 'france_icn') {
    const franceMap: Record<string, string> = {
      academic: 'Course & Career Alignment',
      financial: 'Financial Support',
      intent: 'Career Plans & Goals',
      background: 'Academic & Personal Background',
      'follow-up': 'Clarification Follow-up',
    }
    return franceMap[questionType] || 'Academic & Personal Background'
  }
  
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
    case 'france_ema':
    case 'france_icn':
      return 'other'
    default:
      return 'other'
  }
}

/**
 * Extract France university from route
 */
export function getFranceUniversityFromRoute(route: InterviewRoute): FranceUniversity | null {
  if (route === 'france_ema') return 'ema'
  if (route === 'france_icn') return 'icn'
  return null
}
