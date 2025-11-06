/**
 * Analytics API Route
 * Provides performance analytics and statistics for interviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateAnalyticsDashboard } from '@/lib/performance-analytics';
import type { InterviewWithId } from '@/types/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Fetch all interviews for the user
    let query = adminDb().collection('interviews')
      .where('userId', '==', userId)
      .orderBy('startTime', 'desc');
    
    if (orgId) {
      query = query.where('orgId', '==', orgId);
    }
    
    const snapshot = await query.limit(100).get(); // Last 100 interviews
    
    const interviews: InterviewWithId[] = [];
    snapshot.forEach(doc => {
      interviews.push({
        id: doc.id,
        ...doc.data(),
      } as InterviewWithId);
    });
    
    // Generate analytics dashboard
    const dashboard = generateAnalyticsDashboard(interviews);
    
    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

