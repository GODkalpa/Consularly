import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/org/organization
// Returns the caller's organization document (sanitized) based on their user profile orgId
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })

    const caller = callerSnap.data() as { orgId?: string } | undefined
    const orgId = caller?.orgId || ''
    if (!orgId) return NextResponse.json({ error: 'Forbidden: no organization' }, { status: 403 })

    const orgSnap = await adminDb().collection('organizations').doc(orgId).get()
    if (!orgSnap.exists) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const data = orgSnap.data() || {}

    // Sanitize fields: expose only what the org dashboard needs
    const organization = {
      id: orgSnap.id,
      name: data.name ?? '',
      domain: data.domain ?? '',
      plan: data.plan ?? 'basic',
      quotaLimit: typeof data.quotaLimit === 'number' ? data.quotaLimit : 0,
      quotaUsed: typeof data.quotaUsed === 'number' ? data.quotaUsed : 0,
      settings: {
        allowSelfRegistration: !!data?.settings?.allowSelfRegistration,
        defaultInterviewDuration: typeof data?.settings?.defaultInterviewDuration === 'number' ? data.settings.defaultInterviewDuration : 30,
        enableMetricsCollection: !!data?.settings?.enableMetricsCollection,
        customBranding: {
          logoUrl: data?.settings?.customBranding?.logoUrl || undefined,
          primaryColor: data?.settings?.customBranding?.primaryColor || undefined,
          companyName: data?.settings?.customBranding?.companyName || undefined,
        },
        notifications: {
          emailReports: !!data?.settings?.notifications?.emailReports,
          weeklyDigest: !!data?.settings?.notifications?.weeklyDigest,
          quotaWarnings: !!data?.settings?.notifications?.quotaWarnings,
        },
      },
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    }

    const response = NextResponse.json({ organization })
    
    // Cache for 60 seconds - org data changes infrequently
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    
    return response
  } catch (e: any) {
    console.error('[api/org/organization] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
