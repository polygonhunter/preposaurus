import { describe, expect, it, vi } from 'vitest'
import type { ReminderSettings } from '../domain/reminder-settings'
import {
  getReminderDelivery,
  getReminderSettings,
  saveReminderSettings,
  type ReminderSettingsStore,
} from './reminder-settings'

const tuesdayEvening: ReminderSettings = {
  weeklySummary: { isEnabled: true, weekday: 2, time: '18:30:00' },
  isUrgentEnabled: false,
}

function storeWith(stored: ReminderSettings | null) {
  const saved: { householdId: string; settings: ReminderSettings }[] = []
  const settings: ReminderSettingsStore = {
    read: () => Promise.resolve(stored),
    save: (householdId, value) => {
      saved.push({ householdId, settings: value })
      return Promise.resolve()
    },
  }
  return { settings, saved }
}

describe('getReminderSettings', () => {
  it('liefert die gespeicherten Werte, die Uhrzeit ohne Sekunden', async () => {
    const { settings } = storeWith(tuesdayEvening)
    expect(await getReminderSettings({ settings }, 'haushalt-a')).toEqual({
      weeklySummary: { isEnabled: true, weekday: 2, time: '18:30' },
      isUrgentEnabled: false,
    })
  })

  it('nimmt ohne Zeile die Standards: Samstag 10:00, „Dringend“ an', async () => {
    const { settings } = storeWith(null)
    expect(await getReminderSettings({ settings }, 'haushalt-a')).toEqual({
      weeklySummary: { isEnabled: true, weekday: 6, time: '10:00' },
      isUrgentEnabled: true,
    })
  })
})

describe('saveReminderSettings', () => {
  it('speichert für den genannten Haushalt', async () => {
    const { settings, saved } = storeWith(null)
    await saveReminderSettings(
      { settings },
      { householdId: 'haushalt-a', settings: tuesdayEvening },
    )
    expect(saved).toEqual([{ householdId: 'haushalt-a', settings: tuesdayEvening }])
  })
})

describe('getReminderDelivery', () => {
  it('zählt die Adressen, wenn Mails eingerichtet sind', async () => {
    const listAddresses = vi.fn(() => Promise.resolve(['alex@example.org', 'kim@example.org']))
    const delivery = await getReminderDelivery(
      { repository: { listAddresses }, isMailConfigured: true },
      'haushalt-a',
    )
    expect(delivery).toEqual({ isMailConfigured: true, addressCount: 2 })
    expect(listAddresses).toHaveBeenCalledWith('haushalt-a')
  })

  it('fragt ohne Mailversand gar nicht nach Adressen', async () => {
    const listAddresses = vi.fn(() => Promise.resolve(['alex@example.org']))
    const delivery = await getReminderDelivery(
      { repository: { listAddresses }, isMailConfigured: false },
      'haushalt-a',
    )
    expect(delivery).toEqual({ isMailConfigured: false, addressCount: 0 })
    expect(listAddresses).not.toHaveBeenCalled()
  })
})
