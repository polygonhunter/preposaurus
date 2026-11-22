// System-Kategorien, jede mit ihrer Warengruppe (01 „Ordnungssystem“, EIN-04).
// kcal-Durchschnitt und übliche Haltbarkeit bleiben leer, bis M1-08 sie belegt hat.
import type { ProductGroupKey } from './warengruppen'

type SystemCategory = Readonly<{
  key: string
  name: string
  pictogram: string
  productGroup: ProductGroupKey
  // Richtwerte, sobald belegt (M1-08). Fehlt ein Wert, setzt der Seed die Spalte auf leer.
  averageKcalPer100?: string
  typicalShelfLifeMonths?: number
}>

export const SYSTEM_CATEGORIES: readonly SystemCategory[] = [
  { key: 'getreide', name: 'Getreide, Nudeln, Reis', pictogram: '🍝', productGroup: 'getreide' },
  {
    key: 'gemuese_huelsenfruechte',
    name: 'Gemüse und Hülsenfrüchte',
    pictogram: '🥫',
    productGroup: 'gemuese_huelsenfruechte',
  },
  { key: 'obst_nuesse', name: 'Obst und Nüsse', pictogram: '🍑', productGroup: 'obst_nuesse' },
  { key: 'milch', name: 'Milch und Milchprodukte', pictogram: '🥛', productGroup: 'milch' },
  {
    key: 'fleisch_fisch_eier',
    name: 'Fisch, Fleisch, Eier',
    pictogram: '🐟',
    productGroup: 'fleisch_fisch_eier',
  },
  { key: 'fette_oele', name: 'Fette und Öle', pictogram: '🫒', productGroup: 'fette_oele' },
  { key: 'wasser', name: 'Wasser', pictogram: '💧', productGroup: 'wasser' },
  { key: 'getraenke', name: 'Getränke', pictogram: '🧃', productGroup: 'getraenke' },
  { key: 'fertiggerichte', name: 'Fertiggerichte', pictogram: '🍲', productGroup: 'sonstiges' },
  { key: 'sonstiges', name: 'Sonstiges', pictogram: '🍯', productGroup: 'sonstiges' },
]
