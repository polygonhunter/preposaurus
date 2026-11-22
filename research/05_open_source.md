# Open-Source-Landschaft: Vorratsverwaltung, Notvorrat, Prepper (Stand 2026-10-06)

> **Kurzfazit:** Ein reifes, aktives Open-Source-Projekt, das genau die Preposaurus-Kombination „offizielle Notvorrat-Empfehlung + Haushaltsprofil + Zielplanung + Vorratsverwaltung mit Foto/Barcode" abdeckt, gibt es nicht. Am nächsten kam **PrepTrack / Prepper_Log** (Apache-2.0, deutsch, BBK-basierte Wasserberechnung, Barcode, Offline-OCR fürs MHD). Das Repo wurde aber am 18.09.2026 archiviert und hatte nur 16 Sterne. Die starken Bausteine sind generisch: **Grocy** (MIT, rund 9.500 Sterne) als Vorbild für das Datenmodell, **Open Food Facts** (ODbL/DbCL/CC BY-SA, API v3, SDKs unter Apache-2.0) für Barcode-Stammdaten, **ZXing-JS** und **Tesseract.js** (beide Apache-2.0) fürs Scannen bzw. die Texterkennung und **Fluent Emoji** (MIT) für Piktogramme. Offizielle Notvorrat-Daten gibt es kaum maschinenlesbar: Der BBK-Open-Data-Datensatz auf GovData verweist auf eine CSV, die heute 404 liefert.

## Ergebnisse

### 1. Direkte Konkurrenz/Vorbilder: Notvorrat- und Prepper-Apps (Open Source)

