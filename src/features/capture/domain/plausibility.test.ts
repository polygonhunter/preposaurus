import { describe, expect, it } from 'vitest'
import type { BestBefore } from '@/features/inventory/domain/unit'
import { addDays, toCalendarDay } from '@/shared/lib/dates'
import { parseBestBefore } from './best-before'
import { estimateBestBeforeOnRequest } from './estimates'
import { assessBestBefore, type BestBeforeSuggestion, type Confidence } from './plausibility'

const today = toCalendarDay('2026-11-22')
// TESTDATEN: übliche Haltbarkeit einer Kategorie, frei gewählt
const TYPICAL_DAYS = 365

const inDays = (days: number): BestBefore => ({
  date: addDays(today, days),
  precision: 'day',
  isEstimated: false,
})

const assess = (bestBefore: BestBefore | null, confidence: Confidence | null = 'high') =>
  assessBestBefore({ bestBefore, confidence, today, typicalShelfLifeDays: TYPICAL_DAYS })

describe('assessBestBefore', () => {
  it('lässt einen nicht lesbaren Chip leer und erfindet kein Datum', () => {
    expect(assess(null)).toEqual({ status: 'unreadable' })
  })

  it('übernimmt ein plausibles Datum', () => {
    expect(assess(inDays(200))).toEqual({ status: 'ok', bestBefore: inDays(200) })
  })

  it('markiert ein Datum in der Vergangenheit mit „bitte prüfen“', () => {
    expect(assess(inDays(-1))).toEqual({
      status: 'review',
      bestBefore: inDays(-1),
      reasons: ['in-past'],
    })
  })

  it('lässt ein MHD von heute ohne Markierung durch', () => {
    expect(assess(inDays(0)).status).toBe('ok')
  })

  it('markiert ein Datum weit weg vom üblichen Wert der Kategorie', () => {
    expect(assess(inDays(TYPICAL_DAYS * 2)).status).toBe('ok')
    expect(assess(inDays(TYPICAL_DAYS * 2 + 1))).toMatchObject({
      status: 'review',
      reasons: ['far-from-typical'],
    })
  })

  it('markiert kurze Restlaufzeiten nicht, das ist ältere Ware', () => {
    expect(assess(inDays(10)).status).toBe('ok')
  })

  it('prüft ohne üblichen Wert der Kategorie nur die anderen Regeln', () => {
    const result = assessBestBefore({
      bestBefore: inDays(5000),
      confidence: 'medium',
      today,
      typicalShelfLifeDays: null,
    })
    expect(result.status).toBe('ok')
  })

  it('markiert ein MHD mehr als 15 Jahre in der Zukunft, auch ohne Kategoriewert', () => {
    const assessUnknown = (date: string) =>
      assessBestBefore({
        bestBefore: { date: toCalendarDay(date), precision: 'day', isEstimated: false },
        confidence: 'high',
        today,
        typicalShelfLifeDays: null,
      })

    expect(assessUnknown('2041-11-22').status).toBe('ok')
    expect(assessUnknown('2041-11-23')).toMatchObject({
      status: 'review',
      reasons: ['too-far-ahead'],
    })
    expect(assessUnknown('2099-09-30')).toMatchObject({ reasons: ['too-far-ahead'] })
  })

  it('markiert einen Vorschlag mit niedriger Sicherheit', () => {
    expect(assess(inDays(200), 'low')).toMatchObject({
      status: 'review',
      reasons: ['low-confidence'],
    })
  })

  it('nennt alle zutreffenden Gründe', () => {
    expect(assess(inDays(-30), 'low')).toMatchObject({ reasons: ['in-past', 'low-confidence'] })
  })
})

describe('Kein Pfad liefert ein Datum ohne Kennzeichen', () => {
  const dateOf = (suggestion: BestBeforeSuggestion) =>
    suggestion.status === 'unreadable' ? null : suggestion.bestBefore

  it.each(['', 'L 2027 0915', '14:32', '30.09', '09/27', '31.02.2027'])(
    'eine unlesbare Eingabe %j führt zu keinem Datum',
    (text) => {
      const parsed = parseBestBefore(text, today)
      const suggestion = assess(parsed.ok ? parsed.value : null)

      expect(suggestion).toEqual({ status: 'unreadable' })
    },
  )

  it('ein gelesenes Datum ist nie als geschätzt markiert und trägt einen Status', () => {
    const parsed = parseBestBefore('09/2027', today)
    const suggestion = assess(parsed.ok ? parsed.value : null)

    expect(suggestion.status).toBe('ok')
    expect(dateOf(suggestion)?.isEstimated).toBe(false)
  })

  it('eine Schätzung gibt es nur auf ausdrücklichen Aufruf, und dann markiert', () => {
    const estimate = estimateBestBeforeOnRequest({ today, typicalShelfLifeDays: TYPICAL_DAYS })

    expect(estimate).toEqual({
      ok: true,
      value: { date: '2027-11-22', precision: 'day', isEstimated: true },
    })
  })

  it('ohne üblichen Wert der Kategorie gibt es auch keine Schätzung', () => {
    const error = { ok: false, error: { kind: 'no-typical-value' } }
    expect(estimateBestBeforeOnRequest({ today, typicalShelfLifeDays: null })).toEqual(error)
    expect(estimateBestBeforeOnRequest({ today, typicalShelfLifeDays: 0 })).toEqual(error)
  })
})
