// Performance scoring utility
// Combines speech-to-text metrics (AssemblyAI) and body-language metrics (TensorFlow.js)
// to produce category scores: Content, Body Language, Speech, and an Overall score.
// Uses unified MVP weights: 0.7 content, 0.2 speech, 0.1 body

import { BodyLanguageScore } from '@/lib/body-language-scoring'
import { TranscriptionResult } from '@/lib/assemblyai-service'
import { F1_MVP_SCORING_CONFIG } from '@/lib/f1-mvp-config'

export interface TranscriptMetrics {
  words: number
  uniqueWords: number
  typeTokenRatio: number // uniqueWords/words
  sentences: number
  avgSentenceLength: number
  fillerCount: number
  fillerRate: number // fillerCount/words
  repeatedBigramRate: number
  readabilityEase: number // 0..100 (Flesch Reading Ease)
  positivity: number // 0..1 (very rough heuristic)
}

export interface ContentDetails {
  accuracyScore: number // 0..100 (keyword coverage if provided)
  clarityScore: number // 0..100 (structure/readability/length proxy)
  keywordCoverage: number // 0..1
  expectedKeywords?: string[]
  missingKeywords?: string[]
  notes: string[]
}

export interface SpeechDetails {
  fluencyScore: number // 0..100 (filler penalty + repetition)
  toneScore: number // 0..100 (from positivity neutrality)
  clarityScore: number // 0..100 (ASR confidence + readability band)
  fillerRate: number
  typeTokenRatio: number
  avgSentenceLength: number
  positivity: number // 0..1
  asrConfidence: number // 0..1
  notes: string[]
}

export interface PerformanceScoreResult {
  categories: {
    content: number
    bodyLanguage: number
    speech: number
  }
  overall: number
  details: {
    content: ContentDetails
    speech: SpeechDetails
    bodyLanguage: BodyLanguageScore
    transcriptMetrics: TranscriptMetrics
  }
}

export interface ScoreInputs {
  transcript: string
  body: BodyLanguageScore
  // Optionally pass raw AssemblyAI segments for future timing-based metrics
  segments?: TranscriptionResult[]
  // AssemblyAI confidence for the most recent turn or aggregated (0..1)
  assemblyConfidence?: number
  // Optional expected keywords to measure content accuracy/coverage
  expectedKeywords?: string[]
}

// --- Core text analysis helpers ---

const FILLERS = [
  'uh','um','erm','uhm','mmm','hmm','ah','er','like','you know','i mean','sort of','kind of','basically','actually','literally','right','okay','ok','well','so'
]

const POSITIVE_WORDS = [
  'confident','confidently','prepared','ready','excited','motivated','enthusiastic','committed','strong','clear','focused','passion','passionate','achieve','achievement','improve','growth','learn','learning','opportunity','grateful','thankful','interest','eager','keen','reliable','capable','responsible','collaborate','positive','optimistic','proactive'
]

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9'\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSentences(s: string): string[] {
  // Simple sentence splitter
  return s
    .replace(/([.!?])(\s+|$)/g, '$1|')
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean)
}

function syllableCount(word: string): number {
  // Very rough syllable estimator
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  // Remove silent trailing 'e'
  const base = w.replace(/e$/i, '')
  const matches = base.match(/[aeiouy]+/g)
  const count = matches ? matches.length : 1
  return Math.max(1, count)
}

function fleschReadingEase(text: string): number {
  const sentences = splitSentences(text)
  const words = normalizeText(text).split(' ').filter(Boolean)
  const wordCount = words.length || 1
  const sentenceCount = Math.max(1, sentences.length)
  const syllables = words.reduce((sum, w) => sum + syllableCount(w), 0)
  const ASL = wordCount / sentenceCount // average sentence length
  const ASW = syllables / wordCount // avg syllables per word
  // Flesch Reading Ease (higher is easier): 206.835 - 1.015*ASL - 84.6*ASW
  const score = 206.835 - 1.015 * ASL - 84.6 * ASW
  return Math.max(0, Math.min(100, score))
}

function countFillers(text: string): number {
  const t = normalizeText(text)
  let count = 0
  for (const f of FILLERS) {
    const re = new RegExp(`(^|\s)${f.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?=\s|$)`, 'g')
    const m = t.match(re)
    if (m) count += m.length
  }
  return count
}

function repeatedBigramRate(text: string): number {
  const words = normalizeText(text).split(' ').filter(Boolean)
  if (words.length < 4) return 0
  const bigrams: string[] = []
  for (let i = 0; i < words.length - 1; i++) bigrams.push(words[i] + ' ' + words[i + 1])
  const freq: Record<string, number> = {}
  for (const b of bigrams) freq[b] = (freq[b] || 0) + 1
  const repeats = Object.values(freq).filter((n) => n > 1).reduce((s, n) => s + (n - 1), 0)
  return repeats / bigrams.length
}

function positivityScore(text: string): number {
  const words = normalizeText(text).split(' ').filter(Boolean)
  if (!words.length) return 0
  const set = new Set(words)
  let hits = 0
  for (const w of POSITIVE_WORDS) if (set.has(w)) hits++
  // Cap at a reasonable max to avoid over-influence
  const ratio = Math.min(1, hits / Math.max(8, words.length / 50))
  return ratio
}

export function analyzeTranscript(transcript: string): TranscriptMetrics {
  const cleaned = normalizeText(transcript)
  const words = cleaned.length ? cleaned.split(' ').filter(Boolean) : []
  const unique = Array.from(new Set(words))
  const sentences = splitSentences(transcript)
  const avgLen = sentences.length ? (words.length / sentences.length) : words.length
  const fillers = countFillers(transcript)
  const fillerRate = words.length ? fillers / words.length : 0
  const repRate = repeatedBigramRate(transcript)
  const readabilityEase = fleschReadingEase(transcript)
  const positivity = positivityScore(transcript)

  return {
    words: words.length,
    uniqueWords: unique.length,
    typeTokenRatio: words.length ? unique.length / words.length : 0,
    sentences: sentences.length || (words.length ? 1 : 0),
    avgSentenceLength: avgLen,
    fillerCount: fillers,
    fillerRate,
    repeatedBigramRate: repRate,
    readabilityEase,
    positivity,
  }
}

