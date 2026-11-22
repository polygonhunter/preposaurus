// Gemeinsame Prüfung für Vorrat und Versorgung. Sie steht hier, weil Fachlogik verschiedener
// Features untereinander nur Typen teilen darf (CODE_PRINZIPIEN §2). Der Typ ist deshalb
// strukturell und passt auf `StockUnit` und alle Ausschnitte davon.

interface StatusWithBestBefore {
  status: string
  /** null heißt „Datum fehlt“ */
  bestBefore: object | null
}

/** Eine Packung, die noch im Vorrat liegt und kein Datum hat („Datum fehlt“, #116). */
export function isInStockWithoutDate(unit: StatusWithBestBefore): boolean {
  return unit.status === 'stock' && unit.bestBefore === null
}
