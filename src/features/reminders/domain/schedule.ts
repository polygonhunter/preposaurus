import { todayInBerlin } from '@/shared/lib/dates'
import { berlinClockAt, parseTimeOfDay } from './berlin-clock'

// Wann eine Erinnerung fällig ist. Der Worker fragt regelmäßig, die Merker „zuletzt gesendet“
// sorgen dafür, dass jede Art höchstens einmal am Tag (Berliner Kalendertag) hinausgeht.

/** Zeitplan der Wochenübersicht je Haushalt (Standard Sa 10:00, EINSTELLUNGEN_NUTZER §6.2). */
export interface WeeklySchedule {
  isEnabled: boolean
  /** ISO-Wochentag: 1 Montag … 7 Sonntag */
  weekday: number
  /** „HH:MM“ oder „HH:MM:SS“ */
  time: string
}

/**
 * Ruhezeit für „Dringend“: zwischen 21:00 und 8:00 Uhr geht keine Nachricht hinaus, sie kommt am
 * Morgen. Die Wochenübersicht hat eine selbst gewählte Uhrzeit und ist davon ausgenommen.
 */
const URGENT_QUIET_HOURS = { fromMinutes: 21 * 60, untilMinutes: 8 * 60 } as const

export function isInQuietHours(minutes: number): boolean {
  const { fromMinutes, untilMinutes } = URGENT_QUIET_HOURS
  return minutes >= fromMinutes || minutes < untilMinutes
}

function wasSentToday(lastSentAt: Date | null, now: Date): boolean {
  return lastSentAt !== null && todayInBerlin(lastSentAt) === todayInBerlin(now)
}

interface WeeklyDueInput {
  now: Date
  schedule: WeeklySchedule
  lastSentAt: Date | null
}

/** Heute ist der Tag der Wochenübersicht, und sie ist noch nicht hinausgegangen. */
export function isWeeklySummaryPending({ now, schedule, lastSentAt }: WeeklyDueInput): boolean {
  if (!schedule.isEnabled || parseTimeOfDay(schedule.time) === null) return false
  return berlinClockAt(now).weekday === schedule.weekday && !wasSentToday(lastSentAt, now)
}

/**
 * Fällig ab der gewählten Uhrzeit am gewählten Wochentag. War der Worker zur Uhrzeit nicht da,
 * holt er die Übersicht am selben Tag nach, am nächsten Tag nicht mehr.
 */
export function isWeeklySummaryDue(input: WeeklyDueInput): boolean {
  const startMinutes = parseTimeOfDay(input.schedule.time)
  if (startMinutes === null || !isWeeklySummaryPending(input)) return false
  return berlinClockAt(input.now).minutes >= startMinutes
}

interface UrgentDueInput {
  now: Date
  isEnabled: boolean
  lastSentAt: Date | null
}

/** „Dringend“ höchstens einmal am Tag und nie in der Ruhezeit. */
export function isUrgentDue({ now, isEnabled, lastSentAt }: UrgentDueInput): boolean {
  if (!isEnabled || isInQuietHours(berlinClockAt(now).minutes)) return false
  return !wasSentToday(lastSentAt, now)
}
