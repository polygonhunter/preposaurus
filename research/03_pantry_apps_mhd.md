# Vorrats-/Pantry-Apps mit MHD-Tracking: Marktüberblick, Erfassung, UX, Nutzerfeedback

> **Kurzfazit:** Es gibt viele Pantry-/Kühlschrank-Apps (NoWaste, Pantry Check, KitchenPal, CozZo, Fridgely, Grocy und seit 2025/26 viele KI-Apps). Sie erfassen Vorräte fast immer per Barcode, oft zusätzlich per Kassenbon. Neuere Apps nutzen Foto/Video und OCR für das MHD. Das größte Problem ist überall dasselbe: **die Eingabe ist mühsam** (Ersteinrichtung, Barcode wird nicht erkannt, MHD muss man abtippen). Dazu kommen Sync-Fehler, harte Artikel-Limits in den Gratis-Versionen und falsche Haltbarkeitsangaben. **Keine der untersuchten Mainstream-Pantry-Apps verbindet die Vorratsverwaltung mit offiziellen Notvorrats-Empfehlungen** (Tage-Ziel, Haushaltsmitglieder). Das machen nur einzelne kleine Prepper-Apps (z. B. ProvidentPrep, Food Storage Planner), allerdings ohne offizielle EU/DACH-Quellen. Für Preposaurus heißt das: die Erfassung von den Besten übernehmen (Barcode + Batch-Modus + Foto/OCR), dabei aber konsequent auf „schnell genug für 50 Dosen auf einmal“ optimieren.

## Ergebnisse

### 1. Übersicht der Apps

| App | Plattform | Erfassung | Besonderheiten | Preis (Stand Abruf) | Bewertung | Quelle |
|---|---|---|---|---|---|---|
| **NoWaste** (KH Creations, DK) | iOS, Android | Barcode, Kassenbon, Foto; Bibliothek mit über 200 generischen Lebensmitteln; KI-Assistent (Sprache/Text) | Listen für Gefrierfach/Kühlschrank/Vorrat, Sortierung nach MHD, Einkaufsliste, Mahlzeitenplan, Statistik zur Verschwendung, Geräte-Sync | Free (6 Listen / 500 Artikel); Pro 6,99 $/Jahr bzw. 29,99 $ lifetime (DE laut VZ: 6,49 €/Jahr) | 4,2 (751 Bewertungen, US App Store) | [1][2][3] |
| **Pantry Check** | iOS, Android | Barcode (Cloud-DB), Fotos | Echtzeit-Sync, Familienfreigabe, Lagerorte (Keller, Garage), Einkaufsliste aus Verbrauch, CSV-Export, Long-Press für „verbraucht/verdorben“ | Free bis 200 Artikel; Premium 2.000, Pro 10.000 Artikel | 4,5 (1,6 Tsd. Bewertungen) | [4][5] |
| **KitchenPal** | iOS, Android | Barcode (über 4 Mio. Produkte), Kassenbon; „automatische MHD-Erkennung“ für Frischware (gemeint ist vermutlich ein geschätztes Standard-MHD, nicht verifiziert) | Bereiche Vorrat/Kühlschrank/Gefrierfach/Putzmittel, Rezepte aus dem Bestand, geteilte Küche | 1,99 $/Monat oder 29,99 $ lifetime (Sekundärquelle) | Über 4 Sterne; Kritik an Sharing und 50-Artikel-Limit | [6][7][8] |
| **CozZo** | iOS, Android | Barcode (über 500 Mio. Produkte inkl. Fotos), Kassenbon (bis 5 Bons gleichzeitig) | Zwei Ansichten „Zuhause“ und „Einkauf“, Verbrauchsreport, Wochenplaner, Rezept-Matching, Haushaltskonto mit Messaging, Sync auf bis zu 10 Geräten | 1,99 $/Monat oder 17,99 $/Jahr | n/v | [9] |
| **Fridgely** | iOS | Barcode mit **geschätztem MHD**, Kassenbon-Foto | Räume (Kühlschrank/Vorrat/Gefrierfach), Sharing, Rezepte, Einkaufsliste aus Verbrauchtem | Gratis-Version + Einmalkauf | 4,2 (155 Bewertungen, Stand unklar) | [10] |
| **Grocy** (Open Source, MIT) | Self-hosted Web/PWA, Desktop-Variante | Barcode (USB-Scanner, Kamera), Open-Food-Facts-Lookup; Ergänzung **Barcode Buddy** (Batch-Scan, mehrere Barcode-DBs) | Trennt **MHD („best before“) und Verbrauchsdatum („expiration“)**, „geöffnet“-Status, Einfrieren, Preis-Historie, Mindestbestand → automatische Einkaufsliste, Lagerorte, Mengeneinheiten, REST-API für alles, Batterien/Geräte | Kostenlos | Nische für technisch Versierte | [11][12][13] |
| **FoodShiner** | iPhone, iPad, Mac, Watch | manuell/Scan | Kühlschrank-Inhalt + MHD, Rezepte, Meal-Planner (v3.2) | Kostenlos, spendenfinanziert | n/v | [14] |
| **Fridgify** (Valentin Hamm, Kaiserslautern) | iOS | Barcode; Kassenbon seit v1.1 | Vorratsliste + Einkaufsliste + MHD-Erinnerungen | Kostenlos | n/v (neu; Startdatum laut Quelle 2026, nicht verifiziert) | [14] |
| **Shelfze** (M-AI d.o.o.) | iOS | **Foto/Video vom Regal → KI erkennt Produkte; OCR liest MHD** | Rezepte aus dem Bestand, 6 Sprachen | Free; 1,99 $/Monat, 19,99 $/Jahr | Release 12.01.2026, noch keine Bewertungen | [15] |
| Food Expiry AI, FreshSave, Pantry AI, Scannly | iOS | OCR für MHD, KI-Etikett-Extraktion (Marke, Menge, Kategorie); FreshSave mit OCR **auf dem Gerät** | Neue Welle von KI-Apps 2025/26, wenig Bewertungen | meist Abo | kaum Daten | [16] |
| **ProvidentPrep** (Prepper/LDS) | iOS | Barcode (auch LDS-Home-Storage-Artikel) | **Ziele für 3 Monate / 1 Jahr**, Fortschritt je Kategorie, 72-Stunden-Kit-Checkliste, Rotations-Erinnerungen | Gratis, ohne Werbung | 5,0 (1 Bewertung); Release 04.03.2026 | [17] |
| Food Storage Planner, Stocked | iOS | manuell/Barcode | Berechnet, wie lange der Vorrat für eine Gruppe reicht (Szenarien) | n/v | n/v | [18] |
| **Bring!** (Einkaufsliste, keine Vorratsverwaltung) | iOS, Android, Web | Tippen auf Icons | **Handgezeichnete Icons im Raster** (früher 280 Symbole) statt Textliste, unbegrenzt viele Teilnehmende, Push-Nachrichten | Freemium | in DACH sehr verbreitet | [19][20] |
| **Mealime** (Mahlzeitenplaner) | iOS, Android | – | Plan aus Vorlieben/Allergien → automatische Einkaufsliste; **keine Vorratsverwaltung** | Freemium | n/v | [21] |

