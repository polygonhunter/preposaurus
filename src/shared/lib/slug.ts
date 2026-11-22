// Schlüssel aus einem Namen, z. B. für eigene Lebensmittelarten: „Dinkel-Nudeln (Vollkorn)“ →
// eigen_dinkel_nudeln_vollkorn. Erlaubt sind nur a–z, 0–9 und _, wie im CHECK der DB.
const UMLAUTS: Readonly<Record<string, string>> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }
const MAX_KEY_LENGTH = 60

export const OWN_KEY_PREFIX = 'eigen_'

function slugify(text: string, maxLength: number): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (letter) => UMLAUTS[letter] ?? letter)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLength)
    .replace(/_+$/, '')
}

// Liefert null, wenn vom Namen nichts Verwertbares übrig bleibt (z. B. nur Satzzeichen).
export function toOwnKey(name: string): string | null {
  const slug = slugify(name, MAX_KEY_LENGTH - OWN_KEY_PREFIX.length)
  return slug === '' ? null : `${OWN_KEY_PREFIX}${slug}`
}
