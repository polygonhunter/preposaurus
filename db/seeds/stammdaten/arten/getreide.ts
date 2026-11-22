// Lebensmittelarten der Warengruppe „Getreide, Getreideprodukte, Brot und Kartoffeln“.
// Gliederung und Granularitätsregel: docs/quellen/LEBENSMITTELARTEN.md.
import { inCategory, reference } from './eintrag'

export const GRAIN_FOOD_TYPES = [
  ...inCategory('getreide', [
    ['nudeln', 'Nudeln', reference([358, 13, 71.5, 1.5], 24)],
    ['nudeln_frisch', 'Frische Nudeln (gekühlt)'],
    ['nudeln_gefuellt', 'Gefüllte Nudeln (getrocknet)'],
    ['reis', 'Reis', reference([352, 7.1, 78.7, 0.7], 24)],
    ['reis_vorgegart', 'Reis (vorgegart)'],
    ['couscous', 'Couscous', reference([357, 12.8, 72.4, 0.6])],
    ['bulgur', 'Bulgur'],
    ['quinoa', 'Quinoa'],
    ['hirse', 'Hirse'],
    ['polenta', 'Polenta (Maisgrieß)'],
    ['graupen', 'Graupen'],
    ['getreidekoerner', 'Getreidekörner (Weizen, Dinkel, Buchweizen)'],
  ]),
  ...inCategory('mehl_griess', [
    ['mehl', 'Mehl', reference([350, 10.3, 73.6, 1], 12)],
    ['griess', 'Grieß', reference([344, 12.7, 68.9, 1.1])],
    ['speisestaerke', 'Speisestärke'],
    ['paniermehl', 'Paniermehl'],
    ['brotbackmischung', 'Brotbackmischung'],
  ]),
  ...inCategory('cerealien', [
    ['haferflocken', 'Haferflocken', reference([362, 13.2, 57.6, 6.5], 12)],
    ['getreideflocken', 'Getreideflocken (Dinkel, Hirse u. a.)'],
    ['muesli', 'Müsli'],
    ['cerealien', 'Cornflakes und Frühstückscerealien'],
  ]),
  ...inCategory('brot', [
    ['brot', 'Brot (frisch)'],
    ['toastbrot', 'Toastbrot und Sandwichbrot'],
    ['broetchen', 'Brötchen (frisch)'],
    ['laugengebaeck', 'Laugengebäck'],
    ['wraps', 'Wraps, Tortillas und Fladenbrot'],
    ['dauerbrot', 'Schnittbrot, lange haltbar (Pumpernickel, Vollkornbrot)'],
    ['konservenbrot', 'Konservenbrot'],
    ['aufbackbroetchen', 'Aufbackbrötchen (haltbar)'],
    ['backwaren_tk', 'Brot und Brötchen (tiefgekühlt)'],
    ['knaeckebrot', 'Knäckebrot', reference([339, 7.9, 65.7, 1.3])],
    ['zwieback', 'Zwieback', reference([420, 10.1, 71.7, 9.7])],
    ['reiswaffeln', 'Reis- und Maiswaffeln'],
  ]),
  ...inCategory('kartoffeln', [
    ['kartoffeln', 'Kartoffeln'],
    ['kartoffeln_konserve', 'Kartoffeln (Konserve)'],
    ['kartoffeln_vorgegart', 'Kartoffeln (vorgegart, gekühlt)'],
    ['kartoffelpueree_pulver', 'Kartoffelpüree (Pulver)', reference([349, 8.3, 74.6, 0.4])],
    ['knoedel_trocken', 'Knödel und Klöße (Pulver, Kochbeutel)'],
    ['kartoffelteig_gekuehlt', 'Gnocchi, Schupfnudeln und Kloßteig (gekühlt)'],
    ['pommes_tk', 'Pommes frites und Kartoffelprodukte (tiefgekühlt)'],
  ]),
]
