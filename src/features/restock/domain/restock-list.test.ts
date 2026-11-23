import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { ReplacementCandidate } from './replacement-candidates'
import {
  buildRestockList,
  captureTargetOf,
  type RestockGap,
  type RestockItem,
} from './restock-list'

// Frei gewählte Testdaten.
const item = (overrides: Partial<RestockItem> & Pick<RestockItem, 'id'>): RestockItem => ({
  label: 'Knäckebrot',
  source: 'manuell',
  status: 'offen',
  createdAt: new Date('2026-11-20T10:00:00Z'),
  doneAt: null,
  productId: null,
  foodTypeId: null,
  groupKey: null,
  amount: null,
  ...overrides,
})

const doneOn = (iso: string) => ({ status: 'erledigt' as const, doneAt: new Date(iso) })
const today = toCalendarDay('2026-11-22')

const waterGap: RestockGap = {
  groupKey: 'wasser',
  name: 'Wasser',
  missing: { value: 20_000, unit: 'ml' },
  days: 6,
  goalDays: 10,
}

const lentils: ReplacementCandidate = {
  rowKey: 'food-type:linsen',
  productIds: ['p-linsen', 'p-linsen-glas'],
  productId: 'p-linsen',
  label: 'Linsen',
  reason: { kind: 'expires', count: 1, firstDay: toCalendarDay('2026-12-01') },
}

const build = (input: Partial<Parameters<typeof buildRestockList>[0]>) =>
  buildRestockList({ items: [], gaps: [], foodTypes: [], candidates: [], today, ...input })

describe('buildRestockList', () => {
  it('trennt Ersetzen, eigene und erledigte Einträge', () => {
    const list = build({
      items: [
        item({ id: 'a', source: 'nachkauf' }),
        item({ id: 'b' }),
        item({ id: 'c', ...doneOn('2026-11-21T10:00:00Z') }),
      ],
      gaps: [waterGap],
    })

    expect(list.replace.map(({ id }) => id)).toEqual(['a'])
    expect(list.own.map(({ id }) => id)).toEqual(['b'])
    expect(list.done.map(({ id }) => id)).toEqual(['c'])
    expect(list.gaps).toEqual([{ ...waterGap, examples: [] }])
  })

  it('hängt an jede Lücke Beispiele aus den Lebensmittelarten ihrer Warengruppe', () => {
    const list = build({
      gaps: [waterGap],
      foodTypes: [
        { groupKey: 'wasser', name: 'Stilles Wasser', isStocked: false },
        { groupKey: 'getreide', name: 'Nudeln', isStocked: true },
      ],
    })

    expect(list.gaps[0]?.examples).toEqual(['Stilles Wasser'])
  })

  it('zählt nur offene, gespeicherte Einträge, keine erledigten, Lücken oder Vorschläge', () => {
    const list = build({
      items: [item({ id: 'a' }), item({ id: 'b', ...doneOn('2026-11-21T10:00:00Z') })],
      gaps: [waterGap],
      candidates: [lentils],
    })

    expect(list.openItemCount).toBe(1)
  })

  it('lässt einen Vorschlag weg, dessen Produkt oder Name schon offen auf der Liste steht', () => {
    const byProduct = build({
      items: [item({ id: 'a', source: 'nachkauf', label: 'Glas', productId: 'p-linsen-glas' })],
      candidates: [lentils],
    })
    const byName = build({ items: [item({ id: 'b', label: 'linsen' })], candidates: [lentils] })

    expect(byProduct.suggestions).toEqual([])
    expect(byName.suggestions).toEqual([])
    expect(byName.openItemCount).toBe(1)
  })

  it('zeigt den Vorschlag wieder, wenn der Eintrag erledigt ist', () => {
    const list = build({
      items: [
        item({
          id: 'a',
          label: 'Linsen',
          productId: 'p-linsen',
          ...doneOn('2026-11-21T10:00:00Z'),
        }),
      ],
      candidates: [lentils],
    })

    expect(list.suggestions).toEqual([lentils])
  })

  it('sortiert offene Einträge nach dem Anlegen, erledigte nach dem Abhaken (neueste zuerst)', () => {
    const list = build({
      items: [
        item({ id: 'spaet', createdAt: new Date('2026-11-21T10:00:00Z') }),
        item({ id: 'frueh', createdAt: new Date('2026-11-19T10:00:00Z') }),
        item({ id: 'alt', ...doneOn('2026-11-18T10:00:00Z') }),
        item({ id: 'neu', ...doneOn('2026-11-22T10:00:00Z') }),
      ],
    })

    expect(list.own.map(({ id }) => id)).toEqual(['frueh', 'spaet'])
    expect(list.done.map(({ id }) => id)).toEqual(['neu', 'alt'])
  })

  it('ist leer ohne Einträge, Lücke und Vorschlag', () => {
    expect(build({})).toEqual({
      gaps: [],
      hiddenGaps: [],
      belowGoalCount: 0,
      replace: [],
      suggestions: [],
      own: [],
      done: [],
      openItemCount: 0,
    })
  })
})

