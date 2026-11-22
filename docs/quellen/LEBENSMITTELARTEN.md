# Lebensmittelarten: Startliste v2 (#128)

Recherche und Begründung für die zweite Startliste der Lebensmittelarten. Umgesetzt in
`db/seeds/stammdaten/kategorien.ts` und `db/seeds/stammdaten/arten/*.ts`, Prüfseite:
`docs/konzept/lebensmittelarten.html`. **Abrufdatum aller Quellen: 2026-11-22.** Issues: #128, #126, #110, #142.

**Kurz:** 41 Kategorien, 325 Lebensmittelarten, quer durch das Lebensmittelsortiment eines deutschen
Supermarkts. Die Arten sind gröber als in v1 („Nudeln“ statt Spaghetti, Penne, Fusilli), aber die
Liste ist viel breiter (frisch, Kühlregal, Tiefkühl, Getränke, Süßes, Babynahrung). Die 9
Warengruppen bleiben unverändert, sie sind an die BLE gebunden.

## 1. Wunsch des Maintainers

- Deutlich mehr Lebensmittelarten, „besser zu viel als zu wenig“.
- Die Art ist **grob**: „Nudeln“ reicht, keine Nudelsorten. Unterschieden wird nur, wo es für Vorrat,
  Nährwerte oder Haltbarkeit etwas ändert („Linsen (getrocknet)“ gegen „Linsen (Konserve)“,
  „H-Milch“ gegen „Frischmilch“).
- Das ganze Sortiment, nicht nur klassische Notvorrats-Artikel.

## 2. Vorgehen und Quellen

1. **Ordnungsrahmen BLE.** Der Vorratskalkulator der BLE gliedert in sieben Lebensmittelgruppen
   (Getreideprodukte/Brot/Kartoffeln, Gemüse/Pilze, Obst, Getränke, Milch, Eier/Fleisch/Wurst/Fisch,
   Fette/Öl) und nennt je Gruppe Beispielartikel. Daraus folgt die Pflicht, dass jede Kategorie genau
   einer Warengruppe angehört (bzw. „Sonstiges“, wo die BLE nichts zählt, z. B. Süßes, Gewürze).
   Kartoffeln zählen zur Getreidegruppe, Pilze zum Gemüse, Streichfette und Öl zu den Fetten,
   in der vegetarischen Tabelle Ersatzprodukte zur Gruppe Eier/Fleisch/Fisch.
   - Vorratskalkulator: https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratskalkulator
   - Vorratstabelle (Mischkost, vegetarisch): https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle
     und https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle-vegetarisch
2. **Sortimentsgliederung deutscher Händler** (nur Lebensmittel, nur als Anregung für Breite und
   Zuschnitt, keine Listen übernommen):
   - EDEKA24, Kategoriebaum Lebensmittel (Kaffee & Tee, Süß & Salzig, Backen & Desserts,
     Frühstück & Snacks, Würzmittel & Brühen, Soßen, Beilagen, Konserven, Fertiggerichte):
     https://www.edeka24.de/Lebensmittel/
   - REWE Onlineshop: Obst & Gemüse (frisches Obst, frisches Gemüse, Kräuter, Pilze) und
     Tiefkühl (Eis, Pizza, Gemüse, Fisch, Fleisch, Fertiggerichte, Backwaren, Kartoffelprodukte,
     Kräuter, Obst): https://www.rewe.de/shop/c/obst-gemuese/ und https://www.rewe.de/shop/c/tiefkuehl/
     (die Seiten blocken automatische Abrufe, die Gliederung stammt aus den Suchergebnissen).
   - Knuspr, oberste Ebene (u. a. Obst & Gemüse, Kühlregal, Fleisch & Fisch, Süßes & Salziges,
     Brot & Gebäck, Wurst & Schinken, Tiefkühl, Plant Based, Kochen & Backen, Getränke,
     Baby & Kinder): https://www.knuspr.de/
   - Kaufland (Lebensmittel & Getränke: haltbare Lebensmittel, Backzutaten, Fertiggerichte, Nudeln,
     Brotaufstriche, Konserven, Getränke, Süßigkeiten): nur aus Suchergebnissen, die Seite blockt
     Abrufe: https://www.kaufland.de/c/kaese-und-milchprodukte/~1391/
   - Aldi, Lidl, dm: Die Seiten lieferten keinen Kategoriebaum (Abruf geblockt bzw. leer). Der
     gemeinsame Onlineshop von Aldi Nord und Süd wurde laut Presse 2025 eingestellt. Nicht verwendet.
3. **GS1 GPC** als Gegenprobe für die Gliederung nach Warenart: Familien wie „Bread/Bakery Products“
   (50180000) oder „Milk/Butter/Cream/Yogurts/Cheese/Eggs/Substitutes“ (50130000) im Segment
   Food/Beverage/Tobacco. https://www.gs1.org/standards/gpc
4. **Open Food Facts** nur als gedankliche Anregung, die Seite war beim Abruf nicht erreichbar (503).
   **Keine Daten übernommen** (ODbL mit Share-Alike, siehe EMPFEHLUNGSWERTE.md §5).
5. **Eigene Formulierung.** Alle Namen sind eigene, generische Bezeichnungen ohne Marken. Klammern
   nennen Beispiele, damit Nutzer und KI die Art erkennen („Kohl (Weiß-, Rot-, Spitzkohl, Wirsing)“).

## 3. Gliederungsprinzip

**Kategorie = was es ist und wo es im Haushalt lagert, innerhalb genau einer Warengruppe.**

- Jede Kategorie gehört zu genau einer der 9 Warengruppen (Vorratsrechner, 01 „Ordnungssystem“).
  Gemischte Händler-Abteilungen („Tiefkühl“, „Konserven“, „Frühstück“) werden deshalb **aufgeteilt**:
  TK-Gemüse zählt zum Gemüse, TK-Fisch zu Fisch, TK-Pizza zu Sonstiges.
- **Behälter sind nie eine Kategorie** und stehen nie im Schlüssel (Dose, Glas, Packung, Flasche,
  Tetrapak, Beutel). „Konserve“ ist kein Behälter, sondern die Haltbarmachung (sterilisiert, in Dose
  oder Glas).
- Bei **Gemüse, Obst sowie Fleisch und Fisch** trennt die Haltbarmachung die Kategorien (frisch,
  Konserve, tiefgekühlt). Dort ist sie das, wonach ein Haushalt den Vorrat sortiert (Vorratsregal,
  Kühlschrank, Gefrierschrank), und sonst würde eine Kategorie mit 60 Arten entstehen. In allen
  anderen Bereichen ist die Lagerung nur ein Merkmal der Art (Vorschlag §6).
- Kategorien haben etwa 2 bis 34 Arten (Mittel 8). Große Abteilungen wie „Gemüse, Salat und Kräuter
  (frisch)“ sind bewusst nicht weiter zerteilt, weil Nutzer dort nach Namen suchen.
- Die bisherigen Schlüssel `getreide`, `milch`, `wasser` und `fertiggerichte` bleiben erhalten.

## 4. Granularitätsregel: wann eine eigene Art?

Eine eigene Lebensmittelart gibt es, wenn **mindestens eines** zutrifft:

1. **Andere Haltbarmachung mit deutlich anderer Haltbarkeit oder anderen Nährwerten je 100 g:**
   getrocknet, Konserve, tiefgekühlt, frisch, vorgegart. Beispiele: Linsen (getrocknet) 340 kcal
   gegen Linsen (Konserve) 104 kcal; H-Milch (Monate) gegen Frischmilch (Tage); Reis gegen Reis
   (vorgegart).
2. **Anderes Lebensmittel mit deutlich anderen Nährwerten,** auch wenn es ähnlich aussieht: Joghurt
   gegen Quark, Butter gegen Margarine, Kakaopulver gegen Kakaogetränkepulver, Limonade gegen
   zuckerfreie Limonade, Haferdrink gegen Sojadrink.
