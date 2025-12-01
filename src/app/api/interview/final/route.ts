import { NextRequest, NextResponse } from 'next/server'
import { selectLLMProvider, callLLMProvider, logProviderSelection, type InterviewRoute, type LLMProviderConfig } from '@/lib/llm-provider-selector'
import type { DetailedInsight } from '@/types/firestore'
import { buildOptimizedPrompt, logPromptMetrics, type ConversationEntry, type PerAnswerScore } from '@/lib/prompt-compression'
import { performanceTracker, createEvaluationMetric } from '@/lib/performance-benchmark'
import { UK_SCORING_CONFIG, checkScoreDiscrepancy } from '@/lib/f1-mvp-config'
import { detectScoringAnomaly, type ScoringAnomaly } from '@/lib/uk-score-validator'

// Final interview evaluation focused on UK pre-CAS metrics with graceful fallback
// Request body:
// {
//   route: 'uk_student' | 'usa_f1',
//   studentProfile: { name: string; country: string; intendedUniversity?: string; fieldOfStudy?: string; previousEducation?: string },
//   conversationHistory: Array<{ question: string; answer: string; timestamp?: string; questionType?: string; difficulty?: string }>
// }
// Response body: FinalReport interface

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { route, studentProfile, conversationHistory, perAnswerScores } = body as {
      route?: 'uk_student' | 'usa_f1'
      studentProfile: { name: string; country: string; intendedUniversity?: string; fieldOfStudy?: string; previousEducation?: string }
      conversationHistory: Array<{ question: string; answer: string; timestamp?: string; questionType?: string; difficulty?: string }>
      perAnswerScores?: Array<{ overall: number; categories: { content: number; speech: number; bodyLanguage: number } }>
    }

    if (!studentProfile || !Array.isArray(conversationHistory)) {
      return NextResponse.json({ error: 'Missing studentProfile or conversationHistory' }, { status: 400 })
    }

    // CRITICAL FIX: Combine per-answer scores with LLM evaluation for consistency
    const avgPerAnswerScore = perAnswerScores && perAnswerScores.length > 0
      ? perAnswerScores.reduce((sum, s) => sum + s.overall, 0) / perAnswerScores.length
      : null
    
    console.log('📄 Final evaluation:', {
      route,
      answersCount: conversationHistory.length,
      perAnswerScoresCount: perAnswerScores?.length || 0,
      avgPerAnswerScore: avgPerAnswerScore ? Math.round(avgPerAnswerScore) : 'N/A',
    })
    
    // Try LLM-based final evaluation using provider selector
    try {
      console.log('[Final Evaluation] Starting LLM evaluation...')
      const llmRes = await evaluateWithLLM({ route, studentProfile, conversationHistory, perAnswerScores })
      if (llmRes) {
        console.log('[Final Evaluation] ✅ LLM evaluation succeeded')
        return NextResponse.json(llmRes)
      } else {
        console.warn('[Final Evaluation] ⚠️ LLM evaluation returned null')
      }
    } catch (e) {
      console.error('LLM final evaluation failed:', e)
      // fall through to heuristics
    }

    // Heuristic fallback (deterministic, no external calls)
    const fallback = evaluateHeuristically(route, conversationHistory, perAnswerScores)
    return NextResponse.json(fallback)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Final scoring error:', e)
    return NextResponse.json({
      decision: 'borderline',
      overall: 60,
      dimensions: { communication: 60, credibility: 60 },
      summary: 'Final AI evaluation failed due to a technical error. This is a conservative heuristic result based on general interview standards. The applicant should retake the interview for a proper assessment, as technical issues prevented detailed analysis.',
      detailedInsights: [
        {
          category: 'Content Quality',
          type: 'weakness',
          finding: 'Unable to analyze due to technical error',
          actionItem: 'Please retake the interview for proper AI analysis'
        }
      ],
      strengths: [],
      weaknesses: ['Technical error prevented proper evaluation'],
      recommendations: ['Provide concrete details (numbers, names, evidence).', 'Clarify finances (maintenance funds, 28-day rule) and accommodation plans.'],
    })
  }
}

/**
 * Build a degraded (more minimal) prompt for retry attempts
 * Further reduces token count by removing examples and detailed instructions
 */
