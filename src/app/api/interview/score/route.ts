import { NextRequest, NextResponse } from 'next/server'
import { LLMScoringService, type AIScoringRequest } from '@/lib/llm-scorer'
import { scorePerformance } from '@/lib/performance-scoring'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      question,
      answer,
      bodyLanguage,
      assemblyConfidence,
      interviewContext,
    }: {
      question: string
      answer: string
      bodyLanguage?: BodyLanguageScore
      assemblyConfidence?: number
      interviewContext: AIScoringRequest['interviewContext']
    } = body

    if (!question || typeof answer !== 'string' || !interviewContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Heuristic baseline using local analyzer (speech + body + content heuristics)
    const defaultBody: BodyLanguageScore = bodyLanguage || {
      posture: { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 60 },
      gestures: { left: 'unknown', right: 'unknown', confidence: 0, score: 60 },
      expressions: { eyeContactScore: 55, smileScore: 55, confidence: 0.5, score: 55 },
      overallScore: 58,
      feedback: [],
    }

    const perf = scorePerformance({
      transcript: answer,
      body: defaultBody,
      assemblyConfidence,
    })

    // Try AI scoring for content
    let aiRes: Awaited<ReturnType<LLMScoringService['scoreAnswer']>> | null = null
    try {
      const service = new LLMScoringService()
      aiRes = await service.scoreAnswer({
        question,
        answer,
        interviewContext,
      })
    } catch (e) {
      // If LLM is not configured or fails, we will fallback to heuristics-only
      aiRes = null
    }

    const contentScore = aiRes?.contentScore ?? perf.categories.content
    const speechScore = perf.categories.speech
    const bodyScore = perf.categories.bodyLanguage

    // Transparent, tunable weights (could be made env-configurable later)
    const weights = { content: 0.5, speech: 0.25, bodyLanguage: 0.25 }
    const overall = Math.round(
      weights.content * contentScore +
      weights.speech * speechScore +
      weights.bodyLanguage * bodyScore
    )

    return NextResponse.json({
      rubric: aiRes?.rubric ?? {
        communication: perf.details.speech.clarityScore,
        relevance: 60,
        specificity: 50,
        consistency: 65,
        academicPreparedness: 60,
        financialCapability: 60,
        intentToReturn: 60,
      },
      summary: aiRes?.summary ?? (
        perf.details.content.notes.concat(perf.details.speech.notes).join(' ') ||
        'Good effort. Improve structure, reduce fillers, and add concrete details.'
      ),
      recommendations: aiRes?.recommendations ?? [
        'Address all parts of the question directly.',
        'Add specific numbers, names, and evidence.',
        'Reduce filler words and maintain a steady pace.',
      ],
      redFlags: aiRes?.redFlags ?? [],
      contentScore,
      speechScore,
      bodyScore,
      overall,
      categories: {
        content: contentScore,
        speech: speechScore,
        bodyLanguage: bodyScore,
      },
      weights,
      // Also return some diagnostics for transparency
      diagnostics: {
        heuristic: perf,
        usedLLM: !!aiRes,
      },
    })
  } catch (error) {
    console.error('Error in /api/interview/score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Interview Answer Scoring API',
    method: 'POST',
    requestBody: {
      question: 'string',
      answer: 'string',
      bodyLanguage: 'BodyLanguageScore (optional)',
      assemblyConfidence: 'number 0..1 (optional)',
      interviewContext: {
        visaType: 'F1 | B1/B2 | H1B | other',
        studentProfile: '{ name, country, intendedUniversity?, fieldOfStudy?, previousEducation? }',
        conversationHistory: '[{question, answer, timestamp}]',
      },
    },
  })
}
