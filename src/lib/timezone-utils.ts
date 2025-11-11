/**
 * Timezone Utilities for Interview Scheduling
 * Handles timezone conversions for multi-timezone organizations
 */

import { DateTime } from 'luxon'

/**
 * Convert UTC timestamp to organization timezone
 */
export function convertToOrgTimezone(
  utcTimestamp: Date,
  orgTimezone: string
): string {
  return DateTime.fromJSDate(utcTimestamp)
    .setZone(orgTimezone)
    .toFormat('yyyy-MM-dd HH:mm')
}

/**
 * Convert UTC timestamp to user timezone with full formatting
 */
export function convertToUserTimezone(
  utcTimestamp: Date,
  userTimezone: string
): string {
  return DateTime.fromJSDate(utcTimestamp)
    .setZone(userTimezone)
    .toLocaleString(DateTime.DATETIME_FULL)
}

/**
 * Format date for display (e.g., "November 11, 2025")
 */
export function formatDateForDisplay(date: Date, timezone: string): string {
  return DateTime.fromJSDate(date)
    .setZone(timezone)
    .toFormat('MMMM d, yyyy')
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTimeForDisplay(date: Date, timezone: string): string {
  return DateTime.fromJSDate(date)
    .setZone(timezone)
    .toFormat('h:mm a')
}

/**
 * Get user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Validate IANA timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    DateTime.local().setZone(timezone)
    return true
  } catch {
    return false
  }
}

/**
 * Get list of common timezones grouped by region
 */
export function getCommonTimezones(): { region: string; zones: { label: string; value: string }[] }[] {
  return [
    {
      region: 'North America',
      zones: [
        { label: 'Eastern Time (ET)', value: 'America/New_York' },
        { label: 'Central Time (CT)', value: 'America/Chicago' },
        { label: 'Mountain Time (MT)', value: 'America/Denver' },
        { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
        { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
        { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' },
      ]
    },
    {
      region: 'Europe',
      zones: [
        { label: 'London (GMT/BST)', value: 'Europe/London' },
        { label: 'Paris (CET/CEST)', value: 'Europe/Paris' },
        { label: 'Berlin (CET/CEST)', value: 'Europe/Berlin' },
        { label: 'Madrid (CET/CEST)', value: 'Europe/Madrid' },
        { label: 'Rome (CET/CEST)', value: 'Europe/Rome' },
        { label: 'Athens (EET/EEST)', value: 'Europe/Athens' },
        { label: 'Moscow (MSK)', value: 'Europe/Moscow' },
      ]
    },
    {
      region: 'Asia',
      zones: [
        { label: 'Dubai (GST)', value: 'Asia/Dubai' },
        { label: 'Kolkata (IST)', value: 'Asia/Kolkata' },
        { label: 'Kathmandu (NPT)', value: 'Asia/Kathmandu' },
        { label: 'Bangkok (ICT)', value: 'Asia/Bangkok' },
        { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
        { label: 'Hong Kong (HKT)', value: 'Asia/Hong_Kong' },
        { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
        { label: 'Seoul (KST)', value: 'Asia/Seoul' },
      ]
    },
    {
      region: 'Australia & Pacific',
      zones: [
        { label: 'Sydney (AEDT/AEST)', value: 'Australia/Sydney' },
        { label: 'Melbourne (AEDT/AEST)', value: 'Australia/Melbourne' },
        { label: 'Brisbane (AEST)', value: 'Australia/Brisbane' },
        { label: 'Perth (AWST)', value: 'Australia/Perth' },
        { label: 'Auckland (NZDT/NZST)', value: 'Pacific/Auckland' },
      ]
    },
    {
      region: 'South America',
      zones: [
        { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
        { label: 'Buenos Aires (ART)', value: 'America/Argentina/Buenos_Aires' },
        { label: 'Santiago (CLT)', value: 'America/Santiago' },
        { label: 'Bogotá (COT)', value: 'America/Bogota' },
      ]
    },
    {
      region: 'Africa',
      zones: [
        { label: 'Cairo (EET)', value: 'Africa/Cairo' },
        { label: 'Lagos (WAT)', value: 'Africa/Lagos' },
        { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
        { label: 'Johannesburg (SAST)', value: 'Africa/Johannesburg' },
      ]
    }
  ]
}

/**
 * Calculate time difference in hours between two timezones
 */
export function getTimezoneOffset(timezone1: string, timezone2: string): number {
  const now = DateTime.now()
  const tz1 = now.setZone(timezone1)
  const tz2 = now.setZone(timezone2)
  return (tz1.offset - tz2.offset) / 60 // Convert minutes to hours
}

/**
 * Convert local time to UTC
 */
export function localToUTC(date: Date, timezone: string): Date {
  return DateTime.fromJSDate(date, { zone: timezone })
    .toUTC()
    .toJSDate()
}

/**
 * Convert UTC to local time
 */
export function utcToLocal(date: Date, timezone: string): Date {
  return DateTime.fromJSDate(date, { zone: 'utc' })
    .setZone(timezone)
    .toJSDate()
}

/**
 * Check if a given time is in the past
 */
export function isPastTime(date: Date, timezone: string): boolean {
  const targetTime = DateTime.fromJSDate(date, { zone: timezone })
  const now = DateTime.now().setZone(timezone)
  return targetTime < now
}

/**
 * Get start and end of day in a specific timezone
 */
export function getDayBounds(date: Date, timezone: string): { start: Date; end: Date } {
  const dt = DateTime.fromJSDate(date, { zone: timezone })
  return {
    start: dt.startOf('day').toJSDate(),
    end: dt.endOf('day').toJSDate()
  }
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Parse time string (HH:mm) and combine with date
 */
export function parseTimeString(date: Date, timeString: string, timezone: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  return DateTime.fromJSDate(date, { zone: timezone })
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
    .toJSDate()
}

/**
 * Generate time slots for a given date range
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
  bufferTime: number = 0
): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  let current = DateTime.now().set({ hour: startHour, minute: startMin })
  const end = DateTime.now().set({ hour: endHour, minute: endMin })
  
  while (current < end) {
    slots.push(current.toFormat('HH:mm'))
    current = current.plus({ minutes: slotDuration + bufferTime })
  }
  
  return slots
}

/**
 * Check if two time ranges overlap
 */
export function doTimesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Get hours until a specific time
 */
export function getHoursUntil(futureDate: Date, timezone: string): number {
  const future = DateTime.fromJSDate(futureDate, { zone: timezone })
  const now = DateTime.now().setZone(timezone)
  return future.diff(now, 'hours').hours
}

/**
 * Format relative time (e.g., "in 2 hours", "tomorrow at 3 PM")
 */
export function formatRelativeTime(date: Date, timezone: string): string {
  const dt = DateTime.fromJSDate(date, { zone: timezone })
  const now = DateTime.now().setZone(timezone)
  const diff = dt.diff(now, ['days', 'hours', 'minutes'])
  
  if (diff.days > 7) {
    return dt.toFormat('MMM d, h:mm a')
  } else if (diff.days >= 2) {
    return `in ${Math.floor(diff.days)} days`
  } else if (diff.days >= 1) {
    return `tomorrow at ${dt.toFormat('h:mm a')}`
  } else if (diff.hours >= 1) {
    return `in ${Math.floor(diff.hours)} hours`
  } else if (diff.minutes >= 1) {
    return `in ${Math.floor(diff.minutes)} minutes`
  } else {
    return 'very soon'
  }
}
