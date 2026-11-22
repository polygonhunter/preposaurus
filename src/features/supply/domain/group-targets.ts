import { ok, type Result } from '@/shared/lib/result'
import { isCountedMemberType, type MemberType } from './daily-need'
import { validateDietShifts, type DietShiftError } from './diet-shifts'

// Zielmengen je Warengruppe. Die Werte (quelle_wert) und die Verteilung nach Ernährungsform
// kommen als versionierte Daten herein, nicht als fester Code (UMSETZUNG §7.3).

export type Diet = 'omnivore' | 'vegetarian' | 'vegan'

/** Menge je Person und Tag laut Quelle, in g oder ml. */
export interface GroupTarget {
  groupKey: string
  unit: 'g' | 'ml'
  amountPerPersonPerDay: number
}

/** Was eine Ernährungsform weglässt, geht anteilig in andere Warengruppen (Anteile summieren 1). */
export interface DietShift {
  from: string
  to: readonly { groupKey: string; share: number }[]
}

export type DietShifts = Readonly<Record<Diet, readonly DietShift[]>>

export interface HouseholdMember {
  type: MemberType
  /** null heißt „wie Haushalt“ */
  diet: Diet | null
}

export interface HouseholdGroupTarget {
  groupKey: string
  unit: 'g' | 'ml'
  amount: number
}

interface HouseholdTargetInput {
  members: readonly HouseholdMember[]
  householdDiet: Diet
  targets: readonly GroupTarget[]
  dietShifts: DietShifts
  days: number
}

export function resolveDiet(member: HouseholdMember, householdDiet: Diet): Diet {
  return member.diet ?? householdDiet
}

/** Mengen je Person und Tag nach Ernährungsform. Bei geprüften Verschiebungen bleibt die Menge je Einheit gleich. */
export function targetsForDiet(
  targets: readonly GroupTarget[],
  shifts: readonly DietShift[],
): Map<string, number> {
  const amounts = new Map(targets.map((target) => [target.groupKey, target.amountPerPersonPerDay]))
  for (const shift of shifts) {
    const moved = amounts.get(shift.from) ?? 0
    amounts.set(shift.from, 0)
    for (const { groupKey, share } of shift.to) {
      amounts.set(groupKey, (amounts.get(groupKey) ?? 0) + moved * share)
    }
  }
  return amounts
}

/**
 * Ziel des Haushalts je Warengruppe für `days` Tage: je Person gerechnet, dann summiert.
 * Fehlerhafte Verteilungsdaten ergeben einen Fehlerwert statt einer verfälschten Zielmenge.
 */
export function calculateHouseholdTargets(
  input: HouseholdTargetInput,
): Result<HouseholdGroupTarget[], DietShiftError> {
  const valid = validateDietShifts(input.targets, input.dietShifts)
  if (!valid.ok) return valid
  const totals = new Map<string, number>()
  const counted = input.members.filter((member) => isCountedMemberType(member.type))
  for (const member of counted) {
    const shifts = input.dietShifts[resolveDiet(member, input.householdDiet)]
    for (const [groupKey, amount] of targetsForDiet(input.targets, shifts)) {
      totals.set(groupKey, (totals.get(groupKey) ?? 0) + amount * input.days)
    }
  }
  return ok(
    input.targets.map(({ groupKey, unit }) => ({
      groupKey,
      unit,
      amount: totals.get(groupKey) ?? 0,
    })),
  )
}
