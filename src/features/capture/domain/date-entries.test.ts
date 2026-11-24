import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { BestBeforePrecision } from '@/features/inventory/domain/unit'
import {
  addDateEntry,
  changeDateCount,
  changeDateKind,
  countPackages,
  dateEntryKey,
  dateEntryLabel,
  isKindFixed,
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

describe('Schätzung auf Wahl (#124, #180)', () => {
  const estimated = { ...september, isEstimated: true }

  it('steht mit „ca.“ da und zählt nicht mit einem gelesenen Datum zusammen', () => {
    const entries = addDateEntry(addDateEntry([], september), estimated)

    expect(entries.map(dateEntryLabel)).toEqual(['09/2027', 'ca. 09/2027'])
  })

  it('wird beim Hinzufügen nie ein Verbrauchsdatum', () => {
    const entries = addDateEntry([], estimated, 'use-by')

    expect(entries).toEqual([{ bestBefore: estimated, count: 1, kind: undefined }])
    expect(isKindFixed(entries[0] ?? { bestBefore: null })).toBe(true)
  })

  it('bleibt beim Umschalten ein MHD', () => {
    const entries = addDateEntry([], estimated)
    const key = dateEntryKey(entries[0] ?? { bestBefore: null })

    expect(changeDateKind(entries, { key, kind: 'use-by' })).toEqual(entries)
  })

  it('lässt die Datumsart bei gelesenen Daten und „Datum fehlt“ offen', () => {
    expect(isKindFixed({ bestBefore: september })).toBe(false)
    expect(isKindFixed({ bestBefore: null })).toBe(false)
  })
})

describe('Verbrauchsdatum (#294)', () => {
  const december = date('2026-12-03', 'day')

  it('sagt „Verbrauchsdatum“ dazu und zählt nicht mit einem MHD am selben Tag zusammen', () => {
    const entries = addDateEntry(addDateEntry([], december), december, 'use-by')

    expect(entries.map(dateEntryLabel)).toEqual(['03.12.2026', '03.12.2026 (Verbrauchsdatum)'])
    expect(entries[1]?.kind).toBe('use-by')
  })

  it('zählt ein weiteres Verbrauchsdatum am selben Tag hoch', () => {
    const entries = addDateEntry(addDateEntry([], december, 'use-by'), december, 'use-by')

    expect(entries).toEqual([{ bestBefore: december, count: 2, kind: 'use-by' }])
  })

  it('führt ein ausdrückliches MHD wie eines ohne Angabe', () => {
    const entries = addDateEntry(addDateEntry([], december), december, 'best-before')

    expect(entries).toEqual([{ bestBefore: december, count: 2 }])
  })
})

describe('changeDateKind (Umschalter, #294)', () => {
  const december = date('2026-12-03', 'day')

  it('macht aus einem MHD ein Verbrauchsdatum, Anzahl und Reihenfolge bleiben', () => {
    const entries = addDateEntry(addDateEntry([], december), year2028)
    const key = dateEntryKey(entries[0] ?? { bestBefore: null })

    const changed = changeDateKind(entries, { key, kind: 'use-by' })

    expect(changed.map(dateEntryLabel)).toEqual(['03.12.2026 (Verbrauchsdatum)', '2028'])
    expect(changed[0]?.count).toBe(1)
  })

  it('stuft ein Verbrauchsdatum auf Wunsch zum MHD zurück', () => {
    const entries = addDateEntry([], december, 'use-by')

    const changed = changeDateKind(entries, {
      key: dateEntryKey({ bestBefore: december, kind: 'use-by' }),
      kind: 'best-before',
    })

    expect(changed).toEqual([{ bestBefore: december, count: 1, kind: 'best-before' }])
    expect(dateEntryLabel(changed[0] ?? { bestBefore: null })).toBe('03.12.2026')
  })

  it('legt gleiches Datum mit gleicher Art zusammen und addiert die Anzahl', () => {
    let entries = addDateEntry(addDateEntry([], december, 'use-by'), december)
    entries = changeDateCount(entries, { key: dateEntryKey({ bestBefore: december }), delta: 2 })

    const changed = changeDateKind(entries, {
      key: dateEntryKey({ bestBefore: december }),
      kind: 'use-by',
    })

    expect(changed).toEqual([{ bestBefore: december, count: 4, kind: 'use-by' }])
  })

  it('lässt alles, wie es ist, bei gleicher Art oder unbekanntem Eintrag', () => {
    const entries = addDateEntry([], december)

    expect(
      changeDateKind(entries, { key: dateEntryKey({ bestBefore: december }), kind: 'best-before' }),
    ).toEqual(entries)
    expect(changeDateKind(entries, { key: 'unbekannt', kind: 'use-by' })).toEqual(entries)
  })
})
