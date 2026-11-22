import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  formatBestBefore,
  formatBestBeforeGroup,
  groupByBestBefore,
  type BestBeforeGroup,
} from './group-units'
import type { BestBefore, BestBeforePrecision } from './unit'

function bestBefore(date: string, precision: BestBeforePrecision = 'month', isEstimated = false) {
  return { date: toCalendarDay(date), precision, isEstimated } satisfies BestBefore
}

const times = (count: number, entry: BestBefore) => Array.from({ length: count }, () => entry)

describe('groupByBestBefore', () => {
  it('fasst gleiche Daten zusammen und sortiert nach Datum', () => {
    const entries = [
      ...times(4, bestBefore('2027-11-30')),
      ...times(6, bestBefore('2027-09-30')),
    ].reverse()

    expect(groupByBestBefore(entries).map(formatBestBeforeGroup)).toEqual([
      '09/2027 (6×)',
      '11/2027 (4×)',
    ])
  })

  it('trennt gleiche Tage mit unterschiedlicher Genauigkeit', () => {
    const groups = groupByBestBefore([
      bestBefore('2027-09-30', 'month'),
      bestBefore('2027-09-30', 'day'),
    ])
    expect(groups.map(formatBestBeforeGroup)).toEqual(['30.09.2027 (1×)', '09/2027 (1×)'])
  })

  it('trennt geschätzte von erkannten Daten und nennt sie zuletzt', () => {
    const groups = groupByBestBefore([
      bestBefore('2027-09-30', 'month', true),
      bestBefore('2027-09-30'),
      bestBefore('2027-09-30', 'month', true),
    ])
    expect(groups.map(formatBestBeforeGroup)).toEqual(['09/2027 (1×)', '09/2027 (2×, geschätzt)'])
  })

  it('ordnet bei gleichem Tag Tag vor Monat vor Jahr', () => {
    const groups = groupByBestBefore([
      bestBefore('2027-12-31', 'year'),
      bestBefore('2027-12-31', 'month'),
      bestBefore('2027-12-31', 'day'),
    ])
    expect(groups.map((group: BestBeforeGroup) => group.precision)).toEqual([
      'day',
      'month',
      'year',
    ])
  })

  it('liefert für eine leere Liste keine Gruppe', () => {
    expect(groupByBestBefore([])).toEqual([])
  })
})

describe('formatBestBefore', () => {
  it.each([
    ['day', '30.09.2027'],
    ['month', '09/2027'],
    ['year', '2027'],
  ] as const)('zeigt Genauigkeit %s als %s', (precision, text) => {
    expect(formatBestBefore({ date: toCalendarDay('2027-09-30'), precision })).toBe(text)
  })

  it('zeigt einstellige Tage und Monate zweistellig', () => {
    expect(formatBestBefore({ date: toCalendarDay('2027-03-05'), precision: 'day' })).toBe(
      '05.03.2027',
    )
  })
})
