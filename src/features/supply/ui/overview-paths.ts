// Ziele der Übersicht (UX-Konzept §8.1 „Übergänge“): Jede Kachel führt genau an einen Ort.
export const OVERVIEW_PATHS = {
  due: '/uebersicht/bald-faellig',
  restock: '/nachkaufen',
  settings: '/einstellungen',
  capture: '/neu',
} as const

/** Vorrat Ebene 2 einer Warengruppe */
export const stockGroupPath = (groupKey: string) => `/vorrat/${encodeURIComponent(groupKey)}`
