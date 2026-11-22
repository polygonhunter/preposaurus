import { describe, expect, it } from 'vitest'
import { addDays, toCalendarDay } from '@/shared/lib/dates'
import { timeGroupFor } from './time-group'
import type { StockUnit } from './unit'
import { DEFAULT_AMPEL_THRESHOLDS } from './unit-state'

const today = toCalendarDay('2026-11-22')

type UnitOptions = Partial<Pick<StockUnit, 'status' | 'checkedAt'>>

function unitIn(days: number | null, options: UnitOptions = {}) {
  const bestBefore =
    days === null
      ? null
      : { date: addDays(today, days), precision: 'day' as const, isEstimated: false }
  return { status: 'stock' as const, checkedAt: null, bestBefore, ...options }
}

const groupIn = (days: number | null, thresholds = DEFAULT_AMPEL_THRESHOLDS) =>
  timeGroupFor(unitIn(days), today, thresholds)

describe('timeGroupFor mit den Standardschwellen (orange 28, gelb 90)', () => {
  it.each([
    [-400, 'expired'],
    [-1, 'expired'],
    [0, 'this-week'],
    [7, 'this-week'],
    [8, 'this-month'],
    [28, 'this-month'],
    [29, 'next-three-months'],
    [90, 'next-three-months'],
    [91, 'later'],
    [3650, 'later'],
  ])('%i Tage bis zum MHD → %s', (days, group) => {
    expect(groupIn(days)).toBe(group)
  })
})

describe('timeGroupFor mit eigenen Schwellen', () => {
  it('folgt der Orange- und der Gelb-Schwelle, „Diese Woche“ bleibt fest 7 Tage', () => {
    const thresholds = { soonDays: 60, urgentDays: 14 }
    expect(groupIn(7, thresholds)).toBe('this-week')
    expect(groupIn(14, thresholds)).toBe('this-month')
    expect(groupIn(15, thresholds)).toBe('next-three-months')
    expect(groupIn(60, thresholds)).toBe('next-three-months')
    expect(groupIn(61, thresholds)).toBe('later')
  })

  it('hat bei orange genau 7 Tagen keine Packung in „Diesen Monat“', () => {
    const thresholds = { soonDays: 30, urgentDays: 7 }
    expect(groupIn(7, thresholds)).toBe('this-week')
    expect(groupIn(8, thresholds)).toBe('next-three-months')
  })

  it('springt bei gleicher Orange- und Gelb-Schwelle von „Diesen Monat“ direkt auf „später“', () => {
    const thresholds = { soonDays: 28, urgentDays: 28 }
    expect(groupIn(28, thresholds)).toBe('this-month')
    expect(groupIn(29, thresholds)).toBe('later')
  })
})

describe('timeGroupFor ohne Gruppe', () => {
  it('ordnet „Datum fehlt“ keiner Gruppe zu, dafür gibt es den Filter „Unvollständig“', () => {
    expect(groupIn(null)).toBeNull()
  })

  it.each(['consumed', 'discarded'] as const)('übergeht Packungen mit Status %s', (status) => {
    expect(timeGroupFor(unitIn(3, { status }), today, DEFAULT_AMPEL_THRESHOLDS)).toBeNull()
  })

  it('nimmt eine abgelaufene, „Noch gut“ geprüfte Packung aus „Abgelaufen“', () => {
    const checked = unitIn(-10, { checkedAt: toCalendarDay('2026-11-20') })
    expect(timeGroupFor(checked, today, DEFAULT_AMPEL_THRESHOLDS)).toBeNull()
  })

  it('ordnet eine geprüfte Packung mit neuem, künftigem Datum wieder nach dem Datum ein', () => {
    const redated = unitIn(5, { checkedAt: toCalendarDay('2026-11-20') })
    expect(timeGroupFor(redated, today, DEFAULT_AMPEL_THRESHOLDS)).toBe('this-week')
  })
})

describe('timeGroupFor mit ungenauen und geschätzten Daten', () => {
  it('rechnet bei „11/2026“ mit dem Monatsende, auch wenn das Datum geschätzt ist', () => {
    const monthOnly = {
      ...unitIn(null),
      bestBefore: {
        date: toCalendarDay('2026-11-30'),
        precision: 'month' as const,
        isEstimated: true,
      },
    }
    // 22.11. bis 30.11. sind 8 Tage, also nicht mehr „Diese Woche“
    expect(timeGroupFor(monthOnly, today, DEFAULT_AMPEL_THRESHOLDS)).toBe('this-month')
  })
})
