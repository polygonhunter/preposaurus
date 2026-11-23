// Notfall „Admin hat sein Passwort vergessen“ (EINSTELLUNGEN_NUTZER §3.4): Die Kommandozeile im
// Container erzeugt ein neues, vorläufiges Passwort und gibt es einmal aus. Es ist nie ein Argument,
// weil Argumente im Shell-Verlauf und in der Prozessliste landen. Aufgehoben werden die Sperre des
// Namens, die Pause für alle (global) und alle Adress-Sperren, sonst hinge der Admin trotz neuem
// Passwort in einer laufenden Sperre fest (Review #138).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { PasswordResetRepository } from '../data/password-reset-repository'
import { GLOBAL_LOCK_KEY, IP_LOCK_PREFIX, nameLockKey } from '../domain/sign-in-brake'
import { usernameSchema } from '../schemas'

export type ResetPasswordError = { kind: 'invalid-username' } | { kind: 'not-found' }

export type ResetPasswordDeps = Readonly<{
  repository: PasswordResetRepository
  hashPassword: (password: string) => Promise<string>
  generatePassword: () => string
  now: () => Date
}>

/** Das neue Passwort und ob der Nutzer überhaupt aktiv ist (sonst hilft es allein nicht). */
export type ResetPasswordOutcome = Readonly<{
  username: string
  password: string
  isActive: boolean
}>

export async function resetPasswordFromCli(
  deps: ResetPasswordDeps,
  rawUsername: string,
): Promise<Result<ResetPasswordOutcome, ResetPasswordError>> {
  const parsed = usernameSchema.safeParse(rawUsername)
  if (!parsed.success) return err({ kind: 'invalid-username' })
  const username = parsed.data
  const user = await deps.repository.findUserByUsername(username)
  if (user === null) return err({ kind: 'not-found' })
  const password = deps.generatePassword()
  await deps.repository.resetPassword({
    userId: user.id,
    passwordHash: await deps.hashPassword(password),
    now: deps.now(),
    lockKeys: [nameLockKey(username), GLOBAL_LOCK_KEY],
    lockKeyPrefix: IP_LOCK_PREFIX,
    changedBy: null,
  })
  return ok({ username, password, isActive: user.isActive })
}
