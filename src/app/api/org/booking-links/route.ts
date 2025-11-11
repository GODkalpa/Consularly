import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import type { BookingLink } from '@/types/firestore'

/**
 * GET /api/org/booking-links
 * Returns all booking links for the organization
 */
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

    // Load caller profile to get orgId
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerOrgId = caller?.orgId || ''
    if (!callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: caller has no organization' }, { status: 403 })
    }

    const snapshot = await adminDb()
      .collection('bookingLinks')
      .where('orgId', '==', callerOrgId)
      .orderBy('createdAt', 'desc')
      .get()

    const links = snapshot.docs.map(doc => {
      const data = doc.data() as BookingLink
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      }
    })

    return NextResponse.json({ links }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/booking-links] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/org/booking-links
 * Create new booking link
 * Body: { name, description?, route?, settings, availability }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile to get orgId
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { role?: string; orgId?: string } | undefined
    const callerOrgId = caller?.orgId || ''
    if (!callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: caller has no organization' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, route, settings, availability } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!settings || !settings.timezone) {
      return NextResponse.json({ error: 'settings.timezone is required' }, { status: 400 })
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    // Ensure slug is unique
    let slug = baseSlug
    let counter = 1
    let isUnique = false

    while (!isUnique) {
      const existing = await adminDb()
        .collection('bookingLinks')
        .where('slug', '==', slug)
        .limit(1)
        .get()
      
      if (existing.empty) {
        isUnique = true
      } else {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    // Set defaults for settings
    const linkSettings = {
      slotDuration: settings.slotDuration || 30,
      bufferBefore: settings.bufferBefore || 0,
      bufferAfter: settings.bufferAfter || 5,
      maxAdvanceDays: settings.maxAdvanceDays || 30,
      minAdvanceHours: settings.minAdvanceHours || 24,
      timezone: settings.timezone,
      requireApproval: settings.requireApproval || false
    }

    // Validate availability
    if (!availability || Object.keys(availability).length === 0) {
      return NextResponse.json({ error: 'At least one day must have availability' }, { status: 400 })
    }

    // Create booking link document
    const linkData: any = {
      orgId: callerOrgId,
      name,
      slug,
      isActive: true,
      settings: linkSettings,
      availability,
      bookingCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    if (description) linkData.description = description
    if (route) linkData.route = route

    const docRef = await adminDb().collection('bookingLinks').add(linkData)

    const link = {
      id: docRef.id,
      ...linkData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ link }, { status: 201 })
  } catch (e: any) {
    console.error('[api/org/booking-links] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
