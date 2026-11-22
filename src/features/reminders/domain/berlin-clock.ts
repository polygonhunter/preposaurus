import { dayParts, todayInBerlin, type CalendarDay } from '@/shared/lib/dates'

// Zeitpläne der Erinnerungen gelten in Europe/Berlin (technik.html, Ablauf Erinnerungen), egal in
// welcher Zeitzone der Worker läuft. Sommer- und Winterzeit stecken in Intl.

/** Ortszeit in Berlin, so weit die Zeitpläne sie brauchen. */
export interface BerlinClock {
  day: CalendarDay
  /** ISO-Wochentag: 1 Montag … 7 Sonntag */
  weekday: number
  /** Minuten seit Mitternacht */
  minutes: number
}

const MINUTES_PER_HOUR = 60
const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/

const berlinTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function isoWeekday(day: CalendarDay): number {
  const { year, month, day: dayOfMonth } = dayParts(day)
  const sundayBased = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay()
  return sundayBased === 0 ? 7 : sundayBased
}

function minutesInBerlin(now: Date): number {
  const parts = berlinTime.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value)
  return part('hour') * MINUTES_PER_HOUR + part('minute')
}

export function berlinClockAt(now: Date): BerlinClock {
  const day = todayInBerlin(now)
  return { day, weekday: isoWeekday(day), minutes: minutesInBerlin(now) }
}

/** Liest „10:00“ oder „10:00:00“ (Spalte `time`) als Minuten seit Mitternacht, sonst null. */
export function parseTimeOfDay(text: string): number | null {
  const match = TIME_OF_DAY.exec(text)
  if (!match) return null
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2])
}
