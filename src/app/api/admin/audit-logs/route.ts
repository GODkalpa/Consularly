import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * GET /api/admin/audit-logs
 * Returns recent audit log entries
 * Query params:
 * - limit: number of entries to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    // Verify admin token
    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile to verify admin role
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string } | undefined
    const isAdmin = caller?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limitCount = limitParam ? parseInt(limitParam, 10) : 10

    // Fetch recent audit logs - gracefully handle if collection doesn't exist
    let logsSnap
    try {
      logsSnap = await adminDb()
        .collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get()
    } catch (indexError) {
      // If index doesn't exist or collection is empty, return empty logs
      console.warn('[audit-logs] Collection not indexed or empty:', indexError)
      return NextResponse.json({
        logs: [],
        total: 0,
        message: 'Audit logs not yet configured'
      })
    }

    const logs = logsSnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data?.userId || '',
        orgId: data?.orgId || '',
        action: data?.action || '',
        targetId: data?.targetId || '',
        targetType: data?.targetType || '',
        details: data?.details || {},
        timestamp: data?.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        ipAddress: data?.ipAddress,
        userAgent: data?.userAgent,
      }
    })

    // Transform to activity format for UI
    const activities = logs.map((log) => {
      let type = 'system'
      let message = `${log.action} on ${log.targetType}`
      let status: 'success' | 'warning' | 'info' | 'error' = 'info'

      // Map actions to friendly messages
      if (log.action === 'user_created') {
        type = 'user'
        message = `New user created: ${log.details?.email || log.targetId}`
        status = 'success'
      } else if (log.action === 'organization_created') {
        type = 'org'
        message = `New organization registered: ${log.details?.name || log.targetId}`
        status = 'success'
      } else if (log.action === 'interview_created') {
        type = 'interview'
        message = `Interview session started`
        status = 'info'
      } else if (log.action === 'quota_exceeded') {
        type = 'quota'
        message = `Quota limit reached`
        status = 'warning'
      } else if (log.action === 'user_updated') {
        type = 'user'
        message = `User profile updated`
        status = 'info'
      }

      return {
        id: log.id,
        type,
        message,
        time: log.timestamp,
        status,
      }
    })

    const response = NextResponse.json({
      logs: activities,
      total: logs.length,
    })
    
    // Cache for 2 minutes - logs don't change frequently
    response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=240')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/audit-logs] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

