// Port des Speicherns (#51). Den Port legt der Verbraucher fest (CODE_PRINZIPIEN §8). Jede
// Methode filtert auf die haushalt_id, Tests ersetzen den Port durch ein Fake.
import 'server-only'
import type {
  CaptureLookup,
  FoodTypeRef,
  NewCapture,
  NewProductRow,
  NewUnitRows,
  ProductCandidate,
} from '../domain/stock-records'

/** Lesen und Schreiben innerhalb einer Transaktion. */
export interface StockTransaction {
  findCapture: (householdId: string, captureId: string) => Promise<CaptureLookup>
  /** System-Art oder eigene Art des Haushalts, sonst null */
  findFoodType: (householdId: string, foodTypeId: string) => Promise<FoodTypeRef | null>
  hasStorageLocation: (householdId: string, storageLocationId: string) => Promise<boolean>
  hasContainer: (containerId: string) => Promise<boolean>
  hasProduct: (householdId: string, productId: string) => Promise<boolean>
  /** false: Eine parallele Anfrage hat dieselbe Erfassung gerade angelegt */
  claimCapture: (capture: NewCapture) => Promise<boolean>
  /** Gibt die neue Produkt-ID zurück */
  insertProduct: (product: NewProductRow) => Promise<string>
  insertUnits: (rows: NewUnitRows) => Promise<void>
}

export interface StockWriter {
  /** Wirft die Arbeit eine Ausnahme, bleibt nichts gespeichert. */
  transaction: <T>(work: (tx: StockTransaction) => Promise<T>) => Promise<T>
  findProductsByFoodType: (householdId: string, foodTypeId: string) => Promise<ProductCandidate[]>
}
