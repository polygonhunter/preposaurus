# Prüfblatt Empfehlungswerte (M1-08)

Prüfblatt für den Maintainer (U3). Erst nach Freigabe kommen die Werte als Seed in die Datenbank (M1-09).
**Abrufdatum aller Quellen: 2026-11-22.** Issue: #19, dazu #128 (Startliste der Lebensmittelarten).

**Kennzeichnung**
- **offiziell**: steht so in der verlinkten Primärquelle (BBK, BLE, DGE).
- **abgeleitet**: aus einer offenen Quelle nachvollziehbar gerechnet, Rechenweg steht dabei.
- **Annahme**: keine Quelle, Vorschlag von Preposaurus. Muss ausdrücklich freigegeben werden.
- **⚠ Abweichung**: Wert im Repo (Prototyp, Recherche) passt nicht zur Primärquelle.

Wörtliche Zitate sind auf kurze Stichworte begrenzt. Zahlen sind Fakten mit Quellenangabe.

---

## 1. Offizielle Mengen BBK/BLE (1 Person, 10 Tage)

### 1.1 Quellenlage
| Quelle | Fassung | Was sie sagt | Fundstelle |
|---|---|---|---|
| BBK, Ratgeber „Vorsorgen für Krisen und Katastrophen“ | Stand 11/2025, 2. Auflage, ISBN 978-3-949117-36-7 (Impressum S. 37) | möglichst **10 Tage**, zumindest **3 Tage** hilft schon | S. 3 und S. 6 |
| ebd. | ebd. | **keine kg-Mengen** mehr. Für Mengen verweist das BBK auf den Vorratskalkulator der BLE | S. 6 |
| ebd. | ebd. | Wasser **2 l je Person und Tag**, davon **0,5 l zum Kochen**. Beispiel 3 Personen: 18 l (3 Tage), 30 l (5 Tage), 60 l (10 Tage) | S. 7 |
| BBK, „Checklisten zur Vorsorge“ | PDF, 3 Seiten (Download v=19) | Stufen **3 / 5 / 7 / 10 Tage** für Trinkwasser (2 l je Person und Tag) und für haltbare Lebensmittel | S. 1 |
| BLE, Vorratstabelle Mischkost (PDF) | © BLE 2024, PDF-Metadaten 17.01.2024 | Mengen je Gruppe, Basis **2.200 kcal** je Person und Tag; Energiegehalte aus **BLS 3.02** (MRI 2014), angelehnt an die D-A-CH-Referenzwerte 2015 | S. 1 (einseitig), Fußnoten 1–5 |
| BLE, Vorratstabelle (Webseite) und Vorratskalkulator | ohne Datum; Excel-Datei heißt `2023_03_24_VorratTab.xlsx` | gleiche Gruppensummen; Kalkulator 1–10 Personen, 1–28 Tage, Tageswerte je Gruppe, keine Altersstufen | – |
| BLE, Vorratstabelle vegetarisch | ohne Datum (PDF „Anhang 3.2“, BLE 2024) | wie Mischkost, nur Gruppe Eier/Ersatzprodukte **1,3 kg** | – |

Links:
- BBK-Ratgeber: https://www.bbk.bund.de/SharedDocs/Downloads/DE/Mediathek/Publikationen/Buergerinformationen/Ratgeber/BBK-Vorsorgen-fuer-Krisen-und-Katastrophen.pdf?__blob=publicationFile&v=44
- BBK-Checkliste: https://www.bbk.bund.de/SharedDocs/Downloads/DE/Mediathek/Publikationen/Buergerinformationen/Ratgeber/Checklisten-zur-Vorsorge-Krisen-und-Katastrophen.pdf?__blob=publicationFile&v=19
- BBK-Übersichtsseite: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/ratgeber-checkliste_node.html (nennt keine 3. Auflage)
- BLE-Tabelle Mischkost (PDF): https://www.ernaehrungsvorsorge.de/fileadmin/SITE_MASTER/content/Dokumente/Anhang_3.1_Vorratstabelle_Mischkost_-_DIN_A4.pdf
- BLE-Tabelle (Web): https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle
- BLE-Tabelle vegetarisch: https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle-vegetarisch
- BLE-Vorratskalkulator: https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratskalkulator

### 1.2 Mengen je Warengruppe

Spalte „Seed“ = Vorschlag für `quelle_wert.menge_pro_person_tag` (10-Tage-Menge ÷ 10). Die Tageswerte stehen so auch im Vorratskalkulator (1 Person, 1 Tag).

| Warengruppe im Repo (`warengruppen.ts`) | BLE-Gruppe | Mischkost 10 Tage | vegetarisch 10 Tage | Seed g bzw. ml je Person und Tag | Status | Repo bisher |
|---|---|---|---|---|---|---|
| `getreide` | Getreideprodukte, Brot, Kartoffeln | **3,3 kg** | 3,3 kg | 330 g | offiziell | ⚠ Prototyp 3,5 kg |
| `gemuese_huelsenfruechte` | Gemüse, Pilze (Hülsenfrüchte als Alternative genannt, Fußnote 3) | **4,0 kg** | 4,0 kg | 400 g | offiziell | 4,0 kg ✓ |
| `obst_nuesse` | Obst (Beispiele mit Rosinen, Haselnüssen) | **2,5 kg** | 2,5 kg | 250 g | offiziell | 2,5 kg ✓ |
| `milch` | Milch, Milcherzeugnisse | **2,5 kg** | 2,5 kg | 250 g | offiziell | ⚠ Prototyp 2,6 kg |
| `fleisch_fisch_eier` | Eier, Fleisch, Wurst, Fisch (vegetarisch: Eier, Ersatzprodukte) | **1,2 kg** | **1,3 kg** | 120 g (vegetarisch 130 g) | offiziell | ⚠ Prototyp 1,5 kg |
| `fette_oele` | Fette, Öl | **330 g** | 330 g | 33 g | offiziell | ⚠ Prototyp 357 g |
| `wasser` | Getränke (davon Mineralwasser 20 l) | **20 l** | 20 l | 2.000 ml | offiziell | 20 l ✓ |
| `getraenke` | in „Getränke“ enthalten (Zitronensaft 0,14 l, Instantkaffee 180 g, Tee 90 g) | – | – | kein Ziel | abgeleitet | kein Ziel ✓ |
| `sonstiges` | „Sonstige Lebensmittel“ ohne Menge | – | – | kein Ziel | offiziell | kein Ziel ✓ |

