/**
 * Interview Configuration by Country
 * Fixed settings per country - no modes or difficulty levels
 */

export type InterviewCountry = 'usa' | 'uk' | 'france';

export interface CountryInterviewConfig {
  country: InterviewCountry;
  name: string;
  questionCount: number;
  prepTime?: number; // seconds - prep time before answering (UK/France only)
  answerTime: number; // seconds - time to answer
}

// ===== COUNTRY CONFIGURATIONS =====

export const COUNTRY_CONFIGS: Record<InterviewCountry, CountryInterviewConfig> = {
  usa: {
    country: 'usa',
    name: 'USA F1 Student Visa',
    questionCount: 8,
    answerTime: 30, // 30 seconds per answer, no prep time
  },
  uk: {
    country: 'uk',
    name: 'UK Student Visa',
    questionCount: 16, // Results in exactly 15 questions asked (counter starts at 1, ends when counter reaches this value)
    prepTime: 15, // 15 seconds to prepare
    answerTime: 90, // 90 seconds to answer
  },
  france: {
    country: 'france',
    name: 'France Student Visa',
    questionCount: 15, // 15 for EMA, 10 for ICN (handled separately)
    prepTime: 30, // 30 seconds to prepare
    answerTime: 90, // 90 seconds to answer
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get country configuration
 */
export function getCountryConfig(country: string): CountryInterviewConfig {
  // Map route names to country codes
  const countryMap: Record<string, InterviewCountry> = {
    'usa_f1': 'usa',
    'usa': 'usa',
    'uk_student': 'uk',
    'uk': 'uk',
    'france_ema': 'france',
    'france_icn': 'france',
    'france': 'france',
  };

  const countryCode = countryMap[country.toLowerCase()] || 'usa';
  return COUNTRY_CONFIGS[countryCode];
}

/**
 * Get question count for a country
 */
export function getQuestionCount(country: string): number {
  return getCountryConfig(country).questionCount;
}

/**
 * Get answer time for a country
 */
export function getAnswerTime(country: string): number {
  return getCountryConfig(country).answerTime;
}

/**
 * Get prep time for a country (if applicable)
 */
export function getPrepTime(country: string): number | undefined {
  return getCountryConfig(country).prepTime;
}

