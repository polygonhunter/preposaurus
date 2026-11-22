import { describe, expect, it } from 'vitest'
import { formatQuantity } from '@/shared/lib/quantities'
import { toCalendarDay } from '@/shared/lib/dates'
import { compareOutcomes, fulfillmentPercent, type HistoryEntry } from './stats'

describe('fulfillmentPercent', () => {
  const input = { suppliedDays: 6.2, goalDays: 10, sourceStandardDays: 10 }

  it('bezieht sich vorläufig auf die Zieldauer', () => {
    expect(fulfillmentPercent(input)).toBe(62)
    expect(fulfillmentPercent({ ...input, goalDays: 14 })).toBe(44)
  })

  it('zeigt Übererfüllung über 100 %', () => {
    expect(fulfillmentPercent({ ...input, suppliedDays: 12 })).toBe(120)
  })

  it('kann auf den Standard der Quelle umgestellt werden', () => {
    expect(fulfillmentPercent({ ...input, goalDays: 3 }, 'source-standard')).toBe(62)
  })

  it('liefert null ohne sinnvollen Bezug', () => {
    expect(fulfillmentPercent({ ...input, goalDays: 0 })).toBeNull()
  })
})

describe('compareOutcomes', () => {
  const entry = (outcome: HistoryEntry['outcome'], date: string, amount: HistoryEntry['amount']) =>
    ({ outcome, date: toCalendarDay(date), amount }) satisfies HistoryEntry
  const year2026 = { from: toCalendarDay('2026-01-01'), to: toCalendarDay('2026-12-31') }
  const history = [
    entry('consumed', '2026-03-10', { value: 500, unit: 'g' }),
    entry('consumed', '2026-12-31', { value: 1500, unit: 'ml' }),
    entry('discarded', '2026-01-01', { value: 400, unit: 'g' }),
    entry('discarded', '2025-12-31', { value: 1000, unit: 'g' }),
    entry('consumed', '2027-01-01', { value: 500, unit: 'g' }),
  ]

  it('vergleicht verbraucht und entsorgt im Zeitraum, beide Grenztage eingeschlossen', () => {
    expect(compareOutcomes(history, year2026)).toEqual({
      consumed: { count: 2, amounts: { g: 500, ml: 1500 } },
      discarded: { count: 1, amounts: { g: 400, ml: 0 } },
    })
  })

  it('summiert die entsorgte Menge für die Anzeige „2026: … entsorgt“', () => {
    const { discarded } = compareOutcomes(history, year2026)
    expect(formatQuantity({ value: discarded.amounts.g, unit: 'g' })).toBe('400 g')
    const more = [...history, entry('discarded', '2026-05-05', { value: 600, unit: 'g' })]
    expect(
      formatQuantity({ value: compareOutcomes(more, year2026).discarded.amounts.g, unit: 'g' }),
    ).toBe('1 kg')
  })

  it('zählt nichts, wenn im Zeitraum nichts entsorgt wurde', () => {
    const period = { from: toCalendarDay('2026-02-01'), to: toCalendarDay('2026-02-28') }
    expect(compareOutcomes(history, period).discarded.count).toBe(0)
  })
})
