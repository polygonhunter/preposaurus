// Inhalt des Beispielhaushalts (nach prototypes/lib/mock-data.ts). Erfundene Personen, erfundene
// Produkte. Die MHDs stehen als Ampelstufe da und werden relativ zum Tag des Seeds berechnet.
import type { DemoUnitStage } from './factories'

export type DemoProduct = Readonly<{
  name: string
  category: string
  // Leer wie nach einer KI-Erkennung ohne Treffer: Dann zählt nur die Kategorie.
  foodType?: string
  container: string
  location: 'Keller' | 'Küche'
  contentAmount: string
  contentUnit: 'g' | 'ml'
  kcalPer100: string
  units: readonly DemoUnitStage[]
}>

export const DEMO_MEMBERS = [
  { name: 'Alex', type: 'erwachsen', pictogram: '🧑', birthDate: '1984-01-01' },
  { name: 'Sam', type: 'erwachsen', pictogram: '👩', birthDate: '1987-01-01' },
  { name: 'Kim', type: 'kind', pictogram: '👦', birthDate: '2016-01-01', diet: 'vegetarisch' },
] as const

// Alex ist Admin, Sam Mitglied, Kim hat keinen Login (wie im Prototyp).
export const DEMO_USERS = [
  { name: 'Alex', email: 'alex@example.org', role: 'admin', member: 'Alex' },
  { name: 'Sam', email: 'sam@example.org', role: 'mitglied', member: 'Sam' },
] as const

const product = (
  name: string,
  details: Omit<DemoProduct, 'name' | 'location' | 'contentUnit'> &
    Partial<Pick<DemoProduct, 'location' | 'contentUnit'>>,
): DemoProduct => ({ name, location: 'Keller', contentUnit: 'g', ...details })

export const DEMO_PRODUCTS: readonly DemoProduct[] = [
  product('Nudeln', {
    foodType: 'spaghetti',
    category: 'getreide',
    container: 'packung',
    contentAmount: '500',
    kcalPer100: '359',
    units: ['gruen', 'gruen', 'gelb'],
  }),
  product('Haferflocken', {
    foodType: 'haferflocken',
    category: 'getreide',
    container: 'packung',
    location: 'Küche',
    contentAmount: '500',
    kcalPer100: '372',
    units: ['orange', 'datum_fehlt'],
  }),
  product('Linsen', {
    category: 'gemuese_huelsenfruechte',
    container: 'dose',
    contentAmount: '400',
    kcalPer100: '90',
    units: ['gruen', 'gruen', 'gruen'],
  }),
  product('Walnüsse', {
    category: 'obst_nuesse',
    container: 'beutel',
    location: 'Küche',
    contentAmount: '200',
    kcalPer100: '654',
    units: ['rot'],
  }),
  product('H-Milch', {
    foodType: 'h_milch',
    category: 'milch',
    container: 'tetrapak',
    contentAmount: '1000',
    contentUnit: 'ml',
    kcalPer100: '64',
    units: ['orange', 'gelb', 'gruen'],
  }),
  product('Thunfisch in Öl', {
    foodType: 'thunfisch',
    category: 'fleisch_fisch_eier',
    container: 'dose',
    contentAmount: '150',
    kcalPer100: '190',
    units: ['rot', 'gruen'],
  }),
  product('Mineralwasser', {
    foodType: 'sprudelwasser',
    category: 'wasser',
    container: 'flasche',
    contentAmount: '1500',
    contentUnit: 'ml',
    kcalPer100: '0',
    units: ['gruen', 'gruen', 'gruen', 'gruen', 'gruen', 'gruen'],
  }),
  product('Ravioli', {
    foodType: 'ravioli',
    category: 'fertiggerichte',
    container: 'dose',
    contentAmount: '800',
    kcalPer100: '90',
    units: ['gelb', 'gruen'],
  }),
]