| Projekt | Was es kann | Lizenz | Aktivität / Reife | Bewertung für Preposaurus |
|---|---|---|---|---|
| **BEKO2210/Prepper_Log** („PrepTrack") [1][2] | Offline-PWA, „Crisis-Readiness-Score" aus Haushaltsgröße und Zieltagen, Wasserberechnung nach BBK, Barcode (ZXing) mit Open-Food-Facts-Abfrage, **Offline-MHD-OCR mit Tesseract.js**, Push-Erinnerungen 30/14/7/3/1 Tage vor Ablauf, Verbrauchslog, Export/Import, optionaler LAN-Sync, 6 Sprachen (deutschsprachig zuerst) | Apache-2.0 | Angelegt 03/2026, letzter Push 24.08.2026, **archiviert am 18.09.2026**, 16 Sterne, 2 Forks, ca. 240 Commits | **Wichtigste Referenz.** Beweist, dass das Konzept technisch als PWA machbar ist. Wegen Apache-2.0 sind Ideen und Teile wiederverwendbar (mit NOTICE/Attribution). Gleichzeitig ein Warnsignal: Ein Ein-Personen-Projekt wurde nach ca. 6 Monaten eingestellt. Gründe sind unbekannt. |
| **Cruton80/Notvorratstracker** [3] | Deutsch: Vorrat tracken, Barcodes, Notfallplanung, geteilte Einkaufslisten für Familien (React Native/Expo + Supabase) | **keine Lizenz** (rechtlich nicht wiederverwendbar) | 4 Commits, 0 Sterne, letzter Push 06/2026 | Zeigt, dass es im DACH-Raum Bedarf gibt. Technisch irrelevant. |
| **Stryi/Vorratsuebersicht** [4][5] | Deutsche Android-App zur Vorratserfassung (seit v9 in Kotlin, vorher Xamarin/C#), Doku zu verteilter Datenbank/Sync | Apache-2.0 | 672 Commits, 11 Sterne, letzter Push 05.10.2026 (aktiv) | Langlebiges deutsches Hobbyprojekt mit MHD-Fokus. Laut README offenbar im Play Store (nicht separat verifiziert). Keine Notvorrat-Logik gefunden. |
| **realbluehead/pim** („Prepper Inventory Manager"), **LinderTech/prepper_inventory**, **d-otis/doomsday-prepper-inventory**, **DavidSatimeWallin/goventory** (CLI, MIT) [6] | Einfache Prepper-Inventarlisten | meist ohne Lizenz, goventory MIT | 0–1 Sterne, teils seit Jahren inaktiv | Nicht relevant. |
| **Food Storage Calculator** (SourceForge) [7] | GWT-Web-App, Drei-Stufen-Modell (frisch, Monate/Jahre, Jahrzehnte), US-Kontext | GPL-3.0 | Letztes Update 05.12.2014, Beta | Veraltet. Nur das 3-Stufen-Konzept ist interessant. |
| **Greg-2600/water_storage_calculator** [8] | Wasserbedarf nach Alter, Geschlecht und Situation | GPL-3.0 | 1 Stern, letzter Push 2019 | Nur als Idee für personenbezogene Wasserfaktoren. |
| **michaelsboost/lifeos** [9] | „Personal resilience dashboard": Budget, Pantry-MHD, Inventar | MIT | 2 Sterne, Push 05/2026 | Randnotiz. |

**Kommerzielle, nicht offene Prepper-Apps** (nur der Vollständigkeit halber, Details sind nicht verifiziert und gehören zum Wettbewerbsreport): PrepperPro, ProvidentPrep, PanPrep, Prepper App Pro, Food Storage Planner (iOS), „Prepperstool" (de.meckydev, Android) [10].

### 2. Generische Vorrats- und Haushalts-Software (Open Source)

| Projekt | Fokus | Lizenz | Sterne / letzter Push | Relevanz |
|---|---|---|---|---|
| **Grocy** [11][12] | Self-hosted „ERP beyond your fridge": Bestand, MHD, Barcode, Open-Food-Facts-Lookup, Einkaufsliste nach Mindestbestand, Rezepte, Essensplan, REST-API, PWA | **MIT** | ca. 9.555 / 16.09.2026, 136 offene Issues | **Bestes Vorbild für das Datenmodell** (Produkt ↔ Bestandseintrag mit MHD, Mengeneinheiten und Umrechnung, Lagerorte, Mindestbestand). MIT bedeutet freie Wiederverwendung. Die UX gilt als komplex, Notvorrat-Logik fehlt. |
| **Grocy Android** (patzly) [13] | Native Companion-App für Grocy | GPL-3.0 | ca. 1.197 / 25.08.2026 | UX-Referenz für mobile Erfassung. Copyleft, also keinen Code übernehmen. |
| **Barcode Buddy** [14] | Barcode-Scanner-Workflow für Grocy | AGPL-3.0 | ca. 607 / 25.09.2026 | Ideen für einen Schnell-Scan-Workflow („Scan-Modus Einkauf/Verbrauch"). |
| **KitchenOwl** [15] | Einkaufsliste und Rezepte, Flask + Flutter | AGPL-3.0 | ca. 3.725 / 26.09.2026 | UX-Referenz für Haushalts-Sharing. |
| **Mealie** [16] | Rezepte und Essensplanung | AGPL-3.0 | ca. 13.454 / 06.10.2026 | Später relevant für die Erweiterung „Rezepte aus dem Notvorrat". |
| **jenser1/ha-vorrat-addon** [17], **Psychman52OS/PantrLytics** [6] | Home-Assistant-Add-ons für Vorräte | MIT / unklar | 1 bzw. 6 Sterne | Zeigt den Smart-Home-Integrationswunsch. Niedrige Priorität. |
| **martinkadauke/vorratsdatenspeicher** [17] | KI-first, Kassenbon-Scan per lokalem LLM | AGPL-3.0 | 4 Sterne / 15.09.2026 | Ideengeber: **Kassenbon-Scan** als zusätzlicher Erfassungsweg. |
| **GhostPantry**, **IsyCortex/Pantry**, diverse „PantryTracker" [18] | Kleine Pantry-/MHD-Tracker, teils mit KI-Erfassung | meist ohne Lizenz | 0–5 Sterne | Viele Studien- und Hobbyprojekte, also hohes Grundinteresse, aber keine reife Lösung. |

### 3. Datenquellen und Datensätze

| Quelle | Inhalt | Lizenz / Bedingungen | Status |
|---|---|---|---|
| **Open Food Facts Datenbank** [19] | Produkte per EAN/Barcode: Name, Marke, Kategorie, Menge, Nährwerte, Allergene, Bilder | Datenbank **ODbL**, Inhalte **DbCL**, Bilder **CC BY-SA 3.0**. Pflicht: Attribution mit Link. Share-Alike für abgeleitete *Datenbanken*. | Aktiv |
| **Open Food Facts API** [20] | Lesen ohne Login, Schreiben mit Auth. **v3 empfohlen**, v2 deprecated | Pflicht-User-Agent `AppName/Version (Kontakt-E-Mail)`. Limits **15 Produktabfragen/min/IP** und **10 Suchen/min/IP**. Suche ist nicht für Autocomplete gedacht, bei Missbrauch drohen IP-Sperren. | Aktiv |
| **OFF-SDKs** (z. B. openfoodfacts-dart, Apache-2.0, 228 Sterne, Push 02.10.2026) [21]; Wrapper u. a. für JS, Kotlin, Swift, Python [20] | Fertige API-Clients | Apache-2.0 (Dart verifiziert, andere nicht einzeln geprüft) | Aktiv |
| **OFF-Taxonomien** [22] | Text-DAGs u. a. `food_groups`, `storage_conditions`, `preservation`, `units`, `allergens` | Keine eigene Lizenzangabe im Ordner gefunden. Vermutlich unter der Lizenz des Server-Repos bzw. der Datenbank: **unklar, prüfen**. | Aktiv |
| **Open Food Facts Smooth App** [23] | Offizielle Flutter-App (Scan, Produktseite) | Apache-2.0, ca. 1.421 Sterne, Push 05.10.2026 | UX- und Code-Referenz für den Barcode-Scan |
| **Robotoff** (OFF-ML-Dienst) [24] | Vorhersagen/Erkennung auf Produktbildern | AGPL-3.0, Push 05.10.2026 | Ob Robotoff **MHD-Erkennung** anbietet, konnte ich **nicht verifizieren**. |
| **BBK-Checkliste „Persönliche Notfallvorsorge" auf GovData** [25] | Notvorrat, Notgepäck, Dokumente. Ressourcen als PDF und **CSV** | **Datenlizenz Deutschland – Namensnennung 2.0 (dl-by-de/2.0)**, damit kommerziell nutzbar mit Quellenangabe | Metadaten zuletzt geändert 31.03.2022. **CSV- und PDF-Link liefern am 06.10.2026 HTTP 404** (eigener Test) [26]. Das Open-Data-Angebot ist also veraltet. |
| **Vorratskalkulator ernaehrungsvorsorge.de** (BMEL/BLE) [27] | 1–10 Personen, 1–28 Tage. Basis 2.200 kcal/Person/Tag. Tagesmengen: Getreide/Brot/Kartoffeln 330 g, Gemüse/Pilze 400 g, Obst 250 g, Getränke 2,0 l, Milch/Milchprodukte 250 g, Eier/Fleisch/Wurst/Fisch 120 g, Fette/Öle 33 g. Quelle: BLS 3.02 (MRI, 2014) | **Keine** Open-Data-Lizenz, keine API, kein Download gefunden | Online. Laut Sekundärquelle [28] Überarbeitung 2020 mit MRI (vegetarische Variante, Kinder, Haustiere). Das stimmt nicht mit der abgerufenen Seite (nur Personen und Tage) überein. **Abweichung klären** (eventuell zwei Versionen/Seiten). |

**Ergebnis:** Auf GitHub habe ich **kein Repository gefunden, das BBK-, BMEL-, AT-, CH- oder FEMA-Empfehlungen als gepflegten, strukturierten Datensatz (JSON/CSV) bereitstellt** [29]. Die Suche nach „notvorrat", „vorratskalkulator" und „emergency supply checklist" lieferte nur App-Projekte. Preposaurus muss diesen Datensatz also selbst kuratieren.

### 4. Bausteine: Scan, OCR, Piktogramme

| Baustein | Zweck | Lizenz | Aktivität |
|---|---|---|---|
| **ZXing-JS** [30] | Barcode-Scan im Browser/PWA (EAN-13 u. a.) | Apache-2.0 | ca. 2.939 Sterne, Push 02.10.2026 |
| **Tesseract.js** [31] | Offline-OCR im Browser (MHD-Text) | Apache-2.0 | ca. 38.756 Sterne, letzter Push 17.05.2026 |
| **Fluent Emoji** (Microsoft) [32] | Farbige 3D/flache Piktogramme für Lebensmittel und Gegenstände | **MIT** | ca. 10.146 Sterne, Push 24.08.2026 |
| **OpenMoji** [33][34] | Einheitliche, offene Emoji/Icons | **CC BY-SA 4.0** (Attribution und Share-Alike für bearbeitete Icons) | ca. 4.561 Sterne, Push 12.08.2026 |
| **Noto Emoji** (Google) [35] | Emoji-Font/-Grafiken | OFL-1.1 (Font). Bildlizenz im Repo separat prüfen | ca. 5.038 Sterne |
| Lucide Icons | UI-Icons (wird von Prepper_Log genutzt [1]) | Lizenz nicht separat geprüft | – |

Hinweis zur MHD-Erkennung: Laut Literatur ist das wegen sehr vieler Formate („EXP 25DEC24", Prägedruck, Punktmatrix) schwierig. Ansätze sind EAST + Tesseract oder YOLO-basierte Detektion [36][37]. Reines Tesseract ohne Vorverarbeitung dürfte auf gekrümmten Dosen oder geprägten Deckeln unzuverlässig sein (Einschätzung, nicht getestet).

## Bedeutung für Preposaurus

1. **Lücke bestätigt, aber eng.** Kein aktives Open-Source-Projekt kombiniert „offizielle Empfehlung (auswählbar) + Haushaltsprofil + Ziel/Datum + Vorratsverwaltung". Das archivierte PrepTrack zeigt, dass die Idee naheliegt. Es zeigt aber auch, dass Durchhaltevermögen und Pflege der Daten den Unterschied machen werden.
2. **PrepTrack/Prepper_Log gründlich auswerten** (Apache-2.0): Scoring-Logik, BBK-Wasserformel, OCR-Pipeline, Benachrichtigungsstufen 30/14/7/3/1, Datenmodell in Dexie. Ein Fork als PoC-Abkürzung ist rechtlich möglich (LICENSE und NOTICE beibehalten, Änderungen kennzeichnen). Archiviert heißt aber: keine Upstream-Pflege.
3. **Datenmodell an Grocy anlehnen** (MIT): Produkt-Stammdaten (EAN, Kategorie, Einheit) getrennt von **Bestandseinträgen** (Menge, MHD, Lagerort, Kaufdatum). Dazu Mengeneinheiten-Umrechnung und Mindestbestand. Neu für Preposaurus kommt eine **Mapping-Schicht** hinzu: Produkt → Lebensmittelgruppe der jeweiligen Empfehlung (z. B. BBK-Gruppe „Getreide/Brot/Kartoffeln"), dazu kcal und Gewicht, damit der Zielerfüllungsgrad berechnet werden kann.
4. **Open Food Facts als Barcode-Backbone**, mit Auflagen: API v3, eigener User-Agent, **lokales Caching**, kein Autocomplete über die OFF-Suche (Limit 10/min). Attribution „Daten von Open Food Facts (ODbL)" im Impressum/About. Bei einer eigenen, öffentlich weitergegebenen Produktdatenbank auf ODbL-Basis gilt Share-Alike. Eine private Nutzerinventar-Datenbank ist vermutlich unkritisch, das lässt sich juristisch klären. Optional können Nutzer fehlende Produkte zurück an OFF melden (Community-Aspekt).
5. **Eigenen, versionierten Empfehlungs-Datensatz kuratieren** (z. B. `recommendations/bbk-2026.json`, `bmel-vorratskalkulator.json`, `at-zivilschutz.json`, `ch-bwl.json`, `fema.json`) mit Quellen-URL, Abrufdatum, Version und Lizenz je Eintrag. Das ist der eigentliche Differenzierungs-Baustein. Er könnte selbst als **Open-Data-Repo (CC BY 4.0 / DL-DE BY 2.0-kompatibel)** veröffentlicht werden, als Community- und SEO-Hebel, denn die BBK-Open-Data-CSV ist tot.
6. **Erfassung in Stufen (MVP → später):** (a) Barcode mit ZXing-JS + OFF, (b) MHD manuell mit Schnellauswahl (Monat/Jahr), (c) MHD-OCR mit Tesseract.js als „Vorschlag zum Bestätigen", (d) später Kassenbon-Scan oder Foto→Kategorie per Vision-Modell (siehe vorratsdatenspeicher). OCR nie ungeprüft übernehmen.
7. **Piktogramme:** Fluent Emoji (MIT) ist für ein schönes, konsistentes Lebensmittel-Bildset ohne Share-Alike-Pflicht die unkomplizierteste Wahl. OpenMoji nur, wenn CC BY-SA akzeptabel ist.
8. **Lizenzstrategie für den eigenen Code früh festlegen:** Bei permissiver Lizenz (MIT/Apache) **keinen** Code aus GPL- oder AGPL-Projekten übernehmen (Grocy-Android, KitchenOwl, Mealie, Barcode Buddy, Robotoff). Diese Projekte nur als UX- und Feature-Inspiration nutzen.
9. **Offline-first/PWA** ist Konsens bei Prepper-Projekten (PrepTrack, pantry-patrol, P.H.I.), denn im Krisenfall ist das Netz eventuell weg. Der Notvorrat-Plan und die Liste müssen offline verfügbar und **druck- bzw. exportierbar** sein.

## Offene Fragen

- Warum wurde Prepper_Log/PrepTrack archiviert (rechtliche Gründe, Motivation, Wechsel zu kommerziell)? Läuft die Demo unter beko2210.github.io/Prepper_Log noch? Kontakt zum Autor aufnehmen?
- Gibt es einen aktuellen, offiziellen maschinenlesbaren BBK-Datensatz (Nachfolger der 404-CSV)? Anfrage an BBK/GovData möglich.
- Welche Version des BMEL-Vorratskalkulators ist aktuell (Personen/Tage vs. Kinder/vegetarisch/Haustiere)? Dürfen die Tagesmengen (Fakten, keine Schöpfungshöhe) übernommen werden? Vermutlich ja, aber mit Quellenangabe.
- Lizenz der OFF-Taxonomie-Dateien und genaue ODbL-Pflichten, wenn Nutzer-Inventare OFF-Daten enthalten.
- Kann Robotoff oder ein anderes offenes Modell MHD-Daten zuverlässig erkennen? Eigener kleiner PoC mit 30–50 realen Fotos (Dosen, Gläser, Packungen) wäre sinnvoll.
- Reicht die OFF-Abdeckung für deutsche Discounter-Eigenmarken (Aldi, Lidl), die typische Notvorrat-Produkte sind? Stichprobentest nötig.
- Wie ist Vorratsuebersicht (Stryi) im Play Store positioniert (Downloads, Bewertungen)? Gehört in den Wettbewerbsreport.

## Quellen

Alle Quellen abgerufen am 2026-10-06. Kennzahlen (Sterne, Push-Daten) stammen aus der GitHub-REST-API und sind Momentaufnahmen.

1. BEKO2210/Prepper_Log (README) – https://github.com/BEKO2210/Prepper_Log
2. GitHub API: BEKO2210/Prepper_Log (archived, Lizenz, Daten) – https://api.github.com/repos/BEKO2210/Prepper_Log
3. Cruton80/Notvorratstracker – https://github.com/Cruton80/Notvorratstracker
4. Stryi/Vorratsuebersicht – https://github.com/Stryi/Vorratsuebersicht
5. GitHub-Suche „vorrat OR vorratskalkulator OR lebensmittelvorrat" – https://api.github.com/search/repositories?q=vorrat+OR+vorratskalkulator+OR+lebensmittelvorrat&sort=stars
6. GitHub-Suche „prepper inventory" – https://api.github.com/search/repositories?q=prepper+inventory&sort=stars
7. Food Storage Calculator (SourceForge) – https://sourceforge.net/projects/foodstoragecalculator/
8. GitHub-Suche „emergency supply checklist / food storage calculator" – https://api.github.com/search/repositories?q=emergency+supply+checklist+OR+%22food+storage%22+calculator
9. michaelsboost/lifeos – https://github.com/michaelsboost/lifeos
10. Websuche Prepper-Apps (u. a. https://mwm.ai/apps/providentprep/6759816669, https://apps.apple.com/it/app/food-storage-planner/id6478508317, https://apkpure.net/prepperstool/de.meckydev.gabrieldenzel.prepperstool) – nicht im Detail verifiziert
11. GitHub API: grocy/grocy – https://api.github.com/repos/grocy/grocy
12. Grocy Website – https://grocy.info/
13. GitHub API: patzly/grocy-android – https://api.github.com/repos/patzly/grocy-android
14. GitHub API: Forceu/barcodebuddy – https://api.github.com/repos/Forceu/barcodebuddy
15. GitHub API: TomBursch/kitchenowl – https://api.github.com/repos/TomBursch/kitchenowl
16. GitHub API: mealie-recipes/mealie – https://api.github.com/repos/mealie-recipes/mealie
17. GitHub-Suche (siehe 5): jenser1/ha-vorrat-addon, martinkadauke/vorratsdatenspeicher
18. GitHub-Suche „pantry inventory expiration" – https://api.github.com/search/repositories?q=pantry+inventory+expiration&sort=stars
19. Open Food Facts – Nutzungsbedingungen / Lizenzen – https://world.openfoodfacts.org/terms-of-use
20. Open Food Facts API-Dokumentation – https://openfoodfacts.github.io/openfoodfacts-server/api/
21. GitHub API: openfoodfacts/openfoodfacts-dart – https://api.github.com/repos/openfoodfacts/openfoodfacts-dart
22. Open Food Facts Taxonomien – https://github.com/openfoodfacts/openfoodfacts-server/tree/main/taxonomies
23. GitHub API: openfoodfacts/smooth-app – https://api.github.com/repos/openfoodfacts/smooth-app
24. GitHub API: openfoodfacts/robotoff – https://api.github.com/repos/openfoodfacts/robotoff
25. GovData CKAN-API, Datensatz „Checkliste für die persönliche Notfallvorsorge" – https://www.govdata.de/ckan/api/3/action/package_search?q=checkliste+notfallvorsorge
26. Eigener HTTP-Test (curl, 404): https://www.bbk.bund.de/SharedDocs/Downloads/BBK/DE/Open_Data/Checkliste-Persoenliche-Notfallvorsorge.csv?__blob=publicationFile und https://www.bbk.bund.de/SharedDocs/Downloads/BBK/DE/Publikationen/Broschueren_Flyer/Buergerinformationen_A4/Checkliste_Ratgeber.pdf?__blob=publicationFile
27. Vorratskalkulator ernaehrungsvorsorge.de – https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratskalkulator/
28. Sekundärquelle Notvorrat-Rechner (rechner-portal.de) – https://rechner-portal.de/kochen-ernaehrung/ernaehrung/notvorrat-rechner
29. GitHub-Suche „notvorrat" – https://api.github.com/search/repositories?q=notvorrat&sort=stars
30. GitHub API: zxing-js/library – https://api.github.com/repos/zxing-js/library
31. GitHub API: naptha/tesseract.js – https://api.github.com/repos/naptha/tesseract.js
32. GitHub API: microsoft/fluentui-emoji – https://api.github.com/repos/microsoft/fluentui-emoji
33. GitHub API: hfg-gmuend/openmoji – https://api.github.com/repos/hfg-gmuend/openmoji
34. OpenMoji FAQ (Lizenz/Attribution) – https://openmoji.org/faq/
35. GitHub API: googlefonts/noto-emoji – https://api.github.com/repos/googlefonts/noto-emoji
36. Detection of Expiration Dates in Product Images Using YOLO – https://sol.sbc.org.br/index.php/eramiars/article/view/39448
37. Roboflow: Expiration Date Inspection – https://blog.roboflow.com/expiration-date-inspection/
