import type { BestBefore, BestBeforePrecision, DateKind } from '@/features/inventory/domain/unit'
import {
  addMonths,
  calendarDayFrom,
  dayParts,
  normalizeToPrecision,
  type CalendarDay,
} from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import { monthFromName } from './month-names'

// Regel: Ein MHD wird nie erfunden. Alles, was nicht eindeutig ein Datum ist, ergibt einen
// Fehlerwert, und die Oberfläche fragt nach. Chargennummern und Uhrzeiten sind kein Datum.

export type BestBeforeParseError =
  | { kind: 'empty' }
  | { kind: 'no-date' }
  | { kind: 'incomplete' }
  | { kind: 'ambiguous' }
  | { kind: 'invalid-date' }
  | { kind: 'year-out-of-range' }

type ParseResult = Result<BestBefore, BestBeforeParseError>

/** Vierstellige Jahre außerhalb dieses Bereichs sind kein MHD. */
const MIN_YEAR = 2000
const MAX_YEAR = 2099
const CENTURY = 2000
/**
 * Ein zweistelliges Jahr (`30.09.27`) gilt nur in einem engen Fenster um heute als 20JJ:
 * höchstens so viele Jahre zurück bzw. voraus. Außerhalb ist die Eingabe mehrdeutig.
 */
const TWO_DIGIT_YEAR_YEARS_BACK = 2
const TWO_DIGIT_YEAR_YEARS_AHEAD = 15

const LABEL =
  /^(mindestens haltbar bis( ende)?|zu verbrauchen bis|verbrauchen bis|mhd|best before( end)?|bbe|use by|exp\.?)\s*:?\s*/
const TRAILING_TIME = /\s+\d{1,2}:\d{2}(:\d{2})?( uhr)?$/
const USE_BY = /zu verbrauchen bis|verbrauchen bis|use by/i
const BEST_BEFORE_LABEL = /mindestens haltbar|mhd|best before|bbe/i

interface Matcher {
  pattern: RegExp
  toResult: (groups: string[], today: CalendarDay) => ParseResult
}

/** Jahr aus dem Aufdruck. Ein zweistelliges Jahr außerhalb des Fensters ergibt null. */
function normalizeYear(text: string, today: CalendarDay): number | null {
  const year = Number(text)
  if (text.length !== 2) return year
  const currentYear = dayParts(today).year
  const candidate = CENTURY + year
  const isInWindow =
    candidate >= currentYear - TWO_DIGIT_YEAR_YEARS_BACK &&
    candidate <= currentYear + TWO_DIGIT_YEAR_YEARS_AHEAD
  return isInWindow ? candidate : null
}

function buildDayWithShortYear(groups: string[], today: CalendarDay): ParseResult {
  const year = normalizeYear(groups[4] ?? '', today)
  if (year === null) return err({ kind: 'ambiguous' })
  return buildDay(year, n(groups, 3), n(groups, 1))
}

interface DateNumbers {
  year: number
  month: number
  day: number
}

function build(numbers: DateNumbers, precision: BestBeforePrecision): ParseResult {
  if (numbers.year < MIN_YEAR || numbers.year > MAX_YEAR) return err({ kind: 'year-out-of-range' })
  const date = calendarDayFrom(numbers)
  if (date === null) return err({ kind: 'invalid-date' })
  return ok(withPrecision(date, precision))
}

const buildDay = (year: number, month: number, day: number) => build({ year, month, day }, 'day')
const buildMonth = (year: number, month: number) => build({ year, month, day: 1 }, 'month')
const buildYear = (year: number) => build({ year, month: 1, day: 1 }, 'year')

function withPrecision(date: CalendarDay, precision: BestBeforePrecision): BestBefore {
  return { date: normalizeToPrecision(date, precision), precision, isEstimated: false }
}

const n = (groups: string[], index: number) => Number(groups[index])

const MATCHERS: Matcher[] = [
  {
    pattern: /^(\d{4})-(\d{2})-(\d{2})$/,
    toResult: (g) => buildDay(n(g, 1), n(g, 2), n(g, 3)),
  },
  { pattern: /^(\d{1,2})([./-])(\d{1,2})\2(\d{4}|\d{2})$/, toResult: buildDayWithShortYear },
  { pattern: /^(\d{4})-(\d{2})$/, toResult: (g) => buildMonth(n(g, 1), n(g, 2)) },
  { pattern: /^(\d{1,2})[./-](\d{4})$/, toResult: (g) => buildMonth(n(g, 2), n(g, 1)) },
  {
    pattern: /^([a-zäöü]{3,9})\.?\s*(\d{4})$/,
    toResult: (g) => fromMonthName(g[1] ?? '', n(g, 2)),
  },
  { pattern: /^(\d{4})$/, toResult: (g) => buildYear(n(g, 1)) },
  { pattern: /^(\d{1,2})[./](\d{1,2})(\.?)$/, toResult: classifyShortDate },
]

/** `30.09` fehlt das Jahr. `09/27` könnte Tag/Monat oder Monat/Jahr sein, also wird nicht geraten. */
function classifyShortDate(groups: string[]): ParseResult {
  const couldBeMonthAndYear = n(groups, 1) <= 12 && groups[2]?.length === 2 && groups[3] === ''
  return err({ kind: couldBeMonthAndYear ? 'ambiguous' : 'incomplete' })
}

function fromMonthName(name: string, year: number): ParseResult {
  const month = monthFromName(name)
  return month === null ? err({ kind: 'no-date' }) : buildMonth(year, month)
}

function stripDecoration(text: string): string {
  return text.trim().toLowerCase().replace(LABEL, '').replace(TRAILING_TIME, '').trim()
}

/** Liest ein MHD wie `30.09.2027`, `09/2027` oder `2027` samt Genauigkeit. */
export function parseBestBefore(text: string, today: CalendarDay): ParseResult {
  const cleaned = stripDecoration(text)
  if (cleaned === '') return err({ kind: 'empty' })
  for (const { pattern, toResult } of MATCHERS) {
    const match = pattern.exec(cleaned)
    if (match) return toResult([...match], today)
  }
  return err({ kind: 'no-date' })
}

/** Erkennt am Aufdruck, ob ein MHD oder ein Verbrauchsdatum gemeint ist. Unklar ergibt null. */
export function detectDateKind(text: string): DateKind | null {
  if (USE_BY.test(text)) return 'use-by'
  if (BEST_BEFORE_LABEL.test(text)) return 'best-before'
  return null
}

/** Monat/Jahr-Wähler: Es gilt das Monatsende, Genauigkeit „Monat“. */
export function bestBeforeFromMonth(year: number, month: number): ParseResult {
  return buildMonth(year, month)
}

const QUICK_PICK_MONTHS = {
  'plus-6-months': 6,
  'plus-1-year': 12,
  'plus-2-years': 24,
} as const

export type QuickPick = keyof typeof QUICK_PICK_MONTHS

/** Schnellknöpfe im Monat/Jahr-Wähler, gerechnet ab heute. Es gilt das Monatsende. */
export function quickPickBestBefore(today: CalendarDay, pick: QuickPick): BestBefore {
  return withPrecision(addMonths(today, QUICK_PICK_MONTHS[pick]), 'month')
}
