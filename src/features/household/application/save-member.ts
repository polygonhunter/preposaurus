// Mitglied anlegen oder ändern (#38, HH-01 bis HH-04). Die Eingabe ist schon per Schema geprüft,
// hier kommt dazu, was den heutigen Tag braucht: kein Geburtsjahr in der Zukunft, bei Babys der
// Monat. Der Haushalt kommt aus der Sitzung, nie aus der Eingabe.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { findBirthProblem, toBirthDate, type BirthProblem } from '../domain/birth'
import type { MemberValues } from '../domain/member'
import type { MemberInput } from '../schemas'
import type { HouseholdServices } from './household-services'

export type SaveMemberError = { kind: 'not-found' } | { kind: 'birth'; problem: BirthProblem }

export type SaveMemberCommand = Readonly<{
  householdId: string
  /** null: neue Person */
  memberId: string | null
  input: MemberInput
}>

type SaveDeps = Pick<HouseholdServices, 'members' | 'today'>

function toValues(input: MemberInput): MemberValues {
  const { birthYear, birthMonth, ...rest } = input
  return { ...rest, birthDate: toBirthDate({ year: birthYear, month: birthMonth }, input.type) }
}

export async function saveMember(
  deps: SaveDeps,
  command: SaveMemberCommand,
): Promise<Result<{ memberId: string }, SaveMemberError>> {
  const { householdId, memberId, input } = command
  const birth = { year: input.birthYear, month: input.birthMonth }
  const problem = findBirthProblem(birth, input.type, deps.today)
  if (problem !== null) return err({ kind: 'birth', problem })
  const values = toValues(input)
  if (memberId === null) return ok({ memberId: await deps.members.create(householdId, values) })
  const isUpdated = await deps.members.update(householdId, memberId, values)
  return isUpdated ? ok({ memberId }) : err({ kind: 'not-found' })
}

export async function removeMember(
  deps: Pick<HouseholdServices, 'members'>,
  query: Readonly<{ householdId: string; memberId: string }>,
): Promise<Result<null, { kind: 'not-found' }>> {
  const isRemoved = await deps.members.remove(query.householdId, query.memberId)
  return isRemoved ? ok(null) : err({ kind: 'not-found' })
}