3. **Ein im Laden eigenständig gesuchtes Grundprodukt** (Äpfel, Bananen, Möhren, Zwiebeln). Bei
   frischem Obst und Gemüse steht deshalb je gängiger Art ein Eintrag, seltene werden gebündelt
   („Exotische Früchte“, „Wurzelgemüse“).
4. **Ein für den Notvorrat eigens relevanter Artikel**, den die BLE oder das BBK nennt oder der ohne
   Strom funktioniert (Instantkaffee, Konservenbrot, Eipulver, Notration, Leitungswasser selbst
   abgefüllt).

**Keine** eigene Art für: Sorte oder Form (Spaghetti, Penne, Basmati), Fettstufe (Milch 1,5 % oder
3,5 %), Geschmack (Erdbeerjoghurt), Vollkorn, Bio, laktosefrei, Packungsgröße, Marke, Behälter.
Diese Angaben gehören in die Produktbezeichnung („Zusatz“, UX-Konzept Frage 6).

## 5. Übersicht der Kategorien

| Schlüssel | Kategorie | Warengruppe | Arten |
|---|---|---|---|
| `getreide` | 🍝 Nudeln, Reis und Getreide | Getreide, Getreideprodukte, Brot und Kartoffeln | 12 |
| `mehl_griess` | 🌾 Mehl, Grieß und Stärke | Getreide, Getreideprodukte, Brot und Kartoffeln | 4 |
| `cerealien` | 🥣 Müsli, Flocken und Cerealien | Getreide, Getreideprodukte, Brot und Kartoffeln | 4 |
| `brot` | 🍞 Brot, Brötchen und Dauerbackwaren | Getreide, Getreideprodukte, Brot und Kartoffeln | 12 |
| `kartoffeln` | 🥔 Kartoffeln und Kartoffelprodukte | Getreide, Getreideprodukte, Brot und Kartoffeln | 7 |
| `gemuese_frisch` | 🥕 Gemüse, Salat und Kräuter (frisch) | Gemüse und Hülsenfrüchte | 34 |
| `gemuese_konserve` | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | Gemüse und Hülsenfrüchte | 19 |
| `gemuese_tk` | 🥦 Gemüse (tiefgekühlt) | Gemüse und Hülsenfrüchte | 8 |
| `huelsenfruechte` | 🫘 Hülsenfrüchte | Gemüse und Hülsenfrüchte | 8 |
| `obst_frisch` | 🍎 Obst (frisch) | Obst und Nüsse | 13 |
| `obst_haltbar` | 🍑 Obst (Konserve, Mus und tiefgekühlt) | Obst und Nüsse | 4 |
| `trockenobst` | 🍇 Trockenobst | Obst und Nüsse | 7 |
| `nuesse_saaten` | 🥜 Nüsse, Kerne und Saaten | Obst und Nüsse | 14 |
| `milch` | 🥛 Milch und Sahne | Milch und Milchprodukte | 9 |
| `joghurt_quark` | 🥄 Joghurt, Quark und Milchdesserts | Milch und Milchprodukte | 6 |
| `kaese` | 🧀 Käse | Milch und Milchprodukte | 8 |
| `milchalternativen` | 🌱 Pflanzendrinks und Milchalternativen | Milch und Milchprodukte | 5 |
| `fleisch` | 🥩 Fleisch und Geflügel (frisch) | Fisch, Fleisch und Eier | 6 |
| `wurst` | 🥓 Wurst und Schinken | Fisch, Fleisch und Eier | 8 |
| `fisch` | 🐟 Fisch und Meeresfrüchte (frisch) | Fisch, Fleisch und Eier | 4 |
| `fleisch_fisch_tk` | ❄️ Fleisch und Fisch (tiefgekühlt) | Fisch, Fleisch und Eier | 5 |
| `konserven_fleisch_fisch` | 🥫 Fleisch- und Fischkonserven | Fisch, Fleisch und Eier | 8 |
| `eier` | 🥚 Eier | Fisch, Fleisch und Eier | 4 |
| `fleischersatz` | 🌿 Tofu und Fleischersatz | Fisch, Fleisch und Eier | 6 |
| `oele` | 🫒 Speiseöle | Fette und Öle | 3 |
| `streichfette` | 🧈 Butter, Margarine und Speisefette | Fette und Öle | 4 |
| `wasser` | 💧 Wasser | Wasser | 3 |
| `saefte` | 🧃 Säfte und Nektare | Getränke | 5 |
| `erfrischungsgetraenke` | 🥤 Limonaden, Schorlen und Eistee | Getränke | 7 |
| `alkohol` | 🍷 Bier, Wein und Spirituosen | Getränke | 5 |
| `fertiggerichte` | 🍲 Fertiggerichte, Suppen und Feinkost | Sonstiges | 10 |
| `tk_gerichte` | 🍕 Pizza und Fertiggerichte (tiefgekühlt) | Sonstiges | 4 |
| `suesswaren` | 🍫 Süßwaren, Gebäck und Knabbereien | Sonstiges | 12 |
| `aufstriche` | 🍯 Brotaufstriche | Sonstiges | 4 |
| `backzutaten` | 🧁 Backzutaten und Zucker | Sonstiges | 13 |
| `gewuerze` | 🧂 Salz, Gewürze und Würzmittel | Sonstiges | 10 |
| `saucen` | 🍅 Saucen und Dressings | Sonstiges | 9 |
| `kaffee_tee` | ☕ Kaffee, Tee und Kakao | Sonstiges | 7 |
| `babynahrung` | 🍼 Babynahrung | Sonstiges | 6 |
| `sonstige_lebensmittel` | 📦 Sonstige Lebensmittel | Sonstiges | 3 |
| `spezialnahrung` | 🎒 Notrationen und Spezialnahrung | Sonstiges | 5 |

## 6. Vollständige Liste

325 Arten. **Lagerung** = typische Lagerung ungeöffnet (Vorschlag §9). **Richtwert** = im Seed
hinterlegter USDA-Richtwert (kcal je 100 g bzw. ml, übliche Haltbarkeit in Monaten), Details in
EMPFEHLUNGSWERTE.md §4.2. **Herkunft** = bleibt (Schlüssel aus v1), aus … (zusammengelegt), neu.

