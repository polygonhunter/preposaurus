// Tagesbedarf im Rechenmodus „offiziell“: Summe der Pauschalwerte je Personengruppe.
// Die Werte kommen aus der aktiven Quelle (quelle_bedarf) und werden hier nur übergeben.

/** Mitgliedstypen nach Konzept 02 (W13). */
export type MemberType = 'baby' | 'child' | 'teen' | 'adult' | 'senior'

/** Bedarf einer Person je Tag laut Quelle. Wasser in ml, wie alle Mengen in der Fachlogik. */
export interface PersonNeed {
  kcalPerDay: number
  waterMlPerDay: number
}

export type NeedsByMemberType = Partial<Record<MemberType, PersonNeed>>

/**
 * Vorläufige Annahme L20 (UMSETZUNG §7.3): Ein Baby lässt sich anlegen, zählt aber nicht im
 * Bedarf, solange der Sonderbedarf (HH-05) fehlt. Gilt auch, wenn die Quelle einen Wert hätte.
 */
export const MEMBER_TYPES_WITHOUT_NEED: readonly MemberType[] = ['baby']

export interface UncountedMembers {
  type: MemberType
  count: number
}

export interface DailyNeed {
  kcalPerDay: number
  waterMlPerDay: number
  countedMembers: number
  /** Personengruppen ohne Wert, damit „So wird gerechnet“ sie nennen kann */
  uncounted: UncountedMembers[]
}

/** Bedarf einer Person oder null, wenn ihre Personengruppe nicht mitzählt. */
export function needFor(type: MemberType, needs: NeedsByMemberType): PersonNeed | null {
  if (MEMBER_TYPES_WITHOUT_NEED.includes(type)) return null
  return needs[type] ?? null
}

function countUncounted(types: readonly MemberType[]): UncountedMembers[] {
  const counts = new Map<MemberType, number>()
  for (const type of types) counts.set(type, (counts.get(type) ?? 0) + 1)
  return [...counts].map(([type, count]) => ({ type, count }))
}

/** Bedarf des Haushalts je Tag = Summe über die Mitglieder nach Personengruppe. */
export function calculateDailyNeed(
  members: readonly { type: MemberType }[],
  needs: NeedsByMemberType,
): DailyNeed {
  let kcalPerDay = 0
  let waterMlPerDay = 0
  const uncountedTypes: MemberType[] = []
  for (const { type } of members) {
    const need = needFor(type, needs)
    if (need === null) {
      uncountedTypes.push(type)
      continue
    }
    kcalPerDay += need.kcalPerDay
    waterMlPerDay += need.waterMlPerDay
  }
  const countedMembers = members.length - uncountedTypes.length
  return { kcalPerDay, waterMlPerDay, countedMembers, uncounted: countUncounted(uncountedTypes) }
}
