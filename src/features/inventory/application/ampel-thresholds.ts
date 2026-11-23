// Ampel-Schwellen lesen und ändern (EIN-05, #78). Lesen dürfen alle im Haushalt, ändern nur der
// Admin (die Action prüft das). Die Grenzen prüft die Fachlogik: ganze Tage, Orange mindestens
// 7 Tage („Diese Woche“) und nie größer als Gelb. Vorrat, Übersicht und Bald fällig lesen die
// Schwellen bei jedem Aufruf, die neue Ampel gilt also sofort.
import 'server-only'
import type { Result } from '@/shared/lib/result'
import type { AmpelSettingsStore } from '../data/ampel-settings-repository'
import {
  validateAmpelThresholds,
  type AmpelThresholds,
  type ThresholdError,
} from '../domain/unit-state'

type Deps = Readonly<{ ampel: AmpelSettingsStore }>

export async function getAmpelThresholds(
  deps: Deps,
  householdId: string,
): Promise<AmpelThresholds> {
  return deps.ampel.read(householdId)
}

export async function saveAmpelThresholds(
  deps: Deps,
  command: Readonly<{ householdId: string; thresholds: AmpelThresholds }>,
): Promise<Result<AmpelThresholds, ThresholdError>> {
  const result = validateAmpelThresholds(command.thresholds)
  if (result.ok) await deps.ampel.save(command.householdId, result.value)
  return result
}
