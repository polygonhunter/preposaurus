// Lagerort eines Haushalts (EIN-04, VOR-05). Er hängt am Produkt. Gelöscht wird nur ein Ort, an
// dem kein Produkt liegt, auch kein verbrauchtes: Sonst verlöre die Historie still ihren Ort
// (produkt.lagerort_id SET NULL). Ausblenden geht immer.
import type { NamedEntry } from './catalog-name'

export interface StorageLocation extends NamedEntry {
  /** Produkte des Haushalts an diesem Ort, auch ohne Packung im Vorrat */
  productCount: number
}
