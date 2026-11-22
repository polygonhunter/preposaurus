import type { CalendarDay } from '@/shared/lib/dates'
import type { Quantity, QuantityUnit } from '@/shared/lib/quantities'

type FulfillmentBasis = 'goal-duration' | 'source-standard'

/** Vorläufige Annahme U11 (STA-01): Der Erfüllungsgrad bezieht sich auf die Zieldauer. */
const FULFILLMENT_BASIS: FulfillmentBasis = 'goal-duration'

const PERCENT = 100

interface FulfillmentInput {
  suppliedDays: number
  goalDays: number
  sourceStandardDays: number
}

/** Erfüllungsgrad in Prozent, abgerundet. Über 100 % ist möglich und gewollt. */
export function fulfillmentPercent(
  input: FulfillmentInput,
  basis: FulfillmentBasis = FULFILLMENT_BASIS,
): number | null {
  const referenceDays = basis === 'goal-duration' ? input.goalDays : input.sourceStandardDays
  if (referenceDays <= 0) return null
  return Math.floor((input.suppliedDays / referenceDays) * PERCENT)
}

export type UnitOutcome = 'consumed' | 'discarded'

/** Eine Einheit, die den Vorrat verlassen hat, mit Datum der Entscheidung und Menge. */
export interface HistoryEntry {
  outcome: UnitOutcome
  date: CalendarDay
  amount: Quantity
}

export interface Period {
  from: CalendarDay
  to: CalendarDay
}

export interface OutcomeTotals {
  count: number
  amounts: Record<QuantityUnit, number>
}

const emptyTotals = (): OutcomeTotals => ({ count: 0, amounts: { g: 0, ml: 0, piece: 0 } })

const isInPeriod = (date: CalendarDay, { from, to }: Period) => date >= from && date <= to

/** Verbraucht gegen entsorgt im Zeitraum (beide Tage eingeschlossen), z. B. „2026: 0,4 kg entsorgt“. */
export function compareOutcomes(
  entries: readonly HistoryEntry[],
  period: Period,
): Record<UnitOutcome, OutcomeTotals> {
  const totals = { consumed: emptyTotals(), discarded: emptyTotals() }
  for (const entry of entries) {
    if (!isInPeriod(entry.date, period)) continue
    const target = totals[entry.outcome]
    target.count += 1
    target.amounts[entry.amount.unit] += entry.amount.value
  }
  return totals
}