n/v = nicht verifiziert. Bewertungen und Preise ändern sich oft. Werte stammen vom Abruf am 2026-10-06 bzw. aus der jeweils angegebenen Sekundärquelle.

### 2. Erfassungsmethoden im Vergleich

| Methode | Wer nutzt sie | Stärken | Schwächen (laut Quellen/Reviews) |
|---|---|---|---|
| **Barcode** | fast alle | schnell, liefert Name, Bild, Packungsgröße, oft Nährwerte | Datenbank-Lücken: VZ-Test fand bei NoWaste nur **ca. 50 % der gescannten Produkte** [2]; Pantry Check und KitchenPal: unbekannte Produkte, falsche Bilder [5][8]. Der Barcode liefert **kein MHD**. |
| **Kassenbon (OCR)** | NoWaste, KitchenPal, CozZo, Fridgely, Fridgify | viele Artikel auf einmal | Nutzer berichten von Erkennungsproblemen [3]. Deutsche Bons verwenden stark abgekürzte Artikelnamen. Eine gute Lösung dafür haben wir nicht gefunden (offen). Der Bon enthält ebenfalls **kein MHD**. |
| **Foto/Video vom Regal (KI-Vision)** | Shelfze, Pantry AI, NoWaste („Foto“) | sehr wenig Aufwand bei der Ersterfassung | neu, kaum Bewertungen, Genauigkeit unbelegt [15][16] |
| **MHD-OCR** | Shelfze, FreshSave (on-device), Food Expiry AI, Scannly | löst den größten Schmerzpunkt „MHD abtippen“ | MHD-Aufdrucke sind oft im Punktmatrix-Druck, auf gewölbten Flächen und in uneinheitlichen Formaten. Spezialisierte Modelle erreichen in Studien etwa 99 %, aber nur auf kleinen Datensätzen [22]. In der Praxis braucht es eine Bestätigung durch den Nutzer. |
| **Geschätztes MHD** (Standardwert pro Kategorie) | Fridgely, KitchenPal, NoWaste | null Aufwand | **Sicherheitsrisiko:** NoWaste zeigte bei frischer Bratwurst „+21 Tage“ über das Datum hinaus. Damit werden MHD und Verbrauchsdatum verwechselt [2]. Außerdem tauchen falsche MHD-Vorschläge auf [3]. |
| **Generische Bibliothek/Icons** | NoWaste (über 200 Artikel), Bring! | schnell für lose Ware (Reis, Mehl, Wasser) | weniger präzise (Menge, Marke) |
| **Sprache/KI-Assistent** | NoWaste | freihändig („füge 6 Dosen Linsen hinzu“) | noch kaum Nutzerfeedback |
| **USB-/Bluetooth-Scanner, Batch** | Grocy + Barcode Buddy | ideal für große Einkäufe: unbekannte Codes werden geparkt und später nachgepflegt [13] | nur für Technikaffine |

