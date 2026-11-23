// Mein Konto (#75, #89): Anzeigename und Adresse für Erinnerungen ändern, eigenes Passwort ändern,
// Check-in-Mail wählen. Jeder Nutzer ändert nur sich selbst, die ID kommt aus der Sitzung.
import 'server-only'
import { APIError } from 'better-auth/api'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  endOtherSessions,
  markPasswordChangedBySelf,
  readOwnProfile,
  saveCheckIn,
  saveOwnProfile,
} from '../data/profile-repository'
import { findPasswordProblem, type PasswordProblem } from '../domain/password-rules'
import type { ProfileView } from '../domain/profile'
import type { ChangePasswordInput, CheckInChoice, ProfileInput } from '../schemas'
import type { ProfileServices } from './profile-services'

export async function getOwnProfile(
  deps: ProfileServices,
  userId: string,
): Promise<ProfileView | null> {
  const profile = await readOwnProfile(deps.db, userId)
  return profile === null ? null : { ...profile, isMailConfigured: deps.isMailConfigured }
}

export async function updateOwnProfile(
  deps: Pick<ProfileServices, 'db'>,
  command: Readonly<{ userId: string; input: ProfileInput }>,
): Promise<void> {
  await saveOwnProfile(deps.db, command.userId, command.input)
}

export type ChangePasswordError =
  { kind: 'wrong-password' } | { kind: 'weak-password'; problem: PasswordProblem }

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
  if (!(await changeWithBetterAuth(deps, command))) return err({ kind: 'wrong-password' })
  await markPasswordChangedBySelf(deps.db, command.userId, deps.now())
  if (command.input.endOtherSessions) await endOtherSessionsOf(deps, command)
  return ok(null)
}

export interface CheckInError {
  kind: 'mail-unavailable'
}

/** Die Check-in-Mail lässt sich nur mit Mailversand und eigener Adresse einschalten (#89). */
export async function saveOwnCheckIn(
  deps: ProfileServices,
  command: Readonly<{ userId: string; choice: CheckInChoice }>,
): Promise<Result<null, CheckInError>> {
  const cadence = command.choice === 'aus' ? null : command.choice
  if (cadence !== null) {
    const profile = await readOwnProfile(deps.db, command.userId)
    if (!deps.isMailConfigured || (profile?.reminderEmail ?? null) === null) {
      return err({ kind: 'mail-unavailable' })
    }
  }
  await saveCheckIn(deps.db, command.userId, cadence)
  return ok(null)
}
