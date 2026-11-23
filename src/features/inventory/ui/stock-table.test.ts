import { describe, expect, it } from 'vitest'
import type { StockRowDto } from '../schemas/shared'
import type { FoodTypeLevel } from '../schemas/stock'
import { isSameTarget, tableCells, tableGroupsOf } from './stock-table'

const totals: StockRowDto['totals'] = {
  packages: 3,
  uncountedPackages: 0,
  amounts: { g: 1500, ml: 0 },
  kcal: 5385,
  waterMl: 0,
  macros: { protein: 0, carbs: 0, fat: 0 },
  productsWithoutMacros: 0,
  energyDays: 1.26,
  waterDays: null,
  nextBestBefore: { date: '2027-01-22', precision: 'day', isEstimated: false },
  nextState: 'soon',
  withoutDate: 0,
  estimatedKcalShare: 0,
  isApproximate: false,
}

const row = (overrides: Partial<StockRowDto> = {}): StockRowDto => ({
  target: { kind: 'food-type', id: 'art-nudeln' },
  name: 'Nudeln',
  pictogram: null,
  packagesInStock: 3,
  state: 'soon',
  totals,
  ...overrides,
})

const groupTotals = { ...totals }

describe('tableCells', () => {
  it('zeigt Zahlen ohne Einheit, die steht im Spaltenkopf', () => {
    expect(tableCells(row())).toEqual({
      packages: '3',
      expiredNote: null,
      amount: '1,5 kg',
      kcal: '5.385',
      days: '1,3',
      nextDate: '22.01.2027',
    })
  })

  it('nennt abgelaufene Packungen zusätzlich und geschätzte kcal mit „ca.“', () => {
    const cells = tableCells(
      row({ totals: { ...totals, uncountedPackages: 1, isApproximate: true } }),
    )

    expect(cells).toMatchObject({ packages: '3', expiredNote: '+1 abgelaufen' })
    expect(cells.kcal).toBe('ca. 5.385')
  })

  it('setzt einen Strich, wo es nichts gibt, und zählt Wasser in Wasser-Tagen', () => {
    const water = tableCells(
      row({
        totals: {
          ...totals,
          amounts: { g: 0, ml: 9000 },
          kcal: 0,
          energyDays: null,
          waterDays: 1.5,
          nextBestBefore: null,
        },
      }),
    )

    expect(water).toMatchObject({ amount: '9 l', kcal: '–', days: '1,5', nextDate: null })
    expect(
      tableCells(row({ totals: { ...totals, amounts: { g: 0, ml: 0 }, energyDays: null } })),
    ).toMatchObject({ amount: '–', days: '–' })
  })
})

describe('tableGroupsOf', () => {
  it('reiht die Zeilen je Warengruppe ohne Kategorien, leere Gruppen bleiben stehen', () => {
    const levels: FoodTypeLevel[] = [
      {
        group: { key: 'getreide', name: 'Getreide', shortName: 'Getreide', totals: groupTotals },
        categories: [
          { id: 'k1', name: 'Nudeln', pictogram: null, totals, rows: [row()] },
          {
            id: 'k2',
            name: 'Reis',
            pictogram: null,
            totals,
            rows: [row({ name: 'Reis', target: { kind: 'product', id: 'reis' } })],
          },
        ],
      },
      {
        group: { key: 'fette', name: 'Fette', shortName: 'Fette', totals: groupTotals },
        categories: [],
      },
    ]

    const groups = tableGroupsOf(levels)

    expect(groups.map((group) => [group.key, group.rows.map((entry) => entry.name)])).toEqual([
      ['getreide', ['Nudeln', 'Reis']],
      ['fette', []],
    ])
  })
})

describe('isSameTarget', () => {
  it('vergleicht Art und ID', () => {
    const target = { kind: 'food-type', id: 'a' } as const

    expect(isSameTarget(target, { kind: 'food-type', id: 'a' })).toBe(true)
    expect(isSameTarget(target, { kind: 'product', id: 'a' })).toBe(false)
    expect(isSameTarget(target, null)).toBe(false)
  })
})
