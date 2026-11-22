// System-Kategorien, jede mit genau einer Warengruppe (01 „Ordnungssystem“, EIN-04). Gliederung und
// Begründung: docs/quellen/LEBENSMITTELARTEN.md. Behälter (Dose, Glas) sind keine Kategorie, die Art
// der Haltbarmachung (frisch, Konserve, tiefgekühlt) trennt Kategorien nur bei Gemüse, Obst, Fleisch
// und Fisch, weil der Vorrat dort danach gelagert wird.
// Richtwerte stehen an der Lebensmittelart (E-22), nicht an der Kategorie.
import type { ProductGroupKey } from './warengruppen'

type SystemCategory = Readonly<{
  key: string
  name: string
  pictogram: string
  productGroup: ProductGroupKey
}>

export const SYSTEM_CATEGORIES = [
  { key: 'getreide', name: 'Nudeln, Reis und Getreide', pictogram: '🍝', productGroup: 'getreide' },
  { key: 'mehl_griess', name: 'Mehl, Grieß und Stärke', pictogram: '🌾', productGroup: 'getreide' },
  {
    key: 'cerealien',
    name: 'Müsli, Flocken und Cerealien',
    pictogram: '🥣',
    productGroup: 'getreide',
  },
  {
    key: 'brot',
    name: 'Brot, Brötchen und Dauerbackwaren',
    pictogram: '🍞',
    productGroup: 'getreide',
  },
  {
    key: 'kartoffeln',
    name: 'Kartoffeln und Kartoffelprodukte',
    pictogram: '🥔',
    productGroup: 'getreide',
  },
  {
    key: 'gemuese_frisch',
    name: 'Gemüse, Salat und Kräuter (frisch)',
    pictogram: '🥕',
    productGroup: 'gemuese_huelsenfruechte',
  },
  {
    key: 'gemuese_konserve',
    name: 'Gemüse (Konserve, eingelegt, getrocknet)',
    pictogram: '🌽',
    productGroup: 'gemuese_huelsenfruechte',
  },
  {
    key: 'gemuese_tk',
    name: 'Gemüse (tiefgekühlt)',
    pictogram: '🥦',
    productGroup: 'gemuese_huelsenfruechte',
  },
  {
    key: 'huelsenfruechte',
    name: 'Hülsenfrüchte',
    pictogram: '🫘',
    productGroup: 'gemuese_huelsenfruechte',
  },
  { key: 'obst_frisch', name: 'Obst (frisch)', pictogram: '🍎', productGroup: 'obst_nuesse' },
  {
    key: 'obst_haltbar',
    name: 'Obst (Konserve, Mus und tiefgekühlt)',
    pictogram: '🍑',
    productGroup: 'obst_nuesse',
  },
  { key: 'trockenobst', name: 'Trockenobst', pictogram: '🍇', productGroup: 'obst_nuesse' },
  {
    key: 'nuesse_saaten',
    name: 'Nüsse, Kerne und Saaten',
    pictogram: '🥜',
    productGroup: 'obst_nuesse',
  },
  { key: 'milch', name: 'Milch und Sahne', pictogram: '🥛', productGroup: 'milch' },
  {
    key: 'joghurt_quark',
    name: 'Joghurt, Quark und Milchdesserts',
    pictogram: '🥄',
    productGroup: 'milch',
  },
  { key: 'kaese', name: 'Käse', pictogram: '🧀', productGroup: 'milch' },
  {
    key: 'milchalternativen',
    name: 'Pflanzendrinks und Milchalternativen',
    pictogram: '🌱',
    productGroup: 'milch',
  },
  {
    key: 'fleisch',
    name: 'Fleisch und Geflügel (frisch)',
    pictogram: '🥩',
    productGroup: 'fleisch_fisch_eier',
  },
  { key: 'wurst', name: 'Wurst und Schinken', pictogram: '🥓', productGroup: 'fleisch_fisch_eier' },
  {
    key: 'fisch',
    name: 'Fisch und Meeresfrüchte (frisch)',
    pictogram: '🐟',
    productGroup: 'fleisch_fisch_eier',
  },
  {
    key: 'fleisch_fisch_tk',
    name: 'Fleisch und Fisch (tiefgekühlt)',
    pictogram: '❄️',
    productGroup: 'fleisch_fisch_eier',
  },
  {
    key: 'konserven_fleisch_fisch',
    name: 'Fleisch- und Fischkonserven',
    pictogram: '🥫',
    productGroup: 'fleisch_fisch_eier',
  },
  { key: 'eier', name: 'Eier', pictogram: '🥚', productGroup: 'fleisch_fisch_eier' },
  {
    key: 'fleischersatz',
    name: 'Tofu und Fleischersatz',
    pictogram: '🌿',
    productGroup: 'fleisch_fisch_eier',
  },
  { key: 'oele', name: 'Speiseöle', pictogram: '🫒', productGroup: 'fette_oele' },
  {
    key: 'streichfette',
    name: 'Butter, Margarine und Speisefette',
    pictogram: '🧈',
    productGroup: 'fette_oele',
  },
  { key: 'wasser', name: 'Wasser', pictogram: '💧', productGroup: 'wasser' },
  { key: 'saefte', name: 'Säfte und Nektare', pictogram: '🧃', productGroup: 'getraenke' },
  {
    key: 'erfrischungsgetraenke',
    name: 'Limonaden, Schorlen und Eistee',
    pictogram: '🥤',
    productGroup: 'getraenke',
  },
  {
    key: 'alkohol',
    name: 'Bier, Wein und Spirituosen',
    pictogram: '🍷',
    productGroup: 'getraenke',
  },
  {
    key: 'fertiggerichte',
    name: 'Fertiggerichte, Suppen und Feinkost',
    pictogram: '🍲',
    productGroup: 'sonstiges',
  },
  {
    key: 'tk_gerichte',
    name: 'Pizza und Fertiggerichte (tiefgekühlt)',
    pictogram: '🍕',
    productGroup: 'sonstiges',
  },
  {
    key: 'suesswaren',
    name: 'Süßwaren, Gebäck und Knabbereien',
    pictogram: '🍫',
    productGroup: 'sonstiges',
  },
  { key: 'aufstriche', name: 'Brotaufstriche', pictogram: '🍯', productGroup: 'sonstiges' },
  {
    key: 'backzutaten',
    name: 'Backzutaten und Zucker',
    pictogram: '🧁',
    productGroup: 'sonstiges',
  },
  {
    key: 'gewuerze',
    name: 'Salz, Gewürze und Würzmittel',
    pictogram: '🧂',
    productGroup: 'sonstiges',
  },
  { key: 'saucen', name: 'Saucen und Dressings', pictogram: '🍅', productGroup: 'sonstiges' },
  { key: 'kaffee_tee', name: 'Kaffee, Tee und Kakao', pictogram: '☕', productGroup: 'sonstiges' },
  { key: 'babynahrung', name: 'Babynahrung', pictogram: '🍼', productGroup: 'sonstiges' },
  {
    key: 'sonstige_lebensmittel',
    name: 'Sonstige Lebensmittel',
    pictogram: '📦',
    productGroup: 'sonstiges',
  },
  {
    key: 'spezialnahrung',
    name: 'Notrationen und Spezialnahrung',
    pictogram: '🎒',
    productGroup: 'sonstiges',
  },
] as const satisfies readonly SystemCategory[]

export type SystemCategoryKey = (typeof SYSTEM_CATEGORIES)[number]['key']
