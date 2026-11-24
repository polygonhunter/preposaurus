// Zellen und Gruppen der Vorrat-Tabelle ab „weit“ (DESIGN_SYSTEM §6, M12-04) und die Auswahl der
// Liste neben dem Detail (M12-03). Rein, damit Tabelle und Liste gleich sprechen und es Tests gibt.
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { StockRowDto, StockTarget } from '../schemas/shared'
import type { FoodTypeLevel } from '../schemas/stock'
import { formatAmounts, nextDateLabel, supplyDaysOf } from './stock-format'

/** Platzhalter für leere Zellen, Screenreader lesen „Strich“ statt nichts */
const EMPTY_CELL = '–'

export type TableGroup = Readonly<{ key: string; shortName: string; rows: readonly StockRowDto[] }>

export type TableCells = Readonly<{
  packages: string
  // Zusatz unter der Zahl: „+1 abgelaufen“ (Anzahl und Menge zählen nur, was heute zählt, #208)
  expiredNote: string | null
  amount: string
  kcal: string
  days: string
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

function daysCell(totals: StockRowDto['totals']): string {
  const days = supplyDaysOf(totals)
  return days === null ? EMPTY_CELL : formatGermanNumber(Math.round(days * 10) / 10)
}

/** Werte einer Zeile; die Einheiten (kcal, Tage) stehen im Spaltenkopf. */
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
