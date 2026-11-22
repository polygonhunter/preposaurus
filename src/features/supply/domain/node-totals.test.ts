import { describe, expect, it } from 'vitest'
import { toCalendarDay, type CalendarDay } from '@/shared/lib/dates'
import type { Quantity } from '@/shared/lib/quantities'
import { calculateNodeTotals, type NodeUnit, type TreeNode, type TreePath } from './node-totals'
import type { ReferenceDay } from './supply-rules'
import { supplyUnit } from '../../../../tests/helpers/supply-units'

const today: ReferenceDay = { day: toCalendarDay('2026-11-22'), kind: 'today' }
const target: ReferenceDay = { day: toCalendarDay('2027-03-31'), kind: 'target' }
// TESTDATEN: 1 Erwachsener mit den ungeprüften Konzeptwerten, 2.000 kcal und 2 l je Tag
const need = { kcalPerDay: 2000, waterMlPerDay: 2000 }

// TESTDATEN: Pfade frei gewählt, so wie sie aus den Stammdaten kämen
const spaghetti: TreePath = {
  group: 'getreide',
  category: 'nudeln',
  foodType: 'spaghetti',
  product: 'spaghetti-500',
}
const spaghettiBio: TreePath = { ...spaghetti, product: 'spaghetti-bio-500' }
const penne: TreePath = { ...spaghetti, foodType: 'penne', product: 'penne-500' }
const reis: TreePath = { ...spaghetti, category: 'reis', foodType: 'langkorn', product: 'reis-1kg' }
const wasser: TreePath = {
  group: 'wasser',
  category: 'stilles-wasser',
  foodType: 'mineralwasser',
  product: 'wasser-1-5l',
}

interface UnitOptions {
  path?: TreePath
  bestBefore?: string | null
  kcal?: number
  estimated?: boolean
  content?: Quantity
  status?: NodeUnit['status']
  waterMl?: number
  checkedAt?: string
}

let counter = 0
// Nudeln 500 g mit 359 kcal je 100 g: 1.795 kcal, 65 g Eiweiß, 355 g Kohlenhydrate, 7,5 g Fett
function unit({
  path = spaghetti,
  bestBefore = '2028-03-31',
  content = { value: 500, unit: 'g' },
  estimated = false,
  kcal = 1795,
  ...rest
}: UnitOptions = {}): NodeUnit {
  counter += 1
  const base = supplyUnit(`e${String(counter)}`, bestBefore, {
    ...rest,
    kcal,
    isKcalEstimated: estimated,
  })
  return { ...base, path, content, macros: { protein: 65, carbs: 355, fat: 7.5 } }
}

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

describe('calculateNodeTotals mit „Noch gut zählt mit“', () => {
  const node: TreeNode = { level: 'foodType', key: 'spaghetti' }
  const units = [
    unit({ bestBefore: '2026-01-01', checkedAt: '2026-11-20' }),
    unit({ bestBefore: '2027-09-30' }),
  ]
  const totalsWithSwitch = (reference: ReferenceDay) =>
    calculateNodeTotals({ units, node, need, reference, stillGoodCounts: true })

  it('zählt die geprüfte Packung heute mit, macht ihr Datum aber nicht zum nächsten MHD', () => {
    const totals = totalsWithSwitch(today)

    expect(totals.packages).toBe(2)
    expect(totals.nextBestBefore?.date).toBe(day('2027-09-30'))
  })

  it('hat kein nächstes MHD, wenn nur abgelaufene „Noch gut“-Packungen zählen', () => {
    const result = calculateNodeTotals({
      units: [unit({ bestBefore: '2026-01-01', checkedAt: '2026-11-20' })],
      node,
      need,
      reference: today,
      stillGoodCounts: true,
    })
    expect(result.packages).toBe(1)
    expect(result.nextBestBefore).toBeNull()
  })

  it('zählt sie am Zieldatum nie', () => {
    const totals = totalsWithSwitch(target)
    expect(totals.packages).toBe(1)
    expect(totals.uncountedPackages).toBe(1)
  })
})

describe('calculateNodeTotals mit „Datum fehlt“', () => {
  const units = [unit({ bestBefore: null }), unit({ bestBefore: null }), unit()]
  const node: TreeNode = { level: 'foodType', key: 'spaghetti' }

  it('zählt heute mit und nennt die Packungen ohne Datum gesondert', () => {
    const totals = totalsOf(units, node)

    expect(totals.packages).toBe(3)
    expect(totals.withoutDate).toBe(2)
    expect(totals.nextBestBefore?.date).toBe(day('2028-03-31'))
  })

  it('zählt am Zieldatum nicht mit, nennt sie aber weiter gesondert', () => {
    const totals = totalsOf(units, node, target)

    expect(totals.packages).toBe(1)
    expect(totals.uncountedPackages).toBe(2)
    expect(totals.withoutDate).toBe(2)
    expect(totals.kcal).toBe(1795)
  })

  it('hat kein nächstes MHD, wenn keine Packung ein Datum hat', () => {
    expect(totalsOf([unit({ bestBefore: null })], node).nextBestBefore).toBeNull()
  })
})

describe('calculateNodeTotals: Richtwert-Anteil und „ca.“', () => {
  const node: TreeNode = { level: 'category', key: 'nudeln' }

  it('setzt „ca.“ ab 10 % kcal aus Richtwerten', () => {
    const units = [unit({ kcal: 900 }), unit({ path: penne, kcal: 100, estimated: true })]
    const totals = totalsOf(units, node)

    expect(totals.estimatedKcalShare).toBe(0.1)
    expect(totals.isApproximate).toBe(true)
  })

  it('setzt kein „ca.“ unter der Schwelle, nennt aber den Anteil', () => {
    const units = [unit({ kcal: 950 }), unit({ path: penne, kcal: 50, estimated: true })]
    const totals = totalsOf(units, node)

    expect(totals.estimatedKcalShare).toBe(0.05)
    expect(totals.isApproximate).toBe(false)
  })

  it('übersieht Richtwerte von Packungen, die am Stichtag nicht zählen', () => {
    const units = [unit(), unit({ bestBefore: '2026-01-31', estimated: true })]
    expect(totalsOf(units, node).isApproximate).toBe(false)
  })

  it('bewertet jeden Knoten für sich', () => {
    const units = [unit({ kcal: 1000 }), unit({ path: penne, kcal: 1000, estimated: true })]

    expect(totalsOf(units, { level: 'foodType', key: 'spaghetti' }).isApproximate).toBe(false)
    expect(totalsOf(units, { level: 'foodType', key: 'penne' }).isApproximate).toBe(true)
    expect(totalsOf(units, node).estimatedKcalShare).toBe(0.5)
  })
})