| Warengruppe | Kategorie | Schlüssel | Lebensmittelart | Lagerung | Richtwert | Herkunft |
|---|---|---|---|---|---|---|
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `nudeln` | Nudeln | trocken | 358 kcal, 24 Mon. | aus `spaghetti`, `penne`, `fusilli` |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `nudeln_frisch` | Frische Nudeln (gekühlt) | Kühlschrank |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `nudeln_gefuellt` | Gefüllte Nudeln (getrocknet) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `reis` | Reis | trocken | 352 kcal, 24 Mon. | aus `langkornreis`, `basmatireis`, `milchreis` |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `reis_vorgegart` | Reis (vorgegart) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `couscous` | Couscous | trocken | 357 kcal | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `bulgur` | Bulgur | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `quinoa` | Quinoa | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `hirse` | Hirse | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `polenta` | Polenta (Maisgrieß) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `graupen` | Graupen | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍝 Nudeln, Reis und Getreide | `getreidekoerner` | Getreidekörner (Weizen, Dinkel, Buchweizen) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🌾 Mehl, Grieß und Stärke | `mehl` | Mehl | trocken | 350 kcal, 12 Mon. | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🌾 Mehl, Grieß und Stärke | `griess` | Grieß | trocken | 344 kcal | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🌾 Mehl, Grieß und Stärke | `speisestaerke` | Speisestärke | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🌾 Mehl, Grieß und Stärke | `paniermehl` | Paniermehl | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥣 Müsli, Flocken und Cerealien | `haferflocken` | Haferflocken | trocken | 362 kcal, 12 Mon. | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥣 Müsli, Flocken und Cerealien | `getreideflocken` | Getreideflocken (Dinkel, Hirse u. a.) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥣 Müsli, Flocken und Cerealien | `muesli` | Müsli | trocken |  | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥣 Müsli, Flocken und Cerealien | `cerealien` | Cornflakes und Frühstückscerealien | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `brot` | Brot (frisch) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `toastbrot` | Toastbrot und Sandwichbrot | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `broetchen` | Brötchen (frisch) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `laugengebaeck` | Laugengebäck | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `wraps` | Wraps, Tortillas und Fladenbrot | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `dauerbrot` | Schnittbrot, lange haltbar (Pumpernickel, Vollkornbrot) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `konservenbrot` | Konservenbrot | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `aufbackbroetchen` | Aufbackbrötchen (haltbar) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `backwaren_tk` | Brot und Brötchen (tiefgekühlt) | Tiefkühl |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `knaeckebrot` | Knäckebrot | trocken | 339 kcal | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `zwieback` | Zwieback | trocken | 420 kcal | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🍞 Brot, Brötchen und Dauerbackwaren | `reiswaffeln` | Reis- und Maiswaffeln | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `kartoffeln` | Kartoffeln | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `kartoffeln_konserve` | Kartoffeln (Konserve) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `kartoffeln_vorgegart` | Kartoffeln (vorgegart, gekühlt) | Kühlschrank |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `kartoffelpueree_pulver` | Kartoffelpüree (Pulver) | trocken | 349 kcal | bleibt |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `knoedel_trocken` | Knödel und Klöße (Pulver, Kochbeutel) | trocken |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `kartoffelteig_gekuehlt` | Gnocchi, Schupfnudeln und Kloßteig (gekühlt) | Kühlschrank |  | neu |
| Getreide, Getreideprodukte, Brot und Kartoffeln | 🥔 Kartoffeln und Kartoffelprodukte | `pommes_tk` | Pommes frites und Kartoffelprodukte (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `moehren` | Möhren | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `zwiebeln` | Zwiebeln | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `knoblauch` | Knoblauch | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `lauch` | Lauch und Frühlingszwiebeln | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `tomaten` | Tomaten | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `gurken` | Gurken | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `paprika` | Paprika | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `zucchini` | Zucchini | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `auberginen` | Auberginen | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `kohl` | Kohl (Weiß-, Rot-, Spitzkohl, Wirsing) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `gruenkohl` | Grünkohl | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `rosenkohl` | Rosenkohl | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `brokkoli` | Brokkoli | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `blumenkohl` | Blumenkohl | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `kohlrabi` | Kohlrabi | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `sellerie` | Sellerie | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `wurzelgemuese` | Wurzelgemüse (Pastinaken, Petersilienwurzel, Rüben) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `rote_bete_frisch` | Rote Bete (frisch oder vorgegart) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `radieschen` | Radieschen und Rettich | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `spinat_frisch` | Spinat und Mangold (frisch) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `gruene_bohnen_frisch` | Grüne Bohnen (frisch) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `spargel` | Spargel | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `fenchel` | Fenchel | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `zuckerschoten` | Zuckerschoten und frische Erbsen | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `chili` | Chili und Peperoni | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `sprossen` | Sprossen und Keimlinge | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `kuerbis` | Kürbis | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `suesskartoffeln` | Süßkartoffeln | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `avocados` | Avocados | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `ingwer` | Ingwer | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `pilze_frisch` | Pilze (frisch) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `blattsalat` | Blattsalat (Kopfsalat, Eisberg, Romana) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `salatmischung` | Salatmischung (verzehrfertig) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🥕 Gemüse, Salat und Kräuter (frisch) | `kraeuter_frisch` | Kräuter (frisch) | Kühlschrank |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `erbsen_konserve` | Erbsen (Konserve) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `mischgemuese_konserve` | Erbsen und Möhren, Mischgemüse (Konserve) | trocken | 41 kcal, 60 Mon. | aus `erbsen_moehren` |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `moehren_konserve` | Möhren (Konserve) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `mais_konserve` | Mais (Konserve) | trocken | 74 kcal, 60 Mon. | aus `mais` |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `gruene_bohnen_konserve` | Grüne Bohnen (Konserve) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `tomaten_konserve` | Tomaten (Konserve, stückig oder passiert) | trocken |  | aus `tomaten_gehackt`, `passierte_tomaten` |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `tomatenmark` | Tomatenmark | trocken | 89 kcal, 27 Mon. | bleibt |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `pilze_konserve` | Pilze (Konserve) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `pilze_getrocknet` | Pilze (getrocknet) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `asiagemuese_konserve` | Asiagemüse (Konserve: Bambus, Sojasprossen) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `rotkohl_konserve` | Rotkohl (Konserve) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `sauerkraut` | Sauerkraut | trocken | 16 kcal, 18 Mon. | bleibt |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `rote_bete_konserve` | Rote Bete (Konserve) | trocken |  | aus `rote_bete` |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `gewuerzgurken` | Gewürzgurken | trocken | 12 Mon. | bleibt |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `mixed_pickles` | Mixed Pickles und Silberzwiebeln | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `spargel_konserve` | Spargel (Konserve) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `oliven` | Oliven | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `antipasti` | Antipasti und eingelegtes Gemüse | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🌽 Gemüse (Konserve, eingelegt, getrocknet) | `trockengemuese` | Trockengemüse | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `spinat_tk` | Spinat (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `erbsen_tk` | Erbsen (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `gruene_bohnen_tk` | Grüne Bohnen (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `brokkoli_tk` | Brokkoli und Blumenkohl (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `kohl_tk` | Kohl (tiefgekühlt: Grünkohl, Rosenkohl, Rotkohl) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `gemuesemischung_tk` | Gemüsemischung (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `suppengemuese_tk` | Suppengemüse (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🥦 Gemüse (tiefgekühlt) | `kraeuter_tk` | Kräuter (tiefgekühlt) | Tiefkühl |  | neu |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `linsen_getrocknet` | Linsen (getrocknet) | trocken | 340 kcal | bleibt |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `linsen_konserve` | Linsen (Konserve) | trocken | 104 kcal, 60 Mon. | aus `linsen` |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `kichererbsen_getrocknet` | Kichererbsen (getrocknet) | trocken | 364 kcal | bleibt |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `kichererbsen_konserve` | Kichererbsen (Konserve) | trocken | 130 kcal, 60 Mon. | aus `kichererbsen` |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `bohnen_getrocknet` | Bohnen (getrocknet) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `bohnen_konserve` | Bohnenkerne (Konserve: weiße, Kidney, schwarze) | trocken |  | aus `weisse_bohnen`, `kidneybohnen` |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `erbsen_getrocknet` | Erbsen (getrocknet) | trocken |  | neu |
| Gemüse und Hülsenfrüchte | 🫘 Hülsenfrüchte | `bohnen_tomatensauce` | Bohnen in Tomatensauce | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `aepfel` | Äpfel | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `birnen` | Birnen | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `bananen` | Bananen | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `orangen` | Orangen, Mandarinen und Grapefruits | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `zitronen` | Zitronen und Limetten | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `weintrauben` | Weintrauben | Kühlschrank |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `beeren` | Beeren (Erdbeeren, Heidelbeeren, Himbeeren) | Kühlschrank |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `steinobst` | Steinobst (Pfirsiche, Pflaumen, Kirschen, Aprikosen) | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `kiwis` | Kiwis | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `melonen` | Melonen | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `ananas_frisch` | Ananas (frisch) | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `exotische_fruechte` | Exotische Früchte (Mango, Papaya, Granatapfel) | trocken |  | neu |
| Obst und Nüsse | 🍎 Obst (frisch) | `obst_geschnitten` | Obst (geschnitten, verzehrfertig) | Kühlschrank |  | neu |
| Obst und Nüsse | 🍑 Obst (Konserve, Mus und tiefgekühlt) | `apfelmus` | Apfelmus | trocken | 70 kcal, 18 Mon. | bleibt |
| Obst und Nüsse | 🍑 Obst (Konserve, Mus und tiefgekühlt) | `obst_konserve` | Obstkonserve (Pfirsiche, Ananas, Mandarinen u. a.) | trocken |  | aus `pfirsiche`, `ananas`, `mandarinen` |
| Obst und Nüsse | 🍑 Obst (Konserve, Mus und tiefgekühlt) | `obst_tk` | Obst und Beeren (tiefgekühlt) | Tiefkühl |  | neu |
| Obst und Nüsse | 🍑 Obst (Konserve, Mus und tiefgekühlt) | `rote_gruetze` | Rote Grütze und Kompott (gekühlt) | Kühlschrank |  | neu |
| Obst und Nüsse | 🍇 Trockenobst | `rosinen` | Rosinen | trocken | 324 kcal, 6 Mon. | bleibt |
| Obst und Nüsse | 🍇 Trockenobst | `trockenpflaumen` | Trockenpflaumen | trocken |  | neu |
| Obst und Nüsse | 🍇 Trockenobst | `aprikosen_getrocknet` | Aprikosen (getrocknet) | trocken |  | neu |
| Obst und Nüsse | 🍇 Trockenobst | `datteln` | Datteln und Feigen (getrocknet) | trocken |  | neu |
| Obst und Nüsse | 🍇 Trockenobst | `kandierte_fruechte` | Kandierte Früchte (Zitronat, Orangeat) | trocken |  | neu |
| Obst und Nüsse | 🍇 Trockenobst | `obst_gefriergetrocknet` | Obst (gefriergetrocknet) | trocken |  | neu |
| Obst und Nüsse | 🍇 Trockenobst | `trockenobst` | Trockenobst (sonstiges, Mischungen) | trocken | 6 Mon. | bleibt |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `walnuesse` | Walnüsse | trocken | 689 kcal | bleibt |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `haselnuesse` | Haselnüsse | trocken | 654 kcal | bleibt |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `mandeln` | Mandeln | trocken | 595 kcal | bleibt |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `erdnuesse` | Erdnüsse | trocken | 613 kcal | bleibt |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `erdnussbutter` | Erdnussbutter und Nussmus | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `cashewkerne` | Cashewkerne | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `pistazien` | Pistazien | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `nuesse_sonstige` | Nüsse (sonstige: Paranüsse, Macadamia, Pekan) | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `nussmischung` | Nussmischung und Studentenfutter | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `kokosraspeln` | Kokosraspeln | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `maronen` | Maronen (vorgegart) | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `sonnenblumenkerne` | Sonnenblumen- und Kürbiskerne | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `leinsamen` | Leinsamen und Chiasamen | trocken |  | neu |
| Obst und Nüsse | 🥜 Nüsse, Kerne und Saaten | `sesam` | Sesam | trocken |  | neu |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `h_milch` | H-Milch | trocken | 61 kcal | bleibt |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `frischmilch` | Frischmilch | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `milchpulver` | Milchpulver | trocken | 499 kcal | bleibt |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `kondensmilch` | Kondensmilch | trocken | 135 kcal | bleibt |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `kaffeesahne` | Kaffeesahne | trocken |  | neu |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `sahne` | Sahne (Schlagsahne, Kochsahne) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `saure_sahne` | Saure Sahne, Schmand und Crème fraîche | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `buttermilch` | Buttermilch und Kefir | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥛 Milch und Sahne | `milchmischgetraenk` | Milchmischgetränke (Kakao, Eiskaffee) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥄 Joghurt, Quark und Milchdesserts | `joghurt` | Joghurt (natur) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥄 Joghurt, Quark und Milchdesserts | `fruchtjoghurt` | Fruchtjoghurt und Joghurtzubereitungen | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥄 Joghurt, Quark und Milchdesserts | `trinkjoghurt` | Trinkjoghurt und Joghurtdrinks | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥄 Joghurt, Quark und Milchdesserts | `quark` | Quark und Skyr | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥄 Joghurt, Quark und Milchdesserts | `pudding` | Pudding und Milchdesserts | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🥄 Joghurt, Quark und Milchdesserts | `milchreis_dessert` | Milchreis und Grießbrei (Dessert) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `hartkaese` | Hartkäse (Emmentaler, Bergkäse, Parmesan) | Kühlschrank | 393 kcal | bleibt |
| Milch und Milchprodukte | 🧀 Käse | `schnittkaese` | Schnittkäse (Gouda, Edamer, Tilsiter) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `weichkaese` | Weichkäse (Camembert, Brie) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `frischkaese` | Frischkäse und Hüttenkäse | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `mozzarella_feta` | Mozzarella und Feta | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `grillkaese` | Grill- und Pfannenkäse (Halloumi) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `sauermilchkaese` | Sauermilchkäse (Harzer, Handkäse) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🧀 Käse | `schmelzkaese` | Schmelzkäse | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🌱 Pflanzendrinks und Milchalternativen | `haferdrink` | Haferdrink | trocken |  | bleibt |
| Milch und Milchprodukte | 🌱 Pflanzendrinks und Milchalternativen | `sojadrink` | Sojadrink | trocken | 53 kcal | bleibt |
| Milch und Milchprodukte | 🌱 Pflanzendrinks und Milchalternativen | `pflanzendrink` | Pflanzendrink (Mandel, Reis, Kokos u. a.) | trocken |  | neu |
| Milch und Milchprodukte | 🌱 Pflanzendrinks und Milchalternativen | `joghurtalternative` | Joghurtalternative (pflanzlich) | Kühlschrank |  | neu |
| Milch und Milchprodukte | 🌱 Pflanzendrinks und Milchalternativen | `sahnealternative` | Sahnealternative (pflanzlich) | trocken |  | neu |
| Fisch, Fleisch und Eier | 🥩 Fleisch und Geflügel (frisch) | `hackfleisch` | Hackfleisch | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥩 Fleisch und Geflügel (frisch) | `rindfleisch` | Rindfleisch | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥩 Fleisch und Geflügel (frisch) | `schweinefleisch` | Schweinefleisch | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥩 Fleisch und Geflügel (frisch) | `gefluegel` | Geflügel (Hähnchen, Pute) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥩 Fleisch und Geflügel (frisch) | `lamm_wild` | Lamm und Wild | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥩 Fleisch und Geflügel (frisch) | `bratwurst` | Bratwurst (roh) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `aufschnitt` | Aufschnitt (Lyoner, Mortadella, Geflügelwurst) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `salami` | Salami und Rohwurst | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `kochschinken` | Kochschinken | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `rohschinken` | Rohschinken | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `streichwurst` | Streichwurst (Leberwurst, Teewurst) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `wiener_bockwurst` | Wiener und Bockwurst (gekühlt) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `leberkaese` | Leberkäse und Fleischkäse | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥓 Wurst und Schinken | `speck` | Speck und Schinkenwürfel | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🐟 Fisch und Meeresfrüchte (frisch) | `fisch_frisch` | Fisch (frisch) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🐟 Fisch und Meeresfrüchte (frisch) | `raeucherfisch` | Räucherfisch (Räucherlachs, Makrele) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🐟 Fisch und Meeresfrüchte (frisch) | `hering_mariniert` | Hering mariniert (Matjes, Bismarck, Rollmops) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🐟 Fisch und Meeresfrüchte (frisch) | `garnelen` | Garnelen und Meeresfrüchte (gekühlt) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | ❄️ Fleisch und Fisch (tiefgekühlt) | `fleisch_tk` | Fleisch (tiefgekühlt) | Tiefkühl |  | neu |
| Fisch, Fleisch und Eier | ❄️ Fleisch und Fisch (tiefgekühlt) | `gefluegel_tk` | Geflügel (tiefgekühlt) | Tiefkühl |  | neu |
| Fisch, Fleisch und Eier | ❄️ Fleisch und Fisch (tiefgekühlt) | `fischfilet_tk` | Fischfilet (tiefgekühlt) | Tiefkühl |  | neu |
| Fisch, Fleisch und Eier | ❄️ Fleisch und Fisch (tiefgekühlt) | `fischstaebchen` | Fischstäbchen und panierter Fisch | Tiefkühl |  | neu |
| Fisch, Fleisch und Eier | ❄️ Fleisch und Fisch (tiefgekühlt) | `garnelen_tk` | Garnelen und Meeresfrüchte (tiefgekühlt) | Tiefkühl |  | neu |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `thunfisch_konserve` | Thunfisch (Konserve) | trocken | 109 kcal, 60 Mon. | aus `thunfisch` |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `sardinen_konserve` | Sardinen (Konserve) | trocken | 202 kcal, 60 Mon. | aus `sardinen` |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `makrele_konserve` | Makrele (Konserve) | trocken | 60 Mon. | aus `makrele` |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `hering_konserve` | Hering (Konserve) | trocken |  | aus `hering` |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `fischkonserve` | Fischkonserve (sonstige: Lachs, Sprotten, Muscheln) | trocken |  | neu |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `fleischkonserve` | Fleischkonserve (Corned Beef, Rindfleisch im eigenen Saft) | trocken | 60 Mon. | bleibt |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `wuerstchen_konserve` | Würstchen (Konserve) | trocken | 227 kcal, 60 Mon. | aus `wuerstchen` |
| Fisch, Fleisch und Eier | 🥫 Fleisch- und Fischkonserven | `wurstkonserve` | Wurstkonserve (Leberwurst, Frühstücksfleisch) | trocken |  | neu |
| Fisch, Fleisch und Eier | 🥚 Eier | `eier` | Eier | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥚 Eier | `eipulver` | Eipulver | trocken | 592 kcal | bleibt |
| Fisch, Fleisch und Eier | 🥚 Eier | `eier_gekocht` | Gekochte Eier (gefärbt oder geschält) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🥚 Eier | `fluessigei` | Flüssigei | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🌿 Tofu und Fleischersatz | `tofu` | Tofu | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🌿 Tofu und Fleischersatz | `tempeh_seitan` | Tempeh und Seitan | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🌿 Tofu und Fleischersatz | `fleischersatz` | Fleischersatz (gekühlt) | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🌿 Tofu und Fleischersatz | `fleischersatz_tk` | Fleischersatz (tiefgekühlt) | Tiefkühl |  | neu |
| Fisch, Fleisch und Eier | 🌿 Tofu und Fleischersatz | `falafel` | Falafel und Gemüsebratlinge | Kühlschrank |  | neu |
| Fisch, Fleisch und Eier | 🌿 Tofu und Fleischersatz | `sojagranulat` | Sojagranulat und Sojaschnetzel | trocken |  | neu |
| Fette und Öle | 🫒 Speiseöle | `speiseoel` | Speiseöl (Raps, Sonnenblume) | trocken | 900 kcal, 12 Mon. | aus `rapsoel`, `sonnenblumenoel` |
| Fette und Öle | 🫒 Speiseöle | `olivenoel` | Olivenöl | trocken | 900 kcal, 12 Mon. | bleibt |
| Fette und Öle | 🫒 Speiseöle | `spezialoel` | Spezialöle (Sesam, Lein, Walnuss) | trocken |  | neu |
| Fette und Öle | 🧈 Butter, Margarine und Speisefette | `butter` | Butter | Kühlschrank |  | neu |
| Fette und Öle | 🧈 Butter, Margarine und Speisefette | `margarine` | Margarine und pflanzliche Streichfette | Kühlschrank |  | neu |
| Fette und Öle | 🧈 Butter, Margarine und Speisefette | `butterschmalz` | Butterschmalz | trocken | 896 kcal | bleibt |
| Fette und Öle | 🧈 Butter, Margarine und Speisefette | `bratfett` | Kokosfett, Plattenfett und Schmalz | trocken |  | neu |
| Wasser | 💧 Wasser | `stilles_wasser` | Stilles Wasser | trocken | 0 kcal | bleibt |
| Wasser | 💧 Wasser | `sprudelwasser` | Sprudelwasser | trocken | 0 kcal | bleibt |
| Wasser | 💧 Wasser | `leitungswasser_abgefuellt` | Leitungswasser (selbst abgefüllt) | trocken |  | neu |
| Getränke | 🧃 Säfte und Nektare | `fruchtsaft` | Fruchtsaft | trocken | 46 kcal, 18 Mon. | bleibt |
| Getränke | 🧃 Säfte und Nektare | `fruchtnektar` | Fruchtnektar | trocken |  | neu |
| Getränke | 🧃 Säfte und Nektare | `gemuesesaft` | Gemüsesaft | trocken |  | neu |
| Getränke | 🧃 Säfte und Nektare | `smoothie` | Smoothies (gekühlt) | Kühlschrank |  | neu |
| Getränke | 🧃 Säfte und Nektare | `zitronensaft` | Zitronensaft | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `limonade` | Limonade und Cola | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `limonade_zuckerfrei` | Limonade und Cola (zuckerfrei) | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `saftschorle` | Saftschorle | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `eistee` | Eistee | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `energydrink` | Energy- und Sportgetränke | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `wasser_geschmack` | Wasser mit Geschmack | trocken |  | neu |
| Getränke | 🥤 Limonaden, Schorlen und Eistee | `getraenkepulver` | Getränkepulver und Elektrolyte | trocken |  | neu |
| Getränke | 🍷 Bier, Wein und Spirituosen | `bier` | Bier | trocken |  | neu |
| Getränke | 🍷 Bier, Wein und Spirituosen | `bier_alkoholfrei` | Bier (alkoholfrei) und Malzbier | trocken |  | neu |
| Getränke | 🍷 Bier, Wein und Spirituosen | `wein` | Wein | trocken |  | neu |
| Getränke | 🍷 Bier, Wein und Spirituosen | `sekt` | Sekt und Schaumwein | trocken |  | neu |
| Getränke | 🍷 Bier, Wein und Spirituosen | `spirituosen` | Spirituosen und Likör | trocken |  | neu |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `ravioli` | Ravioli | trocken | 94 kcal, 60 Mon. | bleibt |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `eintopf` | Eintopf | trocken | 60 Mon. | bleibt |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `fertiggericht_konserve` | Fertiggericht (Konserve: Gulasch, Chili u. a.) | trocken |  | neu |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `suppe` | Suppe (verzehrfertig) | trocken |  | bleibt |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `trockensuppe` | Instantsuppe und Trockensuppe | trocken |  | neu |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `instantnudeln` | Instantnudeln | trocken | 434 kcal | bleibt |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `fertiggericht_trocken` | Fertiggericht zum Anrühren (Nudel-, Reis-, Kartoffelgerichte) | trocken |  | neu |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `fertiggericht_gekuehlt` | Fertiggericht (gekühlt) | Kühlschrank |  | neu |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `feinkostsalat` | Feinkostsalat (Kartoffel-, Nudel-, Fleischsalat) | Kühlschrank |  | neu |
| Sonstiges | 🍲 Fertiggerichte, Suppen und Feinkost | `hummus_dips` | Hummus und Dips | Kühlschrank |  | neu |
| Sonstiges | 🍕 Pizza und Fertiggerichte (tiefgekühlt) | `pizza_tk` | Pizza, Baguette und Flammkuchen (tiefgekühlt) | Tiefkühl |  | neu |
| Sonstiges | 🍕 Pizza und Fertiggerichte (tiefgekühlt) | `fertiggericht_tk` | Fertiggericht (tiefgekühlt) | Tiefkühl |  | neu |
| Sonstiges | 🍕 Pizza und Fertiggerichte (tiefgekühlt) | `snacks_tk` | Snacks und Fingerfood (tiefgekühlt) | Tiefkühl |  | neu |
| Sonstiges | 🍕 Pizza und Fertiggerichte (tiefgekühlt) | `kuchen_tk` | Kuchen und Torten (tiefgekühlt) | Tiefkühl |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `schokolade` | Schokolade | trocken | 528 kcal, 24 Mon. | bleibt |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `schokoriegel` | Schokoriegel und Pralinen | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `bonbons` | Bonbons und Kaugummi | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `fruchtgummi` | Fruchtgummi und Lakritz | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `kekse` | Kekse und Waffeln | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `kuchen` | Kuchen und Feingebäck | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `saisongebaeck` | Lebkuchen und Saisongebäck | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `muesliriegel` | Müsli- und Fruchtriegel | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `speiseeis` | Speiseeis | Tiefkühl |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `chips` | Chips | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `salzgebaeck` | Salzgebäck und Cracker | trocken |  | neu |
| Sonstiges | 🍫 Süßwaren, Gebäck und Knabbereien | `popcorn` | Popcorn | trocken |  | neu |
| Sonstiges | 🍯 Brotaufstriche | `honig` | Honig | trocken | 330 kcal, 24 Mon. | bleibt |
| Sonstiges | 🍯 Brotaufstriche | `marmelade` | Marmelade und Konfitüre | trocken | 275 kcal, 18 Mon. | bleibt |
| Sonstiges | 🍯 Brotaufstriche | `nuss_nougat_creme` | Nuss-Nougat-Creme | trocken |  | neu |
| Sonstiges | 🍯 Brotaufstriche | `aufstrich_herzhaft` | Brotaufstrich (herzhaft, vegetarisch) | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `zucker` | Zucker | trocken | 400 kcal | bleibt |
| Sonstiges | 🧁 Backzutaten und Zucker | `suessungsmittel` | Süßstoff und Zuckerersatz | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `sirup` | Sirup und Dicksaft (Frucht-, Ahorn-, Agavensirup) | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `backpulver` | Backpulver und Natron | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `hefe` | Hefe | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `vanillezucker` | Vanillezucker und Backaromen | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `puddingpulver` | Puddingpulver und Dessertpulver | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `gelatine` | Gelatine und Agar-Agar | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `backmischung` | Backmischung (Brot, Kuchen, Muffins) | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `kuvertuere` | Kuvertüre, Schokotropfen und Glasur | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `marzipan` | Marzipan und Persipan (Rohmasse) | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `backdekor` | Streusel und Backdekor | trocken |  | neu |
| Sonstiges | 🧁 Backzutaten und Zucker | `teig_gekuehlt` | Teig (gekühlt: Blätter-, Pizza-, Hefeteig) | Kühlschrank |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `salz` | Salz | trocken | 0 kcal | bleibt |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `pfeffer` | Pfeffer | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `gewuerze` | Gewürze (getrocknet) | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `kraeuter_getrocknet` | Kräuter (getrocknet) | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `gewuerzmischung` | Gewürzmischungen und Würzsalz | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `roestzwiebeln` | Röstzwiebeln | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `bruehe` | Brühe und Fond | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `essig` | Essig | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `sojasauce` | Sojasauce und flüssige Würze | trocken |  | neu |
| Sonstiges | 🧂 Salz, Gewürze und Würzmittel | `senf` | Senf und Meerrettich | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `ketchup` | Ketchup | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `mayonnaise` | Mayonnaise und Remoulade | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `tomatensauce` | Tomatensauce und Pastasauce | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `pesto` | Pesto | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `grillsauce` | Grill- und Würzsaucen (BBQ, Curry, Chili, Salsa) | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `sauce_fertig` | Fertige Saucen (Hollandaise, Bratensauce) | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `saucenpulver` | Fix-Produkte und Saucenpulver | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `wuerzpaste` | Würzpasten (Curry-, Chilipaste) | trocken |  | neu |
| Sonstiges | 🍅 Saucen und Dressings | `dressing` | Salatdressing | trocken |  | neu |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `kaffee` | Kaffee | trocken |  | bleibt |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `instantkaffee` | Instantkaffee und Kaffeespezialitäten (Pulver) | trocken |  | neu |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `kaffeeersatz` | Getreidekaffee und Kaffeeersatz | trocken |  | neu |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `kaffeeweisser` | Kaffeeweißer | trocken |  | neu |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `tee` | Tee | trocken |  | bleibt |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `kakaopulver` | Kakaopulver (ungezuckert) | trocken | 359 kcal | bleibt |
| Sonstiges | ☕ Kaffee, Tee und Kakao | `kakaogetraenkepulver` | Kakaogetränkepulver | trocken |  | neu |
| Sonstiges | 🍼 Babynahrung | `saeuglingsmilch` | Säuglings- und Folgemilch (Pulver) | trocken |  | neu |
| Sonstiges | 🍼 Babynahrung | `saeuglingsmilch_trinkfertig` | Säuglingsmilch (trinkfertig) | trocken |  | neu |
| Sonstiges | 🍼 Babynahrung | `babybrei` | Babybrei (Gemüse, Fleisch, Obst) | trocken |  | neu |
| Sonstiges | 🍼 Babynahrung | `getreidebrei` | Getreide- und Milchbrei (Pulver) | trocken |  | neu |
| Sonstiges | 🍼 Babynahrung | `babysnacks` | Baby- und Kleinkindsnacks | trocken |  | neu |
| Sonstiges | 🍼 Babynahrung | `babytee` | Baby- und Kindertee | trocken |  | neu |
| Sonstiges | 📦 Sonstige Lebensmittel | `kokosmilch` | Kokosmilch | trocken |  | neu |
| Sonstiges | 📦 Sonstige Lebensmittel | `kaesealternative` | Käsealternative (pflanzlich) | Kühlschrank |  | neu |
| Sonstiges | 📦 Sonstige Lebensmittel | `sonstiges_lebensmittel` | Sonstiges Lebensmittel | trocken |  | neu |
| Sonstiges | 🎒 Notrationen und Spezialnahrung | `notration` | Notration und Kompaktnahrung | trocken |  | neu |
| Sonstiges | 🎒 Notrationen und Spezialnahrung | `trekkingmahlzeit` | Trekkingmahlzeit (gefriergetrocknet) | trocken |  | neu |
| Sonstiges | 🎒 Notrationen und Spezialnahrung | `trinknahrung` | Trinknahrung und Trinkmahlzeit | trocken |  | neu |
| Sonstiges | 🎒 Notrationen und Spezialnahrung | `proteinpulver` | Proteinpulver und Shakes | trocken |  | neu |
| Sonstiges | 🎒 Notrationen und Spezialnahrung | `proteinriegel` | Protein- und Energieriegel | trocken |  | neu |

## 7. Abgleich mit der alten Startliste (70 Arten, 10 Kategorien)

**Alle 70 alten Schlüssel sind abgedeckt:** 45 bleiben unverändert (teils mit neuem Namen oder in
neuer Kategorie), 25 gehen in 16 neue oder umbenannte Arten auf. Es entfällt keine Art ersatzlos.

| Alt | Neu | Grund |
|---|---|---|
| `spaghetti`, `penne`, `fusilli` | `nudeln` | Sorte, gleiche Nährwerte |
| `langkornreis`, `basmatireis`, `milchreis` | `reis` | Sorte (Milchreis als Dessert: `milchreis_dessert`) |
| `linsen`, `kichererbsen`, `mais`, `rote_bete` | `linsen_konserve`, `kichererbsen_konserve`, `mais_konserve`, `rote_bete_konserve` | eindeutiger Schlüssel neben getrocknet bzw. frisch |
| `weisse_bohnen`, `kidneybohnen` | `bohnen_konserve` | Sorte, ähnliche Nährwerte |
| `erbsen_moehren` | `mischgemuese_konserve` | Erbsen und Möhren ist eine Gemüsemischung |
| `tomaten_gehackt`, `passierte_tomaten` | `tomaten_konserve` | Form (stückig, passiert) |
| `pfirsiche`, `ananas`, `mandarinen` | `obst_konserve` | Sorte bei Obstkonserven |
| `thunfisch`, `sardinen`, `makrele`, `hering`, `wuerstchen` | `…_konserve` | eindeutiger Schlüssel neben frisch, mariniert und gekühlt |
| `rapsoel`, `sonnenblumenoel` | `speiseoel` | gleiche Nährwerte und Verwendung. Olivenöl bleibt eigene Art |

**Umbenannt bei gleichem Schlüssel** (Auswahl): `erdnuesse` heißt nur noch „Erdnüsse“ (Erdnussbutter ist
die neue Art `erdnussbutter` bei den Brotaufstrichen), `hartkaese` nennt Beispiele, `kaffeesahne` ist eine
eigene Art ohne Richtwert (die Kondensmilch-Werte gelten nicht eindeutig), `marmelade` heißt „Marmelade und Konfitüre“, `linsen_getrocknet` heißt
„Linsen (getrocknet)“.

**Kategorien:** Bleiben: `getreide` (jetzt „Nudeln, Reis und Getreide“), `milch` („Milch und Sahne“),
`wasser`, `fertiggerichte` („Fertiggerichte, Suppen und Feinkost“). Entfallen und aufgeteilt:
`gemuese_huelsenfruechte`, `obst_nuesse`, `fleisch_fisch_eier`, `fette_oele`, `getraenke`, `sonstiges`.
Neu ist die Auffang-Kategorie `sonstige_lebensmittel` („Sonstige Lebensmittel“, Warengruppe Sonstiges)
mit der Auffang-Art „Sonstiges Lebensmittel“ und Arten, die bewusst nicht zum Milch-Ziel zählen
(Kokosmilch, Käsealternative).

**Neu:** 264 Arten, unter anderem Frischware (Obst, Gemüse, Brot, Fleisch, Wurst, Fisch, Käse,
Joghurt), Tiefkühlkost, vegetarische und vegane Alternativen (Tofu, Fleischersatz, Pflanzendrinks,
Käse- und Joghurtalternativen, wie in EMPFEHLUNGSWERTE.md §7 gewünscht), Getränke ohne Wasser
(Säfte, Limonaden, Alkohol), Süßes und Knabbereien, Backzutaten, Gewürze, Saucen, Babynahrung,
Notrationen.

### 7.1 Richtwerte

Übernommen sind nur die **USDA-Werte aus EMPFEHLUNGSWERTE.md §4.2**, wo sie eindeutig sind: 46 Arten
mit Nährwerten (meist mit Haltbarkeit), 5 nur mit Haltbarkeit. Neue Arten bekommen keine Richtwerte,
das folgt mit Quellen.

- **Zusammengelegt mit gleichen Werten:** `nudeln` (Wert von Spaghetti, Penne, Fusilli), `speiseoel`
  (Raps und Sonnenblume, beide 900 kcal, 12 Monate).
- **Zusammengelegt, Wert der Mehrheit:** `reis` übernimmt den Langkorn-Wert (Langkorn und Basmati
  identisch, Milchreis 347 statt 352 kcal).
- **Leer gelassen, weil nicht eindeutig:** `bohnen_konserve` (weiß 107, Kidney 116 kcal),
  `tomaten_konserve` (gehackt 15, passiert 41 kcal), `obst_konserve` (58 bis 66 kcal je Frucht).
- **Leer gelassen, weil keine USDA-Werte:** Tee und Kaffee standen im Prüfblatt nur als Annahme
  (0 kcal), Checkliste Punkt 11. `erdnuesse` behält die Nährwerte, die Haltbarkeit (24 Monate) galt
  laut Prüfblatt für Erdnussbutter und ist deshalb nicht übernommen.
- Die Werte stehen jetzt im Seed. Die Checkliste U3 im Prüfblatt ist noch offen (Frage 1 unten).

### 7.2 Umgang mit entfallenen System-Einträgen beim erneuten Seed

Der Seed läuft per Upsert und kennt die alten Schlüssel nicht mehr. Damit nichts still verschwindet,
räumt `db/seeds/retired-master-data.ts` nach dem Upsert auf (in derselben Transaktion):

1. **Zusammengelegte Arten:** Produkte, die noch auf eine alte Art zeigen, ziehen auf die neue um
   (`MERGED_FOOD_TYPES`, z. B. `spaghetti` → `nudeln`). Art und Kategorie werden in einer Anweisung
   gesetzt, damit der zusammengesetzte Fremdschlüssel passt.
2. **Unbenutzte** entfallene Arten und Kategorien werden **gelöscht**. Auf einer frischen Installation
   ist das der Normalfall, und so bleibt keine tote Zeile liegen.
3. **Noch benutzte** entfallene Arten (z. B. ohne Nachfolger) und Kategorien (Produkt ohne Art oder
   eigene Art des Haushalts darin) werden **ausgeblendet** statt gelöscht. Das ist dieselbe Regel wie
   für System-Kategorien (EIN-04), der Fremdschlüssel würde das Löschen ohnehin verhindern.

Begründung: Umhängen erhält die Absicht der Zusammenlegung (Spaghetti sind Nudeln), Ausblenden schützt
Daten, die der Seed nicht deuten kann. Migrationen sind nicht betroffen. Grenze: Kommt ein entfallener
Schlüssel später wieder in den Seed, bleibt er ausgeblendet, bis ihn jemand einblendet.

**Pflicht für die Oberfläche und die KI:** Ausgeblendete Arten und Kategorien (`ausgeblendet = true`,
durch den Seed oder durch den Haushalt) müssen überall herausgefiltert werden, wo etwas **neu
ausgewählt** wird: Auswahl und Suche in der Erfassung, „+ Neue Lebensmittelart“, Verwaltung der Arten
(dort sichtbar, aber als ausgeblendet markiert) und vor allem das **KI-Enum** der Rolle `verpackung`
samt Prompt-Liste. Sonst schlägt die KI z. B. eine entfallene Art vor. Bestehende Produkte auf einer
ausgeblendeten Art bleiben sichtbar und zählen weiter. Betrifft #126 (Verwaltung) und #142
(KI-Vorschlag, Dublettenprüfung nur gegen sichtbare Arten).

### 7.3 Nachbesserungen aus dem Review

- **Erdnussbutter und Nussmus** stehen bei `nuesse_saaten` und zählen damit zu Obst und Nüssen.
- **Kokosmilch** und **Käsealternative** stehen in der neuen Auffang-Kategorie „Sonstige Lebensmittel“
  (Warengruppe Sonstiges): Kokosmilch ist eine fettreiche Kochzutat, Käsealternativen sind meist
  Stärke und Kokosfett mit kaum Eiweiß. Beide sollen nicht zum Milch-Ziel zählen (Kommentar im Seed).
- **Keine Überschneidungen mehr:** Dips nur noch als `hummus_dips`, haltbare Salsa gehört zu den
  Würzsaucen (`grillsauce`). Sirup zum Verdünnen und Dicksaft sind eine Art `sirup` bei den
  Backzutaten. „Smoothies und Direktsaft (gekühlt)“ heißt jetzt „Smoothies (gekühlt)“, Direktsaft ist
  Fruchtsaft.
- **Kohl:** neu `gruenkohl`, `rosenkohl` (frisch) und `kohl_tk` (tiefgekühlt).
- **Backmischungen und Teige** stehen einheitlich bei den Backzutaten (Sonstiges): `backmischung`
  umfasst jetzt auch Brot (die Art `brotbackmischung` ist vor dem Merge entfallen), `teig_gekuehlt`
  steht daneben. Sie zählen nur über kcal, weil die Zusammensetzung stark schwankt.
- **Kaffeesahne** ist eine eigene Art ohne Richtwert. Der Kondensmilch-Wert (7,5 % Fett) passt nicht
  eindeutig zu Kaffeesahne (meist 10 bis 12 %).
- **Alkohol** ist im Seed als „nie im Getränke- oder Wasser-Ziel“ kommentiert. Geprüft: Als Trinkmenge
  zählt nur die Warengruppe Wasser (`stock-model.ts`, `WATER_GROUP_KEY`). Die Warengruppe Getränke
  hat kein Ziel. Ihre kcal zählen aber wie alle anderen zur Energie, also auch die von Bier und Wein
  (Frage unten).

## 8. Auswirkung auf die KI (Rolle `verpackung`)

Heute steht die Liste **doppelt** im Aufruf: als Enum `lebensmittelart` im Schema (Structured Outputs)
und als Liste „Schlüssel: Name“ im Prompt (`src/server/ai/prompts.ts`).

**Größe** (gemessen an der Seed-Liste, Tokens geschätzt, nicht mit `count_tokens` gezählt, weil kein
API-Schlüssel zur Verfügung stand):

| | v1 (70 Arten) | v2 (325 Arten) |
|---|---|---|
| Prompt-Liste | ca. 1.700 Zeichen, ca. 600 Tokens | 12.367 Zeichen, ca. 4.000 bis 4.500 Tokens |
| Enum im Schema | ca. 1.000 Zeichen, ca. 350 Tokens | 4.744 Zeichen, ca. 1.500 bis 2.000 Tokens |
| Zusammen | ca. 950 Tokens | ca. 5.500 bis 6.500 Tokens |

Annahme: deutsche Namen mit Umlauten und Slugs mit Unterstrichen ergeben etwa 2,5 bis 3 Zeichen je
Token. Ein Foto mit 1.600 px langer Kante wird von der API auf etwa 1.100 × 1.100 px verkleinert und
kostet rund 1.600 Tokens (Breite × Höhe ÷ 750).

**Kosten je Aufruf** mit Haiku 5.5 (0,10 $ je 1 Mio. Eingabe-Tokens, 0,50 $ Ausgabe, laut
Anthropic-Preisliste, siehe 05): Liste ca. 6.000 Tokens ≈ **0,0006 $**, der ganze Aufruf mit Foto,
Prompt und ca. 150 Ausgabe-Tokens ≈ **0,0009 $**. 1.000 Fotos kosten damit unter 1 $, davon rund
zwei Drittel für die Liste. Mit Sonnet 5.5 (2 $ / 10 $) wären es ≈ 0,012 $ je Aufruf nur für die
Liste. Teuer ist das nicht, aber die Liste ist jetzt der größte Posten der Eingabe.

**Enum oder Prompt?** Laut Anthropic-Doku (Structured Outputs, „Schema complexity limits“) gibt es
**keine feste Obergrenze für die Zahl der Enum-Werte**. Feste Grenzen gelten für strikte Tools (20),
optionale Parameter (24) und Parameter mit Union-Typen (16, `nullable` zählt dazu, `lebensmittelart`
belegt einen). Darüber hinaus begrenzt die API intern die Größe der kompilierten Grammatik (Fehler
„Schema is too complex for compilation“, Zeitlimit 180 s). Grammatiken werden 24 Stunden gecacht,
jede Änderung am Schema kompiliert neu. Ein Enum mit 325 kurzen Strings ist nach dieser Beschreibung
unkritisch. Es bleibt deshalb **im Schema**, weil nur es garantiert, dass ein gültiger Schlüssel
zurückkommt. Hinweise: Groß- und Kleinschreibung von Enum-Werten ist nicht garantiert (Schlüssel sind
klein, also unkritisch). Legt ein Haushalt eine eigene Art an, ändert sich das Enum, und der nächste
Aufruf wartet einmal auf die Kompilierung.
Quelle: https://platform.claude.com/docs/en/build-with-claude/structured-outputs

**Vorschlag (nicht umgesetzt):**
1. **Enum im Schema behalten**, die Prompt-Liste nach Kategorie gruppieren und kürzen
   („Hülsenfrüchte: linsen_getrocknet, linsen_konserve, …“, Namen nur, wo der Schlüssel nicht
   selbsterklärend ist). Spart grob ein Drittel.
2. **Liste vor das Foto ziehen und cachen:** Die Liste ist je Haushalt stabil. Steht sie im System-Prompt
   mit `cache_control` statt nach dem Foto, kostet sie bei Treffern ein Zehntel (Haiku 5.5 cacht ab
   512 Tokens). Das lohnt sich, sobald mehrere Fotos innerhalb von 5 Minuten erfasst werden, also
   beim typischen Einräumen eines Einkaufs.
3. **Nur die Arten einer Kategorie schicken,** wenn die Kategorie schon feststeht (Erfassung aus einer
   Kategorie heraus gestartet, Zweitversuch nach Korrektur). Dann schrumpft die Liste auf höchstens
   34 Arten. Ohne bekannte Kategorie wäre ein vorgeschalteter Aufruf nötig, der mehr kostet als er
   spart. Dafür bekommt das Schema optional zusätzlich ein Enum `kategorie` (41 Werte), was auch
   `neue_lebensmittelart_vorschlag` aus #142 braucht.

## 9. Vorschlag: Merkmal „typische Lagerung“ (Schemaänderung, nicht umgesetzt)

Die Tabelle in §6 nennt je Art die typische Lagerung **ungeöffnet**: `trocken` (Vorratsschrank,
Raumtemperatur), `kuehl` (Kühlschrank) oder `tiefkuehl`. Verteilung: 216 trocken, 87 Kühlschrank, 22
Tiefkühl. Für die Datenbank wäre eine Migration nötig:

- `lebensmittelart.typische_lagerung text` mit CHECK auf `STORAGE_KINDS = ['trocken', 'kuehl',
  'tiefkuehl']` in `src/shared/config/constants.ts`, optional (eigene Arten dürfen leer sein).
- Seed: drittes Feld je Eintrag in `arten/*.ts`.
- Nutzen: Lagerort beim Erfassen vorschlagen (TK → Gefrierschrank), Filter „Was liegt im
  Kühlschrank?“, Hinweis bei Stromausfall („Diese 12 Packungen brauchen Kühlung“), Plausibilität
  (Frischmilch mit MHD in 2 Jahren).
- Bewusst **nicht** in der Kategorie: Lagerung ist eine Eigenschaft der Art, wie der Behälter eine des
  Produkts.

## 10. Offene Fragen an den Maintainer

1. **Richtwerte schon im Seed:** Die USDA-Werte sind wie beauftragt übernommen, obwohl die
   Checkliste U3 in EMPFEHLUNGSWERTE.md §6 noch nicht abgehakt ist. So lassen oder bis zur Freigabe
   wieder leeren?
2. **Kaffee, Tee und Kakao** stehen wie bisher in der Warengruppe Sonstiges. Die BLE zählt Kaffee und
   Tee zu „Getränke“. Umziehen?
3. **Pflanzendrinks** zählen zur Warengruppe Milch und damit zum Milch-Ziel (Kokosmilch und
   Käsealternative nicht mehr, §7.3). Recht so?
4. **Babynahrung** zählt zu Sonstiges (nur kcal). Säuglingsmilch eher zur Warengruppe Milch?
5. **Obstkonserven und Bohnenkerne** sind zusammengelegt. Lieber je Frucht bzw. Bohnensorte, damit die
   belegten Richtwerte erhalten bleiben?
6. **Speiseöl:** Raps und Sonnenblume zusammen, Olivenöl getrennt. Passt das, oder alle Öle in eine Art?
7. **Stilles Wasser und Sprudelwasser** bleiben getrennt (stilles Wasser eignet sich besser zum Kochen
   und für Babynahrung). Oder eine Art „Mineralwasser“?
8. **Frischware und Alkohol:** Sollen kurzlebige Arten (Salat, Frischfleisch) und alkoholische Getränke
   für neue Haushalte **ausgeblendet** starten? Die Liste deckt das ganze Sortiment ab, im Notvorrat
   sind sie selten.
9. **Kategorien nach Haltbarmachung** (frisch, Konserve, tiefgekühlt) nur bei Gemüse, Obst, Fleisch und
   Fisch. Einverstanden, oder Kategorien nur nach Warenart und Lagerung ausschließlich als Merkmal?
10. **Merkmal „typische Lagerung“** (§9) als Migration umsetzen?
11. **Ausgeblendet bleibt ausgeblendet:** Taucht ein entfallener Schlüssel später wieder im Seed auf,
    blendet der Seed ihn nicht von selbst ein. Recht so?
12. **KI-Liste** (§8): Prompt kürzen und cachen, Kategorie-Filter erst mit #142?
13. **Granularitätsbrüche:** Nüsse stehen nach Sorte (Walnüsse, Haselnüsse, Mandeln …), frisches
    Fleisch nach Tierart, andere Bereiche gröber (Obstkonserven, Bohnenkerne). Nüsse zu
    „Nüsse“ zusammenlegen und Fleisch nur nach frisch/TK trennen, oder so lassen?
14. **kcal aus Alkohol:** Bier, Wein und Spirituosen zählen heute zur Energie wie jedes Lebensmittel.
    Sollen alkoholische Getränke bei der Energie ausgenommen werden (würde eine Regel in der
    Rechnung brauchen)?
