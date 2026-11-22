// Port der Lesepfade (CODE_PRINZIPIEN §8: den Port definiert der Verbraucher). Umgesetzt von
// `createStockReadRepository` in inventory/data, in Tests von einem Fake. Jede Methode nimmt die
// haushalt_id: Wer liest, kommt nie an Daten eines anderen Haushalts (#133).
import 'server-only'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import type {
  FilterOptions,
  ProductFilter,
  ReadSettings,
  StockGroup,
  StockProduct,
  StockProductUnit,
  UnitQuery,
} from '../domain/stock-entry'
import type { UnitStatus } from '../domain/unit'

export interface StockReader {
  loadSettings: (householdId: string) => Promise<ReadSettings>
  loadSupplyBasis: (householdId: string) => Promise<SupplyBasis>
  loadGroups: () => Promise<StockGroup[]>
  loadFilterOptions: (householdId: string) => Promise<FilterOptions>
  loadProducts: (householdId: string, filter: ProductFilter) => Promise<StockProduct[]>
  loadUnits: (householdId: string, query: UnitQuery) => Promise<StockProductUnit[]>
  countUnitsByStatus: (
    householdId: string,
    productIds: readonly string[],
  ) => Promise<Record<UnitStatus, number>>
}
