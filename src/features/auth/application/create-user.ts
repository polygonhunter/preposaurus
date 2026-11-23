// Nutzer anlegen durch den Admin (#123, EINSTELLUNGEN_NUTZER §3.1): Anzeigename, Benutzername,
// Rolle, optional eine Person. Das Passwort erzeugt die App, der Admin darf eins eingeben. Es geht
// genau einmal an die Action zurück, gespeichert wird nur der Hash. Der Nutzer gilt als „vorläufiges
// Passwort“, bis er es selbst ändert.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { PasswordProblem } from '../domain/password-rules'
import type { CreateUserInput } from '../schemas'
import { choosePassword } from './choose-password'
import type { UserAdminServices } from './user-admin-services'

export type CreateUserError =
  | { kind: 'username-taken' }
  | { kind: 'member-not-found' }
  | { kind: 'password'; problem: PasswordProblem }

export type CreatedUser = Readonly<{ userId: string; username: string; password: string }>

export type CreateUserCommand = Readonly<{
  householdId: string
  actorId: string
  input: CreateUserInput
}>

export async function createUser(
  deps: UserAdminServices,
  { householdId, actorId, input }: CreateUserCommand,
): Promise<Result<CreatedUser, CreateUserError>> {
  const { memberId } = input
  if (memberId !== null && !(await deps.users.isMemberInHousehold(householdId, memberId))) {
    return err({ kind: 'member-not-found' })
  }
  const password = choosePassword(input.password, {
    username: input.username,
    displayName: input.displayName,
    householdName: await deps.users.readHouseholdName(householdId),
    generate: deps.generatePassword,
  })
  if (!password.ok) return err({ kind: 'password', problem: password.error })
  const userId = await deps.users.create({
    householdId,
    name: input.displayName,
    username: input.username,
    role: input.role,
    memberId,
    passwordHash: await deps.hashPassword(password.value),
    createdBy: actorId,
    now: deps.now(),
  })
  if (userId === null) return err({ kind: 'username-taken' })
  return ok({ userId, username: input.username, password: password.value })
}
