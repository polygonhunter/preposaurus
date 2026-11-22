import type { BestBefore, StockUnit } from './unit'

type FifoCandidate = Pick<StockUnit, 'status' | 'bestBefore'>

const isEarlier = (candidate: BestBefore | null, current: BestBefore | null) => {
  if (candidate === null) return false
  return current === null || candidate.date < current.date
}

/**
 * „1 entnehmen“ schlägt die Packung mit dem frühesten MHD im Vorrat vor, damit nichts hinten im
 * Regal abläuft. Bei gleichem Datum gewinnt die zuerst genannte Einheit. Geschätzte Daten zählen
 * wie erkannte, sie sind ja markiert. Packungen ohne Datum kommen zuletzt dran: Bei ihnen weiß
 * niemand, ob sie früher ablaufen, und eine Packung mit bekanntem nahem Datum soll nicht liegen
 * bleiben (#116).
 */
export function pickFifoUnit<T extends FifoCandidate>(units: readonly T[]): T | null {
  let earliest: T | null = null
  for (const unit of units) {
    if (unit.status !== 'stock') continue
    if (earliest === null || isEarlier(unit.bestBefore, earliest.bestBefore)) earliest = unit
  }
  return earliest
}
