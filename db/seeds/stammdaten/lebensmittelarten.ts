// System-Lebensmittelarten, je einer System-Kategorie zugeordnet.
// VORLÄUFIG, wird vom Maintainer geprüft. Richtwerte (kcal_100, übliche Haltbarkeit) bleiben leer,
// bis sie belegt sind (M1-08). Sie wären ohnehin nur Anzeige-Richtwerte, nie ein MHD.
type SystemFoodType = Readonly<{ key: string; name: string; category: string }>

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
    ['linsen_getrocknet', 'Linsen getrocknet'],
    ['kichererbsen_dose', 'Kichererbsen Dose'],
    ['weisse_bohnen_dose', 'Weiße Bohnen Dose'],
    ['kidneybohnen_dose', 'Kidneybohnen Dose'],
    ['mais_dose', 'Mais'],
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
    ['pfirsiche_dose', 'Pfirsiche Dose'],
    ['ananas_dose', 'Ananas Dose'],
    ['mandarinen_dose', 'Mandarinen Dose'],
    ['rosinen', 'Rosinen'],
    ['trockenobst', 'Trockenobst'],
    ['walnuesse', 'Walnüsse'],
    ['haselnuesse', 'Haselnüsse'],
    ['mandeln', 'Mandeln'],
    ['erdnuesse', 'Erdnüsse'],
  ]),
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
    ['wuerstchen_glas', 'Würstchen im Glas'],
    ['eipulver', 'Eipulver'],
  ]),
  ...inCategory('fette_oele', [
    ['rapsoel', 'Rapsöl'],
    ['olivenoel', 'Olivenöl'],
    ['sonnenblumenoel', 'Sonnenblumenöl'],
    ['butterschmalz', 'Butterschmalz'],
    ['erdnussbutter', 'Erdnussbutter'],
  ]),
  ...inCategory('wasser', [
    ['stilles_wasser', 'Stilles Wasser'],
    ['sprudelwasser', 'Sprudelwasser'],
  ]),
  ...inCategory('getraenke', [
    ['fruchtsaft', 'Fruchtsaft'],
    ['tee', 'Tee'],
    ['kaffee', 'Kaffee'],
  ]),
  ...inCategory('fertiggerichte', [
    ['ravioli', 'Ravioli'],
    ['eintopf', 'Eintopf'],
    ['suppe_dose', 'Suppe Dose'],
    ['instantnudeln', 'Instantnudeln'],
  ]),
  ...inCategory('sonstiges', [
    ['honig', 'Honig'],
    ['zucker', 'Zucker'],
    ['salz', 'Salz'],
    ['marmelade', 'Marmelade'],
    ['schokolade', 'Schokolade'],
    ['kakaopulver', 'Kakaopulver'],
  ]),
]
