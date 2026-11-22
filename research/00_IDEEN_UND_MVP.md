# Preposaurus: Ideenkatalog, MVP-Varianten und Empfehlung

> Stand: 2026-10-06 · Phase: **Recherche abgeschlossen, Ideen und MVP definieren.** Es wird noch nichts programmiert.
> Grundlage: Ideenpapier `../00_IDEE.md` und die 25 Recherche-Reports `01`–`25` in diesem Ordner. Verweise wie (R07) meinen den jeweiligen Report.
> Hinweis: Dieses Dokument entstand unter einem früheren Arbeitstitel. Der Name ist seit 2026-11-22 „Preposaurus“ (siehe Frage 1 in Abschnitt 4).

---

## 0. Die Recherche in fünf Sätzen

1. **Die Idee gibt es nicht 1:1, der Kern aber schon.** In DACH gibt es seit 2025/26 fünf oder mehr junge Notvorrat-Apps (Vorratsplan, Vorratskompass, Blackout Prepper, Krisenvorrat Manager, SAFELIX). Keine davon hat mehr als 20 Store-Bewertungen, einen Marktführer gibt es nicht (R01, R02).
2. **Was fehlt:** mehrere auswählbare offizielle Quellen mit sauberem Quellennachweis, Foto-/KI-Erfassung für den Notvorrat, eine schöne Piktogramm-Optik und ein echter „lebendiger Vorrat“ (Rotation) bei gleichzeitig wenig Erfassungsaufwand (R01–R03, R06).
3. **Die größte Gefahr ist nicht die Technik, sondern die Bindung:** Nutzer geben Inventar-Apps wegen des Erfassungsaufwands auf. Vorsorge passiert in Wellen nach Krisen und wird selten zur Routine (R06, R20, R21).
4. **Technisch machbar, aber mit klaren Grenzen:** Barcode und Open Food Facts sind Standard. Das MHD liefert keine Datenbank, die MHD-Texterkennung ist auf Dosen und Punktmatrix unbewiesen, und Vision-LLMs können Daten erfinden. Alles braucht deshalb eine Bestätigung durch den Menschen (R14–R16).
5. **Rahmen:** Native App (Expo/React Native) statt reiner PWA wegen lokaler Erinnerungen auf iOS (R17), offline-first und local-first (R18, R22), keine Behördentexte, -grafiken oder -logos, Zahlen nur als Fakten mit Quelle (R07, R08, R22), ruhiger Ton statt Prepper-Ästhetik und ein anderer öffentlicher Name (R20, R25).

---

## 1. Ideenkatalog

Alle Ideen aus den 25 Reports, dedupliziert und gruppiert.

**Bewertung (jeweils 1–5):**
- **Nutzen:** Wert für den Haushalt (5 = sehr hoch)
- **Aufwand:** Bau- und Pflegeaufwand (5 = sehr hoch, 1 = gering)
- **Diff.:** Differenzierung gegenüber der Konkurrenz (5 = gibt es so nirgends)
- **Phase:** Vorschlag für die Einordnung: **PoC**, **MVP**, **V2**, **V3** oder **nie/prüfen**

### A. Haushalt und Bedarf

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| A1 | Haushalts-Wizard mit Piktogramm-Zählern (Erwachsene, Kinder nach Altersgruppe, Senior:innen, Baby, Haustier), ohne Klarnamen | 5 | 2 | 3 | MVP | R12, R21, R22 |
| A2 | Getränke nach Alter skalieren (BLE-Fußnote: Kinder bis 12 Jahre 1 l, ab 65 Jahre 2 l), Säuglinge gesondert | 4 | 1 | 3 | MVP | R07, R08 |
| A3 | Zwei Rechenmodi: „Offiziell (Pauschale 2.200 kcal)“ als Standard, „Individuell (DGE nach Alter, Geschlecht, Aktivität)“ als Ableitung, deutlich gekennzeichnet | 3 | 3 | 4 | V2 | R12 |
| A4 | Ernährungsform pro Person: vegetarisch (offizielle BLE-Tabelle), vegan oder glutenfrei (abgeleitet, gekennzeichnet) | 4 | 2 | 3 | MVP (nur vegetarisch), V2 | R08, R09, R12 |
| A5 | Flags statt Diagnosen: laktosefrei, glutenfrei, Nüsse, Babynahrung, Schwangerschaft. Nur lokal gespeichert, lösen Hinweise und Checklisten aus, keine Pflichtmengen | 4 | 2 | 3 | MVP | R08, R22 |
| A6 | Haustiere: Futter- und Wasserbedarf (FEDIAF-Formel nur als Schätzung, die gewohnte Ration hat Vorrang) | 3 | 2 | 3 | V2 | R12 |
| A7 | Sonderpfad Baby: Pre-Nahrung, Wasser „geeignet für Säuglingsnahrung“, Kocher und Brennstoff, Windeln, als Checkliste | 4 | 2 | 4 | V2 | R12 |
| A8 | Szenario-Schalter: Hitze (Wasser ×2), Hygienemodus (FEMA), Stromausfall (ohne Kochen essbar) | 3 | 2 | 4 | V2 | R12, R11 |
| A9 | Mehrere Haushalte verwalten (zum Beispiel für die eigenen Eltern) | 3 | 3 | 4 | V3 | R20 |

