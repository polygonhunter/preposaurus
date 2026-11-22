// Datensätze zwischen Use-Case und Repository des Speicherns (#51). Reine Typen in domain/, damit
// application/ (Port) und data/ (Umsetzung) dieselbe Form teilen, ohne sich zu importieren.
import type { ContentQuantity } from '@/shared/lib/quantities'
import type { ProductIdentity } from './product-match'
import type { CaptureMethod, PlannedNutrition, PlannedUnit } from './stock-draft'

export interface FoodTypeRef {
  id: string
  name: string
  categoryId: string
}

/** Was eine Erfassung schon angelegt hat, für die Wiederholung mit demselben Schlüssel. */
export interface SavedCapture {
  productId: string
  unitCount: number
}

/** `foreign`: Die ID gehört einer Erfassung eines anderen Haushalts. */
export type CaptureLookup =
  { kind: 'none' } | { kind: 'foreign' } | ({ kind: 'saved' } & SavedCapture)

export interface NewCapture {
  id: string
  householdId: string
  userId: string
  method: CaptureMethod
}

export interface NewProductRow {
  householdId: string
  categoryId: string
  foodTypeId: string
  name: string
  content: ContentQuantity
  drainedWeightG: number | null
  containerId: string | null
  storageLocationId: string | null
  nutrition: PlannedNutrition | null
}

export interface NewUnitRows {
  productId: string
  captureId: string
  units: readonly PlannedUnit[]
}

/** Ein vorhandenes Produkt, das zum Wiedererkennen in Frage kommt. */
export interface ProductCandidate extends ProductIdentity {
  id: string
  name: string
  containerName: string | null
  storageLocationName: string | null
}
