import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { calculateSupplyDays } from './supply-days'
import { supplyUnit, supplyUnits } from '../../../../tests/helpers/supply-units'

const today = toCalendarDay('2026-11-22')
// TESTDATEN: 2 Erwachsene mit den ungeprüften Konzeptwerten aus technik.html #rechnung
const need = { kcalPerDay: 4400, waterMlPerDay: 4000 }

const valueOf = <T>(result: { ok: true; value: T } | { ok: false }) => {
  if (!result.ok) throw new Error('Rechnung fehlgeschlagen')
  return result.value
}

describe('calculateSupplyDays', () => {
  it('nimmt den kleineren Wert aus Energie und Wasser als Engpass', () => {
    const units = [
      supplyUnit('reis', '2028-01-31', { kcal: 35200 }),
      supplyUnit('wasser', '2028-01-31', { waterMl: 16000 }),
    ]
    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )

    expect(result).toEqual({
      energyDays: 8,
      waterDays: 4,
      days: 4,
      bottleneck: 'water',
      estimatedKcalShare: 0,
      isApproximate: false,
      kcal: 35200,
      waterMl: 16000,
    })
  })

  it('nennt Energie als Engpass, wenn sie knapper ist', () => {
    const units = [
      supplyUnit('reis', '2028-01-31', { kcal: 8800 }),
      supplyUnit('wasser', '2028-01-31', { waterMl: 40000 }),
    ]
    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )

    expect(result.days).toBe(2)
    expect(result.bottleneck).toBe('energy')
  })

  it('zählt abgelaufene, verbrauchte und entsorgte Einheiten nicht', () => {
    const units = [
      supplyUnit('ok', '2026-11-22', { kcal: 4400, waterMl: 4000 }),
      supplyUnit('abgelaufen', '2026-11-21', { kcal: 44000, waterMl: 40000 }),
      supplyUnit('verbraucht', '2028-01-31', { kcal: 44000, status: 'consumed' }),
      supplyUnit('entsorgt', '2028-01-31', { waterMl: 40000, status: 'discarded' }),
    ]
    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )

    expect(result.days).toBe(1)
  })

  it('zählt „Noch gut“ vorläufig nicht, außer die Regel wird umgestellt', () => {
    const checked = supplyUnit('geprueft', '2026-10-31', {
      kcal: 4400,
      waterMl: 4000,
      checkedAt: '2026-11-20',
    })
    const units = [checked]

    expect(
      valueOf(
        calculateSupplyDays({
          units,
          need,
          reference: { day: today, kind: 'today' },
          stillGoodCounts: false,
        }),
      ).days,
    ).toBe(0)
    const counting = calculateSupplyDays({
      units,
      need,
      reference: { day: today, kind: 'today' },
      stillGoodCounts: true,
    })
    expect(valueOf(counting).days).toBe(1)
  })

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

  it('rundet auf eine Nachkommastelle ab', () => {
    const units = [
      supplyUnit('reis', '2028-01-31', { kcal: 4400 * 2.99 }),
      supplyUnit('wasser', '2028-01-31', { waterMl: 4000 * 0.7 }),
    ]
    const result = valueOf(
      calculateSupplyDays({
        units,
        need,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )

    expect(result.energyDays).toBe(2.9)
    expect(result.waterDays).toBe(0.7)
    expect(result.days).toBe(0.7)
  })

  it('liefert 0 Tage bei leerem Vorrat', () => {
    expect(
      valueOf(
        calculateSupplyDays({
          units: [],
          need,
          reference: { day: today, kind: 'today' },
          stillGoodCounts: false,
        }),
      ).days,
    ).toBe(0)
  })

  it('meldet einen Fehler, wenn kein Bedarf da ist', () => {
    const noNeed = { kcalPerDay: 0, waterMlPerDay: 0 }
    expect(
      calculateSupplyDays({
        units: [],
        need: noNeed,
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    ).toEqual({
      ok: false,
      error: { kind: 'no-need' },
    })
  })

  it('zählt viele gleiche Einheiten', () => {
    const units = supplyUnits(10, 'nudeln', (id) => supplyUnit(id, '2028-01-31', { kcal: 1795 }))
    const result = valueOf(
      calculateSupplyDays({
        units,
        need: { kcalPerDay: 2200, waterMlPerDay: 2000 },
        reference: { day: today, kind: 'today' },
        stillGoodCounts: false,
      }),
    )

    expect(result.kcal).toBe(17950)
    expect(result.energyDays).toBe(8.1)
  })
})
