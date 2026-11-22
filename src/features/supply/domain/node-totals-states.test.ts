import { describe, expect, it } from 'vitest'
import { toCalendarDay, type CalendarDay } from '@/shared/lib/dates'
import { calculateNodeTotals, type NodeUnit, type TreeNode } from './node-totals'
import type { ReferenceDay } from './supply-rules'
import { need, nodeUnit as unit, penne, target, today } from '../../../../tests/helpers/node-units'

const totalsOf = (units: NodeUnit[], node: TreeNode, reference = today) =>
  calculateNodeTotals({ stillGoodCounts: false, units, node, need, reference })

const day = (text: string): CalendarDay => toCalendarDay(text)

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
