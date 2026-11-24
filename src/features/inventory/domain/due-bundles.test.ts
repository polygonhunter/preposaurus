import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { bundleDueUnits, dueGroupOf, type DueUnit } from './due-bundles'
import type { BestBeforePrecision, DateKind, UnitStatus } from './unit'
import { DEFAULT_AMPEL_THRESHOLDS } from '../../../../tests/helpers/ampel-thresholds'

const context = { today: toCalendarDay('2026-11-22'), thresholds: DEFAULT_AMPEL_THRESHOLDS }

interface Options {
  status?: UnitStatus
  checkedAt?: string
  kind?: DateKind
  precision?: BestBeforePrecision
  isEstimated?: boolean
}

let counter = 0
function unit(bundleKey: string, bestBefore: string | null, options: Options = {}): DueUnit {
  counter += 1
  return {
    id: `e${String(counter)}`,
    bundleKey,
    status: options.status ?? 'stock',
    kind: options.kind ?? 'best-before',
    checkedAt: options.checkedAt === undefined ? null : toCalendarDay(options.checkedAt),
    bestBefore:
      bestBefore === null
        ? null
        : {
            date: toCalendarDay(bestBefore),
            precision: options.precision ?? 'day',
            isEstimated: options.isEstimated ?? false,
          },
  }
}

describe('dueGroupOf', () => {
  it('ordnet nach Zeitgruppe', () => {
    expect(dueGroupOf(unit('a', '2026-11-21'), context)).toBe('expired')
    expect(dueGroupOf(unit('a', '2026-11-29'), context)).toBe('this-week')
    expect(dueGroupOf(unit('a', '2026-12-20'), context)).toBe('this-month')
    expect(dueGroupOf(unit('a', '2027-02-20'), context)).toBe('next-three-months')
  })

  it('lässt später Fälliges, „Datum fehlt“, Entschiedenes und Entnommenes weg', () => {
    // „Datum fehlt“ steht nur im Filter „Unvollständig“ (DATENKATALOG A11)
    expect(dueGroupOf(unit('a', null), context)).toBeNull()
    expect(dueGroupOf(unit('a', '2027-06-30'), context)).toBeNull()
    expect(dueGroupOf(unit('a', '2026-11-21', { checkedAt: '2026-11-22' }), context)).toBeNull()
    expect(dueGroupOf(unit('a', null, { status: 'consumed' }), context)).toBeNull()
  })
})

describe('bundleDueUnits', () => {
  it('bündelt gleiche Art und gleiches Datum, sortiert nach Gruppe und Datum', () => {
    const bundles = bundleDueUnits(
      [
        unit('spaghetti', '2026-12-20'),
        unit('milch', '2026-11-25'),
        unit('spaghetti', '2026-11-25'),
        unit('spaghetti', '2026-11-25'),
        unit('spaghetti', null),
        unit('milch', '2026-11-21'),
      ],
      context,
    )

    expect(bundles.map((bundle) => [bundle.group, bundle.bundleKey, bundle.units.length])).toEqual([
      ['expired', 'milch', 1],
      ['this-week', 'milch', 1],
      ['this-week', 'spaghetti', 2],
      ['this-month', 'spaghetti', 1],
    ])
  })

  it('trennt Genauigkeit, Schätzung und Datumsart innerhalb desselben Tages', () => {
    const bundles = bundleDueUnits(
      [
        unit('milch', '2026-11-30'),
        unit('milch', '2026-11-30', { precision: 'month' }),
        unit('milch', '2026-11-30', { isEstimated: true }),
        unit('milch', '2026-11-30', { kind: 'use-by' }),
      ],
      context,
    )

    expect(bundles).toHaveLength(4)
  })
})
