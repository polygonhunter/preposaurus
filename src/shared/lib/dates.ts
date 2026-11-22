// Kalendertage als ISO-Text (JJJJ-MM-TT). Gerechnet wird nur in UTC, damit Sommerzeit und
// Mitternacht nie einen Tag verschieben. Uhrzeiten kommen nur in todayInBerlin vor.

declare const calendarDayBrand: unique symbol

export type CalendarDay = string & { readonly [calendarDayBrand]: true }

const DAY_MS = 86_400_000
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const BERLIN = 'Europe/Berlin'

interface DayParts {
  year: number
  month: number
  day: number
}

const pad = (value: number, length: number) => String(value).padStart(length, '0')

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

const isIntegerBetween = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max

// Date.UTC legt die Jahre 0–99 auf 1900–1999, deshalb erst ab Jahr 1000
const MIN_YEAR = 1000

/** Baut einen Kalendertag aus Jahr, Monat (1–12) und Tag. Ungültiges ergibt null. */
export function calendarDayFrom({ year, month, day }: DayParts): CalendarDay | null {
  if (!isIntegerBetween(year, MIN_YEAR, 9999) || !isIntegerBetween(month, 1, 12)) return null
  if (!isIntegerBetween(day, 1, daysInMonth(year, month))) return null
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as CalendarDay
}

/** Liest einen ISO-Kalendertag (JJJJ-MM-TT). Ungültige Tage wie der 30.02. ergeben null. */
export function parseCalendarDay(text: string): CalendarDay | null {
  const match = ISO_DAY.exec(text)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  if (year === undefined || month === undefined || day === undefined) return null
  return calendarDayFrom({ year, month, day })
}

/** Für feste Werte im Code: Ein ungültiger Tag ist ein Programmierfehler und wird geworfen. */
export function toCalendarDay(text: string): CalendarDay {
  const day = parseCalendarDay(text)
  if (day === null) throw new RangeError(`Kein gültiger Kalendertag: ${text}`)
  return day
}

export function dayParts(day: CalendarDay): DayParts {
  const [year = 0, month = 0, dayOfMonth = 0] = day.split('-').map(Number)
  return { year, month, day: dayOfMonth }
}

function fromUtcMillis(millis: number): CalendarDay {
  return new Date(millis).toISOString().slice(0, 10) as CalendarDay
}

function toUtcMillis(day: CalendarDay): number {
  const { year, month, day: dayOfMonth } = dayParts(day)
  return Date.UTC(year, month - 1, dayOfMonth)
}

/** Der heutige Tag in Deutschland, egal in welcher Zeitzone der Server läuft. */
export function todayInBerlin(now: Date): CalendarDay {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BERLIN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value)
  return toCalendarDay(`${pad(part('year'), 4)}-${pad(part('month'), 2)}-${pad(part('day'), 2)}`)
}

/** Ganze Tage von `from` bis `to`, negativ, wenn `to` davor liegt. */
export function daysBetween(from: CalendarDay, to: CalendarDay): number {
  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / DAY_MS)
}

export function addDays(day: CalendarDay, days: number): CalendarDay {
  return fromUtcMillis(toUtcMillis(day) + days * DAY_MS)
}

/** Monate addieren. Gibt es den Tag im Zielmonat nicht (31. → April), gilt dessen Monatsende. */
export function addMonths(day: CalendarDay, months: number): CalendarDay {
  const { year, month, day: dayOfMonth } = dayParts(day)
  const monthIndex = year * 12 + (month - 1) + months
  const targetYear = Math.floor(monthIndex / 12)
  const targetMonth = (monthIndex % 12) + 1
  const targetDay = Math.min(dayOfMonth, daysInMonth(targetYear, targetMonth))
  return toCalendarDay(`${pad(targetYear, 4)}-${pad(targetMonth, 2)}-${pad(targetDay, 2)}`)
}

export function endOfMonth(day: CalendarDay): CalendarDay {
  const { year, month } = dayParts(day)
  return toCalendarDay(`${pad(year, 4)}-${pad(month, 2)}-${pad(daysInMonth(year, month), 2)}`)
}

export function endOfYear(day: CalendarDay): CalendarDay {
  return toCalendarDay(`${pad(dayParts(day).year, 4)}-12-31`)
}

/** Wie genau ein Datum aufgedruckt ist: Tag, nur Monat oder nur Jahr. */
export type DayPrecision = 'day' | 'month' | 'year'

/** Datum so, wie es aufgedruckt war: „30.09.2027“, „09/2027“ oder „2027“. */
export function formatDayWithPrecision({
  date,
  precision,
}: {
  date: CalendarDay
  precision: DayPrecision
}): string {
  const { year, month, day } = dayParts(date)
  if (precision === 'year') return String(year)
  if (precision === 'month') return `${pad(month, 2)}/${String(year)}`
  return `${pad(day, 2)}.${pad(month, 2)}.${String(year)}`
}
