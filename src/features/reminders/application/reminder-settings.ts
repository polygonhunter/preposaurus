// Erinnerungen des Haushalts lesen und ändern (ERI-02, ERI-03, #89). Lesen dürfen alle im Haushalt,
// ändern nur der Admin (die Action prüft das). Der Worker liest dieselben Spalten bei jedem Lauf,
// neue Werte gelten also ab dem nächsten Lauf (höchstens 10 Minuten).
import 'server-only'
import {
  DEFAULT_WEEKLY_SUMMARY_TIME,
  DEFAULT_WEEKLY_SUMMARY_WEEKDAY,
} from '@/shared/config/constants'
import {
  toMinutePrecision,
  type ReminderDelivery,
  type ReminderSettings,
} from '../domain/reminder-settings'
import type { ReminderRepository } from './reminder-repository'

export interface ReminderSettingsStore {
  /** null: Der Haushalt hat noch keine Zeile in haushalt_einstellung */
  read: (householdId: string) => Promise<ReminderSettings | null>
  save: (householdId: string, settings: ReminderSettings) => Promise<void>
}

/** Standard der Tabelle: Wochenübersicht samstags 10:00, „Dringend“ an */
const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  weeklySummary: {
    isEnabled: true,
    weekday: DEFAULT_WEEKLY_SUMMARY_WEEKDAY,
    time: DEFAULT_WEEKLY_SUMMARY_TIME,
  },
  isUrgentEnabled: true,
}

type SettingsDeps = Readonly<{ settings: ReminderSettingsStore }>

type DeliveryDeps = Readonly<{
  repository: Pick<ReminderRepository, 'listAddresses'>
  isMailConfigured: boolean
}>

export async function getReminderSettings(
  deps: SettingsDeps,
  householdId: string,
): Promise<ReminderSettings> {
  const stored = await deps.settings.read(householdId)
  const { weeklySummary, isUrgentEnabled } = stored ?? DEFAULT_REMINDER_SETTINGS
  return {
    weeklySummary: { ...weeklySummary, time: toMinutePrecision(weeklySummary.time) },
    isUrgentEnabled,
  }
}

export async function saveReminderSettings(
  deps: SettingsDeps,
  command: Readonly<{ householdId: string; settings: ReminderSettings }>,
): Promise<void> {
  await deps.settings.save(command.householdId, command.settings)
}

export async function getReminderDelivery(
  deps: DeliveryDeps,
  householdId: string,
): Promise<ReminderDelivery> {
  if (!deps.isMailConfigured) return { isMailConfigured: false, addressCount: 0 }
  const addresses = await deps.repository.listAddresses(householdId)
  return { isMailConfigured: true, addressCount: addresses.length }
}
