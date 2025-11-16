import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/student/interviews/[id]
// Returns detailed interview results for student's own interview
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const firebaseUid = decoded.uid
    const interviewId = params.id

    if (!interviewId) {
      return NextResponse.json({ error: 'Missing interview ID' }, { status: 400 })
    }

    // Find student record by Firebase UID
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get()

    if (studentQuery.empty) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id

    // Get interview document
    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const interviewData = interviewSnap.data()

    // Verify student owns this interview
    if (interviewData?.userId !== studentId || interviewData?.orgId !== studentData.orgId) {
      return NextResponse.json({ error: 'Forbidden: not your interview' }, { status: 403 })
    }

    // Return comprehensive interview details
    const interview = {
      id: interviewId,
      status: interviewData.status || 'unknown',
      route: interviewData.route || null,
      
      // Timing
      startTime: interviewData.startTime?.toDate?.()?.toISOString() || interviewData.startTime,
      endTime: interviewData.endTime?.toDate?.()?.toISOString() || interviewData.endTime,
      duration: interviewData.duration || null,
      
      // Scores
      score: typeof interviewData.score === 'number' ? interviewData.score : null,
      scoreDetails: interviewData.scoreDetails || null,
      detailedScores: interviewData.detailedScores || null,
      perAnswerScores: interviewData.perAnswerScores || [],
      
      // Content
      completedQuestions: interviewData.completedQuestions || 0,
      conversationHistory: interviewData.conversationHistory || [],
      
      // Analysis
      finalReport: interviewData.finalReport || null,
      improvementAreas: interviewData.improvementAreas || [],
      achievements: interviewData.achievements || [],
      
      // Metadata
      creditSource: interviewData.creditSource || 'org',
      createdAt: interviewData.createdAt?.toDate?.()?.toISOString() || interviewData.createdAt,
      updatedAt: interviewData.updatedAt?.toDate?.()?.toISOString() || interviewData.updatedAt
    }

    // Get comparison data (previous interviews for improvement tracking)
    const previousInterviewsSnap = await adminDb()
      .collection('interviews')
      .where('orgId', '==', studentData.orgId)
      .where('userId', '==', studentId)
      .where('status', '==', 'completed')
      .orderBy('startTime', 'desc')
      .limit(5)
      .get()

    const previousScores = previousInterviewsSnap.docs
      .filter(doc => doc.id !== interviewId && doc.data().score)
      .map(doc => ({
        id: doc.id,
        score: doc.data().score,
        date: doc.data().startTime?.toDate?.()?.toISOString() || doc.data().startTime,
        route: doc.data().route
      }))

    // Calculate improvement metrics
    const improvement = previousScores.length > 0 ? {
      previousScore: previousScores[0]?.score || 0,
      change: (interview.score || 0) - (previousScores[0]?.score || 0),
      trend: previousScores.length >= 3 ? calculateTrend(previousScores.slice(0, 3)) : null,
      bestScore: Math.max(...previousScores.map(p => p.score)),
      practiceCount: previousScores.length
    } : null

    return NextResponse.json({
      interview,
      improvement,
      recommendations: generateRecommendations(interview, improvement),
      student: {
        id: studentId,
        name: studentData.name,
        creditsRemaining: (studentData.creditsAllocated || 0) - (studentData.creditsUsed || 0)
      }
    })

  } catch (e: any) {
    console.error('[api/student/interviews/[id]] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

function calculateTrend(scores: { score: number }[]): 'improving' | 'stable' | 'declining' {
  if (scores.length < 2) return 'stable'
  
  const changes = []
  for (let i = 0; i < scores.length - 1; i++) {
    changes.push(scores[i].score - scores[i + 1].score)
  }
  
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  
  if (avgChange > 2) return 'improving'
  if (avgChange < -2) return 'declining'
  return 'stable'
}

function generateRecommendations(
  interview: any, 
  improvement: any
): string[] {
  const recommendations: string[] = []
  
  if (!interview.finalReport || interview.status !== 'completed') {
    return ['Complete the interview to receive detailed recommendations.']
  }

  // Score-based recommendations
  if (interview.score < 70) {
    recommendations.push('Focus on strengthening your overall responses - consider reviewing common questions.')
  } else if (interview.score < 85) {
    recommendations.push('Good progress! Work on specific areas mentioned in your detailed feedback.')
  } else {
    recommendations.push('Excellent performance! You\'re ready for your actual interview.')
  }

  // Detailed score analysis
  if (interview.detailedScores) {
    const scores = interview.detailedScores
    const weakAreas = Object.entries(scores)
      .filter(([_, score]: [string, any]) => score < 70)
      .map(([area, _]) => area)

    if (weakAreas.includes('clarity')) {
      recommendations.push('Practice speaking more clearly and at an appropriate pace.')
    }
    if (weakAreas.includes('confidence')) {
      recommendations.push('Work on projecting confidence through body language and voice tone.')
    }
    if (weakAreas.includes('specificity')) {
      recommendations.push('Provide more specific details and examples in your answers.')
    }
  }

  // Improvement trend recommendations
  if (improvement) {
    if (improvement.trend === 'improving') {
      recommendations.push('Great improvement trend! Keep practicing to maintain momentum.')
    } else if (improvement.trend === 'declining') {
      recommendations.push('Consider taking a break and reviewing your previous successful performances.')
    }
    
    if (improvement.practiceCount >= 5) {
      recommendations.push('You\'ve practiced extensively - you should feel confident for your real interview!')
    }
  }

  // Route-specific recommendations
  if (interview.route === 'usa_f1') {
    recommendations.push('Review your I-20 and financial documents before your actual F1 interview.')
  } else if (interview.route === 'uk_student') {
    recommendations.push('Be prepared to discuss your course details and post-study plans for UK interviews.')
  }

  return recommendations.slice(0, 5) // Limit to 5 recommendations
}
