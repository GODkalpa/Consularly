import type { InterviewRoute } from './interview-routes'

/**
 * Interface for per-answer summary used in compressed prompts
 */
export interface AnswerSummary {
  questionNumber: number
  questionType: string
  difficulty: string
  scores: {
    content: number
    speech: number
    bodyLanguage: number
    overall: number
  }
  answerLength: number
  wordCount: number
  excerpt: string
  redFlags?: string[]
}

/**
 * Interface for conversation history entry
 */
export interface ConversationEntry {
  question: string
  answer: string
  timestamp?: string
  questionType?: string
  difficulty?: string
}

/**
 * Interface for per-answer scores
 */
export interface PerAnswerScore {
  overall: number
  categories: {
    content: number
    speech: number
    bodyLanguage: number
  }
}

/**
 * Build a compact answer summary from conversation entry and scores
 * Reduces token usage by ~70% compared to full transcript
 */
export function buildAnswerSummary(
  entry: ConversationEntry,
  score: PerAnswerScore,
  index: number
): AnswerSummary {
  const words = entry.answer.trim().split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const answerLength = entry.answer.length
  
  // Extract first 100 characters as excerpt
  const excerpt = entry.answer.substring(0, 100).trim()
  
  // Detect red flags in answer
  const redFlags: string[] = []
  const lowerAnswer = entry.answer.toLowerCase()
  
  // Financial red flags
  if (lowerAnswer.includes('sufficient') && !lowerAnswer.match(/\d+/)) {
    redFlags.push('Vague financial terms without specific amounts')
  }
  
  // Agent dependency red flags
  if (lowerAnswer.match(/agent|consultant/i) && lowerAnswer.match(/told|said|advised/i)) {
    redFlags.push('Heavy reliance on agent/consultant')
  }
  
  // Vague accommodation
  if (lowerAnswer.match(/accommodation|housing/i) && lowerAnswer.match(/will find|will look|will arrange/i)) {
    redFlags.push('No concrete accommodation plan')
  }
  
  // Very brief answers (< 10 words)
  if (wordCount < 10) {
    redFlags.push(`Very brief answer (${wordCount} words)`)
  }
  
  return {
    questionNumber: index + 1,
    questionType: entry.questionType || 'unknown',
    difficulty: entry.difficulty || 'medium',
    scores: {
      content: Math.round(score.categories.content),
      speech: Math.round(score.categories.speech),
      bodyLanguage: Math.round(score.categories.bodyLanguage),
      overall: Math.round(score.overall)
    },
    answerLength,
    wordCount,
    excerpt: excerpt + (entry.answer.length > 100 ? '...' : ''),
    redFlags: redFlags.length > 0 ? redFlags : undefined
  }
}

/**
 * Build optimized prompt with compressed answer summaries
 * Returns both system and user prompts
 */
