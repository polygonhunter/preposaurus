import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { GoalRepository } from '../data/goal-repository'
import { goalSchema } from '../schemas'
import { getGoalSettings, saveGoal } from './goal-settings'

type StoredGoal = Awaited<ReturnType<GoalRepository['read']>>

const today = toCalendarDay('2026-11-23')
const HOUSEHOLD = 'haushalt-1'

const SOURCE = {
  name: 'BBK/BLE',
  asOf: '2024',
  link: 'https://example.org/empfehlung',
  defaultDays: 10,
  isVerified: true,
}

function fakeGoals(stored: StoredGoal) {
  const saved: unknown[] = []
  const goals: GoalRepository = {
    read: () => Promise.resolve(stored),
    save: (householdId, goal) => {
      saved.push({ householdId, ...goal })
      return Promise.resolve()
    },
  }
  return { goals, saved }
}

const form = (choice: string, customDays = '', targetDate = '') =>
  goalSchema.parse({ choice, customDays, targetDate })

describe('Ziel lesen', () => {
  it('nimmt ohne Ziel den Standard der Quelle', async () => {
    const { goals } = fakeGoals({ days: null, targetDate: null, source: SOURCE })

    const settings = await getGoalSettings({ goals, today }, HOUSEHOLD)

    expect(settings).toMatchObject({ days: 10, defaultDays: 10, source: SOURCE })
  })

  it('nimmt ohne Quelle 10 Tage als Standard', async () => {
    const { goals } = fakeGoals({ days: 14, targetDate: null, source: null })

    const settings = await getGoalSettings({ goals, today }, HOUSEHOLD)

    expect(settings).toMatchObject({ days: 14, defaultDays: 10, source: null })
  })

  it('merkt sich, wenn das gespeicherte Zieldatum vorbei ist', async () => {
    const past = toCalendarDay('2026-10-31')
    const { goals } = fakeGoals({ days: 10, targetDate: past, source: null })

    const settings = await getGoalSettings({ goals, today }, HOUSEHOLD)

    expect(settings).toMatchObject({ targetDate: past, isTargetDatePast: true })
  })
})

describe('Ziel speichern', () => {
  it('speichert eine feste Dauer mit Datum', async () => {
    const { goals, saved } = fakeGoals({ days: 10, targetDate: null, source: null })

    const result = await saveGoal(
      { goals, today },
      { householdId: HOUSEHOLD, input: form('14', '', '2026-12-31') },
    )

    expect(result.ok).toBe(true)
    expect(saved).toEqual([{ householdId: HOUSEHOLD, days: 14, targetDate: '2026-12-31' }])
  })

  it('speichert einen eigenen Wert ohne Datum', async () => {
    const { goals, saved } = fakeGoals({ days: 10, targetDate: null, source: null })

    await saveGoal({ goals, today }, { householdId: HOUSEHOLD, input: form('eigen', '21') })

    expect(saved).toEqual([{ householdId: HOUSEHOLD, days: 21, targetDate: null }])
  })

  it('speichert kein Datum in der Vergangenheit, heute geht', async () => {
    const { goals, saved } = fakeGoals({ days: 10, targetDate: null, source: null })
    const deps = { goals, today }

    const past = await saveGoal(deps, {
      householdId: HOUSEHOLD,
      input: form('10', '', '2026-11-22'),
    })
    const sameDay = await saveGoal(deps, {
      householdId: HOUSEHOLD,
      input: form('10', '', '2026-11-23'),
    })

    expect(past).toEqual({ ok: false, error: { kind: 'target-in-past' } })
    expect(sameDay.ok).toBe(true)
    expect(saved).toHaveLength(1)
  })
})

describe('Schema des Ziels', () => {
  it('verlangt beim eigenen Wert eine Zahl von 1 bis 365', () => {
    for (const customDays of ['', '0', '366', '2,5', 'zehn']) {
      const result = goalSchema.safeParse({ choice: 'eigen', customDays, targetDate: '' })
      expect(result.success, customDays).toBe(false)
      expect(result.error?.issues[0]?.path).toEqual(['customDays'])
    }
  })

  it('lehnt eine unbekannte Dauer und ein ungültiges Datum ab', () => {
    expect(goalSchema.safeParse({ choice: '7', customDays: '', targetDate: '' }).success).toBe(
      false,
    )
    const badDate = goalSchema.safeParse({ choice: '10', customDays: '', targetDate: '2026-02-30' })
    expect(badDate.error?.issues[0]?.path).toEqual(['targetDate'])
  })
})
