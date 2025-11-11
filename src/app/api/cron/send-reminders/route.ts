import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminDb, Timestamp } from '@/lib/firebase-admin'
import { send24HourReminder, send1HourReminder } from '@/lib/email-service'
import { formatDateForDisplay, formatTimeForDisplay, getHoursUntil } from '@/lib/timezone-utils'
import type { InterviewSlot, OrganizationBranding } from '@/types/firestore'

/**
 * POST /api/cron/send-reminders
 * Vercel Cron job to send 24h and 1h reminders
 * Runs every hour
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-reminders",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureFirebaseAdmin()

    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)
    const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000)
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    let sent24h = 0
    let sent1h = 0
    let failed = 0

    // ===== Send 24-hour reminders =====
    const slots24h = await adminDb()
      .collection('interviewSlots')
      .where('status', '==', 'booked')
      .where('startTime', '>=', Timestamp.fromDate(in24Hours))
      .where('startTime', '<=', Timestamp.fromDate(in25Hours))
      .get()

    console.log(`[Cron] Found ${slots24h.size} slots for 24h reminders`)

    for (const doc of slots24h.docs) {
      const slot = doc.data() as InterviewSlot
      
      // Skip if already sent
      if (slot.remindersSent?.reminder24h) {
        console.log(`[Cron] Skipping 24h reminder for slot ${doc.id} - already sent`)
        continue
      }

      // Skip if no student email
      if (!slot.studentEmail || !slot.studentName) {
        console.log(`[Cron] Skipping slot ${doc.id} - no student email`)
        continue
      }

      try {
        // Fetch organization for branding
        const orgSnap = await adminDb().collection('organizations').doc(slot.orgId).get()
        const orgData = orgSnap.data() as { name: string; settings?: { customBranding?: OrganizationBranding } }
        const orgName = orgData?.name || 'Organization'
        const orgBranding = orgData?.settings?.customBranding

        const startTime = slot.startTime.toDate()
        const hoursUntil = getHoursUntil(startTime, slot.timezone)

        await send24HourReminder({
          to: slot.studentEmail,
          studentName: slot.studentName,
          orgName,
          orgBranding,
          interviewDate: formatDateForDisplay(startTime, slot.timezone),
          interviewTime: formatTimeForDisplay(startTime, slot.timezone),
          timezone: slot.timezone,
          route: slot.interviewRoute || '',
          routeDisplay: getRouteDisplay(slot.interviewRoute || ''),
          hoursUntil
        })

        // Mark as sent
        await adminDb().collection('interviewSlots').doc(doc.id).update({
          'remindersSent.reminder24h': true
        })

        // Log reminder
        await adminDb().collection('reminderLogs').add({
          interviewSlotId: doc.id,
          orgId: slot.orgId,
          studentEmail: slot.studentEmail,
          type: 'reminder_24h',
          status: 'sent',
          sentAt: Timestamp.now(),
          emailProvider: 'brevo'
        })

        sent24h++
        console.log(`[Cron] Sent 24h reminder to ${slot.studentEmail} for slot ${doc.id}`)
      } catch (error) {
        console.error(`[Cron] Failed to send 24h reminder for slot ${doc.id}:`, error)
        failed++

        // Log failure
        await adminDb().collection('reminderLogs').add({
          interviewSlotId: doc.id,
          orgId: slot.orgId,
          studentEmail: slot.studentEmail || '',
          type: 'reminder_24h',
          status: 'failed',
          sentAt: Timestamp.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
          emailProvider: 'brevo'
        })
      }
    }

    // ===== Send 1-hour reminders =====
    const slots1h = await adminDb()
      .collection('interviewSlots')
      .where('status', '==', 'booked')
      .where('startTime', '>=', Timestamp.fromDate(in1Hour))
      .where('startTime', '<=', Timestamp.fromDate(in2Hours))
      .get()

    console.log(`[Cron] Found ${slots1h.size} slots for 1h reminders`)

    for (const doc of slots1h.docs) {
      const slot = doc.data() as InterviewSlot
      
      // Skip if already sent
      if (slot.remindersSent?.reminder1h) {
        console.log(`[Cron] Skipping 1h reminder for slot ${doc.id} - already sent`)
        continue
      }

      // Skip if no student email
      if (!slot.studentEmail || !slot.studentName) {
        console.log(`[Cron] Skipping slot ${doc.id} - no student email`)
        continue
      }

      try {
        // Fetch organization for branding
        const orgSnap = await adminDb().collection('organizations').doc(slot.orgId).get()
        const orgData = orgSnap.data() as { name: string; settings?: { customBranding?: OrganizationBranding } }
        const orgName = orgData?.name || 'Organization'
        const orgBranding = orgData?.settings?.customBranding

        const startTime = slot.startTime.toDate()
        const hoursUntil = getHoursUntil(startTime, slot.timezone)

        await send1HourReminder({
          to: slot.studentEmail,
          studentName: slot.studentName,
          orgName,
          orgBranding,
          interviewDate: formatDateForDisplay(startTime, slot.timezone),
          interviewTime: formatTimeForDisplay(startTime, slot.timezone),
          timezone: slot.timezone,
          route: slot.interviewRoute || '',
          routeDisplay: getRouteDisplay(slot.interviewRoute || ''),
          hoursUntil
        })

        // Mark as sent
        await adminDb().collection('interviewSlots').doc(doc.id).update({
          'remindersSent.reminder1h': true
        })

        // Log reminder
        await adminDb().collection('reminderLogs').add({
          interviewSlotId: doc.id,
          orgId: slot.orgId,
          studentEmail: slot.studentEmail,
          type: 'reminder_1h',
          status: 'sent',
          sentAt: Timestamp.now(),
          emailProvider: 'brevo'
        })

        sent1h++
        console.log(`[Cron] Sent 1h reminder to ${slot.studentEmail} for slot ${doc.id}`)
      } catch (error) {
        console.error(`[Cron] Failed to send 1h reminder for slot ${doc.id}:`, error)
        failed++

        // Log failure
        await adminDb().collection('reminderLogs').add({
          interviewSlotId: doc.id,
          orgId: slot.orgId,
          studentEmail: slot.studentEmail || '',
          type: 'reminder_1h',
          status: 'failed',
          sentAt: Timestamp.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
          emailProvider: 'brevo'
        })
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      sent24h,
      sent1h,
      failed,
      total: sent24h + sent1h
    }

    console.log(`[Cron] Reminder job completed:`, result)
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[Cron] Error in send-reminders:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET endpoint for manual testing
 */
export async function GET(req: NextRequest) {
  // Allow GET for testing, but require secret
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized - invalid secret' }, { status: 401 })
  }

  // Forward to POST handler
  return POST(req)
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
