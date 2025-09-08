import { scorePerformance } from '@/lib/performance-scoring'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'

// Example transcript simulating a student's response
const transcript = `Thank you for the question. I chose to study Computer Science in the US because
of the strong research culture and practical curriculum. My coursework will focus on
machine learning and systems, and I plan to work with professors whose research aligns
with my interests. This program builds on my undergraduate projects, and I am confident
it will help me contribute to Nepal's growing tech ecosystem after graduation.`

// Example body-language output (as if produced by useBodyLanguageTracker/evaluateBodyLanguage)
const body: BodyLanguageScore = {
  posture: { torsoAngleDeg: 4, headTiltDeg: 6, slouchDetected: false, score: 88 },
  gestures: { left: 'open', right: 'open', confidence: 1, score: 95 },
  expressions: { eyeContactScore: 78, smileScore: 62, confidence: 0.9, score: 72 },
  overallScore: 84,
  feedback: [],
}

const expectedKeywords = [
  'computer science',
  'research',
  'curriculum',
  'machine learning',
  'professors',
  'projects',
  'nepal',
]

const result = scorePerformance({
  transcript,
  body,
  assemblyConfidence: 0.86, // from AssemblyAI real-time state if available
  expectedKeywords,
})

console.log('\n=== Performance Scoring Demo ===')
console.log('Category Scores:', result.categories)
console.log('Overall:', result.overall)
console.log('\nContent Details:', result.details.content)
console.log('\nSpeech Details:', result.details.speech)
console.log('\nBody Language (raw):', result.details.bodyLanguage)
console.log('\nTranscript Metrics:', result.details.transcriptMetrics)
