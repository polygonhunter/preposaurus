// Vergleichbarer Suchtext für alle Suchen der App (Erfassen #212, Stammdaten #126).

/** Kleinschreibung ohne Akzente, ß als ss, ae/oe/ue wie ä/ö/ü. „Knaecke“ und „Knäcke“ sind gleich. */
export function normalizeSearchText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/([aou])e/g, '$1')
}