### 3. Was Nutzer lieben / hassen

| Lieben | Hassen |
|---|---|
| Mehrere Lagerorte/Listen (Kühlschrank, Keller, Garage) [3][4] | **Hoher Aufwand bei der Ersterfassung** („labor intensive at first“) [5] |
| Familien-Sync in Echtzeit [4][8] | **Sync-Fehler**: ein Mitglied löscht etwas, beim anderen ist es noch da [5]; Sharing funktioniert nicht [8] |
| Weniger Doppelkäufe, Geld gespart [5] | Barcode nicht gefunden oder falsche Produktbilder [5][8] |
| Schneller Barcode-Scan, Foto-Oberfläche [5] | **Harte Gratis-Limits** (50 / 200 / 500 Artikel), die man nur mit Abo aufhebt [1][4][8] |
| Schneller Support [5] | Abstürze mit Datenverlust („add all“ → 20 Artikel weg) [3] |
| Statistik zur Verschwendung [3] | Kein Undo, versehentliches Löschen [4] |
| Rezepte aus Artikeln, die bald ablaufen [6][10] | Fehlende Kategorien (Zucker, Öle), Trockenware landet im „Kühlschrank“ [3] |
| | Teilverbrauch nicht abbildbar (halbe Packung) [3] |
| | Kein Desktop/Browser-Zugang [5] |
| | Falsche oder gefährliche Haltbarkeitsangaben [2] |

### 4. Datenquellen und Technik (kurz)

- **Open Food Facts API:** Lesezugriff ohne Login, aber mit eigenem User-Agent (`AppName/Version (Kontakt)`). Limits: **15 Produkt-Anfragen/Minute/IP** und 10 Suchanfragen/Minute/IP. Für große Datenmengen gibt es Dumps (CSV/JSONL). Daten stehen unter ODbL, Bilder unter CC BY-SA. Beispiel: `GET https://world.openfoodfacts.org/api/v3.6/product/{barcode}.json` [23]. Folgerung: Abfragen gehen direkt vom Client des Nutzers oder über einen Cache; ein eigener Server-Proxy ohne Cache würde schnell ins Limit laufen.
- **Grocy** zeigt ein gutes Datenmodell: Produkt (Stammdaten) und Bestandseinträge (Charge mit eigenem MHD, Lagerort, Preis, geöffnet ja/nein) sind getrennt. Dazu kommen Mengeneinheiten mit Umrechnung, ein Mindestbestand und ein Journal [11][12].

## Bedeutung für Preposaurus

