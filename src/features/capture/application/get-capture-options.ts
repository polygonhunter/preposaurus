// Use-Case „Auswahllisten des Erfassens“ (#52): alles, was das Formular zum Wählen braucht, in
// einem Aufruf. Den Port legt der Verbraucher fest (CODE_PRINZIPIEN §8), Tests nutzen ein Fake.
import 'server-only'
import {
  applyLastUsed,
  type CaptureOptions,
  type CategoryChoice,
  type ContainerChoice,
  type FoodTypeChoice,
  type KnownProduct,
  type LastUsed,
  type NamedChoice,
} from '../domain/capture-options'

export interface CaptureOptionsReader {
  /** System-Arten und eigene Arten des Haushalts, ohne ausgeblendete */
  loadFoodTypes: (householdId: string) => Promise<FoodTypeChoice[]>
  loadContainers: () => Promise<ContainerChoice[]>
  /** Nur eigene, nicht ausgeblendete Lagerorte */
  loadStorageLocations: (householdId: string) => Promise<NamedChoice[]>
  /** Eigene Produkte mit Lebensmittelart fürs Wiedererkennen (#207) */
  loadKnownProducts: (householdId: string) => Promise<KnownProduct[]>
  loadLastUsed: (householdId: string, userId: string) => Promise<LastUsed>
  hasStock: (householdId: string) => Promise<boolean>
  /** Sichtbare Kategorien des Haushalts (#142) */
  loadCategories: (householdId: string) => Promise<CategoryChoice[]>
}

interface CaptureOptionsRequest {
  householdId: string
  userId: string
}

export async function getCaptureOptions(
  reader: CaptureOptionsReader,
  { householdId, userId }: CaptureOptionsRequest,
): Promise<CaptureOptions> {
  const [foodTypes, containers, storageLocations, knownProducts, lastUsed, hasStock, categories] =
    await Promise.all([
      reader.loadFoodTypes(householdId),
      reader.loadContainers(),
      reader.loadStorageLocations(householdId),
      reader.loadKnownProducts(householdId),
      reader.loadLastUsed(householdId, userId),
      reader.hasStock(householdId),
      reader.loadCategories(householdId),
    ])
  return {
    foodTypes,
    containers,
    storageLocations,
    knownProducts,
    ...applyLastUsed(lastUsed, { foodTypes, storageLocations }),
    isStockEmpty: !hasStock,
    categories,
  }
}
