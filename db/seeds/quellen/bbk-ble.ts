// Empfehlungsquelle BBK/BLE (UMSETZUNG M1-09, #20). Werte aus dem Prüfblatt
// docs/quellen/EMPFEHLUNGSWERTE.md (Abruf aller Quellen 2026-11-22), §1.2 Mengen und §2.2 Bedarf.
// GEPRÜFT (U3, #106): Vom Maintainer delegiert, 2026-11-24, entschieden nach Empfehlung. Jeder
// Wert ist gegen die BLE-Vorratstabelle Mischkost (PDF, © BLE 2024), die Webfassungen Mischkost und
// vegetarisch, den Vorratskalkulator und den BBK-Ratgeber (Stand 11/2025, 2. Auflage) geprüft
// (Prüfblatt §6). Der Seed (Dienst „migrate“) stellt die bestehende Fassung per Upsert um. Ändern
// sich Werte, bleibt der Stand gleich und der Upsert überschreibt sie; eine neue Fassung braucht
// einen neuen Stand, wie Haushalte dann wechseln, klärt #222.
//
// Fundstellen:
// - BBK, Ratgeber „Vorsorgen für Krisen und Katastrophen“, Stand 11/2025, 2. Auflage: 10 Tage,
//   mindestens 3 Tage (S. 3 und 6), Wasser 2 l je Person und Tag, davon 0,5 l zum Kochen (S. 7),
//   für Mengen Verweis auf den BLE-Vorratskalkulator (S. 6).
// - BLE, Vorratstabelle Mischkost und vegetarisch, © BLE 2024: Mengen je Warengruppe für 10 Tage,
//   2.200 kcal je Person und Tag, Getränke-Fußnote 4. Link unten (Webfassung der Tabelle).
//
// Nicht hier: Vegan hat keine offizielle Tabelle. Der Vorschlag aus dem Prüfblatt §3.3 kommt als
// eigene Quelle „Preposaurus-Vorschlag“ (#303). Bis dahin rechnet die Fachlogik vegan wie „alles“
// (stored-diet-targets.ts). Babys haben bei der BLE keine Werte und zählen nicht (L20).
import type { MEMBER_TYPES } from '../../../src/shared/config/constants'
import { DEFAULT_SOURCE_KEY } from '../../../src/shared/config/constants'
import type { ProductGroupKey } from '../stammdaten/warengruppen'

type PersonGroup = (typeof MEMBER_TYPES)[number]
type Amount = Readonly<{ amount: string; unit: 'g' | 'ml' }>

export const BBK_BLE_SOURCE = {
  key: DEFAULT_SOURCE_KEY,
  name: 'BBK/BLE',
  country: 'DE',
} as const

export const BBK_BLE_VERSION = {
  asOf: 'BBK 11/2025, BLE 2024',
  link: 'https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle',
  // offiziell: möglichst 10 Tage, Etappen 3 / 5 / 7 / 10 (BBK-Checkliste)
  defaultDays: 10,
  isVerified: true,
} as const

// Bedarf je Person und Tag (Prüfblatt §2.2). kcal: BLE-Pauschale 2.200 für alle (offiziell, für
// Kinder bewusst hoch). Wasser: Erwachsene 2 l offiziell (BBK S. 7, BLE Fußnote 4: 1,5 l Trinken +
// 0,5 l Kochwasser je Person und Tag). Kind und Senior sind abgeleitet: Getränkebedarf aus
// Fußnote 4 plus dieselben 0,5 l Kochwasser, so wie die BLE die 2 l für Erwachsene bildet
// (Checkliste Nr. 4 und 5, entschieden nach Empfehlung, #106).
export const BBK_BLE_NEEDS: Partial<Record<PersonGroup, { kcal: string; waterMl: number }>> = {
  // abgeleitet: 1 l Getränke offiziell (BLE Fußnote 4, Kinder bis 12) + 0,5 l Kochwasser.
  kind: { kcal: '2200', waterMl: 1500 },
  // Die Tabelle gilt je Person; 13–17 nimmt Fußnote 4 nicht aus, also wie Erwachsene (Nr. 6).
  jugendlich: { kcal: '2200', waterMl: 2000 },
  erwachsen: { kcal: '2200', waterMl: 2000 },
  // abgeleitet: 2 l Getränke ab 65 offiziell (BLE Fußnote 4) + 0,5 l Kochwasser.
  senior: { kcal: '2200', waterMl: 2500 },
}

// Menge je Person und Tag = BLE-Menge für 10 Tage ÷ 10 (Prüfblatt §1.2, alle offiziell). Getränke
// und Sonstiges haben bei der BLE keine eigene Menge und deshalb kein Ziel.
// Fette: Die BLE zählt 180 g Streichfett + 0,15 l Öl als 330 g, setzt also Liter gleich Gramm.
// Wasser: Die BLE kennt nur „Getränke 20 l“ (Mineralwasser). Die Trennung in Wasser und Getränke
// ist eine Repo-Entscheidung (UMSETZUNG 7.3, U11).
const MIXED_DIET: Partial<Record<ProductGroupKey, Amount>> = {
  getreide: { amount: '330', unit: 'g' },
  gemuese_huelsenfruechte: { amount: '400', unit: 'g' },
  obst_nuesse: { amount: '250', unit: 'g' },
  milch: { amount: '250', unit: 'g' },
  fleisch_fisch_eier: { amount: '120', unit: 'g' },
  fette_oele: { amount: '33', unit: 'g' },
  wasser: { amount: '2000', unit: 'ml' },
}

// BLE-Tabelle vegetarisch: wie Mischkost, nur Eier und Ersatzprodukte 1,3 kg statt 1,2 kg.
const VEGETARIAN_DIET: Partial<Record<ProductGroupKey, Amount>> = {
  ...MIXED_DIET,
  fleisch_fisch_eier: { amount: '130', unit: 'g' },
}

export const BBK_BLE_VALUES = {
  alles: MIXED_DIET,
  vegetarisch: VEGETARIAN_DIET,
} as const