**Übernehmen:**
1. **Chargen-Modell wie bei Grocy:** Ein Produkt kann mehrere Bestandseinträge mit jeweils eigenem MHD haben (z. B. 12 Dosen Linsen aus drei Einkäufen). Das ist Voraussetzung für FIFO bzw. den „lebendigen Vorrat“.
2. **Zwei Datumstypen** (MHD vs. Verbrauchsdatum) wie bei Grocy. **Nie** automatisch „über das Verbrauchsdatum hinaus essbar“ anzeigen, so wie es der VZ-Test bei NoWaste kritisiert hat. Für einen Notvorrat sind ohnehin fast nur MHD-Produkte relevant.
3. **Schneller Batch-Modus:** Barcode scannen, Menge per Stepper, MHD per OCR vorschlagen, bestätigen, nächstes Produkt. Unbekannte Barcodes parken und später nachpflegen (Barcode Buddy). Zielwert: unter 5 Sekunden pro Artikel.
4. **MHD-OCR immer als Vorschlag mit Bestätigung**, mit Fallback auf Monat/Jahr-Picker (bei Konserven reicht oft „08/2028“). Gleiche Artikel bekommen dasselbe MHD („auf alle 6 anwenden“).
5. **Generische Piktogramm-Bibliothek im Bring!-Stil** für lose Ware und Notvorrat-Kategorien (Wasser, Reis, Nudeln, Konserven, Hygiene). Das ist der schnellste Weg ohne Barcode und passt zur gewünschten Optik. Das Raster mit Icons statt Textliste ist UX, die sich bewährt hat [19].
6. **Mehrere Lagerorte** (Keller, Speisekammer, Garage) und **Haushalt teilen**, aber mit robustem Sync (das ist der Top-Kritikpunkt der Konkurrenz) und mit Undo.
7. **Teilverbrauch und Status:** „angebrochen“, „½ Packung verbraucht“, Long-Press-Schnellaktionen „verbraucht / weggeworfen“ (Pantry Check).
8. **Kein hartes Artikel-Limit** im Gratis-Modell. Ein Notvorrat hat schnell 100 bis 300 Positionen; Limits bei 50 oder 200 werden als Abzocke empfunden.
9. **Web/Desktop-Zugang** (PWA). Wird bei Pantry Check ausdrücklich vermisst.
10. **CSV/JSON-Export und Backup**, damit kein Datenverlust das Vertrauen zerstört.

**Differenzierung (Lücke im Markt):**
- Die Pantry-Apps optimieren gegen **Verschwendung im Alltag** (Kühlschrank, Rezepte). Keine verbindet den Bestand mit einem **offiziellen Notvorrats-Soll** (BBK und andere) je Haushaltsmitglied. Genau das ist der USP von Preposaurus: „Ihr seid für 6,5 Tage versorgt.“
- Prepper-Apps wie ProvidentPrep haben Ziele (3 Monate / 1 Jahr), aber US/LDS-Bezug und keine auswählbaren offiziellen Quellen.
- Notvorrat ist eher **langsam drehender Bestand** (Konserven, MHD in Jahren). Daraus folgen andere Prioritäten: Erinnerungen 3 bis 6 Monate vorher („jetzt in den Alltag einbauen und nachkaufen“), weniger Rezepte, mehr Rotationsplanung.

**MVP-Empfehlung zur Erfassung (Reihenfolge):**
1. Manuell über die Piktogramm-Bibliothek (Kategorie + Menge + MHD Monat/Jahr), funktioniert offline
2. Barcode über Open Food Facts mit lokalem Cache
3. MHD-OCR on-device als Vorschlag
4. Später: Regalfoto/Video per KI-Vision, Kassenbon (eher geringe Priorität, weil kein MHD und abgekürzte Namen auf deutschen Bons)

## Offene Fragen

- Wie gut erkennt Open Food Facts typische deutsche Notvorrat-Artikel (Discounter-Eigenmarken, Konserven, Wasser)? Lohnt sich ein eigener PoC-Scan von etwa 50 Produkten? Der VZ-Wert von ca. 50 % bezieht sich auf die Datenbank von NoWaste, nicht auf Open Food Facts.
- Wie genau ist MHD-OCR on-device (Apple Vision / ML Kit) auf echten Konserven- und Getränkeaufdrucken? Das braucht einen eigenen Test.
- Kassenbon-Erkennung bei deutschen Händlern (Abkürzungen wie „BIO LINS.ROT 500G“): Gibt es nutzbare Mapping-Datenbanken? Nicht gefunden.
- Die tatsächliche Erkennungsqualität der KI-Regalfoto-Apps (Shelfze und andere) ist unbelegt, weil Bewertungen fehlen.
- Die KitchenPal-Funktion „automatische MHD-Erkennung“ ist nur aus Sekundärquellen bekannt. Gemeint ist vermutlich eine Schätzung, nicht OCR (nicht verifiziert).
- Fridgify: Startdatum und Funktionsumfang sind nur aus einer Tag-Übersichtsseite bekannt (nicht verifiziert).
- Langzeit-Nutzung: Wie viele Nutzer brechen Pantry-Apps nach der Ersterfassung ab? Konkrete Retention-Zahlen haben wir nicht gefunden. Studien nennen den manuellen Eingabeaufwand allgemein als Hauptbarriere [24].

