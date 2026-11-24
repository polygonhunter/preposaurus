import { describe, expect, it } from 'vitest'
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { bestBeforeKeyOf, groupByBestBefore, groupKeyOf, type BestBeforeGroup } from './group-units'
import type { BestBefore, BestBeforePrecision } from './unit'

function bestBefore(date: string, precision: BestBeforePrecision = 'month', isEstimated = false) {
  return { date: toCalendarDay(date), precision, isEstimated } satisfies BestBefore
}

const times = (count: number, entry: BestBefore) => Array.from({ length: count }, () => entry)

/** Kurzform einer Gruppe für lesbare Erwartungen: „09/2027 (2×, geschätzt)“, „Datum fehlt (2×)“. */
function formatBestBeforeGroup(group: BestBeforeGroup): string {
  const count = `${String(group.count)}×`
  if (group.kind === 'no-date') return `Datum fehlt (${count})`
  const estimated = group.isEstimated ? ', geschätzt' : ''
  return `${formatDayWithPrecision(group)} (${count}${estimated})`
}

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
    expect(
      groups.map((group: BestBeforeGroup) => group.kind === 'dated' && group.precision),
    ).toEqual(['day', 'month', 'year'])
  })

  it('liefert für eine leere Liste keine Gruppe', () => {
    expect(groupByBestBefore([])).toEqual([])
  })
})

describe('groupByBestBefore mit „Datum fehlt“', () => {
  it('sammelt Einheiten ohne Datum in einer eigenen Gruppe nach den datierten', () => {
    const groups = groupByBestBefore([
      null,
      bestBefore('2027-11-30'),
      null,
      bestBefore('2027-09-30', 'month', true),
    ])
    expect(groups.map(formatBestBeforeGroup)).toEqual([
      '09/2027 (1×, geschätzt)',
      '11/2027 (1×)',
      'Datum fehlt (2×)',
    ])
  })

  it('liefert nur die Gruppe „Datum fehlt“, wenn keine Einheit ein Datum hat', () => {
    expect(groupByBestBefore([null, null, null])).toEqual([{ kind: 'no-date', count: 3 }])
  })

  it('legt ohne fehlendes Datum keine leere Gruppe „Datum fehlt“ an', () => {
    const groups = groupByBestBefore([bestBefore('2027-09-30')])
    expect(groups).toEqual([
      {
        kind: 'dated',
        date: toCalendarDay('2027-09-30'),
        precision: 'month',
        isEstimated: false,
        count: 1,
      },
    ])
  })
})

describe('bestBeforeKeyOf und groupKeyOf', () => {
  it('geben einer Einheit und ihrer Gruppe denselben Schlüssel', () => {
    const entries = [bestBefore('2027-09-30'), bestBefore('2027-09-30', 'day'), null]
    const groups = groupByBestBefore(entries)

    expect(groups.map(groupKeyOf).sort()).toEqual(entries.map(bestBeforeKeyOf).sort())
  })

  it('trennt geschätzte und erkannte Daten', () => {
    expect(bestBeforeKeyOf(bestBefore('2027-09-30', 'month', true))).not.toBe(
      bestBeforeKeyOf(bestBefore('2027-09-30')),
    )
  })
})
