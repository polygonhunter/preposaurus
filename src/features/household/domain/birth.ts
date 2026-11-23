// Geburtsangabe eines Mitglieds (02_HAUSHALT_ZIEL §1, HH-02): Pflicht ist das Jahr, bei Babys
// zusätzlich der Monat, damit das Alter sich von selbst fortschreibt. Gespeichert wird ein Tag in
// mitglied.geburtsdatum: der Erste des Monats bzw. der 1. Januar. Einen genauen Tag fragt die App
// nicht ab, deshalb zeigt sie bei Babys Monat und Jahr, sonst nur das Jahr.
import { calendarDayFrom, dayParts, type CalendarDay } from '@/shared/lib/dates'
import type { MemberType } from './member'

export type Birth = Readonly<{ year: number; month: number | null }>

export type BirthProblem = 'month-missing' | 'in-future'

const JANUARY = 1
const FIRST_DAY = 1

const needsMonth = (type: MemberType) => type === 'baby'

/** Was an der Angabe fehlt oder nicht stimmt, sonst null. */
export function findBirthProblem(
  birth: Birth,
  type: MemberType,
  today: CalendarDay,
): BirthProblem | null {
  if (needsMonth(type) && birth.month === null) return 'month-missing'
  const current = dayParts(today)
  if (birth.year > current.year) return 'in-future'
  const isThisYear = birth.year === current.year
  if (isThisYear && birth.month !== null && birth.month > current.month) return 'in-future'
  return null
}

/** Tag für die DB. Der Monat zählt nur bei Babys, sonst gilt der 1. Januar. */
export function toBirthDate(birth: Birth, type: MemberType): CalendarDay {
  const month = needsMonth(type) ? (birth.month ?? JANUARY) : JANUARY
  const day = calendarDayFrom({ year: birth.year, month, day: FIRST_DAY })
  if (day === null) throw new RangeError(`Kein gültiges Geburtsjahr: ${String(birth.year)}`)
  return day
}

/** Liest die gespeicherte Angabe so, wie sie abgefragt wurde. */
export function birthFromDate(date: CalendarDay, type: MemberType): Birth {
  const { year, month } = dayParts(date)
  return { year, month: needsMonth(type) ? month : null }
}
