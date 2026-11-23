// Port für die gespeicherten Einträge der Nachkaufen-Liste (CODE_PRINZIPIEN §8: den Port definiert
// der Verbraucher). Jede Methode bekommt den Haushalt und filtert darauf (#133).
import 'server-only'
import type { RestockItem, RestockSource } from '../domain/restock-list'

interface NewRestockItem {
  label: string
  source: RestockSource
  /** Nur bei „nachkauf“: das Produkt der entnommenen Packung */
  productId: string | null
}

/** Produkt einer entnommenen Packung, mit dem Namen für die Liste. */
interface ConsumedProduct {
  productId: string
  label: string
}

export interface RestockRepository {
  listItems: (householdId: string) => Promise<RestockItem[]>
  addItem: (householdId: string, item: NewRestockItem) => Promise<void>
  /** false, wenn es den Eintrag im Haushalt nicht gibt */
  setDone: (
    householdId: string,
    change: Readonly<{ id: string; isDone: boolean }>,
  ) => Promise<boolean>
  /** false, wenn es den Eintrag im Haushalt nicht gibt */
  removeItem: (householdId: string, id: string) => Promise<boolean>
  /**
   * Setzt das Produkt einer Entnahme als „nachkauf“ auf die Liste, nur wenn es dort noch nicht offen
   * steht. Prüfen und Anlegen laufen in einem Schritt, damit schnelles Tippen keine Dubletten
   * erzeugt. Liefert die ID des neuen Eintrags, null, wenn das Produkt schon offen auf der Liste stand.
   */
  addProductOnce: (householdId: string, item: ConsumedProduct) => Promise<string | null>
  findConsumedProduct: (householdId: string, unitId: string) => Promise<ConsumedProduct | null>
}
