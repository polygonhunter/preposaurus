// Anmelden mit Benutzername und Passwort (EINSTELLUNGEN_NUTZER §4.3). Die Bremse läuft hier vor
// Better Auth, weil dessen Rate-Limit Aufrufe über auth.api nicht begrenzt. Gezählt wird jeder
// eingegebene Name, ob es ihn gibt oder nicht. Falsches Passwort, unbekannter Name und
// deaktivierter Nutzer ergeben dieselbe Antwort.
import 'server-only'
import { APIError } from 'better-auth/api'
import type { Auth } from '@/server/auth/auth'
import { err, ok, type Result } from '@/shared/lib/result'
import type { SignInLockRepository } from '../data/sign-in-lock-repository'
import {
  ipLockKey,
  nameLockKey,
  registerIpFailure,
  registerNameFailure,
  remainingLockMinutes,
} from '../domain/sign-in-brake'
import type { SignInInput } from '../schemas'

export type SignInError = { kind: 'invalid-credentials' } | { kind: 'throttled'; minutes: number }

type SignInLog = (message: string, context: Readonly<Record<string, unknown>>) => void

export type SignInDeps = Readonly<{
  auth: Auth
  locks: SignInLockRepository
  headers: Headers
  clientIp: string | null
  now: () => Date
  logWarning: SignInLog
}>

async function tryBetterAuth(deps: SignInDeps, input: SignInInput): Promise<string | null> {
  try {
    const { user } = await deps.auth.api.signInUsername({ body: input, headers: deps.headers })
    return user.id
  } catch (error) {
    // Falsches Passwort, unbekannter Name, ungültiges Format, keine Sitzung (deaktiviert)
    if (error instanceof APIError) return null
    throw error
  }
}

async function recordFailure(deps: SignInDeps, nameKey: string, ipKey: string | null) {
  const now = deps.now()
  const states = await deps.locks.findByKeys(ipKey === null ? [nameKey] : [nameKey, ipKey])
  await deps.locks.save(nameKey, registerNameFailure(states.get(nameKey) ?? null, now))
  if (ipKey !== null)
    await deps.locks.save(ipKey, registerIpFailure(states.get(ipKey) ?? null, now))
}

async function lockedMinutes(deps: SignInDeps, keys: readonly string[]): Promise<number> {
  const states = await deps.locks.findByKeys(keys)
  return remainingLockMinutes(
    keys.map((key) => states.get(key) ?? null),
    deps.now(),
  )
}

export async function signIn(
  deps: SignInDeps,
  input: SignInInput,
): Promise<Result<{ userId: string }, SignInError>> {
  const nameKey = nameLockKey(input.username)
  const ipKey = deps.clientIp === null ? null : ipLockKey(deps.clientIp)
  const logContext = { username: input.username, ip: deps.clientIp }
  const minutes = await lockedMinutes(deps, ipKey === null ? [nameKey] : [nameKey, ipKey])
  if (minutes > 0) {
    deps.logWarning('Anmeldung gebremst', logContext)
    return err({ kind: 'throttled', minutes })
  }
  const userId = await tryBetterAuth(deps, input)
  if (userId === null) {
    await recordFailure(deps, nameKey, ipKey)
    deps.logWarning('Anmeldung fehlgeschlagen', logContext)
    return err({ kind: 'invalid-credentials' })
  }
  // Erfolg setzt nur die Bremse des Namens zurück. Die Adresse bleibt gezählt.
  await deps.locks.remove(nameKey)
  return ok({ userId })
}
