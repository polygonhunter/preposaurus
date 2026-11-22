import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { calculateGoalProgress, unitsExpiringBefore } from './goal-progress'
import { supplyUnit, supplyUnits } from '../../../../tests/helpers/supply-units'

const today = toCalendarDay('2026-11-22')
const targetDay = toCalendarDay('2027-03-31')

describe('Rechenbeispiel aus technik.html #rechnung', () => {
  // Bedarfswerte nach Konzept, ungeprüft (TESTDATEN): 2 Erwachsene, 4.400 kcal und 4 l je Tag.
  const need = { kcalPerDay: 4400, waterMlPerDay: 4000 }
  // Bestand frei gewählt: heute 33.000 kcal und 26 l Wasser.
  const units = [
    // 3 Packungen Nudeln zu je 1.795 kcal laufen vor dem Zieldatum ab
    ...supplyUnits(3, 'nudeln-alt', (id) => supplyUnit(id, '2027-01-31', { kcal: 1795 })),
    ...supplyUnits(12, 'nudeln', (id) => supplyUnit(id, '2027-09-30', { kcal: 1795 })),
    ...supplyUnits(15, 'linsen', (id) => supplyUnit(id, '2028-06-30', { kcal: 405 })),
    ...supplyUnits(13, 'wasser', (id) => supplyUnit(id, '2028-12-31', { waterMl: 2000 })),
  ]
  const result = calculateGoalProgress({
    stillGoodCounts: false,
    units,
    need,
    today,
    goal: { days: 10, targetDay },
  })
  if (!result.ok) throw new Error('Rechnung fehlgeschlagen')
  const progress = result.value

  it('heute: 33.000 kcal ÷ 4.400 = 7,5 Tage Energie, 26 ÷ 4 = 6,5 Tage Wasser', () => {
    expect(progress.today.kcal).toBe(33000)
    expect(progress.today.waterMl).toBe(26000)
    expect(progress.today.energyDays).toBe(7.5)
    expect(progress.today.waterDays).toBe(6.5)
  })

  it('heute versorgt: 6,5 Tage, Engpass ist das Wasser', () => {
    expect(progress.today.days).toBe(6.5)
    expect(progress.today.bottleneck).toBe('water')
  })

  it('am Zieldatum bleiben 27.615 kcal, das sind 6,2 Tage', () => {
    expect(progress.atTarget.kcal).toBe(27615)
    expect(progress.atTarget.energyDays).toBe(6.2)
    expect(progress.atTarget.waterDays).toBe(6.5)
  })

  it('Ziel: 6,2 von 10 Tagen, noch nicht erreicht', () => {
    expect(progress.atTarget.days).toBe(6.2)
    expect(progress.goalDays).toBe(10)
    expect(progress.isGoalReached).toBe(false)
  })

  it('nennt die 3 Packungen, die vor dem Zieldatum ablaufen', () => {
    expect(progress.expiringBeforeTarget.map((unit) => unit.id)).toEqual([
      'nudeln-alt-1',
      'nudeln-alt-2',
      'nudeln-alt-3',
    ])
  })
})

