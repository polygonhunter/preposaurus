// System-Lebensmittelarten, je einer System-Kategorie zugeordnet. Namen und Schlüssel nennen keinen
// Behälter (die Dose ist ein Merkmal am Produkt), nur echte Unterschiede wie „getrocknet“.
// VORLÄUFIG, wird vom Maintainer geprüft. Richtwerte (kcal, Makros, übliche Haltbarkeit) bleiben leer,
// bis sie belegt sind (M1-08). Sie wären ohnehin nur Anzeige-Richtwerte, nie ein MHD.
type SystemFoodType = Readonly<{
  key: string
  name: string
  category: string
  // Anzeige-Richtwerte, sobald belegt (M1-08). Fehlt ein Wert, setzt der Seed die Spalte auf leer.
  kcalPer100?: string
  proteinPer100?: string
  carbsPer100?: string
  fatPer100?: string
  typicalShelfLifeMonths?: number
}>

const inCategory = (category: string, entries: readonly (readonly [string, string])[]) =>
  entries.map(([key, name]) => ({ key, name, category }))

export const SYSTEM_FOOD_TYPES: readonly SystemFoodType[] = [
  ...inCategory('getreide', [
    ['spaghetti', 'Spaghetti'],
    ['penne', 'Penne'],
    ['fusilli', 'Fusilli'],
    ['langkornreis', 'Langkornreis'],
    ['basmatireis', 'Basmatireis'],
    ['milchreis', 'Milchreis'],
    ['haferflocken', 'Haferflocken'],
    ['knaeckebrot', 'Knäckebrot'],
    ['zwieback', 'Zwieback'],
    ['mehl', 'Mehl'],
    ['griess', 'Grieß'],
    ['couscous', 'Couscous'],
    ['kartoffelpueree_pulver', 'Kartoffelpüree (Pulver)'],
    ['muesli', 'Müsli'],
  ]),
  ...inCategory('gemuese_huelsenfruechte', [
    ['linsen', 'Linsen'],
    ['linsen_getrocknet', 'Linsen getrocknet'],
    ['kichererbsen', 'Kichererbsen'],
    ['kichererbsen_getrocknet', 'Kichererbsen getrocknet'],
    ['weisse_bohnen', 'Weiße Bohnen'],
    ['kidneybohnen', 'Kidneybohnen'],
    ['mais', 'Mais'],
    ['erbsen_moehren', 'Erbsen & Möhren'],
    ['tomaten_gehackt', 'Tomaten gehackt'],
    ['passierte_tomaten', 'Passierte Tomaten'],
    ['tomatenmark', 'Tomatenmark'],
    ['sauerkraut', 'Sauerkraut'],
    ['rote_bete', 'Rote Bete'],
    ['gewuerzgurken', 'Gewürzgurken'],
  ]),
  ...inCategory('obst_nuesse', [
    ['apfelmus', 'Apfelmus'],
    ['pfirsiche', 'Pfirsiche'],
    ['ananas', 'Ananas'],
    ['mandarinen', 'Mandarinen'],
    ['rosinen', 'Rosinen'],
    ['trockenobst', 'Trockenobst'],
    ['walnuesse', 'Walnüsse'],
    ['haselnuesse', 'Haselnüsse'],
    ['mandeln', 'Mandeln'],
    ['erdnuesse', 'Erdnüsse und Erdnussbutter'],
  ]),
  // Pflanzendrinks stehen bei Milch, weil sie im Vorrat dieselbe Rolle spielen: Sie werden wie
  // Milch verwendet und gelagert. Wer vegan lebt, findet sie so an der erwarteten Stelle.
  ...inCategory('milch', [
    ['h_milch', 'H-Milch'],
    ['haferdrink', 'Haferdrink'],
    ['sojadrink', 'Sojadrink'],
    ['kondensmilch', 'Kondensmilch'],
    ['milchpulver', 'Milchpulver'],
    ['hartkaese', 'Hartkäse'],
  ]),
  ...inCategory('fleisch_fisch_eier', [
    ['thunfisch', 'Thunfisch'],
    ['sardinen', 'Sardinen'],
    ['makrele', 'Makrele'],
    ['hering', 'Hering'],
    ['fleischkonserve', 'Fleischkonserve'],
    ['wuerstchen', 'Würstchen'],
    ['eipulver', 'Eipulver'],
  ]),
  ...inCategory('fette_oele', [
    ['rapsoel', 'Rapsöl'],
    ['olivenoel', 'Olivenöl'],
    ['sonnenblumenoel', 'Sonnenblumenöl'],
    ['butterschmalz', 'Butterschmalz'],
  ]),
  ...inCategory('wasser', [
    ['stilles_wasser', 'Stilles Wasser'],
    ['sprudelwasser', 'Sprudelwasser'],
  ]),
  ...inCategory('getraenke', [['fruchtsaft', 'Fruchtsaft']]),
  ...inCategory('fertiggerichte', [
    ['ravioli', 'Ravioli'],
    ['eintopf', 'Eintopf'],
    ['suppe', 'Suppe'],
    ['instantnudeln', 'Instantnudeln'],
  ]),
  ...inCategory('sonstiges', [
    ['honig', 'Honig'],
    ['zucker', 'Zucker'],
    ['salz', 'Salz'],
    ['marmelade', 'Marmelade'],
    ['schokolade', 'Schokolade'],
    ['kakaopulver', 'Kakaopulver'],
    // Tee und Kaffee liefern kaum Energie und zählen nicht als Getränk für den Wasserbedarf.
    ['tee', 'Tee'],
    ['kaffee', 'Kaffee'],
  ]),
]
