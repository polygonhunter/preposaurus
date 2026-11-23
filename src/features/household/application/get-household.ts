// Mitglieder und Regeln des Haushalts für die Einstellungen (#37, #38, #117). Lesen dürfen alle im
// Haushalt, ändern nur der Admin (die Actions prüfen das).
import 'server-only'
import type { Member } from '../domain/member'
import type { HouseholdRules } from '../data/household-settings-repository'
import type { HouseholdServices } from './household-services'

export type HouseholdView = Readonly<{ members: Member[]; rules: HouseholdRules }>

type ReadDeps = Pick<HouseholdServices, 'members' | 'settings'>

export async function getHousehold(deps: ReadDeps, householdId: string): Promise<HouseholdView> {
  const [members, rules] = await Promise.all([
    deps.members.list(householdId),
    deps.settings.read(householdId),
  ])
  return { members, rules }
}

export async function getMember(
  deps: Pick<HouseholdServices, 'members'>,
  query: Readonly<{ householdId: string; memberId: string }>,
): Promise<Member | null> {
  return deps.members.find(query.householdId, query.memberId)
}
