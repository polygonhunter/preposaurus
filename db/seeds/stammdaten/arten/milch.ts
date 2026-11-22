// Lebensmittelarten der Warengruppe „Milch und Milchprodukte“.
// Gliederung und Granularitätsregel: docs/quellen/LEBENSMITTELARTEN.md.
import { inCategory, reference } from './eintrag'

export const DAIRY_FOOD_TYPES = [
  ...inCategory('milch', [
    ['h_milch', 'H-Milch', reference([61, 3.1, 4.8, 3.3])],
    ['frischmilch', 'Frischmilch'],
    ['milchpulver', 'Milchpulver', reference([499, 26.3, 38.4, 26.7])],
    ['kondensmilch', 'Kondensmilch und Kaffeesahne', reference([135, 6.8, 10, 7.6])],
    ['sahne', 'Sahne (Schlagsahne, Kochsahne)'],
    ['saure_sahne', 'Saure Sahne, Schmand und Crème fraîche'],
    ['buttermilch', 'Buttermilch und Kefir'],
    ['milchmischgetraenk', 'Milchmischgetränke (Kakao, Eiskaffee)'],
  ]),
  ...inCategory('joghurt_quark', [
    ['joghurt', 'Joghurt (natur)'],
    ['fruchtjoghurt', 'Fruchtjoghurt und Joghurtzubereitungen'],
    ['trinkjoghurt', 'Trinkjoghurt und Joghurtdrinks'],
    ['quark', 'Quark und Skyr'],
    ['pudding', 'Pudding und Milchdesserts'],
    ['milchreis_dessert', 'Milchreis und Grießbrei (Dessert)'],
  ]),
  ...inCategory('kaese', [
    ['hartkaese', 'Hartkäse (Emmentaler, Bergkäse, Parmesan)', reference([393, 27, 1.4, 31])],
    ['schnittkaese', 'Schnittkäse (Gouda, Edamer, Tilsiter)'],
    ['weichkaese', 'Weichkäse (Camembert, Brie)'],
    ['frischkaese', 'Frischkäse und Hüttenkäse'],
    ['mozzarella_feta', 'Mozzarella und Feta'],
    ['grillkaese', 'Grill- und Pfannenkäse (Halloumi)'],
    ['sauermilchkaese', 'Sauermilchkäse (Harzer, Handkäse)'],
    ['schmelzkaese', 'Schmelzkäse'],
  ]),
  ...inCategory('milchalternativen', [
    ['haferdrink', 'Haferdrink'],
    ['sojadrink', 'Sojadrink', reference([53, 3.3, 5.7, 1.8])],
    ['pflanzendrink', 'Pflanzendrink (Mandel, Reis, Kokos u. a.)'],
    ['joghurtalternative', 'Joghurtalternative (pflanzlich)'],
    ['sahnealternative', 'Sahnealternative (pflanzlich)'],
    ['kaesealternative', 'Käsealternative (pflanzlich)'],
    ['kokosmilch', 'Kokosmilch'],
  ]),
]
