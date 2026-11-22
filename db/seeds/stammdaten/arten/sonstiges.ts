// Lebensmittelarten der Warengruppe „Sonstiges“.
// Gliederung und Granularitätsregel: docs/quellen/LEBENSMITTELARTEN.md.
import { inCategory, reference, shelfLife } from './eintrag'

export const OTHER_FOOD_TYPES = [
  ...inCategory('fertiggerichte', [
    ['ravioli', 'Ravioli', reference([94, 3.2, 11.8, 3.4], 60)],
    ['eintopf', 'Eintopf', shelfLife(60)],
    ['fertiggericht_konserve', 'Fertiggericht (Konserve: Gulasch, Chili u. a.)'],
    ['suppe', 'Suppe (verzehrfertig)'],
    ['trockensuppe', 'Instantsuppe und Trockensuppe'],
    ['instantnudeln', 'Instantnudeln', reference([434, 10.2, 57.4, 17.6])],
    ['fertiggericht_trocken', 'Fertiggericht zum Anrühren (Nudel-, Reis-, Kartoffelgerichte)'],
    ['fertiggericht_gekuehlt', 'Fertiggericht (gekühlt)'],
    ['feinkostsalat', 'Feinkostsalat (Kartoffel-, Nudel-, Fleischsalat)'],
    // Einzige Art für Dips, haltbare Salsa steht bei den Würzsaucen.
    ['hummus_dips', 'Hummus und Dips'],
  ]),
  ...inCategory('tk_gerichte', [
    ['pizza_tk', 'Pizza, Baguette und Flammkuchen (tiefgekühlt)'],
    ['fertiggericht_tk', 'Fertiggericht (tiefgekühlt)'],
    ['snacks_tk', 'Snacks und Fingerfood (tiefgekühlt)'],
    ['kuchen_tk', 'Kuchen und Torten (tiefgekühlt)'],
  ]),
  ...inCategory('suesswaren', [
    ['schokolade', 'Schokolade', reference([528, 7.7, 56, 29.7], 24)],
    ['schokoriegel', 'Schokoriegel und Pralinen'],
    ['bonbons', 'Bonbons und Kaugummi'],
    ['fruchtgummi', 'Fruchtgummi und Lakritz'],
    ['kekse', 'Kekse und Waffeln'],
    ['kuchen', 'Kuchen und Feingebäck'],
    ['saisongebaeck', 'Lebkuchen und Saisongebäck'],
    ['muesliriegel', 'Müsli- und Fruchtriegel'],
    ['speiseeis', 'Speiseeis'],
    ['chips', 'Chips'],
    ['salzgebaeck', 'Salzgebäck und Cracker'],
    ['popcorn', 'Popcorn'],
  ]),
  ...inCategory('aufstriche', [
    ['honig', 'Honig', reference([330, 0.3, 82.2, 0], 24)],
    ['marmelade', 'Marmelade und Konfitüre', reference([275, 0.4, 67.8, 0.1], 18)],
    ['nuss_nougat_creme', 'Nuss-Nougat-Creme'],
    ['aufstrich_herzhaft', 'Brotaufstrich (herzhaft, vegetarisch)'],
  ]),
  ...inCategory('backzutaten', [
    ['zucker', 'Zucker', reference([400, 0, 100, 0])],
    ['suessungsmittel', 'Süßstoff und Zuckerersatz'],
    // Eine Art für Sirup zum Verdünnen und zum Süßen, Nährwerte und Haltbarkeit sind ähnlich.
    ['sirup', 'Sirup und Dicksaft (Frucht-, Ahorn-, Agavensirup)'],
    ['backpulver', 'Backpulver und Natron'],
    ['hefe', 'Hefe'],
    ['vanillezucker', 'Vanillezucker und Backaromen'],
    ['puddingpulver', 'Puddingpulver und Dessertpulver'],
    ['gelatine', 'Gelatine und Agar-Agar'],
    // Backmischungen und Teige stehen alle hier und zählen nur über kcal, weil ihre
    // Zusammensetzung stark schwankt.
    ['backmischung', 'Backmischung (Brot, Kuchen, Muffins)'],
    ['kuvertuere', 'Kuvertüre, Schokotropfen und Glasur'],
    ['marzipan', 'Marzipan und Persipan (Rohmasse)'],
    ['backdekor', 'Streusel und Backdekor'],
    ['teig_gekuehlt', 'Teig (gekühlt: Blätter-, Pizza-, Hefeteig)'],
  ]),
  ...inCategory('gewuerze', [
    ['salz', 'Salz', reference([0, 0, 0, 0])],
    ['pfeffer', 'Pfeffer'],
    ['gewuerze', 'Gewürze (getrocknet)'],
    ['kraeuter_getrocknet', 'Kräuter (getrocknet)'],
    ['gewuerzmischung', 'Gewürzmischungen und Würzsalz'],
    ['roestzwiebeln', 'Röstzwiebeln'],
    ['bruehe', 'Brühe und Fond'],
    ['essig', 'Essig'],
    ['sojasauce', 'Sojasauce und flüssige Würze'],
    ['senf', 'Senf und Meerrettich'],
  ]),
  ...inCategory('saucen', [
    ['ketchup', 'Ketchup'],
    ['mayonnaise', 'Mayonnaise und Remoulade'],
    ['tomatensauce', 'Tomatensauce und Pastasauce'],
    ['pesto', 'Pesto'],
    ['grillsauce', 'Grill- und Würzsaucen (BBQ, Curry, Chili, Salsa)'],
    ['sauce_fertig', 'Fertige Saucen (Hollandaise, Bratensauce)'],
    ['saucenpulver', 'Fix-Produkte und Saucenpulver'],
    ['wuerzpaste', 'Würzpasten (Curry-, Chilipaste)'],
    ['dressing', 'Salatdressing'],
  ]),
  ...inCategory('kaffee_tee', [
    ['kaffee', 'Kaffee'],
    ['instantkaffee', 'Instantkaffee und Kaffeespezialitäten (Pulver)'],
    ['kaffeeersatz', 'Getreidekaffee und Kaffeeersatz'],
    ['kaffeeweisser', 'Kaffeeweißer'],
    ['tee', 'Tee'],
    ['kakaopulver', 'Kakaopulver (ungezuckert)', reference([359, 19.6, 20.9, 13.7])],
    ['kakaogetraenkepulver', 'Kakaogetränkepulver'],
  ]),
  ...inCategory('babynahrung', [
    ['saeuglingsmilch', 'Säuglings- und Folgemilch (Pulver)'],
    ['saeuglingsmilch_trinkfertig', 'Säuglingsmilch (trinkfertig)'],
    ['babybrei', 'Babybrei (Gemüse, Fleisch, Obst)'],
    ['getreidebrei', 'Getreide- und Milchbrei (Pulver)'],
    ['babysnacks', 'Baby- und Kleinkindsnacks'],
    ['babytee', 'Baby- und Kindertee'],
  ]),
  ...inCategory('sonstige_lebensmittel', [
    // Kochzutat mit viel Fett, kein Milchersatz zum Trinken: zählt nicht zum Milch-Ziel.
    ['kokosmilch', 'Kokosmilch'],
    // Meist aus Stärke und Kokosfett, kaum Eiweiß: zählt nicht zum Milch-Ziel.
    ['kaesealternative', 'Käsealternative (pflanzlich)'],
    // Auffang-Art, wenn keine andere passt. Besser eine eigene Art anlegen (#142).
    ['sonstiges_lebensmittel', 'Sonstiges Lebensmittel'],
  ]),
  ...inCategory('spezialnahrung', [
    ['notration', 'Notration und Kompaktnahrung'],
    ['trekkingmahlzeit', 'Trekkingmahlzeit (gefriergetrocknet)'],
    ['trinknahrung', 'Trinknahrung und Trinkmahlzeit'],
    ['proteinpulver', 'Proteinpulver und Shakes'],
    ['proteinriegel', 'Protein- und Energieriegel'],
  ]),
]