export function buildOptimizedPrompt(
  route: InterviewRoute,
  studentProfile: any,
  conversationHistory: ConversationEntry[],
  perAnswerScores: PerAnswerScore[]
): { system: string; user: string; tokenEstimate: number } {
  const isUKFrance = route === 'uk_student' || route === 'france_ema' || route === 'france_icn'
  const countryName = route === 'uk_student' ? 'UK' : route.startsWith('france_') ? 'France' : 'USA'
  
  // Build answer summaries
  const summaries = conversationHistory.map((entry, i) => 
    buildAnswerSummary(entry, perAnswerScores[i] || { overall: 0, categories: { content: 0, speech: 0, bodyLanguage: 0 } }, i)
  )
  
  // Calculate aggregate scores
  const avgOverall = summaries.reduce((sum, s) => sum + s.scores.overall, 0) / summaries.length
  const avgContent = summaries.reduce((sum, s) => sum + s.scores.content, 0) / summaries.length
  const avgSpeech = summaries.reduce((sum, s) => sum + s.scores.speech, 0) / summaries.length
  const avgBody = summaries.reduce((sum, s) => sum + s.scores.bodyLanguage, 0) / summaries.length
  
  // Collect all red flags
  const allRedFlags = summaries.flatMap(s => s.redFlags || [])
  
  // Build ultra-concise system prompt (reduced from ~2000 tokens to ~500 tokens)
  // UK SCORING FIX: Updated thresholds (70 for accepted, 50 for rejected)
  const system = isUKFrance
    ? `${countryName} visa evaluator. Assess interview performance.

CRITERIA: courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent, communication

THRESHOLDS (UPDATED - more achievable):
- accepted: Overall ≥70, no major red flags
- borderline: Overall 50-69 OR minor flags
- rejected: Overall <50 OR major flags

RED FLAGS: No course modules, ${route === 'uk_student' ? 'no 28-day rule' : 'no financial docs'}, vague accommodation, agent dependency, contradictions

JSON: decision, overall, dimensions, summary (2-3 para), detailedInsights (8-12), strengths, weaknesses, recommendations`
    : `US F1 visa evaluator. Assess interview.

CRITERIA: communication, content, financials, intent

THRESHOLDS:
- accepted: All >75, no flags
- borderline: 60-75, minor issues
- rejected: <60 OR major flags

RED FLAGS: Financial vagueness, contradictions, weak return intent, no program fit

JSON: decision, overall, dimensions, summary (2-3 para), detailedInsights (8-12), strengths, weaknesses, recommendations`
  
  // Build ultra-compressed user prompt (reduced from ~3000 tokens to ~700 tokens)
  const summaryLines = summaries.map(s => {
    const redFlagText = s.redFlags ? ` ⚠️${s.redFlags.length}` : ''
    return `Q${s.questionNumber}: ${s.scores.overall}/100 (C${s.scores.content} S${s.scores.speech} B${s.scores.bodyLanguage}) ${s.wordCount}w${redFlagText}`
  }).join('\n')
  
  const dimensionsSchema = route === 'uk_student'
    ? `"courseAndUniversityFit":n,"financialRequirement":n,"accommodationLogistics":n,"complianceCredibility":n,"postStudyIntent":n,`
    : `"content":n,"financials":n,"intent":n,`
  
  const uniqueFlags = [...new Set(allRedFlags)]
  const flagsSummary = uniqueFlags.length > 0 ? `\nFLAGS: ${uniqueFlags.slice(0, 3).join('; ')}` : ''
  
  const user = `${studentProfile.name} (${studentProfile.country}) → ${studentProfile.intendedUniversity || 'N/A'}

SCORES (${summaries.length}Q):
${summaryLines}

AVG: Overall ${Math.round(avgOverall)} | Content ${Math.round(avgContent)} | Speech ${Math.round(avgSpeech)} | Body ${Math.round(avgBody)}${flagsSummary}

JSON:
{"decision":"accepted|rejected|borderline","overall":n,"dimensions":{"communication":n,${dimensionsSchema}},"summary":"2-3 para","detailedInsights":[{"category":"...","type":"strength|weakness","finding":"...","actionItem":"..."}],"strengths":["..."],"weaknesses":["..."],"recommendations":["..."]}`
  
  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const tokenEstimate = Math.ceil((system.length + user.length) / 4)
  
  return { system, user, tokenEstimate }
}

/**
 * Count tokens in a string (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

/**
 * Log prompt compression metrics
 */
export function logPromptMetrics(
  originalPrompt: { system: string; user: string },
  optimizedPrompt: { system: string; user: string; tokenEstimate: number }
): void {
  const originalTokens = estimateTokenCount(originalPrompt.system + originalPrompt.user)
  const optimizedTokens = optimizedPrompt.tokenEstimate
  const reduction = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100)
  
  console.log('📊 Prompt Compression Metrics:', {
    originalTokens,
    optimizedTokens,
    reduction: `${reduction}%`,
    originalSystemLength: originalPrompt.system.length,
    optimizedSystemLength: optimizedPrompt.system.length,
    originalUserLength: originalPrompt.user.length,
    optimizedUserLength: optimizedPrompt.user.length,
  })
}