function computeContentDetails(
  transcript: string,
  metrics: TranscriptMetrics,
  expectedKeywords?: string[]
): ContentDetails {
  const notes: string[] = []

  // Keyword coverage
  const norm = normalizeText(transcript)
  let coverage = 0
  let missing: string[] | undefined
  if (expectedKeywords && expectedKeywords.length) {
    let hit = 0
    const miss: string[] = []
    for (const kw of expectedKeywords) {
      const k = normalizeText(kw)
      const present = new RegExp(`(^|\\s)${k}(?=\\s|$)`).test(norm)
      if (present) hit++
      else miss.push(kw)
    }
    coverage = hit / expectedKeywords.length
    missing = miss
    if (coverage < 0.6) notes.push('Key points missing; address the main aspects of the question.')
  } else {
    // No explicit keywords provided; infer a modest baseline from length and repetition
    coverage = Math.min(1, (metrics.words / 120) * (1 - metrics.repeatedBigramRate)) * 0.8 + 0.1
    notes.push('No target keywords provided; accuracy estimated heuristically from length and repetition.')
  }

  // Clarity: blend readability and sentence length banding
  const readabilityTarget = 70 // conversational clarity target
  const readabilityCloseness = 100 - Math.min(100, Math.abs(metrics.readabilityEase - readabilityTarget))
  const idealLen = metrics.avgSentenceLength >= 10 && metrics.avgSentenceLength <= 22 ? 100 : Math.max(0, 100 - Math.abs(metrics.avgSentenceLength - 16) * 6)
  let clarity = Math.round(0.65 * readabilityCloseness + 0.35 * idealLen)

  // Penalize extremely short answers
  if (metrics.words < 20) {
    clarity = Math.max(0, clarity - 15)
    notes.push('Response is quite short; add more detail to improve clarity and completeness.')
  }

  const accuracyScore = Math.round(100 * coverage)
  const clarityScore = Math.round(clarity)

  return {
    accuracyScore,
    clarityScore,
    keywordCoverage: coverage,
    expectedKeywords,
    missingKeywords: missing,
    notes,
  }
}

function computeSpeechDetails(
  metrics: TranscriptMetrics,
  asrConfidence?: number
): SpeechDetails {
  const notes: string[] = []

  // Fluency: filler and repetition penalties
  const fillerPenalty = Math.min(60, metrics.fillerRate * 600) // up to -60 at 10% fillers
  const repetitionPenalty = Math.min(25, metrics.repeatedBigramRate * 250)
  let fluency = Math.max(0, 95 - fillerPenalty - repetitionPenalty)
  if (metrics.fillerRate > 0.05) notes.push('Reduce filler words (um/uh/like).')
  if (metrics.repeatedBigramRate > 0.05) notes.push('Avoid repeating phrases; vary wording.')

  // Tone: prefer mildly positive/neutral (peak near 0.35)
  const target = 0.35
  const toneCloseness = Math.max(0, 1 - Math.abs(metrics.positivity - target) / 0.5) // 0..1
  const tone = Math.round(60 + 40 * toneCloseness)
  if (metrics.positivity < 0.1) notes.push('Adopt a slightly more positive, confident tone.')

  // Clarity: ASR confidence + readability around target band 60-80
  const conf = typeof asrConfidence === 'number' ? Math.max(0, Math.min(1, asrConfidence)) : 0.75
  const readabilityTarget = 70
  const readBand = 100 - Math.min(100, Math.abs(metrics.readabilityEase - readabilityTarget))
  const clarity = Math.round(0.6 * (conf * 100) + 0.4 * readBand)
  if (conf < 0.6) notes.push('Speak a bit more clearly or reduce background noise (ASR confidence was low).')

  return {
    fluencyScore: Math.round(fluency),
    toneScore: tone,
    clarityScore: clarity,
    fillerRate: metrics.fillerRate,
    typeTokenRatio: metrics.typeTokenRatio,
    avgSentenceLength: metrics.avgSentenceLength,
    positivity: metrics.positivity,
    asrConfidence: conf,
    notes,
  }
}

export function scorePerformance(inputs: ScoreInputs): PerformanceScoreResult {
  const transcript = inputs.transcript || ''
  const body = inputs.body
  const metrics = analyzeTranscript(transcript)

  const content = computeContentDetails(transcript, metrics, inputs.expectedKeywords)
  const speech = computeSpeechDetails(metrics, inputs.assemblyConfidence)

  // Category scores
  const contentScore = Math.round(0.6 * content.accuracyScore + 0.4 * content.clarityScore)
  const bodyScore = Math.round(body?.overallScore ?? 50)
  const speechScore = Math.round(0.5 * speech.fluencyScore + 0.3 * speech.clarityScore + 0.2 * speech.toneScore)

  // Use unified MVP weights: 0.7 content, 0.2 speech, 0.1 body
  const weights = F1_MVP_SCORING_CONFIG.weights
  const overall = Math.round(
    weights.content * contentScore +
    weights.speech * speechScore +
    weights.body * bodyScore
  )

  return {
    categories: {
      content: contentScore,
      bodyLanguage: bodyScore,
      speech: speechScore,
    },
    overall,
    details: {
      content,
      speech,
      bodyLanguage: body,
      transcriptMetrics: metrics,
    },
  }
}