function buildDegradedPrompt(
  route: InterviewRoute,
  studentProfile: any,
  perAnswerScores: PerAnswerScore[]
): { system: string; user: string } {
  const isUKFrance = route === 'uk_student' || route === 'france_ema' || route === 'france_icn'
  const countryName = route === 'uk_student' ? 'UK' : route.startsWith('france_') ? 'France' : 'USA'
  
  // Ultra-minimal system prompt with updated UK thresholds
  const system = isUKFrance
    ? `${countryName} visa evaluator. Evaluate interview performance.

CRITERIA: courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent, communication

THRESHOLDS (UPDATED - more achievable):
- accepted: Overall ≥70, no major red flags
- borderline: Overall 50-69 OR minor red flags
- rejected: Overall <50 OR major red flags

Return JSON: decision, overall, dimensions, summary, detailedInsights, strengths, weaknesses, recommendations.`
    : `US F1 visa evaluator. Evaluate interview performance.

CRITERIA: communication, content, financials, intent

THRESHOLDS:
- accepted: All >75, no red flags
- borderline: Mixed 60-75
- rejected: Any <60 OR red flags

Return JSON: decision, overall, dimensions, summary, detailedInsights, strengths, weaknesses, recommendations.`
  
  // Calculate aggregate scores only
  const avgOverall = perAnswerScores.reduce((sum, s) => sum + s.overall, 0) / perAnswerScores.length
  const avgContent = perAnswerScores.reduce((sum, s) => sum + s.categories.content, 0) / perAnswerScores.length
  const avgSpeech = perAnswerScores.reduce((sum, s) => sum + s.categories.speech, 0) / perAnswerScores.length
  const avgBody = perAnswerScores.reduce((sum, s) => sum + s.categories.bodyLanguage, 0) / perAnswerScores.length
  
  const dimensionsSchema = route === 'uk_student'
    ? `"courseAndUniversityFit": number, "financialRequirement": number, "accommodationLogistics": number, "complianceCredibility": number, "postStudyIntent": number,`
    : `"content": number, "financials": number, "intent": number,`
  
  // Ultra-minimal user prompt with only aggregate scores
  const user = `STUDENT: ${studentProfile.name} (${studentProfile.country})
UNIVERSITY: ${studentProfile.intendedUniversity || 'N/A'}

SCORES (${perAnswerScores.length} questions):
Overall: ${Math.round(avgOverall)}/100
Content: ${Math.round(avgContent)}/100
Speech: ${Math.round(avgSpeech)}/100
Body: ${Math.round(avgBody)}/100

JSON OUTPUT:
{"decision": "accepted|rejected|borderline", "overall": <0-100>, "dimensions": {"communication": <0-100>, ${dimensionsSchema}}, "summary": "<2 paragraphs>", "detailedInsights": [{"category": "...", "type": "strength|weakness", "finding": "...", "actionItem": "..."}], "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."]}`
  
  return { system, user }
}

/**
 * Select the best available LLM provider for final evaluation.
 * Uses the central selector so env-configured models (e.g. Kimi) are respected.
 */
function selectFastestProvider(route: InterviewRoute): LLMProviderConfig | null {
  const config = selectLLMProvider(route, 'final_evaluation')
  if (!config) {
    console.warn('[Final Evaluation] No LLM provider available from selector')
    return null
  }
  console.log(`🚀 [Fast Provider] Selected ${config.provider} (${config.model}) for final evaluation`)
  return config
}