### B. Offizielle Quellen und Empfehlungen

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| B1 | **Eigener, versionierter Empfehlungs-Datensatz:** jede Zahl mit Herausgeber, Titel, Stand, URL, Abrufdatum, Lizenz und Ebene (national, regional, NGO) | 5 | 3 | 5 | PoC/MVP | R05, R07–R11, R22 |
| B2 | **Quellen-Umschalter** im MVP mit DE (BMLEH/BLE-Mischkost + vegetarisch, BBK-Stufen 3/5/7/10 Tage), AT (ÖZSV-Tabelle 14 Tage), CH (BWL 7 Tage, 9 l Wasser) und EU (72 h) | 5 | 3 | 5 | MVP | R01, R07–R10 |
| B3 | Quellen ohne Mengenangaben (EU, Nordics, USA, UK) als **Kategorien-Checkliste statt kg-Ziel**, transparent gekennzeichnet; kcal-Hochrechnung nur als „Schätzung“ | 4 | 2 | 4 | MVP (EU), V2 (weitere) | R10, R11 |
| B4 | Quellenvergleich nebeneinander („DE 10 Tage / 20 l, AT 14 Tage / 21 l, CH 7 Tage / 9 l“), plus Modus „konservativ = Maximum aller Quellen“ | 4 | 2 | 5 | MVP | R01, R09 |
| B5 | Alte BBK-Werte (3,5 / 2,6 / 1,5 / 0,357 kg) als „historisch“ zeigen und erklären, warum Medienzahlen abweichen | 3 | 1 | 4 | MVP | R07, R08 |
| B6 | Sichtbarer Rechenweg: „berechnet nach BLE-Tabelle, Stand 03/2023, für 3 Personen × 10 Tage“ | 4 | 1 | 4 | MVP | R18, R22 |
| B7 | Prozess zur Quellenpflege (halbjährlicher Review, Änderungslog, App-Hinweis „Empfehlung aktualisiert“) | 4 | 2 | 3 | MVP (Prozess) | R07, R10, R11 |
| B8 | Datensatz als Open-Data-Repo veröffentlichen (die BBK-CSV liefert 404), als Community- und SEO-Hebel | 2 | 2 | 4 | V2, prüfen | R05 |
| B9 | Weitere Länderpakete (Nordics, Baltikum, USA, UK, JP), Mehrsprachigkeit (DE/FR/IT für CH, EN), Einheiten l/Gallonen | 3 | 4 | 3 | V3 | R09–R11 |
| B10 | Kooperation oder Freigabe bei BLE, BBK, BWL, ÖZSV anfragen (Vertrauen, Lizenzklärung, eventuell offizielle Verlinkung) | 4 | 2 | 5 | sofort (parallel) | R07–R09, R22 |

### C. Ziel und Fortschritt

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| C1 | **Ziel aus Tagen und Zieldatum** mit Etappen 3 → 5 → 7 → 10 → 14 Tage (BBK-Stufen), frei wählbar | 5 | 1 | 4 | MVP | R07, R21 |
| C2 | **Hauptkennzahl „Für X Tage versorgt“**, bestimmt durch die knappste Kategorie (meist Wasser), dazu Ringe oder Balken je Lebensmittelgruppe | 5 | 2 | 4 | MVP | R12, R21 |
| C3 | Doppelte Sicht: Deckung je Gruppe (kg/l) und kcal-Deckung (Hybridmodell, das schwächste Glied zählt) | 4 | 3 | 4 | MVP (Gruppen), V2 (kcal) | R07, R12 |
| C4 | Endowed Progress: Im Onboarding wird der vorhandene Vorrat grob geschätzt, damit niemand bei 0 % startet („Ihr seid schon für ca. 2,5 Tage versorgt“). Unsicherheit wird angezeigt | 4 | 2 | 4 | MVP | R21 |
| C5 | **Einkaufsplan bis zum Zieldatum:** die Lücke auf N Wocheneinkäufe verteilen („diese Woche: 6 l Wasser, 2 Dosen Linsen“), Ampel „im Plan“ | 5 | 3 | 5 | MVP | R01, R21 |
| C6 | Offizielle Mengen in Packungen und Gerichte übersetzen („3,3 kg Getreide = 2 × 1 kg Nudeln + 1 kg Reis + …“), Vorlieben des Haushalts berücksichtigen | 5 | 3 | 4 | MVP (einfach), V2 | R06 |
| C7 | Budget-Planer („ca. X € pro Person, verteilt auf Y Wochen“, Eigenmarken-Tipps). Kostenangabe ohne Bezugsjahr, deshalb nur als Spanne | 4 | 2 | 4 | V2 | R06, R08, R20 |
| C8 | Platz-Modus (3-Tage-Kiste, Schublade) für kleine Wohnungen | 3 | 2 | 4 | V2 | R06, R20 |
| C9 | Zweites Ziel „Notgepäck/Go-Bag“ pro Person (3 Tage) neben dem Vorrat zu Hause | 3 | 2 | 3 | V2 | R11, R13 |
| C10 | Meilenstein-Animationen und Badges (3/7/10/14 Tage), ohne tägliche Streaks | 3 | 2 | 3 | MVP (einfach) | R19, R21 |

### D. Erfassung

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| D1 | **Schnellerfassung nach Kategorie und Menge** über ein Piktogramm-Raster („6 × Dose Ravioli 400 g, MHD 03/2028“), offline, schnellster Weg | 5 | 2 | 4 | MVP | R03, R06 |
| D2 | Vorbefüllter Notvorrat-Katalog (generische Artikel je Gruppe, mit Standardgewicht und kcal pro 100 g, eigene Texte) | 5 | 3 | 4 | MVP | R06, R07, R08 |
| D3 | **Barcode-Scan + Open Food Facts** (API v3, eigener User-Agent, lokaler Cache, Attribution), Zuordnung `categories_tags` → offizielle Warengruppe | 5 | 3 | 2 | MVP | R03, R14 |
| D4 | **MHD-Picker Monat/Jahr** mit Schnell-Buttons (+6 Monate, +1 Jahr, +2 Jahre), intern Monatsende (wie GS1 TT=00) | 5 | 1 | 3 | MVP | R16 |
| D5 | „MHD auf alle N gleichen Artikel anwenden“, Mengen-Stepper, „einmal scannen, Stückzahl ändern“ | 5 | 1 | 3 | MVP | R03, R04, R16 |
| D6 | Batch-Modus für große Einkäufe: unbekannte Codes parken und später nachpflegen. Ziel unter 5 Sekunden pro Artikel | 4 | 2 | 3 | MVP | R03 |
| D7 | **MHD-OCR auf dem Gerät** (VisionKit / ML Kit) mit LMIV-Plausibilitätsparser (Ankerwörter, Losnummern und Uhrzeiten filtern, ±30 Jahre), nur als Vorschlag. Nach ca. 3 s ohne Treffer zurück zum Picker | 4 | 3 | 4 | MVP (wenn der PoC es bestätigt), sonst V2 | R15, R16 |
| D8 | Kategorie-Standard-Haltbarkeit (BZfE, Tirol, VZ, USDA), gekennzeichnet als **„geschätzt“**, mit späterer Erinnerung zur Prüfung | 4 | 2 | 3 | MVP | R04, R16 |
| D9 | Lernender MHD-Vorschlag pro EAN (typische Spanne von Erfassung bis MHD, lokal) | 3 | 2 | 4 | V2 | R16 |
| D10 | **„Magic Foto“**: Regal- oder Einkaufsfoto → Cloud-Vision-LLM → Vorschlagsliste mit Kategorie, Menge, MHD-Text oder `null` → Bestätigungs-Screen mit Bounding Boxes. Nur per Opt-in | 4 | 4 | 5 | V2 (nach PoC) | R04, R15 |
| D11 | Zweiter MHD-Versuch per Vision-LLM auf dem zugeschnittenen Ausschnitt (Opt-in) | 3 | 3 | 4 | V2 | R16 |
| D12 | GS1 DataMatrix / Digital Link lesen (AI 15/17 = MHD) für künftig fehlerfreie Datumserfassung | 3 | 2 | 5 | MVP (Parser), Nutzen später | R04, R16 |
| D13 | Fehlendes Produkt an Open Food Facts melden (Schreib-API) | 2 | 2 | 3 | V2 | R05, R14 |
| D14 | Kassenbon-Scan | 1 | 4 | 2 | nie/prüfen | R03, R04 |
| D15 | Apple-Extras: Visual Intelligence, On-Device-Foto-Modus über Foundation Models | 2 | 3 | 4 | V3 | R04, R15 |
| D16 | Eigenes On-Device-Modell aus bestätigten Korrekturen (nur mit Einwilligung) | 2 | 5 | 4 | V3 | R15, R16 |
| D17 | Medikamente: securPharm-DataMatrix für das Verfallsdatum | 3 | 3 | 5 | prüfen (rechtlich) | R13 |