## Quellen

Alle abgerufen am 2026-10-06.

1. NoWaste: Food Inventory List – App Store (US). https://apps.apple.com/us/app/nowaste-food-inventory-list/id926211004
2. Verbraucherzentrale: App-Test »NoWaste – Lebensmittelliste«: Die digitale Speisekammer (18.09.2025). https://www.verbraucherzentrale.de/wissen/digitale-welt/apps-und-software/apptest-nowaste-lebensmittelliste-die-digitale-speisekammer-95921
3. NoWaste App-Store-Seite, Rezensionen (über WebFetch ausgewertet, Abschnitt Reviews). https://apps.apple.com/us/app/nowaste-food-inventory-list/id926211004
4. Pantry Check – Grocery List – App Store (US). https://apps.apple.com/us/app/pantry-check-grocery-list/id966702368
5. JustUseApp: Pantry Check Reviews. https://justuseapp.com/en/app/966702368/pantry-check-grocery-list/reviews
6. SquareTrade Blog: Strategies & Apps to Help With Organizing a Pantry. https://blog.squaretrade.com/strategies-apps-to-help-with-organizing-a-pantry/
7. AlternativeTo: KitchenPal. https://alternativeto.net/software/kitchenpal/about
8. JustUseApp: KitchenPal Reviews. https://justuseapp.com/en/app/1084982489/kitchenpal-pantry-recipes/reviews
9. FAO Agritech Observatory: CozZo. https://agritechobservatory.review.fao.org/en/cozzo
10. Fridgely – App Store (US) / AlternativeTo. https://apps.apple.com/us/app/fridgely/id988016972 ; https://alternativeto.net/software/fridgely/about
11. GitHub: grocy/grocy (README). https://github.com/grocy/grocy
12. Self Host Yourself: Grocy. https://selfhostyourself.com/services/grocy
13. Barcode Buddy Documentation (Changelog) / F-Droid. https://barcodebuddy-documentation.readthedocs.io/en/latest/changelog.html ; https://f-droid.org/en/packages/de.bulling.barcodebuddyscanner/
14. iphone-ticker.de: Tag „Lebensmittel“ (Fridgify, FoodShiner). https://www.iphone-ticker.de/tag/lebensmittel/
15. mwm.ai: Shelfze. https://mwm.ai/apps/shelfze/6755694325
16. App Store / mwm.ai: Food Expiry AI, FreshSave, Pantry AI, Scannly. https://apps.apple.com/app/id6789433988 ; https://mwm.ai/apps/freshsave-expiry-tracker/6762173662 ; https://mwm.ai/apps/pantry-ai/6758572123 ; https://apps.apple.com/us/app/-/id6757216690
17. mwm.ai: ProvidentPrep. https://mwm.ai/apps/providentprep/6759816669
18. App Store: Food Storage Planner. https://apps.apple.com/it/app/food-storage-planner/id6478508317
19. appgefahren.de: Bring: Äußerst schicke Einkaufsliste für den Supermarkt. https://www.appgefahren.de/?p=56960
20. appgefahren.de: Bring! Einkaufsliste: Push-Mitteilungen, Profile & viele Neuerungen. https://www.appgefahren.de/?p=79279
21. Plan to Eat Blog zu Mealime / App Store Mealime. https://www.plantoeat.com/?p=37293 ; https://apps.apple.com/DE/app/id1079999103
22. Springer JESIT: Arabic dot-matrix expiry date recognition (2024). https://jesit.springeropen.com/articles/10.1186/s43067-024-00136-2 ; Springer (2025): https://link.springer.com/article/10.1186/s43067-025-00210-3
23. Open Food Facts API Documentation. https://openfoodfacts.github.io/openfoodfacts-server/api/
24. Sustainability (MDPI) 2024, 16(7), 2800 (via RePEc) sowie studentische Projektberichte (HKU FYP24069). https://ideas.repec.org/a/gam/jsusta/v16y2024i7p2800-d1365286.html ; https://wp2024.cs.hku.hk/fyp24069/wp-content/uploads/sites/70/2025/05/fyp24069_poster.pdf

*Hinweis: Die Inhalte der App-Stores wurden automatisiert zusammengefasst; Bewertungszahlen und Preise können je nach Land und Zeitpunkt abweichen. Quelle 24 ist eher allgemein und wurde nicht im Volltext geprüft.*