describe('calculateGoalProgress', () => {
  const need = { kcalPerDay: 2000, waterMlPerDay: 2000 }

  it('meldet ein erreichtes oder übertroffenes Ziel', () => {
    const units = [supplyUnit('vorrat', '2028-01-31', { kcal: 24000, waterMl: 24000 })]
    const result = calculateGoalProgress({
      stillGoodCounts: false,
      units,
      need,
      today,
      goal: { days: 10, targetDay },
    })

    expect(result.ok && result.value.isGoalReached).toBe(true)
    expect(result.ok && result.value.atTarget.days).toBe(12)
  })

  it('zählt am Zieldatum eine Einheit mit genau diesem MHD noch mit', () => {
    const units = [supplyUnit('knapp', '2027-03-31', { kcal: 20000, waterMl: 20000 })]
    const result = calculateGoalProgress({
      stillGoodCounts: false,
      units,
      need,
      today,
      goal: { days: 10, targetDay },
    })

    expect(result.ok && result.value.atTarget.days).toBe(10)
    expect(result.ok && result.value.expiringBeforeTarget).toEqual([])
  })

  describe('„Noch gut“ geprüfte Packung', () => {
    const units = [
      supplyUnit('geprueft', '2026-10-31', { kcal: 2000, waterMl: 2000, checkedAt: '2026-11-20' }),
    ]
    const goal = { days: 10, targetDay }

    it('zählt mit Einstellung heute, am Zieldatum aber nie', () => {
      const result = calculateGoalProgress({ units, need, today, goal, stillGoodCounts: true })

      expect(result.ok && result.value.today.days).toBe(1)
      expect(result.ok && result.value.atTarget.days).toBe(0)
      expect(result.ok && result.value.expiringBeforeTarget.map((unit) => unit.id)).toEqual([
        'geprueft',
      ])
    })

    it('zählt ohne Einstellung weder heute noch am Zieldatum', () => {
      const result = calculateGoalProgress({ stillGoodCounts: false, units, need, today, goal })

      expect(result.ok && result.value.today.days).toBe(0)
      expect(result.ok && result.value.expiringBeforeTarget).toEqual([])
    })
  })

  it('erlaubt das Zieldatum heute', () => {
    const result = calculateGoalProgress({
      stillGoodCounts: false,
      units: [],
      need,
      today,
      goal: { days: 3, targetDay: today },
    })
    expect(result.ok).toBe(true)
  })

  it('lehnt ein Zieldatum in der Vergangenheit ab', () => {
    const goal = { days: 10, targetDay: toCalendarDay('2026-11-21') }
    expect(calculateGoalProgress({ stillGoodCounts: false, units: [], need, today, goal })).toEqual(
      {
        ok: false,
        error: { kind: 'target-in-past' },
      },
    )
  })

  it('reicht den Fehler „kein Bedarf“ durch', () => {
    const noNeed = { kcalPerDay: 0, waterMlPerDay: 0 }
    const result = calculateGoalProgress({
      stillGoodCounts: false,
      units: [],
      need: noNeed,
      today,
      goal: { days: 10, targetDay },
    })
    expect(result).toEqual({ ok: false, error: { kind: 'no-need' } })
  })
})

describe('Gemischter Bestand mit „Datum fehlt“', () => {
  const need = { kcalPerDay: 2000, waterMlPerDay: 2000 }
  const units = [
    supplyUnit('mit-datum', '2028-01-31', { kcal: 6000, waterMl: 6000 }),
    supplyUnit('ohne-1', null, { kcal: 4000, waterMl: 4000 }),
    supplyUnit('ohne-2', null, { kcal: 2000, waterMl: 2000 }),
    supplyUnit('ohne-verbraucht', null, { kcal: 9000, status: 'consumed' }),
    supplyUnit('laeuft-ab', '2027-01-31', { kcal: 2000, waterMl: 2000 }),
  ]
  const result = calculateGoalProgress({
    stillGoodCounts: false,
    units,
    need,
    today,
    goal: { days: 5, targetDay },
  })
  if (!result.ok) throw new Error('Rechnung fehlgeschlagen')
  const progress = result.value

  it('heute versorgt zählt Einheiten ohne Datum mit', () => {
    expect(progress.today.days).toBe(7)
  })

  it('am Zieldatum zählen nur Einheiten mit Datum', () => {
    expect(progress.atTarget.days).toBe(3)
    expect(progress.isGoalReached).toBe(false)
  })

  it('nennt Einheiten ohne Datum gesondert, nicht als „läuft vor Zieldatum ab“', () => {
    expect(progress.expiringBeforeTarget.map((unit) => unit.id)).toEqual(['laeuft-ab'])
    expect(progress.withoutDate.map((unit) => unit.id)).toEqual(['ohne-1', 'ohne-2'])
  })

  it('erreicht das Ziel nicht allein durch Einheiten ohne Datum', () => {
    const onlyUndated = [supplyUnit('ohne', null, { kcal: 100000, waterMl: 100000 })]
    const run = calculateGoalProgress({
      stillGoodCounts: false,
      units: onlyUndated,
      need,
      today,
      goal: { days: 5, targetDay },
    })
    expect(run.ok && run.value.today.days).toBe(50)
    expect(run.ok && run.value.isGoalReached).toBe(false)
  })
})

describe('unitsExpiringBefore', () => {
  it('übergeht Einheiten ohne Datum', () => {
    expect(unitsExpiringBefore([supplyUnit('ohne', null)], { today, targetDay }, false)).toEqual([])
  })

  it('nennt nur Einheiten, die heute zählen und am Zieldatum nicht mehr', () => {
    const units = [
      supplyUnit('schon-abgelaufen', '2026-11-01'),
      supplyUnit('laeuft-ab', '2027-01-31'),
      supplyUnit('verbraucht', '2027-01-31', { status: 'consumed' }),
      supplyUnit('haelt', '2027-06-30'),
    ]
    expect(unitsExpiringBefore(units, { today, targetDay }, false).map((unit) => unit.id)).toEqual([
      'laeuft-ab',
    ])
  })
})
