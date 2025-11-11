import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin'
import type { BookingLink } from '@/types/firestore'

/**
 * GET /api/org/booking-links/[id]
 * Get a specific booking link
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { orgId?: string } | undefined
    const callerOrgId = caller?.orgId || ''
    if (!callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: caller has no organization' }, { status: 403 })
    }

    const linkId = params.id
    const linkSnap = await adminDb().collection('bookingLinks').doc(linkId).get()

    if (!linkSnap.exists) {
      return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
    }

    const linkData = linkSnap.data() as BookingLink
    if (linkData.orgId !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: link belongs to different organization' }, { status: 403 })
    }

    const link = {
      id: linkSnap.id,
      ...linkData,
      createdAt: linkData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: linkData.updatedAt?.toDate?.()?.toISOString() || null,
    }

    return NextResponse.json({ link }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/booking-links/[id]] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * PATCH /api/org/booking-links/[id]
 * Update booking link
 * Body: { name?, description?, route?, isActive?, settings?, availability? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { orgId?: string } | undefined
    const callerOrgId = caller?.orgId || ''
    if (!callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: caller has no organization' }, { status: 403 })
    }

    const linkId = params.id
    const linkSnap = await adminDb().collection('bookingLinks').doc(linkId).get()

    if (!linkSnap.exists) {
      return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
    }

    const linkData = linkSnap.data() as BookingLink
    if (linkData.orgId !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: link belongs to different organization' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    }

    // Update fields if provided
    if (body.name !== undefined) {
      updateData.name = body.name
      // Regenerate slug if name changes
      const baseSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Ensure slug is unique (excluding current link)
      let slug = baseSlug
      let counter = 1
      let isUnique = false

      while (!isUnique) {
        const existing = await adminDb()
          .collection('bookingLinks')
          .where('slug', '==', slug)
          .limit(1)
          .get()
        
        if (existing.empty || (existing.docs.length === 1 && existing.docs[0].id === linkId)) {
          isUnique = true
        } else {
          slug = `${baseSlug}-${counter}`
          counter++
        }
      }

      updateData.slug = slug
    }

    if (body.description !== undefined) updateData.description = body.description
    if (body.route !== undefined) updateData.route = body.route
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.settings !== undefined) {
      // Merge with existing settings
      updateData.settings = {
        ...linkData.settings,
        ...body.settings
      }
    }
    if (body.availability !== undefined) updateData.availability = body.availability

    // Update the link
    await adminDb().collection('bookingLinks').doc(linkId).update(updateData)

    // Return updated link
    const updatedSnap = await adminDb().collection('bookingLinks').doc(linkId).get()
    const updatedData = updatedSnap.data() as BookingLink

    const link = {
      id: updatedSnap.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || null,
    }

    return NextResponse.json({ link }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/booking-links/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/org/booking-links/[id]
 * Delete booking link
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid

    // Load caller profile
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }
    const caller = callerSnap.data() as { orgId?: string } | undefined
    const callerOrgId = caller?.orgId || ''
    if (!callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: caller has no organization' }, { status: 403 })
    }

    const linkId = params.id
    const linkSnap = await adminDb().collection('bookingLinks').doc(linkId).get()

    if (!linkSnap.exists) {
      return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
    }

    const linkData = linkSnap.data() as BookingLink
    if (linkData.orgId !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: link belongs to different organization' }, { status: 403 })
    }

    // Check if there are upcoming bookings using this link
    const upcomingSlots = await adminDb()
      .collection('interviewSlots')
      .where('orgId', '==', callerOrgId)
      .where('status', '==', 'booked')
      .where('startTime', '>', new Date())
      .limit(1)
      .get()

    if (!upcomingSlots.empty) {
      return NextResponse.json({ 
        error: 'Cannot delete link with upcoming bookings. Please cancel all bookings first or set the link to inactive.' 
      }, { status: 409 })
    }

    // Delete the link
    await adminDb().collection('bookingLinks').doc(linkId).delete()

    return NextResponse.json({ success: true, message: 'Booking link deleted' }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/booking-links/[id]] DELETE error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
