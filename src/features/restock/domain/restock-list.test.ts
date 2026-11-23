import { describe, expect, it } from 'vitest'
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
  isDone: false,
  createdAt: new Date('2026-11-20T10:00:00Z'),
  changedAt: new Date('2026-11-20T10:00:00Z'),
  productId: null,
  foodTypeId: null,
  ...overrides,
})

const waterGap: RestockGap = {
  groupKey: 'wasser',
  name: 'Wasser',
  missing: { value: 20_000, unit: 'ml' },
  days: 6,
  goalDays: 10,
}

describe('buildRestockList', () => {
  it('trennt Ersetzen, eigene und erledigte Einträge', () => {
    const list = buildRestockList({
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
    expect(list.gaps).toEqual([waterGap])
  })

  it('zählt offene Lücken und offene Einträge, aber keine erledigten', () => {
    const list = buildRestockList({
      items: [item({ id: 'a' }), item({ id: 'b', isDone: true })],
      gaps: [waterGap],
    })

    expect(list.openCount).toBe(2)
  })

  it('sortiert offene Einträge nach dem Anlegen, erledigte nach dem Abhaken (neueste zuerst)', () => {
    const list = buildRestockList({
      items: [
        item({ id: 'spaet', createdAt: new Date('2026-11-21T10:00:00Z') }),
        item({ id: 'frueh', createdAt: new Date('2026-11-19T10:00:00Z') }),
        item({ id: 'alt', isDone: true, changedAt: new Date('2026-11-18T10:00:00Z') }),
        item({ id: 'neu', isDone: true, changedAt: new Date('2026-11-22T10:00:00Z') }),
      ],
      gaps: [],
    })

    expect(list.own.map(({ id }) => id)).toEqual(['frueh', 'spaet'])
    expect(list.done.map(({ id }) => id)).toEqual(['neu', 'alt'])
  })

  it('ist leer ohne Einträge und ohne Lücke', () => {
    expect(buildRestockList({ items: [], gaps: [] })).toEqual({
      gaps: [],
      replace: [],
      own: [],
      done: [],
      openCount: 0,
    })
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
