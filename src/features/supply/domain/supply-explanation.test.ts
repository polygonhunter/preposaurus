import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { breakDownNeed, countPackageCaveats } from './supply-explanation'

const today = toCalendarDay('2026-11-23')

const dated = (date: string) => ({
  date: toCalendarDay(date),
  precision: 'day' as const,
  isEstimated: false,
})

describe('breakDownNeed', () => {
  const needs = {
    adult: { kcalPerDay: 2300, waterMlPerDay: 2000 },
    child: { kcalPerDay: 1800, waterMlPerDay: 1500 },
    baby: { kcalPerDay: 800, waterMlPerDay: 700 },
  }

  it('fasst die Personen je Gruppe zusammen, Erwachsene zuerst', () => {
    const members = [
      { type: 'child' as const },
      { type: 'adult' as const },
      { type: 'adult' as const },
    ]
    expect(breakDownNeed(members, needs)).toEqual([
      { type: 'adult', count: 2, kcalPerDay: 2300, waterMlPerDay: 2000 },
      { type: 'child', count: 1, kcalPerDay: 1800, waterMlPerDay: 1500 },
    ])
  })

  it('lässt Babys und Gruppen ohne Wert in der Quelle weg', () => {
    const members = [{ type: 'baby' as const }, { type: 'senior' as const }]
    expect(breakDownNeed(members, needs)).toEqual([])
  })
})

describe('countPackageCaveats', () => {
  it('zählt abgelaufene, geprüfte und Packungen ohne Datum getrennt', () => {
    const units = [
      { status: 'stock' as const, bestBefore: dated('2026-11-01'), checkedAt: null },
      { status: 'stock' as const, bestBefore: dated('2026-11-01'), checkedAt: today },
      { status: 'stock' as const, bestBefore: null, checkedAt: null },
      { status: 'stock' as const, bestBefore: dated('2026-11-23'), checkedAt: null },
      { status: 'consumed' as const, bestBefore: dated('2026-01-01'), checkedAt: null },
    ]
    expect(countPackageCaveats(units, today)).toEqual({ expired: 1, stillGood: 1, missingDate: 1 })
  })

  it('liefert lauter Nullen, wenn alles haltbar ist', () => {
    const units = [{ status: 'stock' as const, bestBefore: dated('2027-01-01'), checkedAt: null }]
    expect(countPackageCaveats(units, today)).toEqual({ expired: 0, stillGood: 0, missingDate: 0 })
  })
})
