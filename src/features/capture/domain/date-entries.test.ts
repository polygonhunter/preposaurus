import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { BestBeforePrecision } from '@/features/inventory/domain/unit'
import {
  addDateEntry,
  changeDateCount,
  countPackages,
  dateEntryKey,
  dateEntryLabel,
  type DateEntry,
} from './date-entries'

const date = (text: string, precision: BestBeforePrecision = 'month') => ({
  date: toCalendarDay(text),
  precision,
  isEstimated: false,
})

const september = date('2027-09-30')
const year2028 = date('2028-12-31', 'year')

describe('addDateEntry', () => {
  it('legt je Datum einen Eintrag an, früheste zuerst, „Datum fehlt“ zuletzt', () => {
    let entries: DateEntry[] = []
    entries = addDateEntry(entries, null)
    entries = addDateEntry(entries, year2028)
    entries = addDateEntry(entries, september)

    expect(entries.map(dateEntryLabel)).toEqual(['09/2027', '2028', 'Datum fehlt'])
    expect(countPackages(entries)).toBe(3)
  })

  it('zählt dasselbe Datum hoch statt es doppelt anzulegen', () => {
    const entries = addDateEntry(addDateEntry([], september), september)

    expect(entries).toEqual([{ bestBefore: september, count: 2 }])
  })

  it('trennt gleiches Datum mit anderer Genauigkeit', () => {
    const entries = addDateEntry(addDateEntry([], september), date('2027-09-30', 'day'))

    expect(entries.map(dateEntryLabel)).toEqual(['09/2027', '30.09.2027'])
  })

  it('zählt auch „Datum fehlt“ hoch', () => {
    expect(addDateEntry(addDateEntry([], null), null)).toEqual([{ bestBefore: null, count: 2 }])
  })
})

describe('changeDateCount', () => {
  const entries: DateEntry[] = [
    { bestBefore: september, count: 2 },
    { bestBefore: null, count: 1 },
  ]

  it('ändert nur den gemeinten Eintrag', () => {
    const changed = changeDateCount(entries, {
      key: dateEntryKey({ bestBefore: september }),
      delta: 1,
    })

    expect(changed.map((entry) => entry.count)).toEqual([3, 1])
  })

  it('entfernt einen Eintrag, dessen Anzahl auf 0 fällt', () => {
    const changed = changeDateCount(entries, { key: dateEntryKey({ bestBefore: null }), delta: -1 })

    expect(changed).toEqual([{ bestBefore: september, count: 2 }])
  })
})
