// Makros je Knoten (A6, A8). Fehlt ein Makro auch im Richtwert der Lebensmittelart, zählt es nicht
// still als 0: Die Summe nennt, wie viele Produkte fehlen („ohne 2 Produkte“, DATENKATALOG A6).

type MacroField = 'protein' | 'carbs' | 'fat'

/** Makros in Gramm. */
export type Macros = Record<MacroField, number>

/** Makros einer Packung in Gramm. null heißt: fehlt am Produkt und im Richtwert. */
export type PackageMacros = Record<MacroField, number | null>

export interface MacroTotals extends Macros {
  /** Produkte, bei denen mindestens ein Makro fehlt. Ihre bekannten Makros zählen mit */
  productsWithoutMacros: number
}

interface MacroUnit {
  id: string
  /** Produkt der Packung; ohne Zuordnung zählt die Packung als eigenes Produkt */
  path: { product: string | null }
  macros: PackageMacros
}

const MACRO_FIELDS: readonly MacroField[] = ['protein', 'carbs', 'fat']

const hasMissingMacro = ({ macros }: MacroUnit) =>
  MACRO_FIELDS.some((field) => macros[field] === null)

function countProductsWithoutMacros(units: readonly MacroUnit[]): number {
  const products = new Set(
    units.filter(hasMissingMacro).map((unit) => unit.path.product ?? unit.id),
  )
  return products.size
}

/** Summiert die bekannten Makros und zählt die Produkte mit Lücken (jedes Produkt einmal). */
export function sumMacros(units: readonly MacroUnit[]): MacroTotals {
  const total: Macros = { protein: 0, carbs: 0, fat: 0 }
  for (const { macros } of units) {
    for (const field of MACRO_FIELDS) total[field] += macros[field] ?? 0
  }
  return { ...total, productsWithoutMacros: countProductsWithoutMacros(units) }
}
