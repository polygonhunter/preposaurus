// Ampel-Schwellen des Haushalts (EIN-05, #78) in haushalt_einstellung. Fehlt die Zeile (alte
// Daten), gelten die Standards, und das erste Speichern legt sie an. Der CHECK
// haushalt_einstellung_ampel_check hält dieselben Grenzen wie validateAmpelThresholds.
import 'server-only'
import type { AmpelThresholds } from '@/features/inventory/domain/unit-state'
import type { Database } from '@/server/db/connection'
import { householdSettings } from '@/server/db/schema/household'
import { loadSettings } from './household-read-query'

export interface AmpelSettingsStore {
  read: (householdId: string) => Promise<AmpelThresholds>
  save: (householdId: string, thresholds: AmpelThresholds) => Promise<void>
}

export function createAmpelSettingsRepository(db: Database): AmpelSettingsStore {
  return {
    async read(householdId) {
      return (await loadSettings(db, householdId)).thresholds
    },
    async save(householdId, { soonDays, urgentDays }) {
      const columns = { ampelYellowDays: soonDays, ampelOrangeDays: urgentDays }
      await db
        .insert(householdSettings)
        .values({ householdId, ...columns })
        .onConflictDoUpdate({ target: householdSettings.householdId, set: columns })
    },
  }
}
