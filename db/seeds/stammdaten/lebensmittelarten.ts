// System-Lebensmittelarten, je einer System-Kategorie zugeordnet. Die Listen stehen je Warengruppe
// in arten/, damit keine Datei zu groß wird. Geprüft (#128, vom Maintainer delegiert, 2026-11-24),
// Antworten in docs/quellen/LEBENSMITTELARTEN.md §10.1.
// Neue Arten bekommen erst Richtwerte, wenn sie belegt sind (EMPFEHLUNGSWERTE.md).
import { FAT_WATER_DRINK_FOOD_TYPES } from './arten/fette-wasser-getraenke'
import { MEAT_FISH_EGG_FOOD_TYPES } from './arten/fleisch-fisch-eier'
import { VEGETABLE_FOOD_TYPES } from './arten/gemuese'
import { GRAIN_FOOD_TYPES } from './arten/getreide'
import { DAIRY_FOOD_TYPES } from './arten/milch'
import { FRUIT_AND_NUT_FOOD_TYPES } from './arten/obst-nuesse'
import { OTHER_FOOD_TYPES } from './arten/sonstiges'
import type { SystemFoodType } from './arten/eintrag'

export const SYSTEM_FOOD_TYPES: readonly SystemFoodType[] = [
  ...GRAIN_FOOD_TYPES,
  ...VEGETABLE_FOOD_TYPES,
  ...FRUIT_AND_NUT_FOOD_TYPES,
  ...DAIRY_FOOD_TYPES,
  ...MEAT_FISH_EGG_FOOD_TYPES,
  ...FAT_WATER_DRINK_FOOD_TYPES,
  ...OTHER_FOOD_TYPES,
]

// Zusammengelegte Arten der ersten Startliste (alt → neu). Der Seed hängt Produkte, die noch auf
// eine alte Art zeigen, auf die neue um (siehe retired-master-data.ts). Schlüssel werden nie wieder
// für etwas anderes vergeben.
export const MERGED_FOOD_TYPES: Readonly<Record<string, string>> = {
  spaghetti: 'nudeln',
  penne: 'nudeln',
  fusilli: 'nudeln',
  langkornreis: 'reis',
  basmatireis: 'reis',
  milchreis: 'reis',
  erbsen_moehren: 'mischgemuese_konserve',
  mais: 'mais_konserve',
  tomaten_gehackt: 'tomaten_konserve',
  passierte_tomaten: 'tomaten_konserve',
  rote_bete: 'rote_bete_konserve',
  linsen: 'linsen_konserve',
  kichererbsen: 'kichererbsen_konserve',
  weisse_bohnen: 'bohnen_konserve',
  kidneybohnen: 'bohnen_konserve',
  pfirsiche: 'obst_konserve',
  ananas: 'obst_konserve',
  mandarinen: 'obst_konserve',
  thunfisch: 'thunfisch_konserve',
  sardinen: 'sardinen_konserve',
  makrele: 'makrele_konserve',
  hering: 'hering_konserve',
  wuerstchen: 'wuerstchen_konserve',
  rapsoel: 'speiseoel',
  sonnenblumenoel: 'speiseoel',
}
