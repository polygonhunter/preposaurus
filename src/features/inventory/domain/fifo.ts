import type { StockUnit } from './unit'

type FifoCandidate = Pick<StockUnit, 'status' | 'bestBefore'>

/**
 * „1 entnehmen“ schlägt die Packung mit dem frühesten MHD im Vorrat vor, damit nichts hinten im
 * Regal abläuft. Bei gleichem Datum gewinnt die zuerst genannte Einheit. Geschätzte Daten zählen
 * wie erkannte, sie sind ja markiert.
 */
export function pickFifoUnit<T extends FifoCandidate>(units: readonly T[]): T | null {
  let earliest: T | null = null
  for (const unit of units) {
    if (unit.status !== 'stock') continue
    if (earliest === null || unit.bestBefore.date < earliest.bestBefore.date) earliest = unit
  }
  return earliest
}
