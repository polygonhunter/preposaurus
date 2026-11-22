// Auswahllisten des Erfassens (#52): Lebensmittelarten mit abgeleitetem Pfad, Behälter und
// Lagerorte. Dazu die Vorbelegung aus der letzten Erfassung des Nutzers (UX §1: Lagerort „zuletzt
// genutzt“, Lebensmittelarten „Zuletzt genutzt“) und ob der Vorrat noch leer ist (erster Start).

/** Lebensmittelart mit Pfad. Kategorie und Warengruppe werden nur angezeigt, nie gewählt (#110). */
export interface FoodTypeChoice {
  id: string
  name: string
  categoryName: string
  productGroupName: string
  /** Richtwert je 100 g bzw. ml, gilt ohne eigene Nährwerte als „ca.“ (E-5) */
  kcalPer100: number | null
}

export interface NamedChoice {
  id: string
  name: string
}

export interface CaptureOptions {
  foodTypes: FoodTypeChoice[]
  containers: NamedChoice[]
  storageLocations: NamedChoice[]
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
