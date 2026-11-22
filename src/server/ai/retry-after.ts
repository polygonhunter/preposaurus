// Wartezeit vor der einen Wiederholung aus dem Header retry-after. Laut HTTP (RFC 9110) steht dort
// entweder eine Zahl von Sekunden oder ein HTTP-Datum. Gedeckelt, damit eine Erkennung nicht
// lange hängt. Ohne verwertbaren Wert gilt eine kurze Standardpause.
const DEFAULT_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 5_000
const MS_PER_SECOND = 1_000

function delayFromValue(value: string, nowMs: number): number | null {
  const seconds = Number(value)
  if (value.trim() !== '' && Number.isFinite(seconds)) return seconds * MS_PER_SECOND
  const date = Date.parse(value)
  return Number.isNaN(date) ? null : date - nowMs
}

export function retryDelayFromHeader(value: string | null | undefined, nowMs = Date.now()): number {
  const delay = value === null || value === undefined ? null : delayFromValue(value, nowMs)
  if (delay === null || delay <= 0) return DEFAULT_RETRY_DELAY_MS
  return Math.min(delay, MAX_RETRY_DELAY_MS)
}
