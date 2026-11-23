// Passwort zurücksetzen durch den Admin (#123, EINSTELLUNGEN_NUTZER §3.1): neues Passwort (erzeugt
// oder eingegeben), einmal angezeigt, nur der Hash gespeichert. Alle Sitzungen des Nutzers enden,
// seine Anmeldesperre ist aufgehoben. Dieselbe Schreibstelle wie der Notfall-Befehl der
// Kommandozeile (password-reset-repository.ts), hier mit dem Admin als Urheber. Das eigene Passwort
// setzt ein anderer Admin zurück: Sonst endete die eigene Sitzung, bevor das neue Passwort zu sehen ist.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { PasswordProblem } from '../domain/password-rules'
import { nameLockKey } from '../domain/sign-in-brake'
import { choosePassword } from './choose-password'
import type { UserAdminServices } from './user-admin-services'

export type ResetUserPasswordError =
  { kind: 'not-found' } | { kind: 'self' } | { kind: 'password'; problem: PasswordProblem }

export type ResetUserPasswordCommand = Readonly<{
  householdId: string
  actorId: string
  userId: string
  /** null: Preposaurus erzeugt das Passwort */
  password: string | null
}>

export async function resetUserPassword(
  deps: UserAdminServices,
  command: ResetUserPasswordCommand,
): Promise<Result<{ username: string; password: string }, ResetUserPasswordError>> {
  if (command.userId === command.actorId) return err({ kind: 'self' })
  const user = await deps.users.find(command.householdId, command.userId)
  if (user === null) return err({ kind: 'not-found' })
  const password = choosePassword(command.password, {
    username: user.username,
    displayName: user.name,
    householdName: await deps.users.readHouseholdName(command.householdId),
    generate: deps.generatePassword,
  })
  if (!password.ok) return err({ kind: 'password', problem: password.error })
  await deps.passwords.resetPassword({
    userId: user.id,
    passwordHash: await deps.hashPassword(password.value),
    now: deps.now(),
    lockKeys: [nameLockKey(user.username)],
    changedBy: command.actorId,
  })
  return ok({ username: user.username, password: password.value })
}
