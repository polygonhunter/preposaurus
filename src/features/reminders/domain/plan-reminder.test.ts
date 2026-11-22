import { describe, expect, it } from 'vitest'
import { dueItem } from '../../../../tests/helpers/due-items'
import { planReminder, type ReminderInput } from './plan-reminder'

const base: ReminderInput = {
  now: new Date('2026-11-24T08:00:00Z'), // Dienstag, 9:00 Uhr in Berlin
  settings: {
    weeklySummary: { isEnabled: true, weekday: 6, time: '10:00' },
    isUrgentEnabled: true,
  },
  lastSent: { 'weekly-summary': null, urgent: null },
  stock: {
    dueItems: [dueItem('Thunfisch', '2026-11-30')],
    missingDateCount: 0,
    goal: null,
    openRestockCount: 0,
  },
}

const saturday = (iso: string): Pick<ReminderInput, 'now'> => ({ now: new Date(iso) })

describe('planReminder', () => {
  it('schickt „Dringend“ an einem normalen Tag', () => {
    const plan = planReminder(base)
    expect(plan?.message.kind).toBe('urgent')
    expect(plan?.marks).toEqual(['urgent'])
  })

  it('schickt nichts, wenn nichts fällig ist', () => {
    const stock = { ...base.stock, dueItems: [] }
    expect(planReminder({ ...base, stock })).toBeNull()
  })

  it('schickt „Dringend“ nicht zweimal am Tag', () => {
    const lastSent = { ...base.lastSent, urgent: new Date('2026-11-24T07:00:00Z') }
    expect(planReminder({ ...base, lastSent })).toBeNull()
  })

  it('wiederholt am nächsten Tag keine schon gemeldete Packung', () => {
    const lastSent = { ...base.lastSent, urgent: new Date('2026-11-24T07:00:00Z') }
    const now = new Date('2026-11-25T08:00:00Z')
    expect(planReminder({ ...base, now, lastSent })).toBeNull()
  })

  it('hält „Dringend“ am Tag der Wochenübersicht zurück, bis sie hinausgeht', () => {
    expect(planReminder({ ...base, ...saturday('2026-11-28T07:30:00Z') })).toBeNull()
  })

  it('schickt am Samstag um 10 Uhr die Wochenübersicht und setzt beide Merker', () => {
    const plan = planReminder({ ...base, ...saturday('2026-11-28T09:00:00Z') })
    expect(plan?.message.kind).toBe('weekly-summary')
    expect(plan?.marks).toEqual(['weekly-summary', 'urgent'])
  })

  it('schickt nach der Wochenübersicht am selben Tag nichts mehr', () => {
    const sent = new Date('2026-11-28T09:00:00Z')
    const lastSent = { 'weekly-summary': sent, urgent: sent }
    expect(planReminder({ ...base, ...saturday('2026-11-28T15:00:00Z'), lastSent })).toBeNull()
  })

  it('schickt am Samstag „Dringend“, wenn die Wochenübersicht aus ist', () => {
    const settings = {
      ...base.settings,
      weeklySummary: { ...base.settings.weeklySummary, isEnabled: false },
    }
    const plan = planReminder({ ...base, ...saturday('2026-11-28T09:00:00Z'), settings })
    expect(plan?.message.kind).toBe('urgent')
  })

  it('schickt nichts, wenn die Wochenübersicht keinen Anlass hat', () => {
    const stock = { ...base.stock, dueItems: [] }
    expect(planReminder({ ...base, ...saturday('2026-11-28T09:00:00Z'), stock })).toBeNull()
  })

  it('schickt nichts, wenn „Dringend“ aus ist', () => {
    const settings = { ...base.settings, isUrgentEnabled: false }
    expect(planReminder({ ...base, settings })).toBeNull()
  })
})
