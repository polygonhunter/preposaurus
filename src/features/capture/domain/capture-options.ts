// Auswahllisten des Erfassens (#52): Lebensmittelarten mit abgeleitetem Pfad, Behälter, Lagerorte
// und die vorhandenen Produkte fürs Wiedererkennen (#207). Dazu die Vorbelegung aus der letzten
// Erfassung des Nutzers (UX §1: Lagerort „zuletzt genutzt“, Lebensmittelarten „Zuletzt genutzt“)
// und ob der Vorrat noch leer ist (erster Start).
import type { ProductIdentity } from './product-match'

/** Lebensmittelart mit Pfad. Kategorie und Warengruppe werden nur angezeigt, nie gewählt (#110). */
export interface FoodTypeChoice {
  id: string
  /** Schlüssel, unter dem die KI eine Art vorschlägt (#110) */
  key: string
  name: string
  categoryName: string
  productGroupName: string
  /** Richtwert je 100 g bzw. ml, gilt ohne eigene Nährwerte als „ca.“ (E-5) */
  kcalPer100: number | null
  /** Eigene Suchwörter (nur eigene Arten, #126) */
  searchTerms: string[]
}

export interface NamedChoice {
  id: string
  name: string
}

/** Behälter mit Schlüssel, unter dem die KI ihn vorschlägt (Schema A) */
export interface ContainerChoice extends NamedChoice {
  key: string
}

/**
 * Vorhandenes Produkt des Haushalts fürs Wiedererkennen (UX §1, #207). Die Liste kommt mit den
 * Optionen, damit das Angebot schon im selben Tipp wie die Wahl der Art steht (Fokus, F2).
 */
export interface KnownProduct extends ProductIdentity {
  id: string
  name: string
  containerName: string | null
  storageLocationName: string | null
}

export interface CaptureOptions {
  foodTypes: FoodTypeChoice[]
  containers: ContainerChoice[]
  storageLocations: NamedChoice[]
  /** Eigene Produkte mit Lebensmittelart, auch ohne Packung im Vorrat (Nachschub) */
  knownProducts: KnownProduct[]
  /** Lagerort der letzten Erfassung des Nutzers, nur wenn er noch auswählbar ist */
  lastStorageLocationId: string | null
  /** Zuletzt erfasste Arten des Nutzers, neueste zuerst, nur auswählbare */
  recentFoodTypeIds: string[]
  /** Keine einzige Packung im Vorrat: Die Seite begrüßt freundlich (#54) */
  isStockEmpty: boolean
}

/** Was die Datenschicht zur letzten Erfassung liefert, ohne zu wissen, was auswählbar ist. */
export interface LastUsed {
  storageLocationId: string | null
  foodTypeIds: string[]
}

/**
 * Vorbelegung nur mit Einträgen, die noch in der Auswahl stehen. Ein inzwischen ausgeblendeter
 * Lagerort oder eine ausgeblendete Art wird nicht vorbelegt.
 */
export function applyLastUsed(
  lastUsed: LastUsed,
  choices: { foodTypes: readonly NamedChoice[]; storageLocations: readonly NamedChoice[] },
): Pick<CaptureOptions, 'lastStorageLocationId' | 'recentFoodTypeIds'> {
  const locationIds = new Set(choices.storageLocations.map((location) => location.id))
  const foodTypeIds = new Set(choices.foodTypes.map((foodType) => foodType.id))
  const { storageLocationId } = lastUsed
  return {
    lastStorageLocationId:
      storageLocationId !== null && locationIds.has(storageLocationId) ? storageLocationId : null,
    recentFoodTypeIds: lastUsed.foodTypeIds.filter((id) => foodTypeIds.has(id)),
  }
}

/** Abgeleitete Pfadzeile „Getreide, Kartoffeln › Nudeln“ (UX §2) */
export const foodTypePath = (foodType: Pick<FoodTypeChoice, 'productGroupName' | 'categoryName'>) =>
  `${foodType.productGroupName} › ${foodType.categoryName}`
