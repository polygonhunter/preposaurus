import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { calculateGoalProgress } from './goal-progress'
import { reachable } from '../../../../tests/helpers/goal-progress'
import { supplyUnit } from '../../../../tests/helpers/supply-units'

// Sonderfälle der Datumsangaben: vergangenes Zieldatum und Packungen ohne Datum.

const today = toCalendarDay('2026-11-22')
const targetDay = toCalendarDay('2027-03-31')

describe('Zieldatum in der Vergangenheit', () => {
  const need = { kcalPerDay: 2000, waterMlPerDay: 2000 }
  const yesterday = toCalendarDay('2026-11-21')
  const units = [
    supplyUnit('vorrat', '2028-01-31', { kcal: 6000, waterMl: 6000 }),
    supplyUnit('ohne', null, { kcal: 2000, waterMl: 2000 }),
  ]
  const result = calculateGoalProgress({
    stillGoodCounts: false,
    units,
    need,
    today,
    goal: { days: 10, targetDay: yesterday },
  })
  if (!result.ok) throw new Error('Rechnung fehlgeschlagen')

  it('ist kein Fehler, sondern ein Hinweis mit dem alten Datum', () => {
    expect(result.value.target).toEqual({ kind: 'target-in-past', targetDay: yesterday })
  })

  it('rechnet „Heute versorgt“ und „Datum fehlt“ trotzdem weiter', () => {
    expect(result.value.today.days).toBe(4)
    expect(result.value.goalDays).toBe(10)
    expect(result.value.withoutDate.map((unit) => unit.id)).toEqual(['ohne'])
  })

  it('meldet auch ein Zieldatum weit in der Vergangenheit nur als Hinweis', () => {
    const longAgo = toCalendarDay('2020-01-01')
    const run = calculateGoalProgress({
      stillGoodCounts: false,
      units: [],
      need,
      today,
      goal: { days: 10, targetDay: longAgo },
    })
    expect(run.ok && run.value.target.kind).toBe('target-in-past')
  })

  it('meldet fehlenden Bedarf weiter als Fehler, auch bei vergangenem Zieldatum', () => {
    const run = calculateGoalProgress({
      stillGoodCounts: false,
      units,
      need: { kcalPerDay: 0, waterMlPerDay: 0 },
      today,
      goal: { days: 10, targetDay: yesterday },
    })
    expect(run).toEqual({ ok: false, error: { kind: 'no-need' } })
  })
})

describe('Zieldatum ist heute', () => {
  const need = { kcalPerDay: 2000, waterMlPerDay: 2000 }
  const units = [
    supplyUnit('haelt', '2028-01-31', { kcal: 6000, waterMl: 6000 }),
    supplyUnit('heute-letzter-tag', '2026-11-22', { kcal: 2000, waterMl: 2000 }),
    supplyUnit('ohne', null, { kcal: 2000, waterMl: 2000 }),
  ]
  const result = calculateGoalProgress({
    stillGoodCounts: false,
    units,
    need,
    today,
    goal: { days: 4, targetDay: today },
  })

  it('ist ein gültiges Ziel und kein Hinweis auf ein vergangenes Datum', () => {
    expect(result.ok && result.value.target.kind).toBe('valid')
  })

  it('zählt am Zieldatum wie heute, nur ohne „Datum fehlt“', () => {
    const atGoal = reachable(result)
    expect(result.ok && result.value.today.days).toBe(5)
    expect(atGoal.atTarget.days).toBe(4)
    expect(atGoal.isGoalReached).toBe(true)
  })

  it('meldet nichts als „läuft vor Zieldatum ab“', () => {
    expect(reachable(result).expiringBeforeTarget).toEqual([])
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
  const atGoal = reachable(result)

  it('heute versorgt zählt Einheiten ohne Datum mit', () => {
    expect(progress.today.days).toBe(7)
  })

  it('am Zieldatum zählen nur Einheiten mit Datum', () => {
    expect(atGoal.atTarget.days).toBe(3)
    expect(atGoal.isGoalReached).toBe(false)
  })

  it('nennt Einheiten ohne Datum gesondert, nicht als „läuft vor Zieldatum ab“', () => {
    expect(atGoal.expiringBeforeTarget.map((unit) => unit.id)).toEqual(['laeuft-ab'])
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
    expect(reachable(run).isGoalReached).toBe(false)
  })
})
