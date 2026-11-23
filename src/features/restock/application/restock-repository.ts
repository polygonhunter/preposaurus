// Port für die gespeicherten Einträge der Nachkaufen-Liste (CODE_PRINZIPIEN §8: den Port definiert
// der Verbraucher). Jede Methode bekommt den Haushalt und filtert darauf (#133).
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import type { GroupFoodType } from '../domain/gap-examples'
import type { ReplacementUnit } from '../domain/replacement-candidates'
import type { RestockItem, RestockSource } from '../domain/restock-list'

interface NewRestockItem {
  label: string
  source: RestockSource
  /** Nur bei „nachkauf“: das Produkt der entnommenen Packung */
  productId: string | null
}

/** Ein Eintrag, wie er vor dem Entfernen gespeichert war; „Rückgängig“ legt ihn so wieder an. */
export interface StoredRestockItem extends NewRestockItem {
  id: string
  isDone: boolean
  createdAt: Date
}

/** Produkt für die Liste, mit dem Namen der Lebensmittelart (ohne Art dem Produktnamen). */
interface ListableProduct {
  productId: string
  label: string
}

export interface RestockRepository {
  listItems: (householdId: string) => Promise<RestockItem[]>
  /** Die eine Zählung offener Einträge für Übersicht und Wochenübersicht (#202) */
  countOpenItems: (householdId: string) => Promise<number>
  addItem: (householdId: string, item: NewRestockItem) => Promise<void>
  /** false, wenn es den Eintrag im Haushalt nicht gibt */
  setDone: (
    householdId: string,
    change: Readonly<{ id: string; isDone: boolean }>,
  ) => Promise<boolean>
  /** Der entfernte Eintrag, null, wenn es ihn im Haushalt nicht gibt */
  removeItem: (householdId: string, id: string) => Promise<StoredRestockItem | null>
  /**
   * Legt einen eben entfernten Eintrag wieder an. Ein Produkt eines anderen Haushalts (oder ein
   * inzwischen gelöschtes) wird nicht übernommen. Gibt es die ID schon, bleibt alles, wie es ist.
   */
  restoreItem: (householdId: string, item: StoredRestockItem) => Promise<void>
  /**
   * Setzt ein Produkt als „nachkauf“ auf die Liste, nur wenn es dort noch nicht offen steht.
   * Prüfen und Anlegen laufen in einem Schritt, damit schnelles Tippen keine Dubletten erzeugt.
   * Liefert die ID des neuen Eintrags, null, wenn das Produkt schon offen auf der Liste stand.
   */
  addProductOnce: (householdId: string, item: ListableProduct) => Promise<string | null>
  findConsumedProduct: (householdId: string, unitId: string) => Promise<ListableProduct | null>
  findProduct: (householdId: string, productId: string) => Promise<ListableProduct | null>
  /** Packungen im Vorrat und seit `consumedSince` verbrauchte, Grundlage für „Ersetzen“ (A14) */
  listReplacementUnits: (
    householdId: string,
    consumedSince: CalendarDay,
  ) => Promise<ReplacementUnit[]>
  /** Lebensmittelarten, die der Haushalt nutzen kann, für die Beispiele an den Lücken */
  listGroupFoodTypes: (householdId: string) => Promise<GroupFoodType[]>
}
