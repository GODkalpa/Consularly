import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue, Timestamp } from '@/lib/firebase-admin'
import type { InterviewSlot, OrganizationBranding } from '@/types/firestore'
import { sendInterviewConfirmation } from '@/lib/email-service'

/**
 * GET /api/org/slots?start=ISO&end=ISO&status=booked
 * Returns all interview slots for the organization within date range
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

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')
    const statusParam = searchParams.get('status')

    // Build query
    let query = adminDb().collection('interviewSlots').where('orgId', '==', callerOrgId)

    // Filter by date range if provided
    if (startParam) {
      const startDate = new Date(startParam)
      query = query.where('startTime', '>=', Timestamp.fromDate(startDate))
    }
    if (endParam) {
      const endDate = new Date(endParam)
      query = query.where('startTime', '<=', Timestamp.fromDate(endDate))
    }

    // Filter by status if provided
    if (statusParam && ['available', 'booked', 'completed', 'cancelled', 'no_show'].includes(statusParam)) {
      query = query.where('status', '==', statusParam)
    }

    // Order by start time
    query = query.orderBy('startTime', 'asc')

    const snapshot = await query.get()
    const slots = snapshot.docs.map(doc => {
      const data = doc.data() as InterviewSlot
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate?.()?.toISOString() || null,
        endTime: data.endTime?.toDate?.()?.toISOString() || null,
        bookedAt: data.bookedAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      }
    })

    return NextResponse.json({ slots }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/slots] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/org/slots
 * Create new interview slot(s)
 * Body: { startTime: ISO, endTime: ISO, timezone: string, route?: string, studentId?: string, studentName?: string, studentEmail?: string }
 * OR: { slots: Array<{...}> } for bulk creation
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

    // Handle bulk creation
    if (body.slots && Array.isArray(body.slots)) {
      const createdSlots = []
      for (const slotData of body.slots) {
        const slot = await createSlot(slotData, callerOrgId, callerUid)
        createdSlots.push(slot)
      }
      return NextResponse.json({ slots: createdSlots }, { status: 201 })
    }

    // Single slot creation
    const slot = await createSlot(body, callerOrgId, callerUid)
    return NextResponse.json({ slot }, { status: 201 })
  } catch (e: any) {
    console.error('[api/org/slots] POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * Helper function to create a single slot
 */
async function createSlot(data: any, orgId: string, createdBy: string) {
  const {
    startTime: startTimeISO,
    endTime: endTimeISO,
    timezone,
    route,
    studentId,
    studentName,
    studentEmail,
    notes
  } = data

  if (!startTimeISO || !endTimeISO || !timezone) {
    throw new Error('startTime, endTime, and timezone are required')
  }

  const startTime = new Date(startTimeISO)
  const endTime = new Date(endTimeISO)

  // Validate times
  if (startTime >= endTime) {
    throw new Error('Start time must be before end time')
  }

  // Check for overlapping slots
  const overlappingSlots = await adminDb()
    .collection('interviewSlots')
    .where('orgId', '==', orgId)
    .where('startTime', '<', Timestamp.fromDate(endTime))
    .where('endTime', '>', Timestamp.fromDate(startTime))
    .where('status', 'in', ['available', 'booked'])
    .get()

  if (!overlappingSlots.empty) {
    throw new Error('Time slot overlaps with existing slot')
  }

  // Create slot document
  const slotData: any = {
    orgId,
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    timezone,
    status: studentId ? 'booked' : 'available',
    bookedBy: createdBy,
    remindersSent: {
      confirmation: false,
      reminder24h: false,
      reminder1h: false
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }

  if (route) slotData.interviewRoute = route
  if (studentId) {
    slotData.studentId = studentId
    slotData.bookedAt = FieldValue.serverTimestamp()
  }
  if (studentName) slotData.studentName = studentName
  if (studentEmail) slotData.studentEmail = studentEmail
  if (notes) slotData.notes = notes

  const docRef = await adminDb().collection('interviewSlots').add(slotData)

  // Send confirmation email if student is assigned
  if (studentId && studentEmail) {
    try {
      // Fetch organization details for branding
      const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
      const orgData = orgDoc.data()
      const orgName = orgData?.name || 'Organization'
      const orgBranding = orgData?.settings?.customBranding as OrganizationBranding | undefined

      // Format date and time for email
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      })
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone
      })

      const interviewDate = dateFormatter.format(startTime)
      const interviewTime = timeFormatter.format(startTime)

      // Map route to display name
      const routeDisplayMap: Record<string, string> = {
        'usa_f1': 'USA F1 Student Visa',
        'uk_student': 'UK Student Visa',
        'france_ema': 'France EMA Interview',
        'france_icn': 'France ICN Interview'
      }
      const routeDisplay = routeDisplayMap[route] || route

      await sendInterviewConfirmation({
        to: studentEmail,
        studentName: studentName || 'Student',
        orgName,
        orgBranding,
        interviewDate,
        interviewTime,
        timezone,
        route,
        routeDisplay,
        slotId: docRef.id
      })

      // Update slot to mark confirmation email as sent
      await docRef.update({
        'remindersSent.confirmation': true
      })

      console.log(`[Slot Created] Confirmation email sent to ${studentEmail}`)
    } catch (emailError) {
      // Log error but don't fail the slot creation
      console.error('[Slot Created] Failed to send confirmation email:', emailError)
      // Could optionally add a field to track failed email attempts
    }
  }

  return {
    id: docRef.id,
    ...slotData,
    startTime: startTimeISO,
    endTime: endTimeISO,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}
