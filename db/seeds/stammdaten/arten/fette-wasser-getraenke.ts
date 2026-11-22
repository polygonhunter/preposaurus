// Lebensmittelarten der Warengruppen „Fette und Öle“, „Wasser“, „Getränke“.
// Gliederung und Granularitätsregel: docs/quellen/LEBENSMITTELARTEN.md.
import { inCategory, reference } from './eintrag'

export const FAT_WATER_DRINK_FOOD_TYPES = [
  ...inCategory('oele', [
    ['speiseoel', 'Speiseöl (Raps, Sonnenblume)', reference([900, 0, 0, 100], 12)],
    ['olivenoel', 'Olivenöl', reference([900, 0, 0, 100], 12)],
    ['spezialoel', 'Spezialöle (Sesam, Lein, Walnuss)'],
  ]),
  ...inCategory('streichfette', [
    ['butter', 'Butter'],
    ['margarine', 'Margarine und pflanzliche Streichfette'],
    ['butterschmalz', 'Butterschmalz', reference([896, 0.3, 0, 99.5])],
    ['bratfett', 'Kokosfett, Plattenfett und Schmalz'],
  ]),
  ...inCategory('wasser', [
    ['stilles_wasser', 'Stilles Wasser', reference([0, 0, 0, 0])],
    ['sprudelwasser', 'Sprudelwasser', reference([0, 0, 0, 0])],
    ['leitungswasser_abgefuellt', 'Leitungswasser (selbst abgefüllt)'],
  ]),
  ...inCategory('saefte', [
    ['fruchtsaft', 'Fruchtsaft', reference([46, 0.1, 11.1, 0.1], 18)],
    ['fruchtnektar', 'Fruchtnektar'],
    ['gemuesesaft', 'Gemüsesaft'],
    ['smoothie', 'Smoothies (gekühlt)'],
    ['zitronensaft', 'Zitronensaft'],
  ]),
  ...inCategory('erfrischungsgetraenke', [
    ['limonade', 'Limonade und Cola'],
    ['limonade_zuckerfrei', 'Limonade und Cola (zuckerfrei)'],
    ['saftschorle', 'Saftschorle'],
    ['eistee', 'Eistee'],
    ['energydrink', 'Energy- und Sportgetränke'],
    ['wasser_geschmack', 'Wasser mit Geschmack'],
    ['getraenkepulver', 'Getränkepulver und Elektrolyte'],
  ]),
  ...inCategory('alkohol', [
    // Alkohol: nie im Getränke- oder Wasser-Ziel. Als Trinkmenge zählt nur die Warengruppe
    // Wasser (stock-model.ts), die Gruppe Getränke hat kein Ziel. Die kcal zählen wie alle
    // anderen zur Energie.
    ['bier', 'Bier'],
    ['bier_alkoholfrei', 'Bier (alkoholfrei) und Malzbier'],
    ['wein', 'Wein'],
    ['sekt', 'Sekt und Schaumwein'],
    ['spirituosen', 'Spirituosen und Likör'],
  ]),
]
