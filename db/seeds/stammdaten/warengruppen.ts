// Warengruppen mit festem Schlüssel (technik.html „Empfehlung und Ziel“). Die Mengen je Gruppe
// stehen nicht hier, sondern versioniert je Quelle in quelle_wert (M1-09).
// Wasser ist eine eigene Gruppe, getrennt von Getränken (vorläufig, UMSETZUNG 7.3 / U11).
export const PRODUCT_GROUPS = [
  { key: 'getreide', name: 'Getreide, Getreideprodukte, Brot und Kartoffeln' },
  { key: 'gemuese_huelsenfruechte', name: 'Gemüse und Hülsenfrüchte' },
  { key: 'obst_nuesse', name: 'Obst und Nüsse' },
  { key: 'milch', name: 'Milch und Milchprodukte' },
  { key: 'fleisch_fisch_eier', name: 'Fisch, Fleisch und Eier' },
  { key: 'fette_oele', name: 'Fette und Öle' },
  { key: 'wasser', name: 'Wasser' },
  { key: 'getraenke', name: 'Getränke' },
  // Zählt nur über die Energie (kcal), z. B. Fertiggerichte, Honig, Süßes.
  { key: 'sonstiges', name: 'Sonstiges' },
] as const

export type ProductGroupKey = (typeof PRODUCT_GROUPS)[number]['key']
