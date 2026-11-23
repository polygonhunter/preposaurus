// Use-Case Verlauf einer Lebensmittelart (#48, ROT-07, UX-Konzept §8.4 Punkt 7): zuletzt
// verbraucht, entsorgt und „Noch gut“ geprüft, mit Tag und Person. Steht als Abschnitt auf der
// Detailseite, auch wenn nichts mehr im Vorrat ist.
import 'server-only'
import { historyEventsOf, type UnitHistoryRow } from '../domain/unit-history'
import type { HistoryEntry, StockTarget } from '../schemas'
import type { StockReader } from './stock-reader'
import { productFilterFor } from './stock-model'

// Genug für „zuletzt“; die ganze Historie gehört in den Export bzw. den späteren Verlauf (D7)
const HISTORY_LIMIT = 10

/** Port: Packungen mit Entnahme oder Prüfung, neueste zuerst. */
export interface HistoryReader {
  loadUnitHistory: (
    householdId: string,
    query: Readonly<{ productIds: readonly string[]; limit: number }>,
  ) => Promise<UnitHistoryRow[]>
}

interface Ports {
  reader: Pick<StockReader, 'loadProducts'>
  history: HistoryReader
}

export async function getFoodTypeHistory(
  { reader, history }: Ports,
  { householdId, target }: Readonly<{ householdId: string; target: StockTarget }>,
): Promise<HistoryEntry[]> {
  const products = await reader.loadProducts(householdId, productFilterFor(target))
  const productIds = products.map((product) => product.id)
  // Eine Packung ergibt höchstens zwei Einträge (geprüft, später entnommen)
  const rows = await history.loadUnitHistory(householdId, { productIds, limit: HISTORY_LIMIT })
  return historyEventsOf(rows, HISTORY_LIMIT)
}