Hinweise:
- **⚠ Abweichung im Prototyp:** `prototypes/lib/categories.ts` nutzt 3.500 / 2.600 / 1.500 / 357 g. Das sind die Werte der **alten BBK-Tabelle** (Ratgeber bis 2025, siehe `research/07` §3 B). Primärquelle heute ist die BLE-Tabelle. Die alten Werte höchstens als „historisch“ erwähnen.
- **Fette:** Die BLE zählt 180 g Streichfett plus 0,15 l Öl als 330 g, setzt Liter also gleich Gramm. Für den Seed reicht 33 g; streng genommen wiegen 0,15 l Rapsöl nur etwa 138 g (Annahme Dichte 0,92, nicht aus der Quelle).
- **Wasser vs. Getränke:** Die BLE kennt nur „Getränke 20 l“. Die Trennung in `wasser` und `getraenke` ist eine Repo-Entscheidung (UMSETZUNG 7.3 / U11). Die 20 l sind laut Fußnote 4 Mineralwasser für 1,5 l Trinken plus 0,5 l Kochen.
- **Abtropfgewicht:** Die BLE gibt Konserven-Beispiele mit **Abtropfgewicht** an. Wer Konserven mit Füllmenge zählt, rechnet sich den Vorrat schöner (UX-Konzept Frage 12).
- **Standardzeitraum:** 10 Tage (`quelle_version.standard_tage = 10`), Etappen 3 / 5 / 7 / 10 laut Checkliste. **offiziell.**

## 2. Bedarf je Person

### 2.1 Was offiziell ist
| Wert | Zahl | Quelle | Status |
|---|---|---|---|
| Energie je Person und Tag | **2.200 kcal**, gleich für alle Altersgruppen | BLE-Tabelle Kopfzeile, Vorratskalkulator | offiziell (Pauschale) |
| Wasser Erwachsene | **2 l** = 1,5 l Trinken + 0,5 l Kochen | BBK-Ratgeber S. 7, BLE Fußnote 4 | offiziell |
| Getränke ab 65 Jahren | **2 l** Getränke („erhöhte Getränkezufuhr“) | BLE Fußnote 4 | offiziell, Kochwasser offen |
| Getränke Kinder bis 12 Jahre (nicht Säuglinge) | **1 l** Getränke | BLE Fußnote 4 | offiziell, Kochwasser offen |
| Säuglinge | keine Werte | BLE nimmt sie in Fußnote 4 aus | offiziell (Lücke) |
| Jugendliche (13–17) | keine eigenen Werte | – | Lücke |

### 2.2 Vorschlag für `quelle_bedarf` (Modus „Offiziell BBK/BLE“)
Eine Zeile je `MEMBER_TYPES`.

| `personengruppe` | `kcal_tag` | `wasser_ml_tag` | Begründung | Status |
|---|---|---|---|---|
| `baby` | – (zählt nicht) | – (zählt nicht) | BLE hat keine Werte; Repo-Regel `MEMBER_TYPES_WITHOUT_NEED`. Hinweis auf Säuglingsnahrung und abgekochtes Wasser bleibt | offiziell (Lücke) + Repo-Regel |
| `kind` (bis 12) | 2.200 | **1.500** | kcal: BLE rechnet pauschal, für Kinder zu hoch, aber auf der sicheren Seite. Wasser: 1 l Getränke (offiziell) + 0,5 l Kochen | kcal offiziell (Pauschale), Wasser: 1 l offiziell, +0,5 l **Annahme** |
| `jugendlich` (13–17) | 2.200 | 2.000 | keine eigene Quelle, wie Erwachsene | **Annahme** |
| `erwachsen` | 2.200 | 2.000 | BBK S. 7, BLE | offiziell |
| `senior` (ab 65) | 2.200 | **2.500** | „erhöhte“ Getränkezufuhr von 2 l heißt: mehr als die 1,5 l Trinkmenge Erwachsener. Kochwasser kommt dazu | 2 l offiziell, +0,5 l **Annahme** |

Strengere Alternative, falls der Maintainer nur den Wortlaut will: Kind 1.000 ml, Senior 2.000 ml.

Repo bisher: `prototypes/lib/supply.ts` nutzt Kind 1.000 ml, Senior 2.000 ml, kcal überall 2.200. Das ist die wörtliche Lesart. `research/07` und `research/08` nennen die Frage „inklusive oder zuzüglich Kochwasser“ ausdrücklich offen. Die Altersgrenze „Kinder bis 12“ im Onboarding (`ONBOARDING.md`, ABGLEICH: „keine Quelle“) hat jetzt eine Quelle: BLE Fußnote 4.

### 2.3 DGE-Richtwerte (für einen späteren Modus „Individuell“)
Nicht für den MVP-Seed, aber geprüft, damit sie nicht erneut recherchiert werden müssen.

**Energie, kcal je Tag, PAL 1,6 (m / w)**, DGE, Stand der Ableitung 2015 – https://www.dge.de/wissenschaft/referenzwerte/energie/

| Alter | 1–<4 | 4–<7 | 7–<10 | 10–<13 | 13–<15 | 15–<19 | 19–<25 | 25–<51 | 51–<65 | ≥65 |
|---|---|---|---|---|---|---|---|---|---|---|
| m | 1.300 | 1.600 | 1.900 | 2.200 | 2.600 | 3.000 | 2.800 | 2.700 | 2.500 | 2.500 |
| w | 1.200 | 1.500 | 1.800 | 2.000 | 2.200 | 2.300 | 2.200 | 2.100 | 2.000 | 1.900 |

Die Seite nennt auch PAL 1,4 und 1,8. Zuschläge: Schwangerschaft +250 (2. Trimester) bzw. +500 kcal (3. Trimester), ausschließliches Stillen +500 kcal. Für Säuglinge gibt es dort keine Energiewerte.

**Wasser durch Getränke, ml je Tag**, DGE, Stand der Ableitung 2000 – https://www.dge.de/wissenschaft/referenzwerte/wasser/

| Alter | 1–<4 | 4–<7 | 7–<10 | 10–<13 | 13–<15 | 15–<19 | 19–<25 | 25–<51 | 51–<65 | ≥65 | Schwangere | Stillende |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Getränke | 820 | 940 | 970 | 1.170 | 1.330 | 1.530 | 1.470 | 1.410 | 1.230 | 1.310 | 1.470 | 1.710 |

