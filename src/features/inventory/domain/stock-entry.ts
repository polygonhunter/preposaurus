import type { CalendarDay } from '@/shared/lib/dates'
import type { ContentQuantity } from '@/shared/lib/quantities'
import type { NutritionValues, ProductNutrition } from './nutrition-source'
import type { AmpelThresholds } from './unit-state'
import type { StockUnit, UnitStatus } from './unit'

// Was die Lesepfade des Vorrats aus der Datenbank bekommen (#43). Nur Typen: Das Repository
// liefert sie, die Use-Cases rechnen damit. Ein Produkt trägt seinen ganzen Pfad im Baum
// Warengruppe → Kategorie → Lebensmittelart, damit niemand nachladen muss (kein N+1).

interface NamedRef {
  id: string
  name: string
}

interface StockFoodType extends NamedRef {
  /** Richtwerte je 100 g bzw. ml, ergänzt fehlende Produktwerte beim Lesen (E-5) */
  reference: NutritionValues
  /** Nur als Hinweis, nie als MHD (#110) */
  typicalShelfLifeMonths: number | null
}

export interface StockCategory extends NamedRef {
  pictogram: string | null
}

export interface StockGroup {
  key: string
  name: string
}

export interface StockProduct extends NamedRef {
  content: ContentQuantity
  nutrition: ProductNutrition
  /**
   * null: ohne Lebensmittelart (heute optional, Maintainer-Frage offen). Das Produkt steht dann
   * als eigene Zeile direkt unter seiner Kategorie.
   */
  foodType: StockFoodType | null
  category: StockCategory
  group: StockGroup
  container: NamedRef | null
  storageLocation: NamedRef | null
}

export interface StockProductUnit extends StockUnit {
  productId: string
}

/** Einschränkungen auf Produktebene, alle optional und miteinander verknüpft (und). */
export interface ProductFilter {
  groupKey?: string | undefined
  categoryId?: string | undefined
  foodTypeId?: string | undefined
  productId?: string | undefined
  containerId?: string | undefined
  storageLocationId?: string | undefined
  /** Teilwort in Bezeichnung oder Lebensmittelart, ohne Groß- und Kleinschreibung */
  search?: string | undefined
}

export interface UnitQuery {
  /** Nur Einheiten dieser Produkte. Fehlt die Liste, gilt der ganze Haushalt */
  productIds?: readonly string[] | undefined
  statuses: readonly UnitStatus[]
  /** Nur Einheiten mit MHD bis zu diesem Tag, ohne Datum nie (Seite Bald fällig) */
  dueUntil?: CalendarDay | undefined
}

/** Haushalts-Einstellungen, die das Lesen braucht (`haushalt_einstellung`). */
export interface ReadSettings {
  thresholds: AmpelThresholds
  /** „Noch gut zählt mit“ (#117), gilt nur für heute */
  stillGoodCounts: boolean
}

export interface FilterOptions {
  containers: NamedRef[]
  storageLocations: NamedRef[]
}