describe('buildRestockList mit abgehakten und ausgeblendeten Lücken (#201)', () => {
  const goalEntry = (overrides: Partial<RestockItem> & Pick<RestockItem, 'id' | 'status'>) =>
    item({
      label: 'Wasser',
      source: 'ziel',
      groupKey: 'wasser',
      amount: { value: 20_000, unit: 'ml' },
      doneAt: new Date('2026-11-21T10:00:00Z'),
      ...overrides,
    })

  it('verdeckt eine abgehakte Lücke und zeigt sie unter „Erledigt“ mit ihrer Menge', () => {
    const list = build({ items: [goalEntry({ id: 'z', status: 'erledigt' })], gaps: [waterGap] })

    expect(list.gaps).toEqual([])
    expect(list.hiddenGaps).toEqual([])
    expect(list.done.map(({ id }) => id)).toEqual(['z'])
    expect(list.belowGoalCount).toBe(1)
    expect(list.openItemCount).toBe(0)
  })

  it('führt eine ausgeblendete Lücke unter „Ausgeblendet“, mit der aktuellen Menge', () => {
    const smaller = { ...waterGap, missing: { value: 12_000, unit: 'ml' as const } }
    const list = build({
      items: [goalEntry({ id: 'z', status: 'ausgeblendet' })],
      gaps: [smaller],
    })

    expect(list.gaps).toEqual([])
    expect(list.hiddenGaps).toEqual([{ ...smaller, entryId: 'z' }])
    expect(list.done).toEqual([])
    expect(list.belowGoalCount).toBe(1)
  })

  it('zeigt die Lücke wieder, wenn sie um mehr als 10 % gewachsen ist', () => {
    const grown = { ...waterGap, missing: { value: 22_001, unit: 'ml' as const } }
    const list = build({
      items: [goalEntry({ id: 'z', status: 'ausgeblendet' })],
      gaps: [grown],
    })

    expect(list.gaps.map(({ groupKey }) => groupKey)).toEqual(['wasser'])
    expect(list.hiddenGaps).toEqual([])
  })

  it('räumt „Erledigt“ nach 14 Tagen auf, dann ist auch die abgehakte Lücke wieder da', () => {
    const list = build({
      items: [
        goalEntry({ id: 'z', ...doneOn('2026-11-07T10:00:00Z') }),
        item({ id: 'alt', ...doneOn('2026-11-07T10:00:00Z') }),
        item({ id: 'gerade-noch', ...doneOn('2026-11-08T10:00:00Z') }),
      ],
      gaps: [waterGap],
    })

    expect(list.done.map(({ id }) => id)).toEqual(['gerade-noch'])
    expect(list.gaps).toHaveLength(1)
  })
})

describe('captureTargetOf', () => {
  it('belegt mit der Lebensmittelart vor, ohne Art mit dem Produkt (#195)', () => {
    expect(captureTargetOf({ productId: 'p', foodTypeId: 'art' })).toEqual({
      kind: 'food-type',
      id: 'art',
    })
    expect(captureTargetOf({ productId: 'p', foodTypeId: null })).toEqual({
      kind: 'product',
      id: 'p',
    })
    expect(captureTargetOf({ productId: null, foodTypeId: null })).toBeNull()
  })
})
