// Zielmengen je Warengruppe aus `quelle_wert`, das die Mengen je Ernährungsform schon verteilt
// speichert (#43). Deshalb wird hier nicht verschoben, sondern je Form gerechnet und summiert.
import {
  calculateHouseholdTargets,
  resolveDiet,
  type Diet,
  type DietShifts,
  type HouseholdGroupTarget,
} from './group-targets'
import type { SupplyBasis } from './supply-basis'

// quelle_wert speichert die Menge je Ernährungsform schon verteilt. Deshalb ohne Verschiebung.
const NO_SHIFTS: DietShifts = { omnivore: [], vegetarian: [], vegan: [] }
const DIETS: readonly Diet[] = ['omnivore', 'vegetarian', 'vegan']

function targetsForDiet(
  basis: Pick<SupplyBasis, 'members' | 'householdDiet' | 'targetsByDiet'>,
  diet: Diet,
  days: number,
): HouseholdGroupTarget[] {
  const members = basis.members.filter(
    (member) => resolveDiet(member, basis.householdDiet) === diet,
  )
  // Fehlen Werte für eine Form, gilt vorläufig „alles“, damit niemand ohne Ziel bleibt
  const targets = basis.targetsByDiet[diet] ?? basis.targetsByDiet.omnivore ?? []
  if (members.length === 0) return []
  const result = calculateHouseholdTargets({
    members,
    householdDiet: basis.householdDiet,
    targets,
    dietShifts: NO_SHIFTS,
    days,
  })
  return result.ok ? result.value : []
}

/**
 * Ziel des Haushalts je Warengruppe für `days` Tage aus den je Ernährungsform gespeicherten
 * Mengen (`quelle_wert`): jede Person nach ihrer Form, dann über alle Formen summiert.
 */
export function calculateStoredDietTargets(
  basis: Pick<SupplyBasis, 'members' | 'householdDiet' | 'targetsByDiet'>,
  days: number,
): HouseholdGroupTarget[] {
  const totals = new Map<string, HouseholdGroupTarget>()
  for (const target of DIETS.flatMap((diet) => targetsForDiet(basis, diet, days))) {
    const existing = totals.get(target.groupKey)
    if (existing) existing.amount += target.amount
    else totals.set(target.groupKey, { ...target })
  }
  return [...totals.values()]
}
