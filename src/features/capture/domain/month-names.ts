// Monatsnamen, wie sie auf Packungen stehen: deutsch und englisch, ausgeschrieben oder abgekürzt.
const MONTH_NAMES: readonly (readonly string[])[] = [
  ['jan', 'januar', 'january', 'jänner'],
  ['feb', 'februar', 'february'],
  ['mär', 'mrz', 'mar', 'märz', 'march'],
  ['apr', 'april'],
  ['mai', 'may'],
  ['jun', 'juni', 'june'],
  ['jul', 'juli', 'july'],
  ['aug', 'august'],
  ['sep', 'sept', 'september'],
  ['okt', 'oct', 'oktober', 'october'],
  ['nov', 'november'],
  ['dez', 'dec', 'dezember', 'december'],
]

/** Monat 1–12 zu einem Namen oder einer Abkürzung, sonst null. */
export function monthFromName(name: string): number | null {
  const lower = name.toLowerCase()
  const index = MONTH_NAMES.findIndex((names) => names.includes(lower))
  return index === -1 ? null : index + 1
}