### E. Vorratsverwaltung und Rotation („lebendiger Vorrat“)

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| E1 | **Datenmodell Produkt / Charge** (nach Grocy): je Charge eigenes MHD, Menge und Lagerort | 5 | 2 | 2 | MVP | R03, R05, R18 |
| E2 | **MHD und Verbrauchsdatum getrennt**: nach MHD „prüfen statt wegwerfen“, nach Verbrauchsdatum „entsorgen“. Niemals „+X Tage essbar“ | 5 | 1 | 4 | MVP | R03, R06, R08, R19 |
| E3 | Bestand als Ereignislog (Zu- und Abgänge) statt überschriebener Mengen: sync-robust, mit Historie | 4 | 2 | 2 | MVP | R18 |
| E4 | Mehrere Lagerorte (Keller, Speisekammer, Garage) mit Temperatur-Richtwerten. Tiefkühlware zählt standardmäßig nicht | 4 | 2 | 3 | MVP | R03, R08 |
| E5 | Attribut „ohne Kochen essbar“ → Kennzahl „X Tage ohne Strom versorgt“ | 4 | 1 | 5 | MVP | R09, R11 |
| E6 | Schnellaktionen per Long-Press: verbraucht, weggeworfen, angebrochen, Teilverbrauch. Undo überall | 5 | 2 | 2 | MVP | R03, R06 |
| E7 | **Rotations-Karte „Diese Woche dran: Linsen“** → „verbraucht + nachkaufen“ → Einkaufsliste | 5 | 2 | 4 | MVP | R06, R21 |
| E8 | Einkaufsliste aus Ziel-Lücke und Rotation (Mindestbestand) | 5 | 2 | 3 | MVP | R03, R21 |
| E9 | „Inventur-Runde“ mit Swipes Ja / Weniger / Leer statt exakter Buchführung (verzeiht verpasste Einträge) | 5 | 2 | 5 | MVP | R06 |
| E10 | Wirkungsbilanz: „X Artikel rotiert, nichts weggeworfen, ca. Y € gespart“ | 3 | 2 | 4 | V2 | R18, R21 |
| E11 | Rezepte aus dem Vorrat, bevorzugt für bald ablaufende Artikel, auch ohne Strom (eigene oder CC-BY-SA-Texte) | 3 | 4 | 3 | V3 | R03, R24 |
| E12 | Druckbare Regal-Etiketten und QR-Sticker, druckbare Notvorrat-Liste | 3 | 2 | 4 | V2 | R06, R05 |

### F. Erinnerungen und Engagement

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| F1 | **Lokal geplante MHD-Erinnerungen ohne Cloud** (expo-notifications), Sammel-Push höchstens 1 × pro Woche, Vorlauf 3–6 Monate | 5 | 2 | 3 | MVP | R03, R17, R21 |
| F2 | Erlaubnis für Benachrichtigungen im Kontext (beim ersten MHD-Artikel), auf iOS provisorisch; nie „Zeitkritisch“; Texte rotieren | 4 | 1 | 2 | MVP | R21 |
| F3 | Saisonale Check-Tage: Warntag DE, AT-Probealarm (1. Samstag im Oktober), Zeitumstellung, halbjährlicher Check. Wassertausch nach Quelle (3 / 6 Monate) | 4 | 1 | 4 | MVP | R09, R10, R11, R21 |
| F4 | Homescreen-Widget „bald fällig“ und App-Badge (japanisches Rolling-Stock-Vorbild) | 3 | 3 | 3 | V2 | R02, R17 |
| F5 | Sanfte Gamification: Wissens-Abzeichen, Einstiegs-Quiz, kein Streak-Zwang, keine Angst-Countdowns | 2 | 2 | 3 | V2 | R02, R21 |
| F6 | Opt-in-Impulse in einem „window of opportunity“ (Unwetter, Stromausfall in den Medien): sanfter 2-Minuten-Check | 3 | 2 | 4 | V2 | R20 |
| F7 | Funktionsprüfung Non-Food („Powerbank laden“, „Brennstoff da?“) | 3 | 1 | 4 | V2 | R13, R20 |

