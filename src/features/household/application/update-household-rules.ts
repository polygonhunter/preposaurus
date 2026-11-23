// Standard-Ernährungsform (HH-03) und „Noch gut zählt mit“ (ROT-05, #117) des Haushalts. Die
// Vorrat-Rechnung liest den Schalter bei jedem Aufruf aus haushalt_einstellung.
import 'server-only'
import type { HouseholdRules } from '../data/household-settings-repository'
import type { HouseholdServices } from './household-services'

export async function updateHouseholdRules(
  deps: Pick<HouseholdServices, 'settings'>,
  command: Readonly<{ householdId: string; change: Partial<HouseholdRules> }>,
): Promise<void> {
  await deps.settings.update(command.householdId, command.change)
}
