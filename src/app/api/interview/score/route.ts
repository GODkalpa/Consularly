import { NextRequest, NextResponse } from 'next/server'
import { LLMScoringService, type AIScoringRequest } from '@/lib/llm-scorer'
import { scorePerformance } from '@/lib/performance-scoring'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import type { F1SessionMemory } from '@/lib/f1-mvp-session-memory'
import { F1_MVP_SCORING_CONFIG } from '@/lib/f1-mvp-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      question,
      answer,
      bodyLanguage,
      assemblyConfidence,
      interviewContext,
      sessionMemory,
    }: {
      question: string
      answer: string
      bodyLanguage?: BodyLanguageScore
      assemblyConfidence?: number
      interviewContext: AIScoringRequest['interviewContext']
      sessionMemory?: F1SessionMemory
    } = body

    if (!question || typeof answer !== 'string' || !interviewContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // CRITICAL FIX: If body language is missing, use penalty score instead of generous baseline
    // This ensures students cannot get points for data that wasn't captured
    let defaultBody: BodyLanguageScore | null = bodyLanguage || null
    let bodyLanguageMissing = false
    
    if (!bodyLanguage) {
      bodyLanguageMissing = true
      console.warn('⚠️ Body language data missing - using penalty score')
      // Use a LOW penalty score (not generous 58) to incentivize proper setup
      defaultBody = {
        posture: { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 25 },
        gestures: { left: 'unknown', right: 'unknown', confidence: 0, score: 25 },
        expressions: { eyeContactScore: 25, smileScore: 25, confidence: 0, score: 25 },
        overallScore: 25,
        feedback: ['Body language analysis unavailable - ensure camera is working'],
      }
    }

    const perf = scorePerformance({
      transcript: answer,
      body: defaultBody!,
      assemblyConfidence,
    })
    
    // Define weights early for validation response
    const weights = F1_MVP_SCORING_CONFIG.weights
    
    // CRITICAL FIX: Count words to prevent scoring empty/minimal answers
    const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length
    const MIN_WORD_COUNT = 10 // Minimum words for a valid answer
    
    // Validate transcript is not empty or placeholder
    if (!answer || answer.trim() === '' || answer === '[No response]') {
      return NextResponse.json({
        error: 'No answer provided',
        rubric: { communication: 0, relevance: 0, specificity: 0, consistency: 0, academicPreparedness: 0, financialCapability: 0, intentToReturn: 0 },
        summary: 'No answer was recorded. Please check your microphone and speak clearly.',
        recommendations: [
          'Ensure microphone is unmuted and working',
          'Speak loud enough for the system to hear',
          'Check browser permissions for microphone access',
        ],
        redFlags: ['No response provided'],
        contentScore: 0,
        speechScore: 0,
        bodyScore: bodyLanguageMissing ? 0 : Math.round(defaultBody!.overallScore),
        overall: 0,
        categories: { content: 0, speech: 0, bodyLanguage: 0 },
        weights,
      }, { status: 400 })
    }
    
    // CRITICAL FIX: Validate minimum word count to prevent gaming the system
    // If answer is too short (< 10 words), give 0 for content/speech but still score body language
    if (wordCount < MIN_WORD_COUNT) {
      const bodyOnlyScore = bodyLanguageMissing ? 0 : Math.round(defaultBody!.overallScore)
      const overallWithBodyOnly = Math.round(weights.body * bodyOnlyScore) // Max 10/100 for body alone
      
      console.warn(`⚠️ Answer too brief (${wordCount} words < ${MIN_WORD_COUNT} minimum) - giving 0 for content/speech`)
      
      return NextResponse.json({
        error: 'Answer too brief',
        rubric: { communication: 0, relevance: 0, specificity: 0, consistency: 0, academicPreparedness: 0, financialCapability: 0, intentToReturn: 0 },
        summary: `Answer too brief (${wordCount} word${wordCount !== 1 ? 's' : ''}). Provide detailed responses with at least ${MIN_WORD_COUNT} words to demonstrate your knowledge and communication skills.`,
        recommendations: [
          'Provide more detailed answers (aim for 30-100 words per question)',
          'Include specific examples, numbers, and concrete details',
          'Speak clearly and ensure your microphone is working properly',
        ],
        redFlags: [`Insufficient answer length: only ${wordCount} word${wordCount !== 1 ? 's' : ''} provided`],
        contentScore: 0,
        speechScore: 0,
        bodyScore: bodyOnlyScore,
        overall: overallWithBodyOnly,
        categories: { content: 0, speech: 0, bodyLanguage: bodyOnlyScore },
        weights,
      }, { status: 200 }) // 200 status since it's a valid request, just poor answer
    }

    // DEBUG: Log the answer being scored
    console.log('📝 [Scoring API] Answer to score:', {
      questionPreview: question.slice(0, 80),
      answerLength: answer.length,
      answerPreview: answer.slice(0, 150),
      hasBodyLanguage: !!bodyLanguage,
      assemblyConfidence,
    });

    // Try AI scoring for content (with session memory for consistency checking)
    let aiRes: Awaited<ReturnType<LLMScoringService['scoreAnswer']>> | null = null
    try {
      const service = new LLMScoringService()
      aiRes = await service.scoreAnswer({
        question,
        answer,
        interviewContext,
        sessionMemory, // Pass session memory for contradiction detection
      })
    } catch (e) {
      console.error('LLM scoring failed, using heuristics:', e)
      // If LLM is not configured or fails, we will fallback to heuristics-only
      aiRes = null
    }

    const contentScore = aiRes?.contentScore ?? perf.categories.content
    const speechScore = perf.categories.speech
    const bodyScore = perf.categories.bodyLanguage
    
    // CRITICAL FIX: If body language is missing, reduce its weight to 0 and redistribute
    // This prevents students from getting free points for missing data
    const adjustedWeights = bodyLanguageMissing
      ? { content: 0.75, speech: 0.25, body: 0 }  // Redistribute body weight to content/speech
      : weights
    
    const overall = Math.round(
      adjustedWeights.content * contentScore +
      adjustedWeights.speech * speechScore +
      adjustedWeights.body * bodyScore
    )
    
    console.log('📊 Scoring complete:', {
      content: contentScore,
      speech: speechScore,
      body: bodyScore,
      bodyMissing: bodyLanguageMissing,
      weights: adjustedWeights,
      overall,
      usedLLM: !!aiRes,
    })

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
      weights: adjustedWeights,
      // Also return some diagnostics for transparency
      diagnostics: {
        heuristic: perf,
        usedLLM: !!aiRes,
        bodyLanguageMissing,
        asrConfidenceProvided: typeof assemblyConfidence === 'number',
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