### G. Design, Ton und Barrierefreiheit

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| G1 | **Bildsprache in zwei Schichten:** Fluent Emoji (MIT) für Inhalte (3D für Kacheln, Flat für Listen, High Contrast für Barrierefreiheit), Phosphor oder Lucide für die UI | 5 | 2 | 4 | MVP | R05, R19 |
| G2 | Eigenes Ergänzungsset (15–25 Motive) im Fluent-Stil: Wasserkanister, Mehl, Haferflocken, H-Milch, Linsen, Kocher, Gaskartusche, Powerbank, Kurbelradio, Bargeld, Babygläschen, Tierfutter | 4 | 3 | 4 | MVP (Teil), V2 | R19 |
| G3 | Design-Tokens: Kategorie-Farben getrennt von Statusfarben, Dark Mode | 4 | 2 | 2 | MVP | R19 |
| G4 | **MHD-Ampel mit 4 Stufen** (Farbe + Form + Text, Teal/Orange statt Rot/Grün): gut, bald verbrauchen, MHD erreicht (prüfen), Verbrauchsdatum überschritten | 5 | 1 | 4 | MVP | R19 |
| G5 | Regal-Visualisierung, die sich füllt, und Wasser in Kanistern oder Flaschen dargestellt | 4 | 3 | 5 | MVP (einfach) | R01, R07, R19 |
| G6 | Ton-Leitfaden „Vorsorge ohne Angst“: Küche und Familie statt Bunker, jede Risiko-Info mit einer konkreten Aktion | 5 | 1 | 4 | MVP (vor dem Design) | R19, R20, R21 |
| G7 | Onboarding in 3 Screens (Haushalt, Quelle, Ziel) in unter 2 Minuten, danach sofort eine Mini-Aufgabe | 5 | 2 | 3 | MVP | R20, R21 |
| G8 | Barrierefreiheit: Text-Labels an allen Piktogrammen, Dynamic Type, große Touch-Ziele, später Leichte Sprache | 4 | 2 | 3 | MVP (Basis) | R19, R20 |
| G9 | Maskottchen Eichhörnchen als Bildmarke | 3 | 2 | 3 | V2 | R25 |

### H. Non-Food und Vorsorge-Module

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| H1 | Non-Food-Checklisten entlang der BBK-Bereiche (Information, Licht und Wärme, Hausapotheke, Hygiene, Brandschutz, Notgepäck, Dokumente, Sonstiges) mit eigenen Texten und Quellenverweis | 4 | 2 | 2 | MVP (Checkliste) | R07, R13 |
| H2 | Vier Tracking-Typen für Non-Food: Ablaufdatum, Wartungsintervall, Ladezustand, Checkliste | 4 | 3 | 4 | V2 | R13 |
| H3 | Persönliche Medikamente mit Reichweite (Packung ÷ Tagesdosis) gegen das Quellenziel (10 Tage DE, 4 Wochen CH). **Gesundheitsdaten, nur lokal** | 4 | 3 | 5 | V2 | R13, R22 |
| H4 | Wartungskalender: Rauchmelder (Test jährlich, Tausch nach 10 Jahren), CO-Melder, Feuerlöscher | 3 | 2 | 4 | V2 | R13 |
| H5 | Batterie-Matrix: Gerät ↔ Batterietyp ↔ Haltbarkeit, Warnung bei fehlendem Ersatz | 3 | 3 | 5 | V2 | R13 |
| H6 | Bargeld-Rechner (NL: 70 € pro Erwachsenem + 30 € pro Kind; CH: Wocheneinkauf + Tankfüllung) | 3 | 1 | 4 | V2 | R10, R13 |
| H7 | Hausapotheke-Vorlage nach Profil (Säugling, Kleinkind, Schulkind, Senior, Haustier) | 3 | 2 | 3 | V2 | R13 |
| H8 | Dokumentenmappe **nur als Checkliste** (Original, beglaubigte Kopie, Kopie, „liegt wo“), keine Scans | 3 | 1 | 3 | V2 | R07, R13, R24 |
| H9 | Statische Sicherheitskarten (CO-Gefahr, Grill nur draußen, Fettbrand) mit Quelle | 3 | 1 | 3 | V2 | R13 |
| H10 | Jodtabletten-Hinweise | 1 | 2 | 1 | nie/nur Link | R10, R13 |

### I. Teilen, Sync und Daten

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| I1 | **Offline-first, local-first** mit lokaler SQLite-Datenbank als Quelle der Wahrheit, kein Pflichtkonto | 5 | 2 | 3 | MVP | R17, R18, R22 |
| I2 | **Export und Backup** (JSON/CSV, PDF), Import. Vertrauensfaktor, ab 12/2026 auch eine Frage der Produkthaftung | 5 | 2 | 3 | MVP | R03, R06, R22 |
| I3 | Haushalts-Sync für die Familie (Einladung per Code/QR, Rollen owner/editor/viewer). Stack: Supabase Frankfurt + PowerSync oder eine Alternative | 5 | 4 | 3 | V2 | R18 |
| I4 | Ende-zu-Ende-verschlüsselter Sync („Wir sehen nicht, was in deinem Keller steht“) | 4 | 5 | 5 | V3 | R01, R22 |
| I5 | P2P-Sync im Haushalt per WLAN/Bluetooth ohne Internet (CRDT) als Krisenmodus | 3 | 5 | 5 | V3 | R18 |
| I6 | Web-Zugang bzw. Web-App zum Anschauen und Bearbeiten | 3 | 3 | 3 | V2 | R01, R03 |
| I7 | Presence („Papa scannt gerade im Keller“) | 1 | 3 | 3 | nie/prüfen | R18 |

### J. Erweiterungen (Warnungen, Notfallplan, Karte)

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| J1 | **NINA ergänzen statt ersetzen:** Check „Bin ich gewarnt?“ (NINA installiert, Cell Broadcast aktiv) plus Deep-Links zu NINA, ZIVA, Alertswiss | 3 | 1 | 4 | MVP | R01, R24 |
| J2 | Notfallplan-Modul, offline und druckbar: Treffpunkt nah und fern, Kontaktkette, Rollen („Wer holt die Kinder?“) | 4 | 3 | 4 | V2 | R02, R24 |
| J3 | DWD-Unwetterwarnungen (CC BY 4.0) als Auslöser für einen Vorrats-Check | 3 | 3 | 4 | V2 | R24 |
| J4 | Pegel-Widget (PEGELONLINE) | 1 | 2 | 3 | V3 | R24 |
| J5 | Offline-Karte (selbst gehostete PMTiles) mit Treffpunkt und Anlaufstellen | 2 | 4 | 3 | V3 | R24 |
| J6 | Eigene MoWaS-/Warn-Pushes | 2 | 5 | 2 | nie (nur mit BBK-Vereinbarung) | R24 |

### K. Geschäftsmodell und Vertrieb

