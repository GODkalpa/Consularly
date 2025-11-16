import { NextRequest, NextResponse } from 'next/server'
import { LLMScoringService, type AIScoringRequest } from '@/lib/llm-scorer'
import { scorePerformance } from '@/lib/performance-scoring'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import type { F1SessionMemory } from '@/lib/f1-mvp-session-memory'
import { F1_MVP_SCORING_CONFIG } from '@/lib/f1-mvp-config'
import { checkRelevance, generateRelevanceFeedback, type RelevanceResult } from '@/lib/relevance-checker'

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
      languageCode,
      languageConfidence,
    }: {
      question: string
      answer: string
      bodyLanguage?: BodyLanguageScore
      assemblyConfidence?: number
      interviewContext: AIScoringRequest['interviewContext']
      sessionMemory?: F1SessionMemory
      languageCode?: string
      languageConfidence?: number
    } = body

    if (!question || typeof answer !== 'string' || !interviewContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // LANGUAGE DETECTION: Check if non-English speech was detected
    let languageWarning: string | undefined;
    let languagePenalty = 0;
    const isNonEnglish = languageCode && languageCode !== 'en' && (languageConfidence || 0) > 0.2;
    
    if (isNonEnglish) {
      const langConfidencePercent = Math.round((languageConfidence || 0) * 100);
      languageWarning = `Non-English language detected: ${languageCode} (${langConfidencePercent}% confidence). Interview must be conducted in English.`;
      languagePenalty = 50; // 50% reduction in content score for non-English
      console.warn(`🌐 [Language Detection] ${languageWarning}`);
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
    
    // RELEVANCE CHECK: Determine if answer addresses the question
    const relevanceCheck: RelevanceResult = checkRelevance(question, answer);
    const relevanceFeedback = generateRelevanceFeedback(relevanceCheck);
    
    console.log('🎯 [Relevance Check]:', {
      score: relevanceCheck.score,
      overlap: Math.round(relevanceCheck.overlap * 100) + '%',
      isOffTopic: relevanceCheck.isOffTopic,
      penalty: relevanceCheck.penalty,
      foundTerms: relevanceCheck.foundTerms.length,
      missingTerms: relevanceCheck.missingTerms.length,
    });
    
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
        languageWarning,
        relevanceCheck: relevanceCheck,
      }, { status: 200 }) // 200 status since it's a valid request, just poor answer
    }
    
    // CRITICAL FIX: If answer is completely off-topic, apply severe penalty
    if (relevanceCheck.isOffTopic) {
      const bodyOnlyScore = bodyLanguageMissing ? 0 : Math.round(defaultBody!.overallScore)
      const minimalContentScore = 15; // Maximum 15/100 for off-topic content
      const minimalSpeechScore = perf.categories.speech > 50 ? 50 : perf.categories.speech; // Cap speech at 50 for off-topic
      
      const offTopicOverall = Math.round(
        weights.content * minimalContentScore +
        weights.speech * minimalSpeechScore +
        weights.body * bodyOnlyScore
      );
      
      console.warn(`⚠️ [Off-Topic] Answer does not address the question (${Math.round(relevanceCheck.overlap * 100)}% overlap)`);
      
      const allRecommendations = [
        ...relevanceFeedback,
        'Listen carefully to the question before answering',
        'Address the specific points mentioned in the question',
        'Include relevant details and examples related to the topic',
      ];
      
      return NextResponse.json({
        error: 'Off-topic answer',
        rubric: { 
          communication: 20, 
          relevance: 10, 
          specificity: 15, 
          consistency: 50, 
          academicPreparedness: 15, 
          financialCapability: 15, 
          intentToReturn: 15 
        },
        summary: relevanceCheck.warning || 'Your answer does not address the question. Please listen carefully and provide relevant information.',
        recommendations: allRecommendations.slice(0, 5),
        redFlags: ['Answer is off-topic or unrelated to the question asked', ...relevanceFeedback],
        contentScore: minimalContentScore,
        speechScore: minimalSpeechScore,
        bodyScore: bodyOnlyScore,
        overall: offTopicOverall,
        categories: { content: minimalContentScore, speech: minimalSpeechScore, bodyLanguage: bodyOnlyScore },
        weights,
        languageWarning,
        relevanceCheck: relevanceCheck,
      }, { status: 200 })
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

    let contentScore = aiRes?.contentScore ?? perf.categories.content
    const speechScore = perf.categories.speech
    const bodyScore = perf.categories.bodyLanguage
    
    // Apply language penalty to content score if non-English detected
    if (languagePenalty > 0) {
      contentScore = Math.round(contentScore * (1 - languagePenalty / 100));
      console.log(`📉 Applied ${languagePenalty}% language penalty: ${aiRes?.contentScore ?? perf.categories.content} → ${contentScore}`);
    }
    
    // Apply relevance penalty to content score
    if (relevanceCheck.penalty > 0 && !relevanceCheck.isOffTopic) {
      const originalContentScore = contentScore;
      contentScore = Math.max(0, contentScore - relevanceCheck.penalty);
      console.log(`📉 Applied relevance penalty: ${originalContentScore} → ${contentScore} (penalty: -${relevanceCheck.penalty})`);
    }
    
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
      languagePenalty,
      relevancePenalty: relevanceCheck.penalty,
      finalScore: overall,
      weights: adjustedWeights,
      usedLLM: !!aiRes,
    })
    
    // Combine red flags from AI, language detection, and relevance check
    const allRedFlags = [
      ...(aiRes?.redFlags ?? []),
      ...(languageWarning ? [languageWarning] : []),
      ...(relevanceCheck.warning && relevanceCheck.penalty > 20 ? [relevanceCheck.warning] : []),
    ];
    
    // Combine recommendations
    const allRecommendations = [
      ...(aiRes?.recommendations ?? [
        'Address all parts of the question directly.',
        'Add specific numbers, names, and evidence.',
        'Reduce filler words and maintain a steady pace.',
      ]),
      ...relevanceFeedback.slice(0, 2), // Add up to 2 relevance feedback items
    ].slice(0, 5); // Limit to 5 recommendations

    return NextResponse.json({
      rubric: aiRes?.rubric ?? {
        communication: perf.details.speech.clarityScore,
        relevance: Math.max(20, relevanceCheck.score),
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
      recommendations: allRecommendations,
      redFlags: allRedFlags,
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
      languageWarning,
      relevanceCheck: {
        score: relevanceCheck.score,
        overlap: relevanceCheck.overlap,
        penalty: relevanceCheck.penalty,
        isOffTopic: relevanceCheck.isOffTopic,
      },
      // Also return some diagnostics for transparency
      diagnostics: {
        heuristic: perf,
        usedLLM: !!aiRes,
        bodyLanguageMissing,
        asrConfidenceProvided: typeof assemblyConfidence === 'number',
        languageDetected: languageCode,
        languageConfidence: languageConfidence,
        relevanceScore: relevanceCheck.score,
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
