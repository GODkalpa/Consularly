/**
 * F1 MVP Session Memory - Doc-Free Self-Consistency Tracking
 * Per the MVP document section 6
 */

export interface F1SessionMemory {
  total_cost?: number
  sponsor?: string
  scholarship_amount?: number
  loan_amount?: number
  sponsor_occupation?: string
  post_study_role?: string
  target_country?: string
  relatives_us?: boolean
}

/**
 * Extract currency numbers from text (supports $, NPR, "k" notation)
 */
function extractCurrencyNumbers(text: string): number[] {
  const numbers: number[] = []
  
  // Match patterns like: $50,000 | $50k | 50000 | 50k | NPR 5000000
  const patterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*k/gi, // $50k
    /\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)/g, // $50,000
    /NPR\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi, // NPR 5000000
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*k/gi, // 50k
    /(\d+(?:,\d{3})*(?:\.\d+)?)/g, // 50000
  ]
  
  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern))
    for (const match of matches) {
      let num = parseFloat(match[1].replace(/,/g, ''))
      if (match[0].toLowerCase().includes('k')) {
        num *= 1000
      }
      if (!isNaN(num) && num > 0) {
        numbers.push(num)
      }
    }
  }
  
  return numbers
}

/**
 * Extract role/job title from text
 */
function extractRole(text: string): string | undefined {
  const rolePatterns = [
    /(?:work as|job as|position as|role as|become a?)\s+([a-z\s]+?)(?:\.|,|in|at|$)/gi,
    /(?:software|data|business|marketing|financial|research)\s+(?:engineer|analyst|scientist|manager|developer)/gi,
  ]
  
  for (const pattern of rolePatterns) {
    const match = pattern.exec(text)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return undefined
}

/**
 * Extract sponsor from text
 */
function extractSponsor(text: string): string | undefined {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('father')) return 'father'
  if (lowerText.includes('mother')) return 'mother'
  if (lowerText.includes('parents')) return 'parents'
  if (lowerText.includes('self')) return 'self'
  if (lowerText.includes('uncle') || lowerText.includes('aunt')) return 'relative'
  return undefined
}

/**
 * Extract country mention
 */
function extractCountry(text: string): string | undefined {
  const countries = ['nepal', 'us', 'usa', 'united states', 'india', 'china']
  const lowerText = text.toLowerCase()
  for (const country of countries) {
    if (lowerText.includes(country)) {
      return country === 'us' || country === 'usa' || country === 'united states' ? 'US' : country
    }
  }
  return undefined
}

/**
 * Update session memory based on answer (TS implementation of MVP pseudocode)
 */
export function updateMemory(memory: F1SessionMemory, answer: string, questionType?: string): F1SessionMemory {
  const nums = extractCurrencyNumbers(answer)
  const role = extractRole(answer)
  const updatedMemory = { ...memory }
  
  // Total cost detection
  if (/(total|year|tuition|cost)/i.test(answer) && nums[0]) {
    updatedMemory.total_cost ??= nums[0]
  }
  
  // Scholarship amount
  if (/scholar/i.test(answer) && nums[0]) {
    updatedMemory.scholarship_amount ??= nums[0]
  }
  
  // Loan amount
  if (/loan/i.test(answer) && nums[0]) {
    updatedMemory.loan_amount ??= nums[0]
  }
  
  // Sponsor
  if (/(father|mother|self|sponsor|parent)/i.test(answer)) {
    updatedMemory.sponsor ??= extractSponsor(answer)
  }
  
  // Sponsor occupation (for financial questions)
  if (questionType === 'financial' && /(business|engineer|doctor|teacher|occupation|profession|work)/i.test(answer)) {
    const occMatch = answer.match(/(?:is a|works as|profession is)\s+([a-z\s]+?)(?:\.|,|$)/i)
    if (occMatch && occMatch[1]) {
      updatedMemory.sponsor_occupation ??= occMatch[1].trim()
    }
  }
  
  // Post-study plans
  if (/(after|graduate|post[- ]study|future|plan|career)/i.test(answer)) {
    updatedMemory.post_study_role ??= role
    updatedMemory.target_country ??= extractCountry(answer)
  }
  
  // Relatives in US
  if (/(relative|uncle|aunt|cousin|family)/i.test(answer) && /U\.?S\.?/i.test(answer)) {
    updatedMemory.relatives_us = true
  }
  
  return updatedMemory
}

/**
 * Check for contradictions in session memory
 */
export type ContradictionLevel = 'none' | 'minor' | 'major'

export function checkContradiction(memory: F1SessionMemory, answer: string): ContradictionLevel {
  const nums = extractCurrencyNumbers(answer)
  
  if (memory.total_cost && nums[0]) {
    const delta = Math.abs(nums[0] - memory.total_cost) / memory.total_cost
    if (delta > 0.2) return 'major' // >20% difference
    if (delta > 0.1) return 'minor' // >10% difference
  }
  
  return 'none'
}

/**
 * Determine if answer needs follow-up (vague, missing numbers, etc.)
 */
export function needsFollowUp(
  questionType: string,
  answer: string,
  memory: F1SessionMemory
): { needed: boolean; reason?: string } {
  const hasNumber = extractCurrencyNumbers(answer).length > 0
  const answerLength = answer.trim().length
  
  // Financial questions must have numbers
  if (questionType === 'financial' && !hasNumber && answerLength < 100) {
    return { needed: true, reason: 'finance_no_number' }
  }
  
  // Check contradiction
  const contradiction = checkContradiction(memory, answer)
  if (contradiction !== 'none') {
    return { needed: true, reason: `contradiction_${contradiction}` }
  }
  
  // Very short answers (less than 30 chars) are typically vague
  if (answerLength < 30) {
    return { needed: true, reason: 'too_vague' }
  }
  
  return { needed: false }
}