| # | Idee | Nutzen | Aufwand | Diff. | Phase | Quelle |
|---|---|:-:|:-:|:-:|:-:|---|
| K1 | **„Fair Freemium“:** Haushalt, Quellen, Ziel, unbegrenztes Inventar, Barcode und Erinnerungen dauerhaft gratis. Sicherheitsrelevantes nie hinter der Paywall | 5 | 1 | 4 | MVP | R03, R06, R23 |
| K2 | Plus als Einmalkauf (ca. 9,99–14,99 €) für Komfortfunktionen (Statistiken, PDF-Notfallmappe, Extra-Piktogramme) | 3 | 2 | 2 | MVP/V2 | R23 |
| K3 | Familien-Jahresabo (ca. 12–20 €) nur für Funktionen mit laufenden Kosten: Sync, KI-Scan-Kontingent, Cloud-Backup | 3 | 2 | 2 | V2 | R23 |
| K4 | Geschenk- und Empfehlungscodes („Vorsorge für die Eltern verschenken“) | 3 | 2 | 3 | V2 | R23 |
| K5 | **B2B2C-Piloten** (KATWARN-Muster): Co-Branding für Versicherer, Sparkassen oder Kommunen, Mitarbeiter-Benefit | 4 | 3 | 5 | V2 (Gespräche früh) | R23 |
| K6 | Kanäle: Feuerwehr, THW, DRK, VHS, Kommunen (Flyer + QR), öffentlicher Web-Vorratsrechner als SEO-Einstieg | 4 | 2 | 3 | MVP (Web-Rechner), V2 | R17, R20 |
| K7 | Fördermittel: SiFo/BMFTR (im Verbund), EXIST (mit Hochschule), Prototype Fund (bei Open Source) | 3 | 3 | – | prüfen | R23 |
| K8 | Neutrale Übergabe der Einkaufsliste an den Handel (Warenkorb, Click & Collect), gekennzeichnet, ohne bezahlte Platzierung | 2 | 3 | 3 | V3 | R23 |
| K9 | Affiliate auf Lebensmittel / kommerzielle Notpakete | 1 | 2 | 1 | nie | R06, R23 |
| K10 | „Fair-Prep-Versprechen“: keine Angst-Upsells, kein Tracking, kein Datenverkauf, keine Behördenlogos | 4 | 1 | 4 | MVP | R23 |

### L. Recht und Vertrauen (Querschnitt, ohne Bewertung, aber Pflicht)

- **L1 Quellen-Transparenz statt Logos:** Hinweis „kein Angebot einer Behörde“, eigene Texte und Piktogramme, Zahlen als Fakten mit Quelle, keine 1:1-Übernahme der BLE-Tabelle (R07, R08, R22).
- **L2 „Mensch bestätigt“:** KI- und OCR-Werte sind immer nur Vorschläge (R15, R16, R22).
- **L3 Disclaimer-Set:** Onboarding, Baby, Schwangerschaft, Krankheit, MHD, Allergene, Datenqualität von Open Food Facts; konservative Rundung (R12, R22).
- **L4 Gesundheitsdaten nur lokal**, nicht in iCloud (Apple 5.1.3(ii)), Art.-9-Einwilligung bei jedem Upload (R22).
- **L5 Cloud-KI nur per Opt-in**, nur bezahlte API-Stufen mit AVV, EXIF entfernen, Hinweis „keine Personen oder Medikamente fotografieren“ (R15, R22).
- **L6 Lizenzseite** (Open Food Facts ODbL/CC BY-SA, OSS, Icons), keine GPL/AGPL-Übernahme (R05, R19, R22).
- **L7 Launch-Checkliste:** Impressum, Datenschutzerklärung, Kontolöschung, Store-Formulare, Verarbeitungsverzeichnis, schlanke DSFA (R22).

### Die Top 10 nach Wert (Nutzen + Differenzierung − Aufwand)

| Rang | Idee | N | A | D |
|:-:|---|:-:|:-:|:-:|
| 1 | B4 Quellenvergleich / „konservativ“ | 4 | 2 | 5 |
| 2 | C1 Ziel aus Tagen + Datum mit Etappen | 5 | 1 | 4 |
| 3 | E2 MHD und Verbrauchsdatum getrennt | 5 | 1 | 4 |
| 4 | G4 MHD-Ampel mit 4 Stufen | 5 | 1 | 4 |
| 5 | E5 „ohne Kochen essbar“ / Tage ohne Strom | 4 | 1 | 5 |
| 6 | E9 Inventur-Runde per Swipe | 5 | 2 | 5 |
| 7 | B1 + B2 Versionierter Quellen-Datensatz und Umschalter | 5 | 3 | 5 |
| 8 | C5 Einkaufsplan bis Zieldatum | 5 | 3 | 5 |
| 9 | C2 „Für X Tage versorgt“ (knappste Kategorie) | 5 | 2 | 4 |
| 10 | D1 + D2 Piktogramm-Schnellerfassung mit Katalog | 5 | 2 | 4 |

**Wichtigste Erkenntnis aus der Tabelle:** Die stärksten Differenzierer sind *nicht* die Technikfeatures (Barcode ist Standard, Foto-KI ist teuer und unsicher), sondern **Fachlogik und UX**: Quellen, Ziel, Rechenweg, Rotation, schnelle Erfassung und Ton. Die Foto-KI ist das „Wow“, aber nicht das Fundament.

---

## 2. Drei MVP-Varianten

### Variante 1: „Schlank“ (Vorratsrechner + Piktogramm-Liste)

**Idee:** Den fachlichen Kern beweisen. Keine Kamera, keine Cloud.

**Features**
- Onboarding in 3 Screens: Haushalt (A1, A2, A5 vegetarisch), Quelle (B2: DE, AT, CH, EU-72h), Ziel mit Datum (C1)
- Quellenvergleich und sichtbarer Rechenweg (B4, B5, B6)
- Bedarfsrechnung je Gruppe und Wasser, Kennzahl „Für X Tage versorgt“ (C2), Grob-Schätzung im Onboarding (C4)
- Manuelle Schnellerfassung über das Piktogramm-Raster + Katalog (D1, D2), MHD-Picker (D4, D5), Kategorie-Default „geschätzt“ (D8)
- Ampel (G4), Einkaufsliste für die Lücke (E8, einfach), Lagerorte (E4), „ohne Kochen essbar“ (E5)
- Export/Import (I2), Non-Food als einfache Checkliste (H1), Deep-Links zu NINA etc. (J1)

**Plattform:** Responsive Web-App / PWA (TypeScript), Daten lokal in IndexedDB, Fachlogik als eigenes TS-Paket. Gleichzeitig als öffentlicher, kostenloser Vorratsrechner für SEO nutzbar.

