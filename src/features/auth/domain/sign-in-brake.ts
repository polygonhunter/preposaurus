// Anmeldebremse (EINSTELLUNGEN_NUTZER §4.3) als reine Regeln. Jeder Versuch wird vor der
// Passwortprüfung gezählt (reserviert). Erreicht der neue Stand eine Grenze, gilt die Sperre ab
// sofort, damit parallele Anfragen nicht an ihr vorbeikommen. Ein Erfolg nimmt die Zählung zurück.
// Je Benutzername: ab 5 Versuchen in Folge 1 Minute, danach doppelt je Versuch, höchstens
// 15 Minuten. Keine Dauersperre, sonst könnte jemand den Admin aussperren.
// Je Adresse: höchstens 20 Versuche in 10 Minuten über alle Namen. Ohne erkennbare Adresse teilen
// sich alle Geräte einen Zähler (ip:unbekannt).
// Global: höchstens 100 Versuche in 10 Minuten über alle Namen und Adressen, danach 1 Minute Pause
// für alle. X-Forwarded-For ist bei direktem Zugriff auf den App-Port fälschbar, wechselnde
// Adressen helfen damit trotzdem nicht weiter (Sicherheits-Review #138).

export interface BrakeRule {
  /** Zählfenster ab dem letzten Versuch, null = zählt, bis ein Erfolg zurücksetzt */
  readonly windowMs: number | null
  /** Sperrdauer, die der Versuch mit dieser Nummer auslöst, 0 = keine */
  readonly lockMsAfter: (attempts: number) => number
}

const MINUTE_MS = 60_000
const NAME_THRESHOLD = 5
const NAME_MAX_MS = 15 * MINUTE_MS
const IP_MAX_ATTEMPTS = 20
const IP_WINDOW_MS = 10 * MINUTE_MS
const GLOBAL_MAX_ATTEMPTS = 100
const GLOBAL_LOCK_MS = MINUTE_MS
const UNKNOWN_IP = 'unbekannt'

function nameLockDurationMs(attempts: number): number {
  if (attempts < NAME_THRESHOLD) return 0
  return Math.min(MINUTE_MS * 2 ** (attempts - NAME_THRESHOLD), NAME_MAX_MS)
}

export const NAME_RULE: BrakeRule = { windowMs: null, lockMsAfter: nameLockDurationMs }

export const IP_RULE: BrakeRule = {
  windowMs: IP_WINDOW_MS,
  lockMsAfter: (attempts) => (attempts >= IP_MAX_ATTEMPTS ? IP_WINDOW_MS : 0),
}

export const GLOBAL_RULE: BrakeRule = {
  windowMs: IP_WINDOW_MS,
  lockMsAfter: (attempts) => (attempts >= GLOBAL_MAX_ATTEMPTS ? GLOBAL_LOCK_MS : 0),
}

export const GLOBAL_LOCK_KEY = 'global'
export const nameLockKey = (username: string) => `name:${username}`
export const IP_LOCK_PREFIX = 'ip:'
export const ipLockKey = (ip: string | null) => `${IP_LOCK_PREFIX}${ip ?? UNKNOWN_IP}`

/** Ganze Minuten bis zum Ende einer Sperre, mindestens 1. */
export function minutesUntil(lockedUntil: Date, now: Date): number {
  return Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / MINUTE_MS))
}
