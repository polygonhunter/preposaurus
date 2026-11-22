import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { calculateSupplyDays } from './supply-days'
import { supplyUnit } from '../../../../tests/helpers/supply-units'

// „ca.“ und „Datum fehlt“ bei „versorgt“
const today = toCalendarDay('2026-11-22')
// TESTDATEN: 2 Erwachsene mit den ungeprüften Konzeptwerten aus technik.html #rechnung
const need = { kcalPerDay: 4400, waterMlPerDay: 4000 }

const valueOf = <T>(result: { ok: true; value: T } | { ok: false }) => {
  if (!result.ok) throw new Error('Rechnung fehlgeschlagen')
  return result.value
}

describe('calculateSupplyDays: Richtwert-Anteil und „Datum fehlt“', () => {
  it('setzt „ca.“ nach dem Anteil geschätzter kcal, ein geschätztes MHD zählt nicht', () => {
    const estimatedKcal = [supplyUnit('a', '2028-01-31', { kcal: 100, isKcalEstimated: true })]
    const estimatedDate = [
      supplyUnit('b', '2028-01-31', { kcal: 100, isBestBeforeEstimated: true }),
    ]
    const exact = [supplyUnit('c', '2028-01-31', { kcal: 100 })]
    const run = (units: typeof exact) =>
      valueOf(
        calculateSupplyDays({
          units,
          need,
          reference: { day: today, kind: 'today' },
          stillGoodCounts: false,
        }),
      ).isApproximate

    expect(run(estimatedKcal)).toBe(true)
    expect(run(estimatedDate)).toBe(false)
    expect(run(exact)).toBe(false)
  })

  it('nennt den Anteil der kcal aus Richtwerten der gezählten Einheiten', () => {
    const units = [
      supplyUnit('richtwert', '2028-01-31', { kcal: 1000, isKcalEstimated: true }),
      supplyUnit('etikett', '2028-01-31', { kcal: 3000 }),
      supplyUnit('abgelaufen', '2026-01-31', { kcal: 9000, isKcalEstimated: true }),
    ]
    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )
    expect(result.estimatedKcalShare).toBe(0.25)
    expect(result.isApproximate).toBe(true)
  })

  it('übersieht Schätzwerte, die am Stichtag nicht mehr zählen', () => {
    const units = [supplyUnit('a', '2026-01-31', { kcal: 100, isKcalEstimated: true })]

    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )
    expect(result.estimatedKcalShare).toBe(0)
    expect(result.isApproximate).toBe(false)
  })

  it('zählt Einheiten ohne Datum heute mit, am Zieldatum nicht', () => {
    const units = [
      supplyUnit('ohne', null, { kcal: 4400, waterMl: 4000 }),
      supplyUnit('mit', '2028-01-31', { kcal: 4400, waterMl: 4000 }),
    ]
    const run = (kind: 'today' | 'target') =>
      valueOf(
        calculateSupplyDays({
          units,
          need,
          reference: { day: today, kind },
          stillGoodCounts: false,
        }),
      ).days

    expect(run('today')).toBe(2)
    expect(run('target')).toBe(1)
  })

  it('wertet ein fehlendes Datum nicht als Schätzung', () => {
    const units = [supplyUnit('ohne', null, { kcal: 100 })]
    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )
    expect(result.isApproximate).toBe(false)
  })
})