**Aufwand (geschätzt in Personentagen, PT, für 1 Person):** ca. 25–40 PT (≈ 5–8 Wochen Vollzeit). Dazu ca. 5–10 PT für den Quellen-Datensatz.

**Risiken**
- **Keine verlässlichen MHD-Erinnerungen auf iOS** (PWA: nur Server-Push, nur Home-Screen-Web-App) → das Kernversprechen „lebendiger Vorrat“ fehlt (R17).
- Web-Speicher kann von WebKit gelöscht werden → Datenverlust (R17); Export ist Pflicht.
- Kaum Abgrenzung zu kostenlosen Angeboten (BLE-Kalkulator, Krisenvorrat Manager, ZIVA) → geringe Zahlungsbereitschaft.
- Manuelle Erfassung allein könnte als zu mühsam erlebt werden.

**Gut geeignet als:** PoC-Grundlage und späterer Web-Rechner, *nicht* als Produkt allein.

---

### Variante 2: „Kern“ (lebendiger Vorrat: + Barcode + MHD-Erinnerungen + Rotation)

**Idee:** Alles aus Variante 1, plus das, was den Vorrat im Alltag lebendig hält. Native App, weiterhin ohne Cloud-Pflicht.

**Zusätzliche Features**
- Barcode-Scan + Open Food Facts mit Cache und Attribution, Zuordnung zur offiziellen Warengruppe, Gewicht und kcal übernehmen (D3)
- Batch-Modus, „MHD auf alle N anwenden“, unbekannte Codes parken (D5, D6)
- MHD-OCR auf dem Gerät als Vorschlag mit LMIV-Parser (D7), **nur wenn der PoC eine brauchbare Trefferquote zeigt**, sonst nur Picker
- GS1-DataMatrix-Parser (D12) als kleines Zusatzstück
- Produkt/Charge-Modell mit Ereignislog (E1, E3), Schnellaktionen und Undo (E6)
- **Lokale MHD-Erinnerungen** (F1, F2), saisonale Check-Tage und Wassertausch (F3)
- Rotations-Karte „Diese Woche dran“ → Einkaufsliste (E7, E8), Inventur-Runde per Swipe (E9)
- Einkaufsplan bis zum Zieldatum (C5), Packungs-Übersetzung einfach (C6), Meilensteine (C10)
- Eigenes Teil-Ergänzungsset an Piktogrammen (G2), Regal- und Wasser-Visualisierung (G5)
- Fair Freemium (K1), optional Plus als Einmalkauf (K2)

**Plattform:** React Native + Expo (TypeScript) für iOS und Android, lokale SQLite. Das gemeinsame Fachlogik-Paket aus Variante 1 wird übernommen. Web-Rechner aus V1 bleibt als Einstieg. Sync bewusst *noch nicht* (V2), Datenmodell aber schon sync-fähig (UUIDs, Ereignislog, Soft Delete).

**Aufwand (geschätzt):** ca. 70–110 PT (≈ 3,5–5,5 Monate Vollzeit) inkl. Store-Vorbereitung. Hinzu kommen: Apple Developer 99 USD/Jahr, Google 25 USD einmalig, Google-Play-Testpflicht (12 Tester × 14 Tage), Design-Ergänzungsset (Freelancer, Budget offen), Rechtsprüfung vor dem Launch.

**Risiken**
- **Open-Food-Facts-Trefferquote bei DACH-Eigenmarken unbekannt** (VZ-Test bei NoWaste nur ca. 50 %) → Fallback Piktogramm muss sehr schnell sein (R03, R14).
- MHD-OCR auf Dosen und Punktmatrix eventuell unbrauchbar → muss als „Bonus“ gebaut werden, nicht als Pflichtweg (R16).
- On-Device-OCR in Expo nur über Community-Module (Wartungsstand unklar) (R17).
- Ohne Sync fehlt der Familien-Aspekt, der oft gelobt wird (R06) → klare Kommunikation „Sync kommt“.
- Bindung nach der Ersterfassung (Kernrisiko des Marktes) (R06, R21).
- Haftung: falsche Mengen oder Datumsangaben (R22) → Disclaimer, Rechenweg, Bestätigung.

---

### Variante 3: „Wow“ (+ Foto-KI-Erkennung + Familien-Sync)

**Idee:** Alles aus Variante 2, plus „Magic Foto“ und Haushalts-Sync. Das, was im Ideenpapier am meisten begeistert.

**Zusätzliche Features**
- „Magic Foto“: Regal- oder Einkaufsfoto → Vision-LLM über einen schlanken Backend-Proxy (Anbieter austauschbar) → JSON mit Kategorie-Enum, Menge, `mhd_text_raw` / `mhd_iso` oder `null`, `confidence` → Bestätigungs-Screen mit Bounding Boxes (D10)
- Zweiter MHD-Versuch per LLM auf dem Ausschnitt (D11)
- Asynchrone Erkennung („3 Artikel erkannt, bitte prüfen“), Fotos verkleinern, EXIF entfernen, Opt-in mit Nennung des Anbieters
- Kontingent pro Haushalt (zum Beispiel X KI-Scans pro Monat gratis), Rate-Limits, Missbrauchsschutz
- Haushalts-Sync (I3): Konto erst beim Teilen, anonymer Start, Einladung per QR, Rollen, Kontolöschung in der App
- Familien-Abo für Sync + KI-Kontingent (K3)

**Plattform:** Expo-App wie in Variante 2 plus Backend: Supabase (Region Frankfurt) + PowerSync oder eine Alternative, Edge-Funktion als KI-Proxy, EU-taugliche KI-Anbieter mit AVV.

**Aufwand (geschätzt):** ca. 140–200 PT (≈ 7–10 Monate Vollzeit). Laufende Kosten: Backend ab ca. 25–75 USD/Monat sobald echte Nutzer da sind (Free-Tiers pausieren), KI ca. 0,2–2 US-Cent pro Foto (unsicher), dazu AVVs, DSFA und Datenschutzerklärung.

