// Schlüssel einer eigenen Lebensmittelart (#110, #126): eigen_ plus Name, je Haushalt eindeutig.
// Er bleibt beim Umbenennen gleich, weil die KI Arten über den Schlüssel vorschlägt.
import { OWN_KEY_PREFIX, toOwnKey } from '@/shared/lib/slug'

const MAX_KEY_LENGTH = 60
const FALLBACK_KEY = `${OWN_KEY_PREFIX}art`

/** Freier Schlüssel für den Namen; bei Gleichstand mit Zähler (eigen_nudeln_2). */
export function uniqueOwnKey(name: string, takenKeys: ReadonlySet<string>): string {
  const base = toOwnKey(name) ?? FALLBACK_KEY
  if (!takenKeys.has(base)) return base
  for (let counter = 2; ; counter += 1) {
    const suffix = `_${String(counter)}`
    const candidate = `${base.slice(0, MAX_KEY_LENGTH - suffix.length)}${suffix}`
    if (!takenKeys.has(candidate)) return candidate
  }
}
