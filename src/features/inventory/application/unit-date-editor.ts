// Port für „Datum ändern“ und „Datum nachtragen“ (#49, #116). Umgesetzt von
// `createUnitDateRepository` in inventory/data, in Tests von einem Fake. Jede Methode nimmt die
// haushalt_id: Eine fremde oder unbekannte Packung ist „nicht gefunden“ (#133).
import 'server-only'
import type { StockUnit } from '../domain/unit'

/** Eine Packung im Vorrat samt Produkt und allen Packungen dieses Produkts im Vorrat. */
export interface UnitDateSource {
  product: {
    id: string
    name: string
    foodType: { id: string; name: string } | null
  }
  /** Alle Packungen des Produkts im Vorrat, die gesuchte eingeschlossen */
  stockUnits: StockUnit[]
}

export interface UnitDateEditor {
  /** null: Die Packung gibt es im Haushalt nicht oder sie ist nicht mehr im Vorrat. */
  loadSource: (householdId: string, unitId: string) => Promise<UnitDateSource | null>
  /** Nur Packungen des Haushalts, die noch im Vorrat sind. */
  loadStockUnits: (householdId: string, unitIds: readonly string[]) => Promise<StockUnit[]>
  /** Schreibt MHD und „Noch gut“, bedingt auf Haushalt und Vorrat. Liefert die Anzahl. */
  saveDates: (householdId: string, units: readonly StockUnit[]) => Promise<number>
}