**Risiken**
- **MHD-Halluzination** durch das LLM (plausibles, aber falsches Datum) → im Notvorrat kritisch (R15, R16).
- Ungenaues Zählen und schwache Feinklassifikation bei dichten Regalfotos → Enttäuschung, wenn „ganzes Regal fotografieren“ versprochen wird (R04, R15).
- DSGVO: Fotos aus der Wohnung an Drittanbieter, Drittlandtransfer; bei Claude derzeit keine EU-Datenresidenz, bei Gemini nur Paid-Tier zulässig (R15, R22).
- Sync ist laut Konkurrenz-Reviews die häufigste Fehlerquelle (R03); zwei Anbieter = zwei Lock-ins (R18).
- Laufende Kosten treffen auf eine Zielgruppe mit geringer Zahlungsbereitschaft und Abo-Aversion (R23).
- Lange Zeit bis zum Launch in einem Markt, der sich gerade füllt (R01, R02).

---

### Vergleich auf einen Blick

| | Schlank | Kern | Wow |
|---|---|---|---|
| Plattform | Web/PWA | iOS + Android (Expo), Web-Rechner | wie Kern + Backend |
| Erfassung | Piktogramm + Picker | + Barcode/OFF, + OCR-Vorschlag | + Magic Foto (LLM) |
| MHD-Erinnerung | unzuverlässig (iOS) | lokal, offline | lokal + Sync |
| Familie / Sync | nein (Export) | nein (Export), sync-fähiges Modell | ja |
| Laufende Kosten | ~0 € | ~10 €/Monat (Stores) | 50–150+ €/Monat + KI |
| Aufwand | 25–40 PT | 70–110 PT | 140–200 PT |
| Differenzierung | mittel (Quellen) | hoch (Quellen + Rotation + UX) | sehr hoch (+ Foto-KI) |
| Hauptrisiko | kein Grund zu bleiben | OFF-Lücken, Bindung | Halluzination, Kosten, DSGVO |

---

## 3. Empfehlung und Proof of Concept

### Empfehlung

**Variante 2 „Kern“ als MVP bauen, mit Variante 1 als erstem Baustein und der Foto-KI aus Variante 3 als bewusst nachgelagertem Release (V1.1/V2), aber erst, wenn der PoC sie bestätigt.**

Begründung:
- Die Recherche zeigt, dass Nutzer an **Erfassungsaufwand und fehlender Routine** scheitern, nicht an fehlender KI. Kern löst genau das (Piktogramm-Schnellerfassung, Barcode, Batch, Inventur-Runde, Rotationskarte, lokale Erinnerungen).
- Die **echten USPs** (mehrere Quellen mit Rechenweg, Ziel mit Datum und Einkaufsplan, „Tage ohne Strom“, MHD/Verbrauchsdatum-Logik, Ton und Optik) sind im Kern alle enthalten und kosten keine laufenden Gebühren.
- Die native App ist nötig, weil reine PWAs auf iOS keine verlässlichen lokalen Erinnerungen können (R17).
- Die Foto-KI ist das „Wow“ fürs Marketing, aber auch das größte Risiko (Halluzination, DSGVO, Kosten). Sie sollte erst kommen, wenn eine eigene Messreihe sie absichert, und dann als **Opt-in mit Bestätigungs-Screen**.
- Das Datenmodell wird von Anfang an sync-fähig angelegt, damit Familien-Sync in V2 kein Umbau wird.
- Parallel (ohne Code): Namen festlegen, Domains sichern, Anfragen an BLE/BBK/BWL/ÖZSV stellen, Ton-Leitfaden schreiben.

### Proof of Concept: Was genau beweisen?

Zeitrahmen: **2–3 Wochen**, Wegwerf-Code erlaubt, lokal ohne Backend (außer für den KI-Test). Fünf Hypothesen mit messbaren Abbruchkriterien:

| # | Hypothese | Test | Erfolgskriterium | Wenn nicht erfüllt |
|---|---|---|---|---|
| P1 | **Die Bedarfsrechnung ist korrekt und verständlich.** | Quellen-Datensatz DE (BLE Mischkost + vegetarisch), AT (ÖZSV 14 T), CH (BWL), EU (72 h) als JSON mit Metadaten; Rechenkern als TS-Paket mit Unit-Tests gegen die offiziellen Beispiele (z. B. BBK 3 Personen: 18/30/60 l; BLE 10 Tage: 3,3/4,0/2,5 kg …). 5 Personen erklären lassen, was der Rechenweg aussagt | Alle Referenzwerte exakt; 4 von 5 Testpersonen verstehen Quelle und Ergebnis ohne Hilfe | Datenmodell und Darstellung überarbeiten, bevor irgendetwas anderes gebaut wird |
| P2 | **Barcode + Open Food Facts trägt im DACH-Vorrat.** | 80–100 typische Vorratsprodukte (Aldi, Lidl, Rewe, Edeka, dm, Eigenmarken, Konserven, Wasser, H-Milch) scannen, auf iPhone und Android | ≥ 70 % Treffer mit Name **und** Menge; ≥ 50 % mit kcal; Kategoriezuordnung ≥ 80 % richtig | Piktogramm-Schnellerfassung wird Hauptweg, Barcode nur Beschleuniger; eigener DE-Katalog wichtiger |
| P3 | **Erfassung ist schneller als Notizblock.** | Klick-Prototyp oder PoC-App: 20 Artikel erfassen (Piktogramm vs. Barcode vs. Batch), Stoppuhr | Median ≤ 8 s pro Artikel inkl. MHD (Ziel 5 s); keine Testperson bricht ab | Erfassungsflow vereinfachen (z. B. MHD nur pro Gruppe, Inventur-Runde statt Einzelbuchung) |
| P4 | **MHD-Erkennung bringt mehr als sie stört.** | Benchmark mit ca. 100 Fotos echter Packungen (Dose geprägt, Punktmatrix, Etikett, Glas): Apple Vision / VisionKit, ML Kit v2, Tesseract.js, 2 Vision-LLMs (z. B. ein günstiges Flash-/Haiku-Modell und ein stärkeres) | On-Device: ≥ 60 % korrekt mit Parser; **Halluzinationsrate LLM ≤ 2 %** (falsches Datum statt `null`); Wartezeit ≤ 3 s | On-Device-OCR fliegt aus dem MVP, Picker bleibt; LLM-MHD nur, wenn Halluzination niedrig ist |
| P5 | **„Magic Foto“ ist mehr als eine Spielerei.** | 30 Regal- und Einkaufsfotos (5–30 Artikel) gegen 2–3 Vision-LLMs mit festem JSON-Schema | Kategorie-Genauigkeit ≥ 85 %, Zählfehler ≤ 15 %, Kosten ≤ 1 Cent pro Foto, Bestätigung schneller als Einzelerfassung | Foto-KI wird auf „Einkauf auf dem Tisch“ (wenige Artikel) begrenzt oder auf V3 verschoben |

