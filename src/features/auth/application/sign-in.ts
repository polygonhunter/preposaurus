// Anmelden mit Benutzername und Passwort (EINSTELLUNGEN_NUTZER §4.3). Die Bremse läuft hier vor
// Better Auth, weil dessen Rate-Limit Aufrufe über auth.api nicht begrenzt. Jeder Versuch wird
// atomar gezählt, bevor das Passwort geprüft wird, sonst kämen parallele Anfragen an der Bremse
// vorbei. Gezählt wird jeder eingegebene Name, ob es ihn gibt oder nicht. Falsches Passwort,
// unbekannter Name und deaktivierter Nutzer ergeben dieselbe Antwort.
import 'server-only'
import { APIError } from 'better-auth/api'
import type { Auth } from '@/server/auth/auth'
import { err, ok, type Result } from '@/shared/lib/result'
import type { BrakeRequest, LocksSet, SignInLockRepository } from '../data/sign-in-lock-repository'
import {
  GLOBAL_LOCK_KEY,
  GLOBAL_RULE,
  IP_RULE,
  NAME_RULE,
  ipLockKey,
  minutesUntil,
  nameLockKey,
} from '../domain/sign-in-brake'
import { usernameSchema, type SignInInput } from '../schemas'

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

// Der Name steht vorne, siehe releaseAfterSuccess. Ohne Adresse zählt ip:unbekannt für alle.
function brakeRequests(deps: SignInDeps, input: SignInInput): BrakeRequest[] {
  return [
    { key: nameLockKey(input.username), rule: NAME_RULE },
    { key: ipLockKey(deps.clientIp), rule: IP_RULE },
    { key: GLOBAL_LOCK_KEY, rule: GLOBAL_RULE },
  ]
}

// Ein Name, der nicht zum Muster passt, kann ein ins falsche Feld getipptes Passwort sein.
// Er landet deshalb nicht im Log (Sicherheits-Review #138).
const loggableUsername = (username: string) =>
  usernameSchema.safeParse(username).success ? username : '<ungültig>'

// Ein Erfolg setzt die Bremse des Namens zurück. Die übrigen Zähler bleiben, nur dieser eine
// reservierte Versuch zählt nicht als Fehlversuch.
async function releaseAfterSuccess(
  deps: SignInDeps,
  requests: readonly BrakeRequest[],
  locksSet: LocksSet,
) {
  const [name, ...shared] = requests.map((request) => request.key)
  await deps.locks.release(name === undefined ? [] : [name], shared, locksSet)
}

export async function signIn(
  deps: SignInDeps,
  input: SignInInput,
): Promise<Result<{ userId: string }, SignInError>> {
  const requests = brakeRequests(deps, input)
  const logContext = { username: loggableUsername(input.username), ip: deps.clientIp }
  const now = deps.now()
  const reservation = await deps.locks.reserve(requests, now)
  if (reservation.blockedUntil !== null) {
    deps.logWarning('Anmeldung gebremst', logContext)
    return err({ kind: 'throttled', minutes: minutesUntil(reservation.blockedUntil, now) })
  }
  const userId = await tryBetterAuth(deps, input)
  if (userId === null) {
    deps.logWarning('Anmeldung fehlgeschlagen', logContext)
    return err({ kind: 'invalid-credentials' })
  }
  await releaseAfterSuccess(deps, requests, reservation.locksSet)
  return ok({ userId })
}