Die DGE rechnet etwa ein Drittel des Wassers aus fester Nahrung. Das fehlt bei Trockenvorräten, deshalb rechnen BBK/BLE mit Trink- plus Kochwasser. `research/12` gibt dieselben Werte wieder ✓.

## 3. Vegetarisch und vegan

### 3.1 Offizielle Lage
- **Vegetarisch: offiziell.** Die BLE hat eine eigene Tabelle (ovo-lacto). Einziger Unterschied zur Mischkost: Gruppe „Eier, Ersatzprodukte für Fleisch, Wurst und Fisch“ **1,3 kg statt 1,2 kg** (Beispiele: Tofu, Bratlinge, vegetarische Wurst und Salami, Brotaufstrich, 5 Eier). Alle anderen Gruppen gleich.
- **Vegan: keine offizielle Tabelle** bei BLE oder BBK gefunden (Suche 2026-11-22). Das BBK sagt nur allgemein, der Vorrat solle zu Allergien und Essgewohnheiten passen (Ratgeber S. 6).
- **DGE-Position vegan (2024):** Für gesunde Erwachsene gesundheitsfördernd möglich, **nur mit Vitamin-B12-Ergänzung** und guter Planung. Für Kinder, Jugendliche, Schwangere, Stillende und Senioren keine klare Empfehlung. – https://www.dge.de/wissenschaft/stellungnahmen-und-positionspapiere/positionen/update-of-the-dge-position-on-vegan-diet/ (Langfassung u. a. in Ernährungs Umschau 7/2024). Nur über Sekundärquellen und den Seitentitel geprüft, Wortlaut nicht.

**⚠ Abweichung:** Der Prototyp (`prototypes/lib/diet.ts`) verteilt bei „vegetarisch“ die ganze Gruppe Fleisch/Fisch/Eier auf Hülsenfrüchte (2/3) und Nüsse (1/3). Die BLE macht das nicht: Die Gruppe bleibt und wird mit Eiern und Ersatzprodukten gefüllt (1,3 kg). Der Prototyp war ausdrücklich als ungeprüfte Annahme markiert.

### 3.2 Seed-Vorschlag vegetarisch (offiziell)
`quelle_wert` mit `ernaehrungsform = vegetarisch`: wie Mischkost, nur `fleisch_fisch_eier` = **130 g** je Person und Tag. Keine Verschiebung zwischen Gruppen nötig.

### 3.3 Seed-Vorschlag vegan (**VORSCHLAG, nicht offiziell**)
Ausgangspunkt ist die vegetarische BLE-Tabelle. Ziel: gleiche Masse je Gruppe, wo es geht, und ungefähr gleiche Energie.

| Warengruppe | vegetarisch (BLE) | vegan (Vorschlag) je Person und Tag | Begründung |
|---|---|---|---|
| `fleisch_fisch_eier` | 130 g | **130 g** pflanzliche Eiweißquellen (Tofu, Ersatzprodukte, Aufstriche) | BLE-Beispiele sind zum größten Teil schon pflanzlich; nur die 5 Eier (etwa 265 g, BLE: 53 g je Ei) fallen weg und werden mengengleich ersetzt |
| `milch` | 250 g | **200 g** angereicherte Pflanzendrinks (H-Ware) | ersetzt 2 l H-Milch 1:1. Pflanzendrinks stehen im Seed schon unter „Milch“ |
| `obst_nuesse` | 250 g | **280 g** (+30 g Nüsse, Nussmus) | ersetzt 500 g Hartkäse. Energie: 500 g Hartkäse ≈ 1.890 kcal (BLE-Wert 378 kcal/100 g); 300 g Nüsse ≈ 1.800–1.960 kcal (USDA-Werte in §4: Mandeln 595, Haselnüsse 654 kcal/100 g, LMIV-Rechnung) |
| übrige Gruppen | wie vegetarisch | unverändert | – |

- Masse gesamt: −20 g je Tag (500 g Käse → 300 g Nüsse), Energie etwa gleich. Eiweiß wird etwas weniger (Käse etwa 27 g/100 g, Nüsse etwa 15–21 g/100 g); das fängt die Gruppe `fleisch_fisch_eier` teilweise auf. Diese Bilanz ist **abgeleitet** aus den Tabellenwerten, nicht offiziell.
- Hinweis **Vitamin B12** bei veganer Ernährung freundlich anzeigen (DGE 2024), nicht als Vorratsmenge rechnen.
- Für den Seed als eigene `quelle` bzw. eigene Version „Preposaurus-Vorschlag“ führen, nicht unter BBK/BLE, damit niemand ihn für amtlich hält.
- Modell: `DATENKATALOG.md` §5 Nr. 12 schlägt Zeilen je Ernährungsform vor. Mit diesem Vorschlag braucht es keine Verschiebungsregeln mehr, die Zahlen stehen direkt je Form.

## 4. Richtwerte je Lebensmittelart

### 4.1 Vorgehen
- **Nährwerte:** USDA FoodData Central, Datensatz **SR Legacy** (letzte Fassung April 2018), Download `FoodData_Central_sr_legacy_food_csv_2018-04.zip` von https://fdc.nal.usda.gov/download-datasets/. Je Art genau ein Eintrag (FDC-ID in der Tabelle), kein Mittelwert.
- **Umrechnung auf EU-Etikett (abgeleitet):** USDA zählt Ballaststoffe in den Kohlenhydraten mit und rechnet kcal mit eigenen Faktoren. Deutsche Etiketten (LMIV Anhang XIV) nicht. Deshalb:
  - **KH = Kohlenhydrate (by difference) − Ballaststoffe**
  - **kcal (LMIV) = 4 × Eiweiß + 4 × KH + 9 × Fett + 2 × Ballaststoffe**
  - Die USDA-kcal stehen zum Vergleich daneben. Große Unterschiede gibt es nur bei ballaststoffreichen Produkten (Kakao 359 statt 228).
