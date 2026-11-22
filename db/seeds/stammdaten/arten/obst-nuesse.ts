// Lebensmittelarten der Warengruppe „Obst und Nüsse“.
// Gliederung und Granularitätsregel: docs/quellen/LEBENSMITTELARTEN.md.
import { inCategory, reference, shelfLife } from './eintrag'

export const FRUIT_AND_NUT_FOOD_TYPES = [
  ...inCategory('obst_frisch', [
    ['aepfel', 'Äpfel'],
    ['birnen', 'Birnen'],
    ['bananen', 'Bananen'],
    ['orangen', 'Orangen, Mandarinen und Grapefruits'],
    ['zitronen', 'Zitronen und Limetten'],
    ['weintrauben', 'Weintrauben'],
    ['beeren', 'Beeren (Erdbeeren, Heidelbeeren, Himbeeren)'],
    ['steinobst', 'Steinobst (Pfirsiche, Pflaumen, Kirschen, Aprikosen)'],
    ['kiwis', 'Kiwis'],
    ['melonen', 'Melonen'],
    ['ananas_frisch', 'Ananas (frisch)'],
    ['exotische_fruechte', 'Exotische Früchte (Mango, Papaya, Granatapfel)'],
    ['obst_geschnitten', 'Obst (geschnitten, verzehrfertig)'],
  ]),
  ...inCategory('obst_haltbar', [
    ['apfelmus', 'Apfelmus', reference([70, 0.2, 16.3, 0.2], 18)],
    ['obst_konserve', 'Obstkonserve (Pfirsiche, Ananas, Mandarinen u. a.)'],
    ['obst_tk', 'Obst und Beeren (tiefgekühlt)'],
    ['rote_gruetze', 'Rote Grütze und Kompott (gekühlt)'],
  ]),
  ...inCategory('trockenobst', [
    ['rosinen', 'Rosinen', reference([324, 3.3, 74.8, 0.2], 6)],
    ['trockenpflaumen', 'Trockenpflaumen'],
    ['aprikosen_getrocknet', 'Aprikosen (getrocknet)'],
    ['datteln', 'Datteln und Feigen (getrocknet)'],
    ['kandierte_fruechte', 'Kandierte Früchte (Zitronat, Orangeat)'],
    ['obst_gefriergetrocknet', 'Obst (gefriergetrocknet)'],
    ['trockenobst', 'Trockenobst (sonstiges, Mischungen)', shelfLife(6)],
  ]),
  ...inCategory('nuesse_saaten', [
    ['walnuesse', 'Walnüsse', reference([689, 15.2, 7, 65.2])],
    ['haselnuesse', 'Haselnüsse', reference([654, 14.9, 7, 60.8])],
    ['mandeln', 'Mandeln', reference([595, 21.1, 9.1, 49.9])],
    ['erdnuesse', 'Erdnüsse', reference([613, 24.4, 12.9, 49.7])],
    ['erdnussbutter', 'Erdnussbutter und Nussmus'],
    ['cashewkerne', 'Cashewkerne'],
    ['pistazien', 'Pistazien'],
    ['nuesse_sonstige', 'Nüsse (sonstige: Paranüsse, Macadamia, Pekan)'],
    ['nussmischung', 'Nussmischung und Studentenfutter'],
    ['kokosraspeln', 'Kokosraspeln'],
    ['maronen', 'Maronen (vorgegart)'],
    ['sonnenblumenkerne', 'Sonnenblumen- und Kürbiskerne'],
    ['leinsamen', 'Leinsamen und Chiasamen'],
    ['sesam', 'Sesam'],
  ]),
]
