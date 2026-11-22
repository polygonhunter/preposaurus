import { describe, expect, it } from 'vitest'
import { toCalendarDay, type CalendarDay } from '@/shared/lib/dates'
import { calculateNodeTotals, type NodeUnit, type TreeNode } from './node-totals'
import {
  need,
  nodeUnit as unit,
  penne,
  reis,
  spaghettiBio,
  today,
  wasser,
} from '../../../../tests/helpers/node-units'

const totalsOf = (units: NodeUnit[], node: TreeNode, reference = today) =>
  calculateNodeTotals({ stillGoodCounts: false, units, node, need, reference })

const day = (text: string): CalendarDay => toCalendarDay(text)

describe('calculateNodeTotals', () => {
  it('liefert für einen leeren Knoten überall 0 und kein MHD', () => {
    expect(totalsOf([unit({ path: reis })], { level: 'foodType', key: 'spaghetti' })).toEqual({
      packages: 0,
      uncountedPackages: 0,
      amounts: { g: 0, ml: 0, piece: 0 },
      kcal: 0,
      macros: { protein: 0, carbs: 0, fat: 0 },
      energyDays: 0,
      waterDays: 0,
      nextBestBefore: null,
      withoutDate: 0,
      estimatedKcalShare: 0,
      isApproximate: false,
    })
  })

  it('summiert mehrere Produkte einer Lebensmittelart', () => {
    const units = [
      unit(),
      unit(),
      unit({ path: spaghettiBio, bestBefore: '2027-09-30' }),
      unit({ path: penne }),
    ]
    const totals = totalsOf(units, { level: 'foodType', key: 'spaghetti' })

    expect(totals.packages).toBe(3)
    expect(totals.amounts.g).toBe(1500)
    expect(totals.kcal).toBe(5385)
    expect(totals.macros).toEqual({ protein: 195, carbs: 1065, fat: 22.5 })
    expect(totals.energyDays).toBe(2.6)
    expect(totals.nextBestBefore?.date).toBe(day('2027-09-30'))
  })

  it('summiert über alle Ebenen bis zur Warengruppe', () => {
    const units = [unit(), unit({ path: penne }), unit({ path: reis }), unit({ path: wasser })]

    expect(totalsOf(units, { level: 'product', key: 'spaghetti-500' }).packages).toBe(1)
    expect(totalsOf(units, { level: 'category', key: 'nudeln' }).packages).toBe(2)
    expect(totalsOf(units, { level: 'group', key: 'getreide' }).packages).toBe(3)
  })

  it('rechnet Wasser in ml und als Wasser-Tage', () => {
    const units = [
      unit({ path: wasser, kcal: 0, content: { value: 1500, unit: 'ml' }, waterMl: 1500 }),
      unit({ path: wasser, kcal: 0, content: { value: 1500, unit: 'ml' }, waterMl: 1500 }),
    ]
    const totals = totalsOf(units, { level: 'group', key: 'wasser' })

    expect(totals.amounts).toEqual({ g: 0, ml: 3000, piece: 0 })
    expect(totals.waterDays).toBe(1.5)
    expect(totals.energyDays).toBe(0)
  })

  it('führt Stückzahlen getrennt von g und ml', () => {
    const units = [unit({ content: { value: 6, unit: 'piece' } }), unit()]
    expect(totalsOf(units, { level: 'product', key: 'spaghetti-500' }).amounts).toEqual({
      g: 500,
      ml: 0,
      piece: 6,
    })
  })

  it('zählt abgelaufene, verbrauchte und entsorgte Packungen nicht', () => {
    const units = [
      unit(),
      unit({ bestBefore: '2026-01-31' }),
      unit({ status: 'consumed' }),
      unit({ status: 'discarded' }),
    ]
    const totals = totalsOf(units, { level: 'foodType', key: 'spaghetti' })

    expect(totals.packages).toBe(1)
    expect(totals.uncountedPackages).toBe(1)
    expect(totals.kcal).toBe(1795)
    expect(totals.nextBestBefore?.date).toBe(day('2028-03-31'))
  })

  it('rechnet ohne Bedarf (nur Babys) Menge, kcal und Makros, aber keine Tage', () => {
    const totals = calculateNodeTotals({
      stillGoodCounts: false,
      units: [unit()],
      node: { level: 'group', key: 'getreide' },
      need: { kcalPerDay: 0, waterMlPerDay: 0 },
      reference: today,
    })
    expect(totals).toMatchObject({
      packages: 1,
      amounts: { g: 500, ml: 0, piece: 0 },
      kcal: 1795,
      macros: { protein: 65, carbs: 355, fat: 7.5 },
      energyDays: null,
      waterDays: null,
    })
  })

  it('lässt nur die Tage weg, für die der Bedarf fehlt', () => {
    const totals = calculateNodeTotals({
      stillGoodCounts: false,
      units: [unit({ path: wasser, kcal: 0, waterMl: 3000 })],
      node: { level: 'group', key: 'wasser' },
      need: { kcalPerDay: 0, waterMlPerDay: 2000 },
      reference: today,
    })
    expect(totals.energyDays).toBeNull()
    expect(totals.waterDays).toBe(1.5)
  })
})
