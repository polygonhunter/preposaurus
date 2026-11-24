// Zellen und Gruppen der Vorrat-Tabelle ab „weit“ (DESIGN_SYSTEM §6, M12-04) und die Auswahl der
// Liste neben dem Detail (M12-03). Rein, damit Tabelle und Liste gleich sprechen und es Tests gibt.
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { NamedDays } from '@/shared/lib/supply-terms'
import type { StockRowDto, StockTarget } from '../schemas/shared'
import type { FoodTypeLevel } from '../schemas/stock'
import { countsAsWater, formatAmounts, namedSupplyDays, nextDateLabel } from './stock-format'

/** Platzhalter für leere Zellen, Screenreader lesen „Strich“ statt nichts */
const EMPTY_CELL = '–'

export type TableGroup = Readonly<{ key: string; shortName: string; rows: readonly StockRowDto[] }>

export type TableCells = Readonly<{
  packages: string
  // Zusatz unter der Zahl: „+1 abgelaufen“ (Anzahl und Menge zählen nur, was heute zählt, #208)
  expiredNote: string | null
  amount: string
  kcal: string
  // Spalte „Satt für“: nur der Wert („4,1 Tage“), bei Wasser mit eigenem Namen darüber (#209)
  days: string | NamedDays
  nextDate: string | null
}>

/**
 * Je Warengruppe eine Zwischenzeile, darunter ihre Zeilen ohne Kategorien. Leere Gruppen bleiben
 * stehen, denn die Lücke ist eine Information (wie auf Ebene 1).
 */
export function tableGroupsOf(levels: readonly FoodTypeLevel[]): TableGroup[] {
  return levels.map(({ group, categories }) => ({
    key: group.key,
    shortName: group.shortName,
    rows: categories.flatMap((category) => category.rows),
  }))
}

/** Dieselbe Lebensmittelart bzw. dasselbe Produkt ohne Art */
export function isSameTarget(a: StockTarget, b: StockTarget | null): boolean {
  return b !== null && a.kind === b.kind && a.id === b.id
}

function expiredNoteOf({ uncountedPackages }: StockRowDto['totals']): string | null {
  return uncountedPackages > 0 ? `+${formatGermanNumber(uncountedPackages)} abgelaufen` : null
}

function kcalCell({ kcal, isApproximate }: StockRowDto['totals']): string {
  if (kcal === 0) return EMPTY_CELL
  const value = formatGermanNumber(Math.round(kcal))
  return isApproximate ? `ca. ${value}` : value
}

/**
 * Spalte „Satt für“ (#209): „4,1 Tage“. Wasser hat keine kcal und nennt sich selbst („Wasser für“
 * klein über „3,2 Tage“), damit unter „Satt für“ keine Wasser-Tage ohne Namen stehen und die
 * Spalte schmal bleibt.
 */
function daysCell(totals: StockRowDto['totals']): string | NamedDays {
  const days = namedSupplyDays(totals)
  if (days === null) return EMPTY_CELL
  return countsAsWater(totals) ? days : days.value
}

/** Werte einer Zeile; die Einheit kcal und der Name der Tage stehen im Spaltenkopf. */
export function tableCells(row: StockRowDto): TableCells {
  const { totals } = row
  return {
    packages: formatGermanNumber(totals.packages),
    expiredNote: expiredNoteOf(totals),
    amount: formatAmounts(totals.amounts) ?? EMPTY_CELL,
    kcal: kcalCell(totals),
    days: daysCell(totals),
    nextDate: nextDateLabel(row.state, totals.nextBestBefore),
  }
}