async function evaluateWithLLM({ route, studentProfile, conversationHistory, perAnswerScores }: { 
  route?: InterviewRoute; 
  studentProfile: any; 
  conversationHistory: any[];
  perAnswerScores?: Array<{ overall: number; categories: { content: number; speech: number; bodyLanguage: number } }>;
}) {
  const effectiveRoute: InterviewRoute = route || 'usa_f1'
  
  // OPTIMIZATION: Use fast provider selection for final evaluation
  const config = selectFastestProvider(effectiveRoute)
  if (!config) {
    console.warn('[Final Evaluation] No provider available')
    return null
  }
  
  logProviderSelection(effectiveRoute, 'final_evaluation', config)
  
  // OPTIMIZATION: Use compressed prompts if per-answer scores are available
  // Allow slight mismatch (e.g., 6 scores for 8 questions) by requiring at least 75% coverage
  const hasEnoughScores = perAnswerScores && perAnswerScores.length > 0 && 
    perAnswerScores.length >= Math.floor(conversationHistory.length * 0.75)
  
  if (hasEnoughScores) {
    console.log('📊 Using optimized prompt compression')
    const startTime = performance.now()
    
    // Pad perAnswerScores to match conversationHistory length if needed
    const paddedScores: PerAnswerScore[] = conversationHistory.map((_, i) => 
      perAnswerScores![i] || { overall: 0, categories: { content: 0, speech: 0, bodyLanguage: 0 } }
    )
    
    const { system, user, tokenEstimate } = buildOptimizedPrompt(
      effectiveRoute,
      studentProfile,
      conversationHistory as ConversationEntry[],
      paddedScores
    )
    
    const promptBuildTime = performance.now() - startTime
    console.log(`📉 Optimized prompt: ~${tokenEstimate} tokens (built in ${Math.round(promptBuildTime)}ms)`)
    
    // RETRY LOGIC: Attempt 1 with MegaLLM, Attempt 2 with Groq fallback
    let response: any
    let llmCallTime: number
    let attempt = 1
    const maxAttempts = 2
    let currentConfig = config
    
    while (attempt <= maxAttempts) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxAttempts}`)
        const llmStartTime = performance.now()
        
        if (attempt === 1) {
          // Attempt 1: Full optimized prompt with MegaLLM (45s timeout, 4096 max tokens)
          // Note: MegaLLM/Claude Haiku needs 20-30s for complex structured JSON with 16 Q&A pairs
          response = await callLLMProvider(currentConfig, system, user, 0.3, 4096, 45000)
        } else {
          // Attempt 2: Retry with same optimized prompt but longer timeout (60s)
          // Don't degrade the prompt - the issue is timeout, not prompt size
          console.log('⚠️ Retrying with extended timeout (60s)')
          response = await callLLMProvider(currentConfig, system, user, 0.3, 4096, 60000)
        }
        
        llmCallTime = performance.now() - llmStartTime
        console.log(`⚡ LLM response time: ${Math.round(llmCallTime)}ms (${currentConfig.provider}/${currentConfig.model})`)
        break // Success, exit retry loop
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} failed:`, error?.message)
        if (attempt === maxAttempts) {
          throw error // Re-throw on final attempt
        }
        attempt++
        // Small backoff delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    const totalTime = performance.now() - startTime
    console.log(`📊 Performance metrics:`, {
      promptBuildMs: Math.round(promptBuildTime),
      llmCallMs: Math.round(llmCallTime!),
      totalMs: Math.round(totalTime),
      estimatedTokens: tokenEstimate,
      provider: config.provider,
      model: config.model,
      attempts: attempt
    })
    const content = response.content
    if (!content) throw new Error('No LLM content returned')
    
    const parseStartTime = performance.now()
    try {
      const parsed = JSON.parse(content)
      const parseTime = performance.now() - parseStartTime
      
      // Track performance metrics
      performanceTracker.logMetric(createEvaluationMetric(
        'interview-' + Date.now(),
        effectiveRoute,
        conversationHistory.length,
        {
          promptBuild: promptBuildTime,
          llmCall: llmCallTime!,
          parse: parseTime,
          total: totalTime
        },
        {
          prompt: tokenEstimate,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || tokenEstimate
        },
        config.provider,
        config.model,
        attempt - 1,
        true,
        undefined
      ))
      
      // basic sanity checks
      const decision = (['accepted', 'rejected', 'borderline'].includes(parsed.decision) ? parsed.decision : 'borderline') as 'accepted' | 'rejected' | 'borderline'
      const overall = Math.max(0, Math.min(100, Number(parsed.overall) || 0))
      const dimensions = parsed.dimensions && typeof parsed.dimensions === 'object' ? parsed.dimensions : {}
      const summary = String(parsed.summary || '').slice(0, 3000)
      
      // Parse detailed insights with validation
      const detailedInsights: DetailedInsight[] = Array.isArray(parsed.detailedInsights)
        ? parsed.detailedInsights.slice(0, 12).map((insight: any) => ({
            category: insight.category || 'Content Quality',
            type: insight.type === 'strength' || insight.type === 'weakness' ? insight.type : 'weakness',
            finding: String(insight.finding || '').slice(0, 300),
            example: insight.example ? String(insight.example).slice(0, 300) : undefined,
            actionItem: String(insight.actionItem || '').slice(0, 300)
          }))
        : []
      
      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5).map((s: any) => String(s).slice(0, 200)) : []
      const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5).map((w: any) => String(w).slice(0, 200)) : []
      const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 10) : []
      
      return { decision, overall, dimensions, summary, detailedInsights, strengths, weaknesses, recommendations }
    } catch (error: any) {
      // Track parse error
      performanceTracker.logMetric(createEvaluationMetric(
        'interview-' + Date.now(),
        effectiveRoute,
        conversationHistory.length,
        {
          promptBuild: promptBuildTime,
          llmCall: llmCallTime!,
          parse: performance.now() - parseStartTime,
          total: totalTime
        },
        {
          prompt: tokenEstimate,
          completion: 0,
          total: tokenEstimate
        },
        config.provider,
        config.model,
        attempt - 1,
        false,
        'JSON parse error: ' + (error?.message || 'Unknown')
      ))
      return null
    }
  }
  
  // FALLBACK: Use original prompt format if per-answer scores not available
  console.log('⚠️ Using legacy prompt format (no per-answer scores)')
  const isUKFrance = effectiveRoute === 'uk_student' || effectiveRoute === 'france_ema' || effectiveRoute === 'france_icn'
  const countryName = effectiveRoute === 'uk_student' ? 'UK' : effectiveRoute.startsWith('france_') ? 'France' : 'UK'
  
  const system = isUKFrance
    ? `You are a STRICT ${countryName} visa credibility evaluator conducting FINAL assessment. Review the ENTIRE interview and make a FINAL DECISION based on real visa refusal patterns.

CRITICAL EVALUATION CRITERIA (European Student Visa Standards):
1. **courseAndUniversityFit** (0-100):
   - Can name 3+ specific modules/courses from chosen program (not generic "business" or "IT")
   - Explains why THIS course fits their background/career goals (not just ranking)
   - Shows independent research (faculty, facilities, course structure)
   - RED FLAG: Only knows university reputation, cannot discuss course content

2. **financialRequirement** (0-100):
   - Knows exact financial requirements (${effectiveRoute === 'uk_student' ? '£18,000+ for London' : 'specific amounts in euros'})
   - ${effectiveRoute === 'uk_student' ? 'Understands 28-day bank balance rule explicitly' : 'Clear documentation of financial support'}
   - Clear tuition + living cost breakdown
   - RED FLAG: Says "sufficient funds" without specific amounts

3. **accommodationLogistics** (0-100):
   - Specific plan: location name, cost per week/month, pre-booked or planned
   - RED FLAG: "I'll find somewhere" or completely vague

4. **complianceCredibility** (0-100):
   - Understands work regulations for international students
   - Shows independent application process (not agent-led)
   - RED FLAG: Heavily references agent, doesn't know basic requirements

5. **postStudyIntent** (0-100):
   - Clear post-study plan (return home OR legitimate career path in ${countryName})
   - RED FLAG: Vague about future plans, or shows unclear immigration intent

6. **communication** (0-100):
   - Natural, confident answers (not scripted/coached)
   - Consistent across all answers (no contradictions)

STRICT DECISION THRESHOLDS (Real ${countryName} standards):
- **accepted**: ALL dimensions ≥75 AND no major red flags (genuine student, likely approved)
- **borderline**: Any dimension 55-74 OR 1-2 minor red flags (needs improvement, 50/50 chance)
- **rejected**: ANY dimension <55 OR any major red flag (likely refusal)

MAJOR RED FLAGS (instant rejection):
- Cannot name 3+ course modules/program details
${effectiveRoute === 'uk_student' ? '- No understanding of 28-day bank rule' : '- No clear financial documentation plan'}
- Complete accommodation ignorance
${effectiveRoute === 'uk_student' ? '- Work visa rule confusion (20h limit)' : '- Work permit regulation confusion'}
- Heavy agent dependency without independent knowledge
- Financial contradictions or vagueness

ENHANCED ANALYSIS REQUIREMENTS:
1. Write a 2-3 paragraph detailed summary analyzing the applicant's overall performance, citing SPECIFIC examples from their answers
2. Identify 8-12 detailed insights categorized by: Content Quality, Financial, Course, Communication, Body Language, Intent
3. Each insight must include: category, type (strength/weakness), specific finding, example from interview, actionable improvement step
4. List 3-5 key strengths and 3-5 key weaknesses

BE EXTREMELY HARSH - European credibility interviews are designed to identify genuine students. Return STRICT JSON only.`
    : `You are a STRICT US Embassy Nepal F1 visa officer conducting FINAL interview assessment. Review the ENTIRE interview transcript and make a FINAL decision.

EVALUATION CRITERIA (Nepal F1 specific):
- communication: Clear, coherent, confident (not coached/scripted)
- content: Solid academic rationale for THIS program at THIS university
- financials: SPECIFIC amounts, sponsor details (name, occupation, income), no vagueness
- intent: Strong Nepal ties, concrete return plans (not "I will return to serve my country")

COMMON RED FLAGS = AUTO-REJECT:
- Financial vagueness (no specific amounts mentioned)
- Contradictions between answers
- Weak return intent + mentions relatives in US
- Cannot explain program fit beyond rankings

DECISION THRESHOLDS:
- accepted: All dimensions >75, no major red flags
- borderline: Mixed scores 60-75, minor concerns
- rejected: Any dimension <60 OR any major red flag

ENHANCED ANALYSIS REQUIREMENTS:
1. Write a 2-3 paragraph detailed summary analyzing the applicant's overall performance, citing SPECIFIC examples from their answers
2. Identify 8-12 detailed insights categorized by: Content Quality, Financial, Course, Communication, Body Language, Intent
3. Each insight must include: category, type (strength/weakness), specific finding, example from interview, actionable improvement step
4. List 3-5 key strengths and 3-5 key weaknesses

BE STRICT - Real F1 rejection rate from Nepal is 30-40%. Return STRICT JSON only.`

  // Include per-answer scores in the prompt for consistency
  const history = conversationHistory
    .map((h, i) => {
      let entry = `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`
      if (perAnswerScores && perAnswerScores[i]) {
        const score = perAnswerScores[i]
        entry += `\n[Score: ${Math.round(score.overall)}/100 (Content: ${Math.round(score.categories.content)}, Speech: ${Math.round(score.categories.speech)}, Body: ${Math.round(score.categories.bodyLanguage)})]`
      }
      return entry
    })
    .join('\n\n')

  const dimensionsSchema = route === 'uk_student'
    ? `"courseAndUniversityFit": number,
"financialRequirement": number,
"accommodationLogistics": number,
"complianceCredibility": number,
"postStudyIntent": number,`
    : `"content": number,
"financials": number,
"intent": number,`

  const avgScoreNote = perAnswerScores && perAnswerScores.length > 0
    ? `\n\nPER-ANSWER AVERAGE SCORE: ${Math.round(perAnswerScores.reduce((sum, s) => sum + s.overall, 0) / perAnswerScores.length)}/100\n(Based on detailed content + speech + body language analysis of each answer)`
    : ''
  
  const userPrompt = `STUDENT PROFILE:
Name: ${studentProfile.name} (${studentProfile.country})
University: ${studentProfile.intendedUniversity || 'Not specified'}
Field: ${studentProfile.fieldOfStudy || 'Not specified'}
Previous Education: ${studentProfile.previousEducation || 'Not specified'}${avgScoreNote}

FULL INTERVIEW TRANSCRIPT:
${history}

---

IMPORTANT: Consider the per-answer scores above (if provided) alongside your holistic evaluation. The scores reflect AI analysis of content accuracy, speech quality, and body language for each answer. Your final decision should be consistent with these granular scores while focusing on credibility and overall readiness.

OUTPUT FORMAT (STRICT JSON - no markdown, no extra text):
{
  "decision": "accepted" | "rejected" | "borderline",
  "overall": <number 0-100>,
  "dimensions": {
    "communication": <number 0-100>,
    ${dimensionsSchema}
  },
  "summary": "<2-3 detailed paragraphs analyzing performance with SPECIFIC examples from answers>",
  "detailedInsights": [
    {
      "category": "Content Quality" | "Financial" | "Course" | "Communication" | "Body Language" | "Intent",
      "type": "strength" | "weakness",
      "finding": "<specific observation>",
      "example": "<quote or paraphrase from their answer>",
      "actionItem": "<concrete improvement step>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "recommendations": ["<deprecated - included for compatibility>"]
}`

  // CRITICAL FIX: Use 60-second timeout for final evaluation (long prompt with 16 Q&A pairs)
  const response = await callLLMProvider(config, system, userPrompt, 0.3, 8192, 60000)
  const content = response.content
  if (!content) throw new Error('No LLM content returned')
  
  try {
    const parsed = JSON.parse(content)
    // basic sanity checks
    const decision = (['accepted', 'rejected', 'borderline'].includes(parsed.decision) ? parsed.decision : 'borderline') as 'accepted' | 'rejected' | 'borderline'
    const overall = Math.max(0, Math.min(100, Number(parsed.overall) || 0))
    const dimensions = parsed.dimensions && typeof parsed.dimensions === 'object' ? parsed.dimensions : {}
    const summary = String(parsed.summary || '').slice(0, 3000) // Increased limit for detailed summary
    
    // Parse detailed insights with validation
    const detailedInsights: DetailedInsight[] = Array.isArray(parsed.detailedInsights)
      ? parsed.detailedInsights.slice(0, 12).map((insight: any) => ({
          category: insight.category || 'Content Quality',
          type: insight.type === 'strength' || insight.type === 'weakness' ? insight.type : 'weakness',
          finding: String(insight.finding || '').slice(0, 300),
          example: insight.example ? String(insight.example).slice(0, 300) : undefined,
          actionItem: String(insight.actionItem || '').slice(0, 300)
        }))
      : []
    
    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5).map((s: any) => String(s).slice(0, 200)) : []
    const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5).map((w: any) => String(w).slice(0, 200)) : []
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 10) : []
    
    return { decision, overall, dimensions, summary, detailedInsights, strengths, weaknesses, recommendations }
  } catch {
    return null
  }
}

