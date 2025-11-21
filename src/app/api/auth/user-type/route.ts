import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth().verifyIdToken(token)
    const uid = decodedToken.uid

    // Check in order: admin -> org -> student

    // 1. Check users collection (admin/org users)
    const userDoc = await adminDb().collection('users').doc(uid).get()
    if (userDoc.exists) {
      const userData = userDoc.data()
      if (userData?.role === 'admin') {
        return NextResponse.json({
          userType: 'admin',
          dashboard: '/admin',
          profile: userData
        })
      }
      if (userData?.orgId) {
        return NextResponse.json({
          userType: 'org',
          orgId: userData.orgId,  // Include orgId at top level for validation
          dashboard: '/org',
          profile: userData
        })
      }
    }

    // 2. Check orgStudents collection
    const studentQuery = await adminDb()
      .collection('orgStudents')
      .where('uid', '==', uid)
      .limit(1)
      .get()

    if (!studentQuery.empty) {
      const studentData = studentQuery.docs[0].data()
      return NextResponse.json({
        userType: 'student',
        dashboard: '/student',
        profile: studentData
      })
    }

    // 3. No profile found
    return NextResponse.json({
      userType: 'unknown',
      dashboard: '/',
      profile: null
    })

  } catch (error) {
    console.error('[user-type] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
