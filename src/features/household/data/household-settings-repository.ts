// Einstellungen des Haushalts, die die Seiten Mitglieder und Regeln ändern: Standard-Ernährungsform
// (HH-03) und „Noch gut zählt mit“ (ROT-05, #117). Fehlt die Zeile in haushalt_einstellung (alte
// Daten), gelten die Standards der Tabelle, und das erste Speichern legt sie an.
import 'server-only'
import { eq } from 'drizzle-orm'
import type { Diet } from '@/features/household/domain/member'
import type { Database } from '@/server/db/connection'
import { householdSettings } from '@/server/db/schema/household'

export type HouseholdRules = Readonly<{ defaultDiet: Diet; stillGoodCounts: boolean }>

type RulesChange = Partial<HouseholdRules>

export interface HouseholdSettingsRepository {
  read: (householdId: string) => Promise<HouseholdRules>
  update: (householdId: string, change: RulesChange) => Promise<void>
}

const DEFAULT_RULES: HouseholdRules = { defaultDiet: 'alles', stillGoodCounts: false }

const toColumns = (change: RulesChange) => ({
  ...(change.defaultDiet === undefined ? {} : { defaultDiet: change.defaultDiet }),
  ...(change.stillGoodCounts === undefined
    ? {}
    : { stillGoodCountsAsSupplied: change.stillGoodCounts }),
})

export function createHouseholdSettingsRepository(db: Database): HouseholdSettingsRepository {
  return {
    async read(householdId) {
      const [row] = await db
        .select({
          defaultDiet: householdSettings.defaultDiet,
          stillGoodCounts: householdSettings.stillGoodCountsAsSupplied,
        })
        .from(householdSettings)
        .where(eq(householdSettings.householdId, householdId))
      return row ?? DEFAULT_RULES
    },
    async update(householdId, change) {
      const columns = toColumns(change)
      await db
        .insert(householdSettings)
        .values({ householdId, ...columns })
        .onConflictDoUpdate({ target: householdSettings.householdId, set: columns })
    },
  }
}
