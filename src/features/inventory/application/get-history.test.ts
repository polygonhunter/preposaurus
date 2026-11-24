import { describe, expect, expectTypeOf, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { HistoryOutcome, HistoryPeriod, TakenOutUnit } from '../domain/history'
import type { UnitStatus } from '../domain/unit'
import { HISTORY_PAGE_LIMIT, type HistoryFilter } from '../schemas/history'
import {
  createFakeStockReader,
  product,
  reisCategory,
} from '../../../../tests/helpers/fake-stock-reader'
import { getHistory, type TakenOutReader } from './get-history'

const householdId = 'haushalt-a'
const today = toCalendarDay('2026-11-24')
const spaghetti = product({ id: 'nudeln' })
const rice = product({ id: 'reis', name: 'Reis lose', foodType: null, category: reisCategory })
const reader = createFakeStockReader({ householdId, products: [spaghetti, rice], units: [] })

let counter = 0
function takenOut(productId: string, outcome: HistoryOutcome, iso: string): TakenOutUnit {
  counter += 1
  return {
    id: `einheit-${String(counter)}`,
    productId,
    outcome,
    takenAt: new Date(iso),
    takenBy: outcome === 'consumed' ? 'Alex' : null,
    bestBefore: { date: toCalendarDay('2027-03-31'), precision: 'month', isEstimated: false },
  }
}

/** Fake des Ports: filtert wie das Repository, neueste zuerst. */
function createFakeHistory(rows: readonly TakenOutUnit[]): TakenOutReader {
  const inScope = (household: string, query: Parameters<TakenOutReader['countUnitsByStatus']>[1]) =>
    (household === householdId ? rows : []).filter(
      (row) =>
        (query.productIds?.includes(row.productId) ?? true) &&
        (query.takenFrom === null || row.takenAt >= query.takenFrom),
    )
  return {
    loadTakenOutUnits: (household, query) =>
      Promise.resolve(
        inScope(household, query)
          .filter((row) => query.outcomes.includes(row.outcome))
          .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
          .slice(0, query.limit),
      ),
    countUnitsByStatus: (household, query) => {
      const counts: Record<UnitStatus, number> = { stock: 0, consumed: 0, discarded: 0 }
      for (const row of inScope(household, query)) counts[row.outcome] += 1
      return Promise.resolve(counts)
    },
  }
}

const rows = [
  takenOut('nudeln', 'consumed', '2026-11-24T07:00:00Z'),
  takenOut('reis', 'discarded', '2026-11-23T23:30:00Z'),
  takenOut('nudeln', 'consumed', '2026-11-01T10:00:00Z'),
  // Ein Tag vor dem Zeitraum „30 Tage“ (26.10. bis 24.11.), in Berlin noch der 25.10.
  takenOut('nudeln', 'discarded', '2026-10-25T21:59:00Z'),
]

// Die Testdaten nutzen lesbare IDs statt UUIDs, deshalb ohne Schema (das prüft der Integrationstest)
const run = (filter: Partial<HistoryFilter>, household = householdId, history = rows) =>
  getHistory(
    { reader, history: createFakeHistory(history) },
    { householdId: household, today, filter: { period: '30-days', ...filter } },
  )

async function page(filter: Partial<HistoryFilter>) {
  const result = await run(filter)
  if (!result.ok) throw new Error('nicht gefunden')
  return result.value
}

describe('getHistory', () => {
  it('spiegelt Ausgang und Zeitraum des Schemas genau in den Domain-Typen', () => {
    expectTypeOf<NonNullable<HistoryFilter['outcome']>>().toEqualTypeOf<HistoryOutcome>()
    expectTypeOf<HistoryFilter['period']>().toEqualTypeOf<HistoryPeriod>()
  })

  it('zeigt die letzten 30 Tage nach Berliner Tag, mit Person und Ziel', async () => {
    const result = await page({})

    expect(result.from).toBe('2026-10-26')
    expect(result.counts).toEqual({ consumed: 2, discarded: 1 })
    expect(result.days.map(({ day, items }) => [day, items.map((item) => item.name)])).toEqual([
      ['2026-11-24', ['Spaghetti', 'Reis lose']],
      ['2026-11-01', ['Spaghetti']],
    ])
    expect(result.days[0]?.items[0]).toMatchObject({
      outcome: 'consumed',
      person: 'Alex',
      target: { kind: 'food-type', id: spaghetti.foodType?.id },
    })
    expect(result.days[0]?.items[1]?.target).toEqual({ kind: 'product', id: 'reis' })
  })

  it('filtert nach Ausgang, die Zähler bleiben für beide Ausgänge', async () => {
    const result = await page({ outcome: 'discarded', period: 'all' })

    expect(result.days.flatMap(({ items }) => items.map((item) => item.outcome))).toEqual([
      'discarded',
      'discarded',
    ])
    expect(result.counts).toEqual({ consumed: 2, discarded: 2 })
    expect(result.from).toBeNull()
  })

  it('zeigt auf Wunsch nur eine Lebensmittelart und nennt ihren Namen', async () => {
    const target = { kind: 'food-type' as const, id: spaghetti.foodType?.id ?? '' }
    const result = await page({ target, period: '12-months' })

    expect(result.target).toEqual({ target, name: 'Spaghetti' })
    expect(result.counts).toEqual({ consumed: 2, discarded: 1 })
  })

  it('meldet ein unbekanntes oder fremdes Ziel als nicht gefunden', async () => {
    const target = { kind: 'product' as const, id: 'unbekannt' }

    expect(await run({ target })).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(await run({}, 'haushalt-b')).toMatchObject({ ok: true, value: { days: [] } })
  })

  it('zeigt höchstens eine Seite und sagt, dass es weitergeht', async () => {
    const many = Array.from({ length: HISTORY_PAGE_LIMIT + 1 }, (_, index) =>
      takenOut('nudeln', 'consumed', new Date(Date.UTC(2026, 10, 24, 0, index)).toISOString()),
    )
    const result = await run({}, householdId, many)

    expect(result.ok && result.value.isTruncated).toBe(true)
    expect(result.ok && result.value.days.flatMap(({ items }) => items).length).toBe(
      HISTORY_PAGE_LIMIT,
    )
  })
})
