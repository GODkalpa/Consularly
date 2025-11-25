import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * Debug endpoint to check branding data
 * GET /api/debug/branding
 */
export async function GET(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const uid = decoded.uid

    // Get user's org
    const userDoc = await adminDb().collection('users').doc(uid).get()
    const userData = userDoc.data()
    const orgId = userData?.orgId

    if (!orgId) {
      return NextResponse.json({ error: 'No org found' }, { status: 404 })
    }

    // Get org data directly from Firestore
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
    const orgData = orgDoc.data()

    // Return raw branding data
    return NextResponse.json({
      orgId,
      orgName: orgData?.name,
      rawSettings: orgData?.settings,
      customBranding: orgData?.settings?.customBranding,
      faviconValue: orgData?.settings?.customBranding?.favicon,
      allBrandingKeys: orgData?.settings?.customBranding ? Object.keys(orgData.settings.customBranding) : [],
    })
  } catch (error: any) {
    console.error('[Debug Branding] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
