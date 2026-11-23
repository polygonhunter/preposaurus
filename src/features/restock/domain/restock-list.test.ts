import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { ReplacementCandidate } from './replacement-candidates'
import { buildRestockList, type RestockGap, type RestockItem } from './restock-list'

// Frei gewählte Testdaten.
const item = (overrides: Partial<RestockItem> & Pick<RestockItem, 'id'>): RestockItem => ({
  label: 'Knäckebrot',
  source: 'manuell',
  isDone: false,
  productId: null,
  createdAt: new Date('2026-11-20T10:00:00Z'),
  changedAt: new Date('2026-11-20T10:00:00Z'),
  ...overrides,
})

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
  buildRestockList({ items: [], gaps: [], foodTypes: [], candidates: [], ...input })

describe('buildRestockList', () => {
  it('trennt Ersetzen, eigene und erledigte Einträge', () => {
    const list = build({
      items: [
        item({ id: 'a', source: 'nachkauf' }),
        item({ id: 'b' }),
        item({ id: 'c', isDone: true }),
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

  it('zählt Lücken, Vorschläge und offene Einträge, aber keine erledigten', () => {
    const list = build({
      items: [item({ id: 'a' }), item({ id: 'b', isDone: true })],
      gaps: [waterGap],
      candidates: [lentils],
    })

    expect(list.openCount).toBe(3)
  })

  it('lässt einen Vorschlag weg, dessen Produkt oder Name schon offen auf der Liste steht', () => {
    const byProduct = build({
      items: [item({ id: 'a', source: 'nachkauf', label: 'Glas', productId: 'p-linsen-glas' })],
      candidates: [lentils],
    })
    const byName = build({ items: [item({ id: 'b', label: 'linsen' })], candidates: [lentils] })

    expect(byProduct.suggestions).toEqual([])
    expect(byName.suggestions).toEqual([])
    expect(byName.openCount).toBe(1)
  })

  it('zeigt den Vorschlag wieder, wenn der Eintrag erledigt ist', () => {
    const list = build({
      items: [item({ id: 'a', label: 'Linsen', productId: 'p-linsen', isDone: true })],
      candidates: [lentils],
    })

    expect(list.suggestions).toEqual([lentils])
  })

  it('sortiert offene Einträge nach dem Anlegen, erledigte nach dem Abhaken (neueste zuerst)', () => {
    const list = build({
      items: [
        item({ id: 'spaet', createdAt: new Date('2026-11-21T10:00:00Z') }),
        item({ id: 'frueh', createdAt: new Date('2026-11-19T10:00:00Z') }),
        item({ id: 'alt', isDone: true, changedAt: new Date('2026-11-18T10:00:00Z') }),
        item({ id: 'neu', isDone: true, changedAt: new Date('2026-11-22T10:00:00Z') }),
      ],
    })

    expect(list.own.map(({ id }) => id)).toEqual(['frueh', 'spaet'])
    expect(list.done.map(({ id }) => id)).toEqual(['neu', 'alt'])
  })

  it('ist leer ohne Einträge, Lücke und Vorschlag', () => {
    expect(build({})).toEqual({
      gaps: [],
      replace: [],
      suggestions: [],
      own: [],
      done: [],
      openCount: 0,
    })
  })
})
