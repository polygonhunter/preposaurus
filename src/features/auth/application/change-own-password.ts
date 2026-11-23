// Eigenes Passwort ändern (#75, EINSTELLUNGEN_NUTZER §3.2): altes Passwort Pflicht, neues nach
// §4.4. Falsche alte Passwörter zählen in die Anmeldebremse des Benutzernamens (§4.3), damit eine
// offene Sitzung nicht zum Durchprobieren des Passworts taugt. Ein eigener Schlüssel bräuchte eine
// Migration (CHECK auf anmelde_sperre.schluessel), und Durchprobieren ist es in beiden Fällen.
import 'server-only'
import { APIError } from 'better-auth/api'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  endOtherSessions,
  markPasswordChangedBySelf,
  readOwnProfile,
} from '../data/profile-repository'
import { findPasswordProblem, type PasswordProblem } from '../domain/password-rules'
import { minutesUntil, NAME_RULE, nameLockKey } from '../domain/sign-in-brake'
import type { ChangePasswordInput } from '../schemas'
import type { ProfileServices } from './profile-services'

export type ChangePasswordError =
  | { kind: 'wrong-password' }
  | { kind: 'weak-password'; problem: PasswordProblem }
  | { kind: 'throttled'; minutes: number }

type ChangePasswordCommand = Readonly<{
  userId: string
  headers: Headers
  input: ChangePasswordInput
}>

// Better Auth prüft das alte Passwort und speichert den neuen Hash. Die anderen Sitzungen beenden
// wir selbst: revokeOtherSessions von Better Auth ersetzt auch die aktuelle Sitzung samt Cookie, und
// das Neuladen der Seite in derselben Anfrage sähe dann noch das alte Cookie.
async function changeWithBetterAuth(deps: ProfileServices, command: ChangePasswordCommand) {
  const { currentPassword, newPassword } = command.input
  try {
    await deps.auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: false },
      headers: command.headers,
    })
    return true
  } catch (error) {
    // Falsches altes Passwort; die Länge prüft schon das Schema
    if (error instanceof APIError) return false
    throw error
  }
}

// Gezählt wird vor der Prüfung des alten Passworts, wie bei der Anmeldung. Ein Erfolg löscht den
// Zähler des Namens wieder, wie eine erfolgreiche Anmeldung.
async function changeWithBrake(
  deps: ProfileServices,
  command: ChangePasswordCommand & Readonly<{ username: string }>,
): Promise<Result<null, ChangePasswordError>> {
  const request = { key: nameLockKey(command.username), rule: NAME_RULE }
  const now = deps.now()
  const reservation = await deps.locks.reserve([request], now)
  if (reservation.blockedUntil !== null) {
    return err({ kind: 'throttled', minutes: minutesUntil(reservation.blockedUntil, now) })
  }
  if (!(await changeWithBetterAuth(deps, command))) return err({ kind: 'wrong-password' })
  await deps.locks.release([request.key], [], reservation.locksSet)
  return ok(null)
}

async function endOtherSessionsOf(deps: ProfileServices, command: ChangePasswordCommand) {
  const current = await deps.auth.api.getSession({
    headers: command.headers,
    query: { disableCookieCache: true },
  })
  await endOtherSessions(deps.db, command.userId, current?.session.id ?? null)
}

export async function changeOwnPassword(
  deps: ProfileServices,
  command: ChangePasswordCommand,
): Promise<Result<null, ChangePasswordError>> {
  const profile = await readOwnProfile(deps.db, command.userId)
  if (profile === null) return err({ kind: 'wrong-password' })
  const problem = findPasswordProblem(command.input.newPassword, {
    username: profile.username,
    displayName: profile.displayName,
    householdName: profile.householdName ?? undefined,
  })
  if (problem !== null) return err({ kind: 'weak-password', problem })
  const changed = await changeWithBrake(deps, { ...command, username: profile.username })
  if (!changed.ok) return changed
  await markPasswordChangedBySelf(deps.db, command.userId, deps.now())
  if (command.input.endOtherSessions) await endOtherSessionsOf(deps, command)
  return ok(null)
}
