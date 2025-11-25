import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyAuth } from '@/lib/auth-helpers'
import { generateEmailAlias, validateEmailAlias } from '@/lib/email-alias-generator'


/**
 * Get organization email alias
 * GET /api/admin/organizations/[id]/email-alias
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = params.id

    // Allow platform admins OR users from the same organization
    const isAdmin = authResult.user?.role === 'admin'
    const isOrgUser = authResult.user?.orgId === orgId
    
    if (!isAdmin && !isOrgUser) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only access your own organization' },
        { status: 403 }
      )
    }

    // Fetch organization
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgData = orgDoc.data()
    const emailAlias = orgData?.settings?.customBranding?.emailAlias

    return NextResponse.json({
      emailAlias: emailAlias || null,
      orgName: orgData?.name,
      hasAlias: !!emailAlias,
    })
  } catch (error) {
    console.error('[Email Alias API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update organization email alias
 * POST /api/admin/organizations/[id]/email-alias
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = params.id

    // Allow platform admins OR users from the same organization
    const isAdmin = authResult.user?.role === 'admin'
    const isOrgUser = authResult.user?.orgId === orgId
    
    if (!isAdmin && !isOrgUser) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only manage your own organization' },
        { status: 403 }
      )
    }
    const body = await request.json()
    const { emailAlias, autoGenerate } = body

    // Fetch organization
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgData = orgDoc.data()
    const orgName = orgData?.name

    let newEmailAlias: string

    if (autoGenerate) {
      // Auto-generate email alias from organization name
      try {
        newEmailAlias = generateEmailAlias(orgName)
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to generate email alias: ${error.message}` },
          { status: 400 }
        )
      }
    } else if (emailAlias) {
      // Validate provided email alias
      const validation = validateEmailAlias(emailAlias)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
      newEmailAlias = emailAlias
    } else {
      return NextResponse.json(
        { error: 'Either emailAlias or autoGenerate must be provided' },
        { status: 400 }
      )
    }

    // Update organization branding with email alias
    await adminDb().collection('organizations').doc(orgId).update({
      'settings.customBranding.emailAlias': newEmailAlias,
      updatedAt: new Date(),
    })

    console.log(`[Email Alias API] Updated email alias for org ${orgId}: ${newEmailAlias}`)

    return NextResponse.json({
      success: true,
      emailAlias: newEmailAlias,
      message: 'Email alias updated successfully',
    })
  } catch (error: any) {
    console.error('[Email Alias API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
