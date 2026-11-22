// Lese-Repository des Vorrats (#43). Jede Methode nimmt die haushalt_id und filtert darauf (#133).
// Die Use-Cases kennen nur den Port `StockReader`, Tests ersetzen ihn durch ein Fake.
import 'server-only'
import type { ProductFilter, UnitQuery } from '@/features/inventory/domain/stock-entry'
import type { Database } from '@/server/db/connection'
import {
  loadFilterOptions,
  loadGroups,
  loadSettings,
  loadSupplyBasis,
} from './household-read-query'
import { loadProducts } from './stock-products-query'
import { countUnitsByStatus, loadUnits } from './stock-units-query'

export function createStockReadRepository(db: Database) {
  return {
    loadSettings: (householdId: string) => loadSettings(db, householdId),
    loadSupplyBasis: (householdId: string) => loadSupplyBasis(db, householdId),
    loadGroups: () => loadGroups(db),
    loadFilterOptions: (householdId: string) => loadFilterOptions(db, householdId),
    loadProducts: (householdId: string, filter: ProductFilter) =>
      loadProducts(db, householdId, filter),
    loadUnits: (householdId: string, query: UnitQuery) => loadUnits(db, householdId, query),
    countUnitsByStatus: (householdId: string, productIds: readonly string[]) =>
      countUnitsByStatus(db, householdId, productIds),
  }
}