function evaluateHeuristically(
  route: 'uk_student' | 'usa_f1' | undefined, 
  history: Array<{ answer: string }>,
  perAnswerScores?: Array<{ overall: number; categories: { content: number; speech: number; bodyLanguage: number } }>
) {
  const answers = history.map((h) => String(h.answer || ''))
  const words = answers.join(' ').trim().split(/\s+/).filter(Boolean)
  const totalWords = words.length
  const avgLen = answers.length ? totalWords / answers.length : 0

  // Stricter keyword coverage for UK dimensions
  const txt = answers.join(' ').toLowerCase()
  
  // UK-specific pattern matching (more strict)
  const has28DayRule = /28[-\s]?day/i.test(txt)
  const hasMaintenanceAmount = /(£|pound|gbp)\s*1[5-9],?\d{3}|£\s*2[0-5],?\d{3}/i.test(txt) // £15,000-£25,000 range
  const hasModuleNames = /(module|course|subject|unit).*?(analytics|management|engineering|computing|finance|marketing)/i.test(txt)
  const hasWorkHourLimit = /20\s*hours?|part[-\s]?time\s*work/i.test(txt)
  const hasAccommodationDetail = /(accommodation|housing|halls?|dorm|flat|room).*?(£|pound|\d+\s*(per|\/)\s*(week|month))/i.test(txt)
  
  // Broader checks
  const hasFinance = /(fund|finance|bank|maintenance|proof|statement|tuition|fees|sponsor)/i.test(txt)
  const hasCourseFit = /(course|module|university|ranking|curriculum|faculty|program)/i.test(txt)
  const hasAccommodation = /(accommodation|rent|housing|dorm|hostel|flat|room|living)/i.test(txt)
  const hasCompliance = /(cas|ukvi|visa|rules|work|hours)/i.test(txt)
  const hasIntent = /(return|plans after|post-study|career|job|graduate route)/i.test(txt)

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

  // CRITICAL FIX: If per-answer scores are available, use them as primary source
  // Otherwise fall back to keyword-based heuristics
  if (perAnswerScores && perAnswerScores.length > 0) {
    const avgContent = perAnswerScores.reduce((sum, s) => sum + s.categories.content, 0) / perAnswerScores.length
    const avgSpeech = perAnswerScores.reduce((sum, s) => sum + s.categories.speech, 0) / perAnswerScores.length
    const avgBody = perAnswerScores.reduce((sum, s) => sum + s.categories.bodyLanguage, 0) / perAnswerScores.length
    const avgOverall = perAnswerScores.reduce((sum, s) => sum + s.overall, 0) / perAnswerScores.length
    
    console.log('✅ Using per-answer scores for final evaluation:', {
      avgContent: Math.round(avgContent),
      avgSpeech: Math.round(avgSpeech),
      avgBody: Math.round(avgBody),
      avgOverall: Math.round(avgOverall),
    })
    
    // Use per-answer scores as dimensions (more accurate than keyword matching)
    const communication = Math.round(avgSpeech)
    const content = Math.round(avgContent)
    
    // UK SCORING FIX: Use updated thresholds (70 for accepted, 50 for rejected)
    const isUKRoute = route === 'uk_student';
    const acceptedThreshold = isUKRoute ? UK_SCORING_CONFIG.thresholds.accepted : 75;
    const rejectedThreshold = isUKRoute ? UK_SCORING_CONFIG.thresholds.borderline : 55;
    
    const decision: 'accepted' | 'rejected' | 'borderline' = 
      avgOverall >= acceptedThreshold ? 'accepted' : avgOverall < rejectedThreshold ? 'rejected' : 'borderline'
    
    // Check for score discrepancy and log warning if needed
    if (isUKRoute) {
      const discrepancyCheck = checkScoreDiscrepancy(avgOverall, avgOverall); // Will be used with final score later
      if (discrepancyCheck.hasWarning) {
        console.warn(`⚠️ [Score Discrepancy] ${discrepancyCheck.message}`);
      }
    }
    
    const dimensions = route === 'uk_student'
      ? {
          communication,
          courseAndUniversityFit: content,
          financialRequirement: content, // Content includes all answer quality
          accommodationLogistics: content,
          complianceCredibility: communication,
          postStudyIntent: content,
        }
      : { communication, content, financials: content, intent: content }
    
    // Generate detailed insights based on per-answer scores
    const detailedInsights: DetailedInsight[] = []
    const strengths: string[] = []
    const weaknesses: string[] = []
    
    // CRITICAL FIX: Detect "no response" patterns (multiple answers with 0 or near-0 scores)
    const zeroScoreCount = perAnswerScores.filter(s => s.overall <= 10).length
    const zeroScorePercentage = (zeroScoreCount / perAnswerScores.length) * 100
    
    if (zeroScoreCount >= 3 || zeroScorePercentage >= 30) {
      weaknesses.push(`Failed to provide adequate responses to ${zeroScoreCount} out of ${perAnswerScores.length} questions`)
      detailedInsights.push({
        category: 'Content Quality',
        type: 'weakness',
        finding: `${zeroScoreCount} answer${zeroScoreCount !== 1 ? 's' : ''} contained insufficient content (< 10 words each)`,
        example: 'Multiple questions were answered with silence or very brief responses',
        actionItem: 'Prepare thoroughly and provide detailed answers (30-100 words) to ALL questions. Silence or very brief answers will result in automatic failure.'
      })
    }
    
    // SCORING ANOMALY DETECTION (Requirement 3.2): Detect scores < 40 with word count > 10
    // This indicates potential scoring issues rather than missing responses
    const scoringAnomalies: ScoringAnomaly[] = [];
    answers.forEach((answer: string, index: number) => {
      const score = perAnswerScores[index]?.overall ?? 0;
      const wordCount = answer?.trim().split(/\s+/).filter((w: string) => w.length > 0).length ?? 0;
      
      if (detectScoringAnomaly(score, wordCount)) {
        scoringAnomalies.push({
          questionIndex: index,
          score,
          wordCount,
          anomalyType: 'zero_dimension_pattern',
          correctedScore: score, // Already corrected by LLM scorer
        });
      }
    });
    
    if (scoringAnomalies.length > 0) {
      console.warn('⚠️ [Final Evaluation] Scoring anomalies detected:', scoringAnomalies);
      // Flag for manual review if multiple anomalies (Requirement 5.4)
      if (scoringAnomalies.length >= 3) {
        detailedInsights.push({
          category: 'Content Quality',
          type: 'weakness',
          finding: `${scoringAnomalies.length} questions had low scores despite having substantive answers (${scoringAnomalies.map(a => `Q${a.questionIndex + 1}: ${a.wordCount} words, score ${a.score}`).join('; ')})`,
          example: 'This may indicate scoring anomalies for factual questions',
          actionItem: 'Review these answers manually - low scores may be due to question type mismatch rather than poor answers'
        });
      }
    }
    
    if (avgContent >= 75) {
      strengths.push('Strong content quality with well-structured answers')
      detailedInsights.push({
        category: 'Content Quality',
        type: 'strength',
        finding: 'Consistently provided detailed and relevant answers',
        example: 'Demonstrated good understanding across multiple questions',
        actionItem: 'Continue maintaining this level of detail in future interviews'
      })
    } else if (avgContent < 60) {
      weaknesses.push('Content needs significant improvement - answers lack depth and specifics')
      detailedInsights.push({
        category: 'Content Quality',
        type: 'weakness',
        finding: 'Answers were often vague or lacked specific details',
        example: 'Provided generic responses without concrete examples or numbers',
        actionItem: 'Practice providing specific examples, numbers, and detailed explanations for each question'
      })
    }
    
    if (avgSpeech >= 75) {
      strengths.push('Excellent communication skills with clear articulation')
      detailedInsights.push({
        category: 'Communication',
        type: 'strength',
        finding: 'Spoke clearly with good pace and minimal filler words',
        actionItem: 'Maintain this communication style in future interviews'
      })
    } else if (avgSpeech < 60) {
      weaknesses.push('Communication delivery needs improvement')
      detailedInsights.push({
        category: 'Communication',
        type: 'weakness',
        finding: 'Speech clarity and delivery could be improved',
        actionItem: 'Practice speaking slowly, reducing filler words, and maintaining steady pace'
      })
    }
    
    if (avgBody >= 60) {
      strengths.push('Good body language and posture maintained throughout')
    } else {
      weaknesses.push('Body language needs attention')
      detailedInsights.push({
        category: 'Body Language',
        type: 'weakness',
        finding: 'Posture and body language showed room for improvement',
        actionItem: 'Practice sitting upright, maintaining eye contact with the camera, and using open gestures'
      })
    }
    
    // Add performance-based insights
    if (avgOverall >= 80) {
      strengths.push('Overall strong interview performance')
    } else if (avgOverall < 55) {
      weaknesses.push('Overall performance significantly below expectations')
    }
    
    // Build summary with anomaly awareness (Requirement 3.1, 3.3, 3.4)
    // IMPORTANT: Do NOT claim "zero words recorded" when scoring anomalies are detected
    const anomalyNote = scoringAnomalies.length > 0 
      ? ` Note: ${scoringAnomalies.length} question(s) had low scores despite substantive answers (word counts: ${scoringAnomalies.map(a => `Q${a.questionIndex + 1}: ${a.wordCount} words`).join(', ')}). This may indicate scoring anomalies for factual questions.`
      : '';
    
    const summary = `Based on detailed per-answer analysis across ${perAnswerScores.length} questions, the candidate achieved an average score of ${Math.round(avgOverall)}/100. ${
      zeroScoreCount >= 3 && scoringAnomalies.length === 0
        ? `CRITICAL ISSUE: ${zeroScoreCount} question${zeroScoreCount !== 1 ? 's were' : ' was'} answered with insufficient content (< 10 words each), resulting in automatic zero scores. This suggests inadequate preparation or technical issues with the microphone. Content quality scored ${Math.round(avgContent)}/100, speech delivery ${Math.round(avgSpeech)}/100, and body language ${Math.round(avgBody)}/100. The candidate must retake the interview and provide detailed verbal responses to ALL questions.`
        : zeroScoreCount >= 3 && scoringAnomalies.length > 0
        ? `Some questions received low scores. However, ${scoringAnomalies.length} of these had substantive answers (${scoringAnomalies.map(a => `Q${a.questionIndex + 1}: ${a.wordCount} words`).join(', ')}), suggesting potential scoring anomalies rather than missing responses. Content quality scored ${Math.round(avgContent)}/100, speech delivery ${Math.round(avgSpeech)}/100, and body language ${Math.round(avgBody)}/100.${anomalyNote}`
        : decision === 'accepted' 
        ? 'The performance demonstrated strong capabilities across content quality (avg: ' + Math.round(avgContent) + '/100), speech delivery (avg: ' + Math.round(avgSpeech) + '/100), and body language (avg: ' + Math.round(avgBody) + '/100). The candidate showed consistent preparation and understanding of the subject matter.' + anomalyNote
        : decision === 'rejected' 
        ? 'Significant weaknesses were detected in the interview performance. Content quality scored ' + Math.round(avgContent) + '/100, speech delivery ' + Math.round(avgSpeech) + '/100, and body language ' + Math.round(avgBody) + '/100. These scores indicate substantial gaps in preparation and presentation that need to be addressed.' + anomalyNote
        : 'The performance showed mixed results with some areas of strength and others requiring improvement. Content quality averaged ' + Math.round(avgContent) + '/100, communication ' + Math.round(avgSpeech) + '/100, and body language ' + Math.round(avgBody) + '/100. With focused practice on the identified weaknesses, the candidate can significantly improve their interview readiness.' + anomalyNote
    }`
    
    return {
      decision,
      overall: Math.round(avgOverall),
      dimensions,
      summary,
      detailedInsights,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      recommendations: [
        avgContent < 70 ? 'Improve answer content: add specific details, numbers, and concrete examples' : 'Content quality is adequate',
        avgSpeech < 70 ? 'Improve speech delivery: reduce filler words, speak more clearly' : 'Speech quality is adequate',
        avgBody < 50 ? 'Improve body language: maintain eye contact, sit upright, use open gestures' : 'Body language is adequate',
      ].filter(r => !r.includes('adequate')),
    }
  }
  
  // Fallback to keyword-based heuristics if no per-answer scores available
  console.warn('⚠️ No per-answer scores available, using weak keyword-based heuristics')
  
  // More strict UK scoring (requires specific details, not just keywords)
  const communication = clamp(35 + Math.min(60, (avgLen / 45) * 60)) // longer, coherent answers -> higher
  const courseAndUniversityFit = clamp(hasModuleNames ? 72 : (hasCourseFit ? 55 : 40))
  const financialRequirement = clamp((has28DayRule && hasMaintenanceAmount) ? 75 : (hasFinance ? 55 : 35))
  const accommodationLogistics = clamp(hasAccommodationDetail ? 68 : (hasAccommodation ? 50 : 35))
  const complianceCredibility = clamp(hasWorkHourLimit ? 70 : (hasCompliance ? 55 : 40))
  const postStudyIntent = clamp(hasIntent ? 62 : 45)

  // Weighted overall (UK-style if route is uk_student)
  let overall = communication
  if (route === 'uk_student') {
    overall = clamp(
      0.2 * communication +
      0.2 * courseAndUniversityFit +
      0.25 * financialRequirement +
      0.15 * accommodationLogistics +
      0.1 * complianceCredibility +
      0.1 * postStudyIntent
    )
  } else {
    const content = clamp(hasCourseFit ? 65 : 55)
    const financials = clamp(hasFinance ? 70 : 50)
    const intent = clamp(hasIntent ? 65 : 50)
    overall = clamp(0.4 * communication + 0.3 * content + 0.2 * financials + 0.1 * intent)
  }

  // UK SCORING FIX: Updated thresholds (70 for accepted, 50 for rejected)
  const minDimension = route === 'uk_student' 
    ? Math.min(courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent)
    : overall
  
  // Use UK_SCORING_CONFIG thresholds for UK interviews
  const ukAccepted = UK_SCORING_CONFIG.thresholds.accepted; // 70
  const ukBorderline = UK_SCORING_CONFIG.thresholds.borderline; // 50
  
  const decision: 'accepted' | 'rejected' | 'borderline' = 
    route === 'uk_student'
      ? (overall >= ukAccepted && minDimension >= 60 ? 'accepted' : (overall < ukBorderline || minDimension < 40 ? 'rejected' : 'borderline'))
      : (overall >= 75 ? 'accepted' : overall < 55 ? 'rejected' : 'borderline')

  const recommendations: string[] = []
  const detailedInsights: DetailedInsight[] = []
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (route === 'uk_student') {
    if (!has28DayRule || !hasMaintenanceAmount) {
      recommendations.push('State exact maintenance amount (£18,000+ for London) and mention 28-day bank balance rule explicitly.')
      weaknesses.push('Missing specific financial requirements and 28-day bank balance rule')
      detailedInsights.push({
        category: 'Financial',
        type: 'weakness',
        finding: 'Did not mention specific maintenance amounts or 28-day bank rule',
        actionItem: 'Research and memorize exact financial requirements (£18,000+ for London) and explain the 28-day bank balance rule'
      })
    } else {
      strengths.push('Demonstrated knowledge of financial requirements')
    }
    
    if (!hasModuleNames) {
      recommendations.push('Name at least 3 specific modules from your course syllabus (not generic categories).')
      weaknesses.push('Lacks specific course knowledge - only generic mentions')
      detailedInsights.push({
        category: 'Course',
        type: 'weakness',
        finding: 'Could not name specific course modules or syllabus details',
        actionItem: 'Research course syllabus thoroughly and memorize at least 3-5 specific module names'
      })
    } else {
      strengths.push('Good understanding of course structure and modules')
    }
    
    if (!hasAccommodationDetail) {
      recommendations.push('Provide specific accommodation plan: location, cost per week/month, pre-booked or planned.')
      weaknesses.push('Vague accommodation plans without specific details')
      detailedInsights.push({
        category: 'Intent',
        type: 'weakness',
        finding: 'Accommodation plan lacks specific location and cost details',
        actionItem: 'Research specific accommodation options with exact costs (per week/month) and locations'
      })
    }
    
    if (!hasWorkHourLimit) {
      recommendations.push('Demonstrate understanding of 20 hours/week work limit during term time.')
      detailedInsights.push({
        category: 'Content Quality',
        type: 'weakness',
        finding: 'Did not demonstrate understanding of work hour regulations',
        actionItem: 'Learn that international students can work max 20 hours/week during term time'
      })
    }
    
    if (!hasIntent) {
      recommendations.push('Clearly state post-study plans (return home or Graduate Route) with specifics.')
      weaknesses.push('Unclear post-study intentions')
    }
  } else {
    if (!hasFinance) {
      recommendations.push('Clearly explain maintenance funds and 28-day bank balance proof with figures.')
      weaknesses.push('Financial information too vague')
      detailedInsights.push({
        category: 'Financial',
        type: 'weakness',
        finding: 'Did not provide specific financial amounts or sponsor details',
        actionItem: 'Prepare exact figures for tuition, living costs, and sponsor income details'
      })
    }
    if (!hasCourseFit) {
      recommendations.push('Link your chosen course and university to your background and career goals with specifics.')
      weaknesses.push('Weak academic rationale for program choice')
    }
    if (!hasAccommodation) {
      recommendations.push('Describe concrete accommodation plans (location, costs, arrangements).')
    }
    if (!hasCompliance) {
      recommendations.push('Address compliance and credibility (CAS clarity, agent role, previous refusals if any).')
    }
    if (!hasIntent) {
      recommendations.push('State clear post-study intentions and ties without implying immigration intent.')
      weaknesses.push('Unclear return intent and home country ties')
    }
  }
  
  if (avgLen < 30) {
    recommendations.push('Give fuller, structured answers with concrete numbers and examples.')
    weaknesses.push('Answers too brief and lack detail')
    detailedInsights.push({
      category: 'Communication',
      type: 'weakness',
      finding: 'Answers were too brief (average ' + Math.round(avgLen) + ' words)',
      actionItem: 'Practice giving more detailed answers (aim for 50-100 words per answer) with specific examples'
    })
  } else if (avgLen > 60) {
    strengths.push('Provided detailed, well-structured answers')
  }

  const dimensions = route === 'uk_student'
    ? { communication, courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent }
    : { communication, content: clamp(hasCourseFit ? 65 : 55), financials: clamp(hasFinance ? 70 : 50), intent: clamp(hasIntent ? 65 : 50) }

  const summary = `Based on keyword-based heuristic analysis of the interview transcript (${answers.length} questions, avg ${Math.round(avgLen)} words per answer), the applicant scored ${overall}/100. ${
    decision === 'accepted'
      ? 'The applicant demonstrated adequate coverage of key topics including course knowledge, financial preparation, and intent clarity. However, this heuristic analysis is limited - detailed AI analysis would provide more accurate assessment.'
      : decision === 'rejected'
      ? 'The applicant failed to adequately address several critical areas including specific financial requirements, course details, or accommodation plans. Significant gaps in preparation were evident from the absence of key information in their responses.'
      : 'The applicant showed mixed performance with some areas adequately covered but others lacking detail. More specific information about finances, course modules, and post-study plans would strengthen their case significantly.'
  }`

  return {
    decision,
    overall,
    dimensions,
    summary,
    detailedInsights: detailedInsights.slice(0, 12),
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    recommendations,
  }
}
