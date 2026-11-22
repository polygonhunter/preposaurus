// Ersteinrichtung (#34, ERS-01): Wer die App als Erster öffnet, wird Admin. Nutzer, Haushalt,
// Einstellungen und Ziel entstehen in einer Transaktion, ein zweiter Aufruf scheitert, auch wenn
// beide gleichzeitig kommen (Sperre im Repository). Das Passwort ist hier schon geprüft. Der
// Haushalt heißt zunächst „Unser Haushalt“, die Einrichtung fragt nicht danach (ONBOARDING §2.2).
import 'server-only'
import { DEFAULT_GOAL_DAYS, DEFAULT_HOUSEHOLD_NAME } from '@/shared/config/constants'
import { err, ok, type Result } from '@/shared/lib/result'
import type { FirstAdminRepository } from '../data/first-admin-repository'
import type { SetupInput } from '../schemas'

export interface SetupError {
  kind: 'already-set-up'
}

export type SetupDeps = Readonly<{
  repository: FirstAdminRepository
  hashPassword: (password: string) => Promise<string>
}>

export async function setupFirstAdmin(
  deps: SetupDeps,
  input: SetupInput,
): Promise<Result<null, SetupError>> {
  // Vorab, damit ein später Aufruf keinen teuren Hash rechnet. Maßgeblich ist die Transaktion.
  if (await deps.repository.hasAnyUser()) return err({ kind: 'already-set-up' })
  const isCreated = await deps.repository.createFirstAdmin({
    displayName: input.displayName,
    username: input.username,
    passwordHash: await deps.hashPassword(input.password),
    householdName: DEFAULT_HOUSEHOLD_NAME,
    goalDays: DEFAULT_GOAL_DAYS,
  })
  return isCreated ? ok(null) : err({ kind: 'already-set-up' })
}
