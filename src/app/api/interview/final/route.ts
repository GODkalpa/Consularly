import { NextRequest, NextResponse } from 'next/server'
import { selectLLMProvider, callLLMProvider, logProviderSelection, type InterviewRoute } from '@/lib/llm-provider-selector'

// Final interview evaluation focused on UK pre-CAS metrics with graceful fallback
// Request body:
// {
//   route: 'uk_student' | 'usa_f1',
//   studentProfile: { name: string; country: string; intendedUniversity?: string; fieldOfStudy?: string; previousEducation?: string },
//   conversationHistory: Array<{ question: string; answer: string; timestamp?: string; questionType?: string; difficulty?: string }>
// }
// Response body:
// {
//   decision: 'accepted' | 'rejected' | 'borderline',
//   overall: number,
//   dimensions: Record<string, number>,
//   summary: string,
//   recommendations: string[]
// }

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
      const llmRes = await evaluateWithLLM({ route, studentProfile, conversationHistory, perAnswerScores })
      if (llmRes) return NextResponse.json(llmRes)
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
      summary: 'Final AI evaluation failed. Returning conservative heuristic result.',
      recommendations: ['Provide concrete details (numbers, names, evidence).', 'Clarify finances (maintenance funds, 28-day rule) and accommodation plans.'],
    })
  }
}

async function evaluateWithLLM({ route, studentProfile, conversationHistory, perAnswerScores }: { 
  route?: InterviewRoute; 
  studentProfile: any; 
  conversationHistory: any[];
  perAnswerScores?: Array<{ overall: number; categories: { content: number; speech: number; bodyLanguage: number } }>;
}) {
  const effectiveRoute: InterviewRoute = route || 'usa_f1'
  
  // Select provider for final evaluation
  const config = selectLLMProvider(effectiveRoute, 'final_evaluation')
  if (!config) {
    console.warn('[Final Evaluation] No provider available')
    return null
  }
  
  logProviderSelection(effectiveRoute, 'final_evaluation', config)
  
  // UK and France use similar strict evaluation system
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
  "summary": "<2-3 sentence harsh final assessment>",
  "recommendations": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`

  const response = await callLLMProvider(config, system, userPrompt, 0.3, 1200)
  const content = response.content
  if (!content) throw new Error('No LLM content returned')
  
  try {
    const parsed = JSON.parse(content)
    // basic sanity checks
    const decision = (['accepted', 'rejected', 'borderline'].includes(parsed.decision) ? parsed.decision : 'borderline') as 'accepted' | 'rejected' | 'borderline'
    const overall = Math.max(0, Math.min(100, Number(parsed.overall) || 0))
    const dimensions = parsed.dimensions && typeof parsed.dimensions === 'object' ? parsed.dimensions : {}
    const summary = String(parsed.summary || '').slice(0, 1200)
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 10) : []
    return { decision, overall, dimensions, summary, recommendations }
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
    
    const decision: 'accepted' | 'rejected' | 'borderline' = 
      avgOverall >= 75 ? 'accepted' : avgOverall < 55 ? 'rejected' : 'borderline'
    
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
    
    return {
      decision,
      overall: Math.round(avgOverall),
      dimensions,
      summary: `Based on detailed per-answer analysis: Average score ${Math.round(avgOverall)}/100 across ${perAnswerScores.length} questions. ${decision === 'accepted' ? 'Strong performance across content, speech, and body language.' : decision === 'rejected' ? 'Significant weaknesses detected in answer quality and delivery.' : 'Mixed performance with room for improvement.'}`,
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

  // Stricter UK decision thresholds (all dimensions must be strong)
  const minDimension = route === 'uk_student' 
    ? Math.min(courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent)
    : overall
  
  const decision: 'accepted' | 'rejected' | 'borderline' = 
    route === 'uk_student'
      ? (overall >= 75 && minDimension >= 70 ? 'accepted' : (overall < 60 || minDimension < 50 ? 'rejected' : 'borderline'))
      : (overall >= 75 ? 'accepted' : overall < 55 ? 'rejected' : 'borderline')

  const recommendations: string[] = []
  if (route === 'uk_student') {
    if (!has28DayRule || !hasMaintenanceAmount) {
      recommendations.push('State exact maintenance amount (£18,000+ for London) and mention 28-day bank balance rule explicitly.')
    }
    if (!hasModuleNames) {
      recommendations.push('Name at least 3 specific modules from your course syllabus (not generic categories).')
    }
    if (!hasAccommodationDetail) {
      recommendations.push('Provide specific accommodation plan: location, cost per week/month, pre-booked or planned.')
    }
    if (!hasWorkHourLimit) {
      recommendations.push('Demonstrate understanding of 20 hours/week work limit during term time.')
    }
    if (!hasIntent) {
      recommendations.push('Clearly state post-study plans (return home or Graduate Route) with specifics.')
    }
  } else {
    if (!hasFinance) recommendations.push('Clearly explain maintenance funds and 28-day bank balance proof with figures.')
    if (!hasCourseFit) recommendations.push('Link your chosen course and university to your background and career goals with specifics.')
    if (!hasAccommodation) recommendations.push('Describe concrete accommodation plans (location, costs, arrangements).')
    if (!hasCompliance) recommendations.push('Address compliance and credibility (CAS clarity, agent role, previous refusals if any).')
    if (!hasIntent) recommendations.push('State clear post-study intentions and ties without implying immigration intent.')
  }
  if (avgLen < 30) recommendations.push('Give fuller, structured answers with concrete numbers and examples.')

  const dimensions = route === 'uk_student'
    ? { communication, courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent }
    : { communication, content: clamp(hasCourseFit ? 65 : 55), financials: clamp(hasFinance ? 70 : 50), intent: clamp(hasIntent ? 65 : 50) }

  return {
    decision,
    overall,
    dimensions,
    summary: 'Heuristic summary based on coverage of key topics, answer length, and credibility indicators.',
    recommendations,
  }
}
