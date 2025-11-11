import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb, FieldValue, Timestamp } from '@/lib/firebase-admin'
import { sendCancellationEmail, sendRescheduleConfirmation } from '@/lib/email-service'
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/timezone-utils'
import type { InterviewSlot, OrganizationBranding } from '@/types/firestore'

/**
 * GET /api/org/slots/[id]
 * Get a specific interview slot
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

    const slotId = params.id
    const slotSnap = await adminDb().collection('interviewSlots').doc(slotId).get()

    if (!slotSnap.exists) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    const slotData = slotSnap.data() as InterviewSlot
    if (slotData.orgId !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: slot belongs to different organization' }, { status: 403 })
    }

    const slot = {
      id: slotSnap.id,
      ...slotData,
      startTime: slotData.startTime?.toDate?.()?.toISOString() || null,
      endTime: slotData.endTime?.toDate?.()?.toISOString() || null,
      bookedAt: slotData.bookedAt?.toDate?.()?.toISOString() || null,
      createdAt: slotData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: slotData.updatedAt?.toDate?.()?.toISOString() || null,
    }

    return NextResponse.json({ slot }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/slots/[id]] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * PATCH /api/org/slots/[id]
 * Update interview slot (reschedule, assign student, update status)
 * Body: { startTime?, endTime?, studentId?, studentName?, studentEmail?, status?, notes? }
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

    const slotId = params.id
    const slotSnap = await adminDb().collection('interviewSlots').doc(slotId).get()

    if (!slotSnap.exists) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    const slotData = slotSnap.data() as InterviewSlot
    if (slotData.orgId !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: slot belongs to different organization' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    }

    let isRescheduling = false
    let oldStartTime: Date | null = null
    let oldEndTime: Date | null = null

    // Handle rescheduling
    if (body.startTime || body.endTime) {
      isRescheduling = true
      oldStartTime = slotData.startTime?.toDate() || null
      oldEndTime = slotData.endTime?.toDate() || null

      const newStartTime = body.startTime ? new Date(body.startTime) : oldStartTime
      const newEndTime = body.endTime ? new Date(body.endTime) : oldEndTime

      if (newStartTime && newEndTime && newStartTime >= newEndTime) {
        return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
      }

      // Check for overlapping slots (excluding current slot)
      if (newStartTime && newEndTime) {
        const overlappingSlots = await adminDb()
          .collection('interviewSlots')
          .where('orgId', '==', callerOrgId)
          .where('startTime', '<', Timestamp.fromDate(newEndTime))
          .where('endTime', '>', Timestamp.fromDate(newStartTime))
          .where('status', 'in', ['available', 'booked'])
          .get()

        const hasOverlap = overlappingSlots.docs.some(doc => doc.id !== slotId)
        if (hasOverlap) {
          return NextResponse.json({ error: 'New time overlaps with existing slot' }, { status: 409 })
        }
      }

      if (newStartTime) updateData.startTime = Timestamp.fromDate(newStartTime)
      if (newEndTime) updateData.endTime = Timestamp.fromDate(newEndTime)

      // Reset reminders on reschedule
      updateData.remindersSent = {
        confirmation: false,
        reminder24h: false,
        reminder1h: false
      }
    }

    // Handle student assignment/booking
    if (body.studentId !== undefined) {
      updateData.studentId = body.studentId || null
      if (body.studentId) {
        updateData.status = 'booked'
        updateData.bookedAt = FieldValue.serverTimestamp()
        updateData.bookedBy = callerUid
      } else {
        updateData.status = 'available'
        updateData.bookedAt = null
        updateData.bookedBy = null
      }
    }

    if (body.studentName !== undefined) updateData.studentName = body.studentName || null
    if (body.studentEmail !== undefined) updateData.studentEmail = body.studentEmail || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.interviewRoute !== undefined) updateData.interviewRoute = body.interviewRoute

    // Update the slot
    await adminDb().collection('interviewSlots').doc(slotId).update(updateData)

    // Send email notifications if needed
    const shouldSendConfirmation = body.studentId && !slotData.studentId && body.studentEmail
    
    if (isRescheduling && slotData.studentEmail && oldStartTime && oldEndTime) {
      try {
        // Fetch organization details for branding
        const orgSnap = await adminDb().collection('organizations').doc(callerOrgId).get()
        const orgData = orgSnap.data() as { name: string; settings?: { customBranding?: OrganizationBranding } }
        const orgName = orgData?.name || 'Organization'
        const orgBranding = orgData?.settings?.customBranding

        const newStartTime = updateData.startTime?.toDate() || oldStartTime
        const newEndTime = updateData.endTime?.toDate() || oldEndTime

        await sendRescheduleConfirmation({
          to: slotData.studentEmail,
          studentName: slotData.studentName || 'Student',
          orgName,
          orgBranding,
          oldDate: formatDateForDisplay(oldStartTime, slotData.timezone),
          oldTime: formatTimeForDisplay(oldStartTime, slotData.timezone),
          newDate: formatDateForDisplay(newStartTime, slotData.timezone),
          newTime: formatTimeForDisplay(newStartTime, slotData.timezone),
          timezone: slotData.timezone,
          route: slotData.interviewRoute || '',
          routeDisplay: getRouteDisplay(slotData.interviewRoute || '')
        })

        // Mark confirmation as sent
        await adminDb().collection('interviewSlots').doc(slotId).update({
          'remindersSent.confirmation': true
        })
      } catch (emailError) {
        console.error('[api/org/slots/[id]] Failed to send reschedule email:', emailError)
        // Don't fail the request if email fails
      }
    } else if (shouldSendConfirmation) {
      // Send confirmation email when student is newly assigned to available slot
      try {
        const { sendInterviewConfirmation } = await import('@/lib/email-service')
        
        // Fetch organization details for branding
        const orgSnap = await adminDb().collection('organizations').doc(callerOrgId).get()
        const orgData = orgSnap.data() as { name: string; settings?: { customBranding?: OrganizationBranding } }
        const orgName = orgData?.name || 'Organization'
        const orgBranding = orgData?.settings?.customBranding

        const startTime = slotData.startTime?.toDate()
        if (startTime) {
          const dateFormatter = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: slotData.timezone
          })
          const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: slotData.timezone
          })

          const interviewDate = dateFormatter.format(startTime)
          const interviewTime = timeFormatter.format(startTime)

          await sendInterviewConfirmation({
            to: body.studentEmail,
            studentName: body.studentName || 'Student',
            orgName,
            orgBranding,
            interviewDate,
            interviewTime,
            timezone: slotData.timezone,
            route: updateData.interviewRoute || slotData.interviewRoute || '',
            routeDisplay: getRouteDisplay(updateData.interviewRoute || slotData.interviewRoute || ''),
            slotId
          })

          // Mark confirmation as sent
          await adminDb().collection('interviewSlots').doc(slotId).update({
            'remindersSent.confirmation': true
          })

          console.log(`[Slot Assigned] Confirmation email sent to ${body.studentEmail}`)
        }
      } catch (emailError) {
        console.error('[api/org/slots/[id]] Failed to send confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Return updated slot
    const updatedSnap = await adminDb().collection('interviewSlots').doc(slotId).get()
    const updatedData = updatedSnap.data() as InterviewSlot

    const slot = {
      id: updatedSnap.id,
      ...updatedData,
      startTime: updatedData.startTime?.toDate?.()?.toISOString() || null,
      endTime: updatedData.endTime?.toDate?.()?.toISOString() || null,
      bookedAt: updatedData.bookedAt?.toDate?.()?.toISOString() || null,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || null,
    }

    return NextResponse.json({ slot }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/slots/[id]] PATCH error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/org/slots/[id]
 * Cancel/delete interview slot
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

    const slotId = params.id
    const slotSnap = await adminDb().collection('interviewSlots').doc(slotId).get()

    if (!slotSnap.exists) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    const slotData = slotSnap.data() as InterviewSlot
    if (slotData.orgId !== callerOrgId) {
      return NextResponse.json({ error: 'Forbidden: slot belongs to different organization' }, { status: 403 })
    }

    // Send cancellation email if slot was booked
    if (slotData.status === 'booked' && slotData.studentEmail) {
      try {
        // Fetch organization details for branding
        const orgSnap = await adminDb().collection('organizations').doc(callerOrgId).get()
        const orgData = orgSnap.data() as { name: string; settings?: { customBranding?: OrganizationBranding } }
        const orgName = orgData?.name || 'Organization'
        const orgBranding = orgData?.settings?.customBranding

        const startTime = slotData.startTime?.toDate()
        if (startTime) {
          await sendCancellationEmail({
            to: slotData.studentEmail,
            studentName: slotData.studentName || 'Student',
            orgName,
            orgBranding,
            interviewDate: formatDateForDisplay(startTime, slotData.timezone),
            interviewTime: formatTimeForDisplay(startTime, slotData.timezone),
            reason: 'This slot has been cancelled by the organization.'
          })
        }
      } catch (emailError) {
        console.error('[api/org/slots/[id]] Failed to send cancellation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Delete the slot
    await adminDb().collection('interviewSlots').doc(slotId).delete()

    return NextResponse.json({ success: true, message: 'Slot deleted' }, { status: 200 })
  } catch (e: any) {
    console.error('[api/org/slots/[id]] DELETE error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * Helper function to get display name for interview route
 */
function getRouteDisplay(route: string): string {
  const routeMap: Record<string, string> = {
    'usa_f1': 'USA F1 Student Visa',
    'uk_student': 'UK Student Visa',
    'france_ema': 'France EMA Interview',
    'france_icn': 'France ICN Interview'
  }
  return routeMap[route] || route
}
