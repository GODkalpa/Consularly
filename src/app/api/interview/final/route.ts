import { NextRequest, NextResponse } from 'next/server'

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
    const { route, studentProfile, conversationHistory } = body as {
      route?: 'uk_student' | 'usa_f1'
      studentProfile: { name: string; country: string; intendedUniversity?: string; fieldOfStudy?: string; previousEducation?: string }
      conversationHistory: Array<{ question: string; answer: string; timestamp?: string; questionType?: string; difficulty?: string }>
    }

    if (!studentProfile || !Array.isArray(conversationHistory)) {
      return NextResponse.json({ error: 'Missing studentProfile or conversationHistory' }, { status: 400 })
    }

    // Try LLM-based final evaluation if configured
    const apiKey = process.env.OPENROUTER_API_KEY
    if (apiKey) {
      try {
        const llmRes = await evaluateWithLLM({ route, studentProfile, conversationHistory, apiKey })
        if (llmRes) return NextResponse.json(llmRes)
      } catch {
        // fall through to heuristics
      }
    }

    // Heuristic fallback (deterministic, no external calls)
    const fallback = evaluateHeuristically(route, conversationHistory)
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

async function evaluateWithLLM({ route, studentProfile, conversationHistory, apiKey }: { route?: 'uk_student' | 'usa_f1'; studentProfile: any; conversationHistory: any[]; apiKey: string }) {
  const baseUrl = 'https://openrouter.ai/api/v1'
  const system = route === 'uk_student'
    ? `You are an expert UK pre-CAS (credibility) evaluator. Produce a FINAL decision after reviewing the entire interview.
Score along these UK-focused dimensions: communication, courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent.
- Be unbiased and use only information evident in the answers.
- Penalize vagueness, contradictions, and lack of specifics.
- Decision must be one of: accepted, rejected, borderline.
Return STRICT JSON only.`
    : `You are an expert visa interview evaluator. Produce a FINAL decision after reviewing the entire interview.
Score along dimensions: communication, content, financials, intent.
Return STRICT JSON only.`

  const history = conversationHistory
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
    .join('\n')

  const user = `Student: ${studentProfile.name} (${studentProfile.country})\nUniversity: ${studentProfile.intendedUniversity || 'Not specified'}\nField: ${studentProfile.fieldOfStudy || 'Not specified'}\nPrev Edu: ${studentProfile.previousEducation || 'Not specified'}\n\nFull Conversation (order):\n${history}\n\nResponse Format (STRICT JSON):\n{
  "decision": "accepted|rejected|borderline",
  "overall": number, // 0-100
  "dimensions": { // pick appropriate keys per system
    "communication": number,
    ${(route === 'uk_student') ? '"courseAndUniversityFit": number,
    "financialRequirement": number,
    "accommodationLogistics": number,
    "complianceCredibility": number,
    "postStudyIntent": number,' : '"content": number,
    "financials": number,
    "intent": number,'}
  },
  "summary": string,
  "recommendations": string[]
}`

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Visa Mock Interview Final Scoring',
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'openai/gpt-3.5-turbo',
      temperature: 0.2,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('No LLM content')
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

function evaluateHeuristically(route: 'uk_student' | 'usa_f1' | undefined, history: Array<{ answer: string }>) {
  const answers = history.map((h) => String(h.answer || ''))
  const words = answers.join(' ').trim().split(/\s+/).filter(Boolean)
  const totalWords = words.length
  const avgLen = answers.length ? totalWords / answers.length : 0

  // Simple keyword coverage for UK dimensions
  const txt = answers.join(' ').toLowerCase()
  const hasFinance = /(fund|finance|bank|maintenance|28-?day|proof|statement|tuition|fees|sponsor)/i.test(txt)
  const hasCourseFit = /(course|module|university|ranking|curriculum|faculty)/i.test(txt)
  const hasAccommodation = /(accommodation|rent|housing|dorm|hostel|flat|room|living|city)/i.test(txt)
  const hasCompliance = /(cas|refusal|ukvi|agent|gap|visa|rules|work)/i.test(txt)
  const hasIntent = /(return|plans after|post-study|career|job)/i.test(txt)

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

  const communication = clamp(40 + Math.min(60, (avgLen / 40) * 60)) // longer, coherent answers -> higher
  const courseAndUniversityFit = clamp(hasCourseFit ? 70 : 50)
  const financialRequirement = clamp(hasFinance ? 70 : 45)
  const accommodationLogistics = clamp(hasAccommodation ? 65 : 45)
  const complianceCredibility = clamp(hasCompliance ? 65 : 50)
  const postStudyIntent = clamp(hasIntent ? 65 : 50)

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

  const decision: 'accepted' | 'rejected' | 'borderline' = overall >= 75 ? 'accepted' : overall < 55 ? 'rejected' : 'borderline'

  const recommendations: string[] = []
  if (!hasFinance) recommendations.push('Clearly explain maintenance funds and 28-day bank balance proof with figures.')
  if (!hasCourseFit) recommendations.push('Link your chosen course and university to your background and career goals with specifics.')
  if (!hasAccommodation) recommendations.push('Describe concrete accommodation plans (location, costs, arrangements).')
  if (!hasCompliance) recommendations.push('Address compliance and credibility (CAS clarity, agent role, previous refusals if any).')
  if (!hasIntent) recommendations.push('State clear post-study intentions and ties without implying immigration intent.')
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
