// Einstieg für die Seiten mit Liste daneben (M12-03, M12-04): echte Repositories, Stichtag in Berlin.
import 'server-only'
import type { StockTree } from '../schemas'
import { getStockTree } from './get-stock-tree'
import { stockServices } from './stock-services'

export async function loadStockTree(householdId: string): Promise<StockTree> {
  const { reader, today } = await stockServices()
  return getStockTree(reader, { householdId, today })
}
