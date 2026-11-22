// Anmeldebremse (EINSTELLUNGEN_NUTZER §4.3), als reine Funktionen über einen Zählerstand.
// Je Benutzername: ab 5 Fehlversuchen in Folge 1 Minute, danach doppelt je Fehlversuch, höchstens
// 15 Minuten. Keine Dauersperre, sonst könnte jemand den Admin aussperren.
// Je Adresse: höchstens 20 Fehlversuche in 10 Minuten über alle Namen.

export type LockState = Readonly<{
  failedAttempts: number
  lastFailedAt: Date | null
  lockedUntil: Date | null
}>

const MINUTE_MS = 60_000
const NAME_THRESHOLD = 5
const NAME_BASE_MS = MINUTE_MS
const NAME_MAX_MS = 15 * MINUTE_MS
const IP_MAX_FAILURES = 20
const IP_WINDOW_MS = 10 * MINUTE_MS

export const nameLockKey = (username: string) => `name:${username}`
export const ipLockKey = (ip: string) => `ip:${ip}`

export function nameLockDurationMs(failedAttempts: number): number {
  if (failedAttempts < NAME_THRESHOLD) return 0
  return Math.min(NAME_BASE_MS * 2 ** (failedAttempts - NAME_THRESHOLD), NAME_MAX_MS)
}

const lockUntil = (now: Date, durationMs: number) =>
  durationMs > 0 ? new Date(now.getTime() + durationMs) : null

export function registerNameFailure(state: LockState | null, now: Date): LockState {
  const failedAttempts = (state?.failedAttempts ?? 0) + 1
  return {
    failedAttempts,
    lastFailedAt: now,
    lockedUntil: lockUntil(now, nameLockDurationMs(failedAttempts)),
  }
}

// Fenster ab dem letzten Fehlversuch: Wer 10 Minuten Ruhe gibt, fängt wieder bei 1 an.
function isWithinIpWindow(state: LockState | null, now: Date): state is LockState {
  if (!state?.lastFailedAt) return false
  return now.getTime() - state.lastFailedAt.getTime() < IP_WINDOW_MS
}

export function registerIpFailure(state: LockState | null, now: Date): LockState {
  const failedAttempts = isWithinIpWindow(state, now) ? state.failedAttempts + 1 : 1
  return {
    failedAttempts,
    lastFailedAt: now,
    lockedUntil: lockUntil(now, failedAttempts >= IP_MAX_FAILURES ? IP_WINDOW_MS : 0),
  }
}

/** Ganze Minuten bis zum Ende der längsten laufenden Sperre, 0 ohne Sperre. */
export function remainingLockMinutes(states: readonly (LockState | null)[], now: Date): number {
  const remainingMs = Math.max(
    0,
    ...states.map((state) => (state?.lockedUntil?.getTime() ?? 0) - now.getTime()),
  )
  return Math.ceil(remainingMs / MINUTE_MS)
}