- **Haltbarkeit:** USDA FSIS **FoodKeeper** (CC0), Spalte „Pantry, ab Kauf“. **Annahme:** Vorgeschlagen ist jeweils der **obere** Wert der Spanne in Monaten (diese Regel steht in keiner Quelle), damit die Plausibilitätsprüfung (MHD mehr als doppelt so weit wie üblich, `FAR_FROM_TYPICAL_FACTOR = 2`) nicht bei normaler Ware anschlägt. Die Spanne steht in der Quelle-Spalte.
  - **Einschränkung:** Die Original-Datei `fsis.usda.gov/shared/data/EN/foodkeeper.json` blockt automatische Abrufe (HTTP 403). Die Werte stammen aus einer Kopie des Datensatzes auf GitHub (`FlamingLasrSwrd/structr-recipe`, `data/foodkeeper/foodkeeper.json`, Kopf nennt FSIS als Quelle, Stand 09-06-2018, 128 Produkte). **Vor der Freigabe in der FoodKeeper-App (foodsafety.gov) stichprobenartig gegenprüfen.**
  - FoodKeeper beschreibt US-Lagerung. Für deutsche Supermarkt-Konserven nennt die Verbraucherzentrale Sachsen ein MHD von **meist 18 Monaten nach Abfüllung** (Marktcheck „Lebensmittelvorrat“, Februar 2025, Abschnitt 6.1.1, PDF-S. 11, https://verbraucherzentrale-sachsen.de/sites/default/files/2025-02/250206_marktcheck_notfallvorrat_vzs.pdf). FoodKeeper sagt für Konserven mit wenig Säure 2–5 Jahre. Für den Hinweistext „üblich“ ist 18 Monate realistischer, für die Plausibilität 60. **Entscheidung nötig** (Checkliste).
- **Leer gelassen** wurde, wo kein passender Eintrag existiert, die Art zu breit ist (Sammelarten) oder US-Ware deutlich anders ist als deutsche.
- **Bezugsbasis:** Werte gelten je 100 g wie im Eintrag beschrieben. „abgetropft“ = Abtropfgewicht, „mit Aufguss/Saft“ = Füllmenge. Das muss zu `nutritionBase` passen (Abtropfgewicht, falls gesetzt).

### 4.2 Tabelle (70 Arten aus `db/seeds/stammdaten/lebensmittelarten.ts`)
Werte je 100 g bzw. 100 ml. kcal (LMIV) und KH sind **abgeleitet**, Eiweiß, Fett und kcal USDA stammen direkt aus FDC.

| Schlüssel | Art | kcal (LMIV) | kcal USDA | Eiweiß g | KH g | Fett g | Haltbarkeit Monate | Quelle Nährwerte | Quelle Haltbarkeit (FoodKeeper) | Hinweis |
|---|---|---|---|---|---|---|---|---|---|---|
| `spaghetti` | Spaghetti | 358 | 371 | 13 | 71,5 | 1,5 | 24 | FDC 168927 (Pasta, dry, unenriched) | Pasta, dry (2 J.) |  |
| `penne` | Penne | 358 | 371 | 13 | 71,5 | 1,5 | 24 | FDC 168927 (Pasta, dry, unenriched) | Pasta, dry (2 J.) | Wert wie Spaghetti |
| `fusilli` | Fusilli | 358 | 371 | 13 | 71,5 | 1,5 | 24 | FDC 168927 (Pasta, dry, unenriched) | Pasta, dry (2 J.) | Wert wie Spaghetti |
| `langkornreis` | Langkornreis | 352 | 365 | 7,1 | 78,7 | 0,7 | 24 | FDC 169756 (Rice, white, long-grain, regular, raw, unenriched) | Rice, white (2 J.) |  |
| `basmatireis` | Basmatireis | 352 | 365 | 7,1 | 78,7 | 0,7 | 24 | FDC 169756 (Rice, white, long-grain, regular, raw, unenriched) | Rice, white (2 J.) | Stellvertreter: Langkornreis (Basmati fehlt in SR Legacy) |
| `milchreis` | Milchreis | 347 | 358 | 6,5 | 79,2 | 0,5 | 24 | FDC 168931 (Rice, white, short-grain, raw, unenriched) | Rice, white (2 J.) | Rundkornreis; ohne Ballaststoffangabe, KH = Kohlenhydrate gesamt |
| `haferflocken` | Haferflocken | 362 | 379 | 13,2 | 57,6 | 6,5 | 12 | FDC 173904 (Cereals, oats, regular and quick, not fortified, dry) | Cereal, cook before eating (12 Mon.) |  |
| `knaeckebrot` | Knäckebrot | 339 | 366 | 7,9 | 65,7 | 1,3 |  | FDC 172739 (Crackers, crispbread, rye) | – | Roggenknäcke; Haltbarkeit nicht im Datensatz |
| `zwieback` | Zwieback | 420 | 426 | 10,1 | 71,7 | 9,7 |  | FDC 171372 (Zwieback) | – | Haltbarkeit nicht im Datensatz |
| `mehl` | Mehl | 350 | 364 | 10,3 | 73,6 | 1 | 12 | FDC 169761 (Wheat flour, white, all-purpose, unenriched) | Flour, white (6–12 Mon.) | US-Weißmehl; *Einschätzung:* etwa Type 405/550 |
| `griess` | Grieß | 344 | 360 | 12,7 | 68,9 | 1,1 |  | FDC 168933 (Semolina, unenriched) | – | Hartweizengrieß; Weichweizengrieß weicht leicht ab |
| `couscous` | Couscous | 357 | 376 | 12,8 | 72,4 | 0,6 |  | FDC 169699 (Couscous, dry) | – |  |
| `kartoffelpueree_pulver` | Kartoffelpüree (Pulver) | 349 | 354 | 8,3 | 74,6 | 0,4 |  | FDC 170445 (Potatoes, mashed, dehydrated, flakes without milk, dry form) | – | Flocken ohne Milch, trocken |
| `muesli` | Müsli | | | | | |  | – | – | kein passender Eintrag, Sorten streuen stark |
| `linsen` | Linsen | 104 | 116 | 9 | 12,2 | 0,4 | 60 | FDC 172421 (Lentils, mature seeds, cooked, boiled, without salt) | Canned goods, low acid (2–5 J.) | Stellvertreter: gekocht (keine Linsenkonserve in SR Legacy) |
| `linsen_getrocknet` | Linsen getrocknet | 340 | 352 | 24,6 | 52,7 | 1,1 |  | FDC 172420 (Lentils, raw) | – | roh |
| `kichererbsen` | Kichererbsen | 130 | 139 | 7 | 16,1 | 2,8 | 60 | FDC 173800 (Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained solids) | Canned goods, low acid (2–5 J.) | Konserve, abgetropft |
| `kichererbsen_getrocknet` | Kichererbsen getrocknet | 364 | 378 | 20,5 | 50,8 | 6 |  | FDC 173756 (Chickpeas (garbanzo beans, bengal gram), mature seeds, raw) | – | roh |
| `weisse_bohnen` | Weiße Bohnen | 107 | 114 | 7,3 | 16,4 | 0,3 | 60 | FDC 175204 (Beans, white, mature seeds, canned) | Canned goods, low acid (2–5 J.) | Konserve |
| `kidneybohnen` | Kidneybohnen | 116 | 124 | 8 | 16 | 1,1 | 60 | FDC 174285 (Beans, kidney, red, mature seeds, canned, drained solids) | Canned goods, low acid (2–5 J.) | Konserve, abgetropft |
| `mais` | Mais | 74 | 67 | 2,3 | 12,3 | 1,2 | 60 | FDC 169214 (Corn, sweet, yellow, canned, whole kernel, drained solids) | Canned goods, low acid (2–5 J.) | Konserve, abgetropft |
| `erbsen_moehren` | Erbsen & Möhren | 41 | 38 | 2,2 | 6,5 | 0,3 | 60 | FDC 170424 (Peas and carrots, canned, regular pack, solids and liquids) | Canned goods, low acid (2–5 J.) | Konserve mit Aufguss |
| `tomaten_gehackt` | Tomaten gehackt | 15 | 16 | 0,8 | 1,6 | 0,2 | 18 | FDC 170051 (Tomatoes, red, ripe, canned, packed in tomato juice) | Canned goods, high acid (12–18 Mon.) | in Tomatensaft |
| `passierte_tomaten` | Passierte Tomaten | 41 | 38 | 1,6 | 7,1 | 0,2 | 18 | FDC 170460 (Tomato products, canned, puree, without salt added) | Canned goods, high acid (12–18 Mon.) | US-Püree; *Einschätzung:* etwas dicker als Passata |
| `tomatenmark` | Tomatenmark | 89 | 82 | 4,3 | 14,8 | 0,5 | 27 | FDC 170459 (Tomato products, canned, paste, without salt added (Includes foods for USDA's Food Distribution Program)) | Tomato paste (27 Mon.) | US-Paste; *Einschätzung:* etwa zweifach konzentriert |
| `sauerkraut` | Sauerkraut | 16 | 19 | 0,9 | 1,4 | 0,1 | 18 | FDC 169279 (Sauerkraut, canned, solids and liquids) | Canned goods, high acid (12–18 Mon.) | Konserve mit Aufguss |
| `rote_bete` | Rote Bete | | | | | |  | – | – | US-Wert ohne Zucker/Essig; *Einschätzung:* deutsche Ware meist süßsauer, daher leer |
| `gewuerzgurken` | Gewürzgurken | | | | | | 12 | – | Pickles (1 J.) | *Einschätzung:* US-Gurken (sauer bzw. sehr süß) passen nicht zu deutscher Ware, Nährwerte leer |
| `apfelmus` | Apfelmus | 70 | 68 | 0,2 | 16,3 | 0,2 | 18 | FDC 171696 (Applesauce, canned, sweetened, without salt) | Canned goods, high acid (12–18 Mon.) | gezuckert; ungezuckert: 42 kcal (FDC 171695) |
| `pfirsiche` | Pfirsiche | 58 | 54 | 0,5 | 13,2 | 0 | 18 | FDC 169111 (Peaches, canned, light syrup pack, solids and liquids) | Canned goods, high acid (12–18 Mon.) | leichter Sirup, mit Saft |
| `ananas` | Ananas | 64 | 60 | 0,4 | 14,9 | 0,1 | 18 | FDC 169126 (Pineapple, canned, juice pack, solids and liquids) | Canned goods, high acid (12–18 Mon.) | im eigenen Saft, mit Saft |
| `mandarinen` | Mandarinen | 66 | 61 | 0,5 | 15,5 | 0,1 | 18 | FDC 169924 (Tangerines, (mandarin oranges), canned, light syrup pack) | Canned goods, high acid (12–18 Mon.) | leichter Sirup |
| `rosinen` | Rosinen | 324 | 299 | 3,3 | 74,8 | 0,2 | 6 | FDC 168165 (Raisins, dark, seedless (Includes foods for USDA's Food Distribution Program)) | Fruits, dried (6 Mon.) |  |
| `trockenobst` | Trockenobst | | | | | | 6 | – | Fruits, dried (6 Mon.) | Sammelart, Nährwerte streuen zu stark |
| `walnuesse` | Walnüsse | 689 | 654 | 15,2 | 7 | 65,2 |  | FDC 170187 (Nuts, walnuts, english) | – | FoodKeeper nennt nur 2–4 Wochen (US, ohne Verpackungsbezug), nicht übernommen |
| `haselnuesse` | Haselnüsse | 654 | 628 | 14,9 | 7 | 60,8 |  | FDC 170581 (Nuts, hazelnuts or filberts) | – | Haltbarkeit nicht im Datensatz |
| `mandeln` | Mandeln | 595 | 579 | 21,1 | 9,1 | 49,9 |  | FDC 170567 (Nuts, almonds) | – | FoodKeeper nennt 4 Monate; *Einschätzung:* deutlich kürzer als übliche Packungsangaben, nicht übernommen |
| `erdnuesse` | Erdnüsse und Erdnussbutter | 613 | 587 | 24,4 | 12,9 | 49,7 | 24 | FDC 173806 (Peanuts, all types, dry-roasted, without salt) | Peanut butter (6–24 Mon.) | Erdnüsse geröstet; Erdnussbutter 598 kcal (FDC 172470). Haltbarkeit gilt für Erdnussbutter |
| `h_milch` | H-Milch | 61 | 61 | 3,1 | 4,8 | 3,3 |  | FDC 172217 (Milk, whole, 3.25% milkfat, without added vitamin A and vitamin D) | – | US-Vollmilch 3,25 % Fett (deutsche H-Milch 3,5 %) |
| `haferdrink` | Haferdrink | | | | | |  | – | – | nicht in SR Legacy |
| `sojadrink` | Sojadrink | 53 | 54 | 3,3 | 5,7 | 1,8 |  | FDC 172446 (Soymilk, original and vanilla, unfortified) | – | nicht angereichert |
| `kondensmilch` | Kondensmilch | 135 | 134 | 6,8 | 10 | 7,6 |  | FDC 171276 (Milk, canned, evaporated, with added vitamin D and without added vitamin A) | – | ungezuckert (evaporated, 7,6 g Fett laut FDC; *Einschätzung:* entspricht deutscher Kondensmilch 7,5 %) |
| `milchpulver` | Milchpulver | 499 | 496 | 26,3 | 38,4 | 26,7 |  | FDC 173454 (Milk, dry, whole, without added vitamin D) | – | Vollmilchpulver |
| `hartkaese` | Hartkäse | 393 | 393 | 27 | 1,4 | 31 |  | FDC 171251 (Cheese, swiss) | – | Stellvertreter: Swiss (Emmentaler-Art); Parmesan 392 kcal (FDC 170848) |
| `thunfisch` | Thunfisch | 109 | 116 | 25,5 | 0 | 0,8 | 60 | FDC 171986 (Fish, tuna, light, canned in water, without salt, drained solids) | Canned goods, low acid (2–5 J.) | in Wasser, abgetropft. Andere FDC-Einträge: 86 kcal (15121, Wasser), 198 kcal (173708, Öl) |
| `sardinen` | Sardinen | 202 | 208 | 24,6 | 0 | 11,4 | 60 | FDC 175139 (Fish, sardine, Atlantic, canned in oil, drained solids with bone) | Canned goods, low acid (2–5 J.) | in Öl, abgetropft, mit Gräten |
| `makrele` | Makrele | | | | | | 60 | – | Canned goods, low acid (2–5 J.) | SR Legacy hat nur Stöcker (jack) als Konserve, nicht Atlantik-Makrele |
| `hering` | Hering | | | | | |  | – | – | deutsche Heringskonserven (Tomatensoße, Marinade) nicht abgebildet |
| `fleischkonserve` | Fleischkonserve | | | | | | 60 | – | Canned goods, low acid (2–5 J.) | Sammelart, Nährwerte streuen zu stark |
| `wuerstchen` | Würstchen | 227 | 230 | 10,5 | 2,6 | 19,4 | 60 | FDC 172942 (Sausage, Vienna, canned, chicken, beef, pork) | Canned goods, low acid (2–5 J.) | Vienna sausage, Konserve |
| `eipulver` | Eipulver | 592 | 592 | 48 | 1,1 | 43,9 |  | FDC 172188 (Egg, whole, dried) | – | Vollei, getrocknet |
| `rapsoel` | Rapsöl | 900 | 884 | 0 | 0 | 100 | 12 | FDC 172336 (Oil, canola) | Canola oil (1 J.) |  |
| `olivenoel` | Olivenöl | 900 | 884 | 0 | 0 | 100 | 12 | FDC 171413 (Oil, olive, salad or cooking) | Oils, olive or vegetable (6–12 Mon.) |  |
| `sonnenblumenoel` | Sonnenblumenöl | 900 | 884 | 0 | 0 | 100 | 12 | FDC 171017 (Oil, sunflower, linoleic (less than 60%)) | Oils, olive or vegetable (6–12 Mon.) |  |
| `butterschmalz` | Butterschmalz | 896 | 876 | 0,3 | 0 | 99,5 |  | FDC 173412 (Butter oil, anhydrous) | – | Butter oil, anhydrous |
| `stilles_wasser` | Stilles Wasser | 0 | 0 | 0 | 0 | 0 |  | FDC 174158 (Water, bottled, generic) | – | Haltbarkeit: VZ Sachsen „fast unbegrenzt“, keine Zahl |
| `sprudelwasser` | Sprudelwasser | 0 | 0 | 0 | 0 | 0 |  | FDC 174842 (Beverages, carbonated, club soda) | – | Club Soda; Haltbarkeit wie stilles Wasser |
| `fruchtsaft` | Fruchtsaft | 46 | 46 | 0,1 | 11,1 | 0,1 | 18 | FDC 173933 (Apple juice, canned or bottled, unsweetened, without added ascorbic acid) | Canned goods, high acid (12–18 Mon.) | Stellvertreter: Apfelsaft |
| `ravioli` | Ravioli | 94 | 97 | 3,2 | 11,8 | 3,4 | 60 | FDC 173329 (Ravioli, meat-filled, with tomato sauce or meat sauce, canned) | Canned goods, low acid (2–5 J.) | mit Fleisch, in Tomatensoße, Konserve |
| `eintopf` | Eintopf | | | | | | 60 | – | Canned goods, low acid (2–5 J.) | Sammelart, Nährwerte streuen zu stark |
| `suppe` | Suppe | | | | | |  | – | – | Dose oder Trockensuppe offen, daher leer |
| `instantnudeln` | Instantnudeln | 434 | 440 | 10,2 | 57,4 | 17,6 |  | FDC 171177 (Soup, ramen noodle, any flavor, dry) | – | Ramen, trocken |
| `honig` | Honig | 330 | 304 | 0,3 | 82,2 | 0 | 24 | FDC 169640 (Honey) | Honey (2 J.) |  |
| `zucker` | Zucker | 400 | 387 | 0 | 100 | 0 |  | FDC 169655 (Sugars, granulated) | – | FoodKeeper: unbegrenzt, als Monatszahl nicht darstellbar |
| `salz` | Salz | 0 | 0 | 0 | 0 | 0 |  | FDC 173468 (Salt, table) | – | FoodKeeper: unbegrenzt, als Monatszahl nicht darstellbar |
| `marmelade` | Marmelade | 275 | 278 | 0,4 | 67,8 | 0,1 | 18 | FDC 169641 (Jams and preserves) | Jams, jellies, and preserves (6–18 Mon.) |  |
| `schokolade` | Schokolade | 528 | 535 | 7,7 | 56 | 29,7 | 24 | FDC 167587 (Candies, milk chocolate) | Chocolate, unsweetened/semi-sweet (1–2 J.) | Stellvertreter: Vollmilch; Zartbitter 70–85 % 598 kcal (FDC 170273) |
| `kakaopulver` | Kakaopulver | 359 | 228 | 19,6 | 20,9 | 13,7 |  | FDC 169593 (Cocoa, dry powder, unsweetened) | – | ungezuckert; Kakaogetränkepulver ist etwas anderes |
| `tee` | Tee | 0 | | 0 | 0 | 0 |  | **Annahme** | – | BLE Fußnote 5: Tee als Getränk 0 kcal. Trockenware zählt bewusst nicht zur Energie (Seed-Kommentar) |
| `kaffee` | Kaffee | 0 | | 0 | 0 | 0 |  | **Annahme** | – | BLE Fußnote 5: Kaffee als Getränk 2 kcal je 100 ml. Pulver zählt bewusst nicht zur Energie |

Zusammenfassung: 70 Arten. Nährwerte für 60 (davon 2 als Annahme: Tee, Kaffee), leer für 10. Haltbarkeit vorgeschlagen für 40, leer für 30.

### 4.3 Gegenprobe mit der BLE-Tabelle (BLS 3.02)
Die BLE-Tabelle Mischkost nennt je Beispiel den Energiegehalt je 100 g aus dem BLS 3.02. Zum Vergleich mit den USDA-Werten (kcal LMIV) aus §4.2. Die BLE-Werte sind **nicht** als Seed vorgeschlagen (Lizenz siehe §5), sie zeigen nur die Größenordnung. **BLE-kcal stehen nur zum Vergleich im Prüfblatt, nicht in Code oder Seed.**

| Art | BLE (BLS 3.02) kcal/100 g | USDA, LMIV-Rechnung | Bemerkung |
|---|---|---|---|
| Nudeln roh | 357 | 358 | ✓ |
| Reis roh | 355 | 352 | ✓ |
| Haferflocken | 373 | 362 | ✓ |
| Knäckebrot | 349 | 339 | ✓ |
| Zwieback | 385 | 420 | US-Zwieback fetter (9,7 g Fett) |
| Mais, Konserve (abgetropft) | 81 | 74 | ✓ |
| Sauerkraut, Konserve | 21 | 16 | ✓ |
| Saure Gurken, Konserve | 11 | – (leer) | BLE-Wert passt zu sauren, nicht zu süßsauren Gurken |
| Rote Bete, Konserve | 36 | – (leer) | kcal ließe sich aus der BLE übernehmen, Makros fehlen |
| Mandarinen, Konserve | 86 (Abtropfgewicht) | 66 (mit Sirup) | andere Bezugsbasis |
| Ananas, Konserve | 69 (Abtropfgewicht) | 64 (mit Saft) | andere Bezugsbasis |
| Rosinen | 314 | 324 | ✓ |
| Haselnusskerne | 664 | 654 | ✓ |
| H-Milch 3,5 % | 66 | 61 | US-Milch 3,25 % Fett |
| Hartkäse | 378 | 393 | Stellvertreter Swiss |
| Thunfisch ohne Öl (abgetropft) | 100 | 109 | ✓ |
| Ölsardinen (abgetropft) | 221 | 202 | ✓ |
| Heringsfilet in Soße | 204 | – (leer) | kcal ließe sich aus der BLE übernehmen |
| Bockwürstchen, Konserve | 271 | 227 (Vienna sausage) | *Einschätzung:* deutsche Würstchen fetter |
| Speiseöl (Rapsöl) | 884 | 900 | USDA-Eigenwert ist 884 |

Ergebnis: Bei Grundnahrungsmitteln liegen beide Quellen meist innerhalb von 5 %. Größere Abstände gibt es bei Würstchen, Zwieback und überall, wo die Bezugsbasis abweicht (Abtropfgewicht vs. mit Aufguss).

Randnotiz: Auf der BLE-Webseite „Vorratstabelle vegetarisch“ steht bei Kartoffeln, roh (710 g, 76 kcal/100 g) als Gesamtwert **450 kcal**. Rechnerisch ergeben sich etwa 540 kcal, wie in der Mischkost-Tabelle. Vermutlich ein Zahlendreher auf der BLE-Seite. Für Preposaurus ohne Folgen, weil keine BLE-kcal übernommen werden.

## 5. Lizenz: Dürfen die Werte in ein AGPL-Repo?

Keine Rechtsberatung. Einschätzung aus den Nutzungsbedingungen der Quellen.

| Quelle | Lage | Folge für den Seed |
|---|---|---|
| **USDA FoodData Central** (Nährwerte) | Laut FDC-Startseite gemeinfrei, veröffentlicht unter **CC0 1.0**. Keine Erlaubnis nötig; USDA bittet, FDC als Quelle zu nennen. data.gov führt den Datensatz mit US-Public-Domain-Kennzeichen | **ja**. Quelle in `THIRD_PARTY_NOTICES.md` bzw. Seed-Kommentar nennen. Mit AGPL vereinbar (CC0 stellt keine Bedingungen) |
| **USDA FSIS FoodKeeper** (Haltbarkeit) | catalog.data.gov: **CC0 1.0** | **ja**, Quelle nennen |
| **BBK** (Zeitraum, Wasser) | Ratgeber urheberrechtlich geschützt, kommerzielle Nutzung untersagt, Zitate mit Quellenangabe erlaubt (Impressum S. 37) | **ja für einzelne Zahlen** (10 Tage, 2 l, 0,5 l) als Fakten mit Quelle. Keine Texte, Bilder oder Illustrationen übernehmen |
| **BLE** (Gruppenmengen, Fußnoten) | © BLE, keine offene Lizenz. Bilder nur mit Einwilligung. `research/22` nennt das Risiko des Datenbankschutzes (§ 87b UrhG) bei Übernahme wesentlicher Teile | **ja für die 7 Gruppensummen und die Getränke-Fußnote** (wenige Einzelfakten, eigene Struktur). **Nicht** die ganze Beispielartikel-Tabelle übernehmen, auch nicht die kcal je Beispiel aus §4.3 als Seed |
| **DGE** (Referenzwerte) | Webseite ohne offene Lizenz | einzelne Zahlen mit Quelle als Fakten; nur für einen späteren Modus „Individuell“ |
| **BLS 4.0** (MRI) | seit 15./16.12.2025 **kostenfrei**, „ohne Lizenzbarrieren“, App-Entwicklung ausdrücklich genannt, Zitierweise „Max Rubner-Institut (2025)“ empfohlen. **Eine benannte Lizenz und eine Aussage zur Weitergabe der Daten fehlen** (blsdb.de, FAQ 16/17) | **noch nicht.** Für ein öffentliches AGPL-Repo vorher beim MRI klären, ob die Weitergabe einzelner Werte erlaubt ist. Danach wäre der BLS die bessere Quelle (deutsche Produkte, gleiche Basis wie die BLE) |
| **Open Food Facts** | ODbL mit Share-Alike für abgeleitete Datenbanken (`research/22` §5) | nicht verwendet. Ein öffentlicher Seed aus OFF-Mittelwerten wäre eine abgeleitete Datenbank und müsste unter ODbL stehen |

Fazit: Der Vorschlag in §4.2 nutzt nur CC0-Daten (USDA) plus eigene Rechnung. Er darf im AGPL-Repo stehen, mit Quellenangabe. Die BBK/BLE-Mengen sind wenige Einzelfakten mit Quelle und Link.

## 6. Checkliste für den Maintainer (U3)

Bitte je Punkt bestätigen oder korrigieren:

1. [ ] **Primärquelle für Mengen** ist die BLE-Vorratstabelle (3,3 / 4,0 / 2,5 / 2,5 / 1,2 kg, 330 g, 20 l), nicht die alte BBK-Tabelle. Die Prototyp-Werte 3,5 / 2,6 / 1,5 kg und 357 g werden nicht übernommen.
2. [ ] **Standardzeitraum** 10 Tage, Etappen 3 / 5 / 7 / 10.
3. [ ] **Energie** im Modus „Offiziell“: 2.200 kcal für alle außer Baby (auch für Kinder, obwohl zu hoch).
4. [ ] **Wasser Kind**: 1.500 ml (1 l + 0,5 l Kochen, Annahme) **oder** wörtlich 1.000 ml.
5. [ ] **Wasser Senior**: 2.500 ml (2 l + 0,5 l Kochen, Annahme) **oder** wörtlich 2.000 ml.
6. [ ] **Jugendliche** wie Erwachsene (2.200 kcal, 2.000 ml), Annahme.
7. [ ] **Vegetarisch** nach BLE: nur `fleisch_fisch_eier` 130 g statt 120 g. Die Verschiebung aus dem Prototyp (2/3 Hülsenfrüchte, 1/3 Nüsse) entfällt.
8. [ ] **Vegan** als gekennzeichneter Preposaurus-Vorschlag (§3.3): 130 g pflanzliche Eiweißquellen, 200 g Pflanzendrinks, 280 g Obst und Nüsse; B12-Hinweis. Eigene Quelle, nicht „BBK/BLE“.
9. [ ] **Nährwerte je Art** aus USDA SR Legacy mit LMIV-Umrechnung (§4.1). Stichproben ansehen, vor allem die Stellvertreter (Basmati, Linsen-Konserve, Hartkäse, Fruchtsaft, Schokolade, Thunfisch) und die Bezugsbasis der Konserven.
10. [ ] **Leere Felder** bleiben leer (10 Arten ohne Nährwerte): Müsli, Rote Bete, Gewürzgurken, Trockenobst, Haferdrink, Makrele, Hering, Fleischkonserve, Eintopf, Suppe. Alternativ einzelne Sammelarten in #128 aufteilen oder streichen.
11. [ ] **Tee und Kaffee** mit 0 kcal (Annahme), damit sie nicht als „unvollständig“ gelten.
12. [ ] **Haltbarkeit**: oberer FoodKeeper-Wert (§4.1). Für Konserven: 60 Monate (FoodKeeper, für die Plausibilität) **oder** 18 Monate (VZ Sachsen, als realistischer Hinweistext)? Werte vorher in der FoodKeeper-App stichprobenartig gegenprüfen.
13. [ ] **Unbegrenzt haltbar** (Zucker, Salz, Wasser) bleibt leer, weil eine Monatszahl das nicht ausdrückt.
14. [ ] **BLS 4.0**: beim MRI anfragen, ob Werte in einem öffentlichen AGPL-Repo weitergegeben werden dürfen. Wenn ja, Richtwerte später auf BLS umstellen.
15. [ ] Danach: `quelle_version.geprueft = true` für die Fassung „BBK 11/2025 + BLE 2024“ und Seed in M1-09.

## 7. Für #128 (Startliste) aufgefallen
- Für vegetarisch und vegan fehlt eine Art für **Tofu bzw. Fleischersatz** in der Kategorie `fleisch_fisch_eier`. Die BLE-Tabelle vegetarisch zählt genau diese Produkte dorthin.
- **Sammelarten** (Trockenobst, Fleischkonserve, Eintopf, Suppe, Müsli) bekommen keine seriösen Richtwerte. Entweder ohne Richtwert lassen (zählt dann mit 0, UX §4) oder in konkrete Arten aufteilen.
- **Hülsenfrüchte-Konserven und getrocknete Ware** unterscheiden sich um den Faktor 3 in kcal. Die Trennung im Seed ist richtig und wichtig.
- **Kartoffeln** zählen bei der BLE zur Getreidegruppe (710 g roh). Im Seed gibt es nur Kartoffelpüree-Pulver.

## Quellen (Abruf 2026-11-22)
1. BBK: Vorsorgen für Krisen und Katastrophen, Stand 11/2025, 2. Auflage (PDF, S. 3, 6, 7, 37). Link siehe §1.1.
2. BBK: Checklisten zur Vorsorge – Krisen und Katastrophen (PDF, S. 1). Link siehe §1.1.
3. BLE: Vorratstabelle Mischkost, © BLE 2024 (PDF, Fußnoten 1–5); Vorratstabelle (Web); Vorratstabelle vegetarisch; Vorratskalkulator. Links siehe §1.1.
4. DGE: Referenzwerte Energie (Stand 2015), https://www.dge.de/wissenschaft/referenzwerte/energie/
5. DGE: Referenzwerte Wasser (Stand 2000), https://www.dge.de/wissenschaft/referenzwerte/wasser/
6. DGE: Position vegane Ernährung (2024), https://www.dge.de/wissenschaft/stellungnahmen-und-positionspapiere/positionen/update-of-the-dge-position-on-vegan-diet/
7. USDA ARS: FoodData Central, SR Legacy (April 2018), https://fdc.nal.usda.gov/download-datasets/ · Lizenzhinweis auf https://fdc.nal.usda.gov/
8. USDA FSIS: FoodKeeper Data, CC0, https://catalog.data.gov/dataset/fsis-foodkeeper-data (Werte aus Kopie, siehe §4.1)
9. Verbraucherzentrale Sachsen: Marktcheck Lebensmittelvorrat, Februar 2025, https://verbraucherzentrale-sachsen.de/sites/default/files/2025-02/250206_marktcheck_notfallvorrat_vzs.pdf
10. MRI: Bundeslebensmittelschlüssel 4.0, https://www.blsdb.de/ und https://www.blsdb.de/faq
11. LMIV (VO (EU) Nr. 1169/2011), Anhang XIV: Umrechnungsfaktoren für den Brennwert.
