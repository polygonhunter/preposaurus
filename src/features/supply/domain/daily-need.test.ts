import { describe, expect, it } from 'vitest'
import { calculateDailyNeed, needFor, type MemberType, type NeedsByMemberType } from './daily-need'

// TESTDATEN, keine Quellwerte. Die echten Werte kommen geprüft als Seed (M1-09, U3).
const TEST_NEEDS: NeedsByMemberType = {
  adult: { kcalPerDay: 2000, waterMlPerDay: 2000 },
  senior: { kcalPerDay: 1800, waterMlPerDay: 2000 },
  teen: { kcalPerDay: 2400, waterMlPerDay: 1500 },
  child: { kcalPerDay: 1500, waterMlPerDay: 1000 },
}

const members = (...types: MemberType[]) => types.map((type) => ({ type }))

describe('calculateDailyNeed', () => {
  it('summiert den Bedarf über alle Mitglieder', () => {
    expect(calculateDailyNeed(members('adult', 'adult', 'child'), TEST_NEEDS)).toEqual({
      kcalPerDay: 5500,
      waterMlPerDay: 5000,
      countedMembers: 3,
      uncounted: [],
    })
  })

  it('zählt ein Baby nicht und nennt es im Ergebnis', () => {
    const result = calculateDailyNeed(members('adult', 'baby', 'baby'), TEST_NEEDS)

    expect(result.kcalPerDay).toBe(2000)
    expect(result.countedMembers).toBe(1)
    expect(result.uncounted).toEqual([{ type: 'baby', count: 2 }])
  })

  it('zählt ein Baby auch dann nicht, wenn die Quelle einen Wert hätte', () => {
    const needs = { ...TEST_NEEDS, baby: { kcalPerDay: 700, waterMlPerDay: 700 } }

    expect(calculateDailyNeed(members('baby'), needs).kcalPerDay).toBe(0)
  })

  it('nennt jede Personengruppe ohne Wert in der Quelle', () => {
    const needs = { adult: { kcalPerDay: 2000, waterMlPerDay: 2000 } }
    const result = calculateDailyNeed(members('adult', 'senior', 'teen', 'senior'), needs)

    expect(result.kcalPerDay).toBe(2000)
    expect(result.uncounted).toEqual([
      { type: 'senior', count: 2 },
      { type: 'teen', count: 1 },
    ])
  })

  it('liefert 0 für einen Haushalt ohne Mitglieder', () => {
    expect(calculateDailyNeed([], TEST_NEEDS)).toEqual({
      kcalPerDay: 0,
      waterMlPerDay: 0,
      countedMembers: 0,
      uncounted: [],
    })
  })
})

describe('needFor', () => {
  it('liefert den Wert der Personengruppe oder null', () => {
    expect(needFor('teen', TEST_NEEDS)).toEqual({ kcalPerDay: 2400, waterMlPerDay: 1500 })
    expect(needFor('baby', TEST_NEEDS)).toBeNull()
    expect(needFor('adult', {})).toBeNull()
  })
})