Zusätzlich, ohne Code und parallel zum PoC:
- **Nutzerwert (P6):** 8–10 Interviews mit Familien, Paaren 30–50 und Senior:innen in DACH (Hauptlücke der Recherche: kaum DACH-Nutzerstimmen). Kernfragen: Was hält euch ab? Wie würdet ihr erfassen? Was würdet ihr zahlen?
- **Konkurrenz-UX-Test:** Vorratsplan, Vorratskompass, Blackout Prepper und Krisenvorrat Manager installieren; Onboarding-Dauer und Sekunden pro Artikel messen (Benchmark für P3).
- **Fake-Door / Landingpage** mit 2–3 Namenskandidaten und Preisanker (Einmalkauf vs. Familien-Abo) zur Messung von Interesse und Zahlungsbereitschaft.
- **Anfragen versenden** (durch den Gründer): BLE (info@ble.de) zur Nachnutzung der Tabellendaten, BBK, BWL, ÖZSV zu Kooperation und Freigaben.

**Ergebnis des PoC:** eine Go/No-Go-Entscheidung je Erfassungsweg und ein bestätigter, getesteter Rechenkern (P1), der direkt in das MVP übernommen wird.

---

## 4. Entscheidungen für den Gründer

1. **Name:** Den früheren Arbeitstitel nur als Codename behalten? *(Entschieden 2026-11-22: Preposaurus.)* Öffentlich einen deutschen Namen wählen (Shortlist R25: Vorratsklug, Vorrapp, Proviantor, Vorsorgly, Kellerkiste)? Domains und Social-Handles sofort sichern?
2. **Zielmarkt zum Start:** nur Deutschland, DACH (DE/AT/CH) oder gleich international (EN)? Davon hängen Quellen, Sprachen und Store-Texte ab.
3. **Zielgruppe:** Familien und Paare 30–50 als Hauptzielgruppe (Empfehlung) oder eher bestehende Vorsorger („Allrounder“) als Early Adopters? Senior:innen und Kümmerer bewusst mitdenken?
4. **MVP-Variante:** Schlank, Kern (Empfehlung) oder Wow?
5. **Plattform:** Expo/React Native (Empfehlung), Flutter oder doch erst Web? Hast du eine persönliche Präferenz oder Vorerfahrung?
6. **Welche Quellen im MVP:** DE (BLE + BBK-Stufen), AT, CH, EU-72h. Reicht das, oder sollen FEMA / weitere direkt dabei sein?
7. **Rechenmodus:** nur die offizielle Pauschale (2.200 kcal) oder zusätzlich die eigene DGE-Ableitung nach Alter und Geschlecht (Haftungs- und Erklärungsaufwand)?
8. **Foto-KI:** Ist sie für dich unverzichtbar im ersten Release, oder darf sie nach dem PoC-Ergebnis in V1.1/V2 kommen? Welche KI-Anbieter kommen aus Datenschutzsicht infrage (EU-Residenz ja/nein)?
9. **Familien-Sync:** im MVP oder erst V2? Wenn ja: Supabase + PowerSync, Firebase oder selbst gehostet?
10. **Gesundheitsdaten:** Sollen Medikamente, Allergien, Schwangerschaft überhaupt erfasst werden, und wenn ja nur lokal (Empfehlung) und als Flags statt Diagnosen?
11. **Non-Food im MVP:** nur Checkliste (Empfehlung) oder schon mit Ablaufdaten, Wartung und Medikamenten-Reichweite?
12. **Geschäftsmodell:** Fair Freemium + Einmalkauf, Familien-Abo nur für Kosten-Features, rein kostenlos/Spenden oder Open Source mit Förderung (Prototype Fund)? Ist das ein Nebenprojekt oder soll es tragfähig werden (dann B2B2C früh angehen)?
13. **B2B2C:** Willst du früh Gespräche mit Versicherern, Sparkassen, Kommunen oder Hilfsorganisationen führen?
14. **Open Source:** Eigenen Code oder zumindest den Quellen-Datensatz offen veröffentlichen? Prepper_Log (Apache-2.0) auswerten bzw. forken?
15. **Behörden-Anfragen:** Willst du BLE, BBK, BWL und ÖZSV aktiv anschreiben (Freigabe, Kooperation)? Wer ist Absender (Privatperson, Firma)?
16. **Rechtsform und Rechtsprüfung:** Unter welcher Rechtsform erscheint die App (Impressum, Haftung)? Budget für eine anwaltliche Prüfung vor dem Launch (Haftung, DSGVO, Marken)?
17. **Design-Budget:** Fluent Emoji + eigenes Ergänzungsset vom Freelancer (Kosten?) oder komplett eigene Illustrationen? Maskottchen ja/nein?
18. **Ton und Haltung:** Einverstanden mit „Vorsorge ohne Angst“, keine Prepper-Ästhetik, kein Krisen-Newsfeed, keine Affiliate-Links für Lebensmittel?
19. **Zeit und Ressourcen:** Wie viele Stunden pro Woche stehen zur Verfügung, gibt es Mitstreiter:innen, und bis wann soll der MVP im Store sein?
20. **Quellenpflege:** Wer prüft die Empfehlungen halbjährlich (du selbst, Community, Partner)? Ohne diesen Prozess veralten die „offiziellen“ Zahlen.
21. **PoC-Freigabe:** Sind die fünf Hypothesen (P1–P5) und die Erfolgskriterien so in Ordnung, und welche Nutzer:innen aus deinem Umfeld können für Interviews und Tests (auch die 12 Google-Play-Tester) gewonnen werden?

---

*Hinweis zur Datenlage:* Mehrere Recherche-Reports melden ausgeschöpfte Websuche, blockierte Primärquellen (z. B. zivilschutz.at, MAFF, redcross.org) oder nur über Sekundärquellen belegte Zahlen. Alle Werte, die in den Quellen-Datensatz wandern, müssen vor der Umsetzung manuell gegen die Primärquelle geprüft werden. Aufwandsschätzungen sind grobe Annahmen für eine erfahrene Einzelperson.
