import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminDb } from '@/lib/firebase-admin'

// GET /api/student/check-email?email=test@example.com
// Check if an email belongs to a student account
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const url = new URL(req.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter required' 
      }, { status: 400 })
    }

    // Check if email exists in orgStudents collection
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    const isStudent = !studentQuery.empty

    return NextResponse.json({
      isStudent,
      ...(isStudent && {
        accountStatus: studentQuery.docs[0].data()?.accountStatus,
        dashboardEnabled: studentQuery.docs[0].data()?.dashboardEnabled
      })
    })

  } catch (e: any) {
    console.error('[api/student/check-email] GET error', e)
    return NextResponse.json({ 
      error: e?.message || 'Internal error',
      isStudent: false 
    }, { status: 500 })
  }
}
