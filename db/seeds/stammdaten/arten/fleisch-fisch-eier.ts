// Lebensmittelarten der Warengruppe „Fisch, Fleisch und Eier“.
// Gliederung und Granularitätsregel: docs/quellen/LEBENSMITTELARTEN.md.
import { inCategory, reference, shelfLife } from './eintrag'

export const MEAT_FISH_EGG_FOOD_TYPES = [
  ...inCategory('fleisch', [
    ['hackfleisch', 'Hackfleisch'],
    ['rindfleisch', 'Rindfleisch'],
    ['schweinefleisch', 'Schweinefleisch'],
    ['gefluegel', 'Geflügel (Hähnchen, Pute)'],
    ['lamm_wild', 'Lamm und Wild'],
    ['bratwurst', 'Bratwurst (roh)'],
  ]),
  ...inCategory('wurst', [
    ['aufschnitt', 'Aufschnitt (Lyoner, Mortadella, Geflügelwurst)'],
    ['salami', 'Salami und Rohwurst'],
    ['kochschinken', 'Kochschinken'],
    ['rohschinken', 'Rohschinken'],
    ['streichwurst', 'Streichwurst (Leberwurst, Teewurst)'],
    ['wiener_bockwurst', 'Wiener und Bockwurst (gekühlt)'],
    ['leberkaese', 'Leberkäse und Fleischkäse'],
    ['speck', 'Speck und Schinkenwürfel'],
  ]),
  ...inCategory('fisch', [
    ['fisch_frisch', 'Fisch (frisch)'],
    ['raeucherfisch', 'Räucherfisch (Räucherlachs, Makrele)'],
    ['hering_mariniert', 'Hering mariniert (Matjes, Bismarck, Rollmops)'],
    ['garnelen', 'Garnelen und Meeresfrüchte (gekühlt)'],
  ]),
  ...inCategory('fleisch_fisch_tk', [
    ['fleisch_tk', 'Fleisch (tiefgekühlt)'],
    ['gefluegel_tk', 'Geflügel (tiefgekühlt)'],
    ['fischfilet_tk', 'Fischfilet (tiefgekühlt)'],
    ['fischstaebchen', 'Fischstäbchen und panierter Fisch'],
    ['garnelen_tk', 'Garnelen und Meeresfrüchte (tiefgekühlt)'],
  ]),
  ...inCategory('konserven_fleisch_fisch', [
    ['thunfisch_konserve', 'Thunfisch (Konserve)', reference([109, 25.5, 0, 0.8], 60)],
    ['sardinen_konserve', 'Sardinen (Konserve)', reference([202, 24.6, 0, 11.4], 60)],
    ['makrele_konserve', 'Makrele (Konserve)', shelfLife(60)],
    ['hering_konserve', 'Hering (Konserve)'],
    ['fischkonserve', 'Fischkonserve (sonstige: Lachs, Sprotten, Muscheln)'],
    [
      'fleischkonserve',
      'Fleischkonserve (Corned Beef, Rindfleisch im eigenen Saft)',
      shelfLife(60),
    ],
    ['wuerstchen_konserve', 'Würstchen (Konserve)', reference([227, 10.5, 2.6, 19.4], 60)],
    ['wurstkonserve', 'Wurstkonserve (Leberwurst, Frühstücksfleisch)'],
  ]),
  ...inCategory('eier', [
    ['eier', 'Eier'],
    ['eipulver', 'Eipulver', reference([592, 48, 1.1, 43.9])],
    ['eier_gekocht', 'Gekochte Eier (gefärbt oder geschält)'],
    ['fluessigei', 'Flüssigei'],
  ]),
  ...inCategory('fleischersatz', [
    ['tofu', 'Tofu'],
    ['tempeh_seitan', 'Tempeh und Seitan'],
    ['fleischersatz', 'Fleischersatz (gekühlt)'],
    ['fleischersatz_tk', 'Fleischersatz (tiefgekühlt)'],
    ['falafel', 'Falafel und Gemüsebratlinge'],
    ['sojagranulat', 'Sojagranulat und Sojaschnetzel'],
  ]),
]
