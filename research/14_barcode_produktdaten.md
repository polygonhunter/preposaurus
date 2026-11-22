# Barcode-Scanning und Produktdatenbanken für Preposaurus

> **Kurzfazit:** Open Food Facts (OFF) ist für Preposaurus die naheliegende, kostenlose Produktdatenquelle: offene API ohne Schlüssel, ca. 429.000 Produkte auf der deutschen Instanz, Bilder, Nährwerte, Allergene – allerdings mit engen Rate-Limits (15 Produktabfragen/Min./IP), Share-Alike-Lizenz (ODbL / CC-BY-SA) und ohne Qualitätsgarantie. Kommerzielle Alternativen (EAN-Search, UPCitemdb, Barcode Lookup) liefern meist nur Name/Kategorie und kosten ab ca. 9–19 EUR/Monat; GS1 ist keine offene Endkunden-Datenquelle. Für das Scannen gilt: nativ sind Google ML Kit (Android/iOS, on-device, kostenlos) und Apple VisionKit (iOS 16+) Standard; im Web ist die native `BarcodeDetector`-API **nicht** in Safari/Firefox verfügbar, daher braucht eine Web-App einen WebAssembly-Fallback (zxing-cpp, z. B. über das Paket `barcode-detector`). Wichtig: Das MHD kommt **nie** aus der Datenbank – es muss pro Packung erfasst werden (manuell oder per OCR).

## Ergebnisse

### 1. Open Food Facts (OFF) – Kerndaten

| Aspekt | Befund | Quelle |
|---|---|---|
| API-Version | v3 (aktuell v3.6) empfohlen; v2 unterstützt, aber deprecated; v0/v1 Legacy | [1] |
| Authentifizierung (Lesen) | Kein API-Key; Pflicht ist ein eigener User-Agent im Format `AppName/Version (Kontakt-E-Mail)` | [1] |
| Authentifizierung (Schreiben) | Login (Session-Cookie) oder Account-Credentials bei POST/PUT/DELETE – nötig, wenn Preposaurus fehlende Produkte/Fotos zurückspielen will | [1] |
| Rate Limits | **15 Req./Min./IP** für Produktabfragen, **10 Req./Min./IP** für Suchen; Search-as-you-type wird explizit abgeraten (Sperrgefahr) | [1] |
| Testumgebung | `world.openfoodfacts.net` (HTTP Basic Auth, öffentlich dokumentiert) | [1] |
| Umfang DE | Startseite de.openfoodfacts.org zeigt „429.396 Produkte" (Abruf 2026-10-06; ob Zahl = in DE verkaufte Produkte oder gesamt, nicht eindeutig) | [2] |
| Bulk-Daten | Nächtliche Dumps: MongoDB, JSONL, Parquet (Hugging Face), CSV (~9 GB unkomprimiert), Delta-Exporte der letzten 14 Tage (ohne Löschungen); Bilder über AWS Open Data | [3] |
| Lizenz Datenbank | Open Database License (ODbL) – Share-Alike, Attribution mit klickbarem Link | [3][4] |
| Lizenz Einzelinhalte | Database Contents License 1.0 | [4] |
| Lizenz Bilder | CC-BY-SA | [1][3][4] |
| Gewährleistung | Daten „as-is", keine Garantie für Richtigkeit/Vollständigkeit; Marken-/Designrechte Dritter können zusätzlich gelten | [4] |
| Schwesterprojekte | Open Products Facts (Non-Food, ca. 46.600 Produkte), Open Beauty Facts – relevant für spätere Non-Food-Erweiterung (Batterien, Hygiene) | [5] |

**Beispielabfrage (nur zur Illustration):**

```
GET https://world.openfoodfacts.org/api/v2/product/3017620422003.json
    ?fields=product_name,brands,quantity,categories_tags,image_front_small_url,
            nutriscore_grade,nova_group,allergens_tags,expiration_date,completeness
User-Agent: Preposaurus/0.1 (kontakt@example.org)
```

Stichprobe (Nutella, 3017620422003) lieferte u. a. Name, Marke, Menge „400 g", Kategorien, Allergene, Nutri-Score E, NOVA 4, Verpackungsinfos, `completeness` 88,75 % – und **`expiration_date: "12-2024"`** [6]. Das zeigt: Das Feld `expiration_date` ist nur das MHD **einer zufällig fotografierten Packung** und für die Vorratsverwaltung wertlos. Außerdem war als Land nur „France" eingetragen – Länderzuordnung ist lückenhaft.

**Für Preposaurus relevante OFF-Felder (Auswahl):** `product_name` / `product_name_de`, `brands`, `quantity` (Freitext, z. B. „400 g" – muss geparst werden), `categories_tags` (Taxonomie, gut zum Mapping auf BBK-Warengruppen), `image_front_url` / `image_front_small_url`, `nutriments` (kcal pro 100 g – ermöglicht Kalorien-basierte Vorratsrechnung), `allergens_tags`, `nutriscore_grade`, `nova_group`, `packaging`, `completeness` [6][7].

**Datenqualität – Einschätzung:** Crowdsourced; Vollständigkeit schwankt stark je Produkt (Feld `completeness` vorhanden). Handelsmarken (Aldi/Lidl/Rewe-Eigenmarken) und regionale Produkte sind erfahrungsgemäß lückenhafter – **nicht verifiziert in dieser Recherche**, sollte im PoC mit 50–100 typischen Vorratsprodukten (Konserven, Nudeln, Reis, Wasser) gemessen werden.

### 2. Alternative Produktdatenbanken

| Anbieter | Umfang (lt. Anbieter) | Daten | Kosten / Limits | Eignung für Preposaurus | Quelle |
|---|---|---|---|---|---|
| **Open Food Facts** | ~429k (DE-Instanz) | Name, Marke, Menge, Kategorien, Bilder, Nährwerte, Allergene | Kostenlos; 15 Req./Min./IP | Erste Wahl für Lebensmittel | [1][2] |
| **EAN-Search.org** | „1,3 Mrd. Produkte" | Name, Kategorie (oft), EAN; keine Produktfotos (nur generierte Barcode-Bilder) | Trial 100 Abfragen/Monat (1 EUR 1. Monat, dann 9 EUR); Pro 5.000 = 19 EUR; Bronze 50.000 = 39 EUR; Silver 150.000 = 99 EUR; Gold 300.000 = 149 EUR/Monat | Fallback für Name, wenn OFF nichts liefert | [8] |
| **UPCitemdb** | k. A. (US-Fokus) | Name, Marke, Bilder-Links (nicht verifiziert) | FREE: 100 Requests/Tag, 6/Min.; DEV: 20.000 Lookups/Tag (Preise nicht abgerufen) | Schwach für DE-Lebensmittel (US-lastig, Annahme) | [9] |
| **Barcode Lookup** | k. A. | k. A. | Seite blockierte Abruf (HTTP 403) – **nicht verifiziert** | Offen | [10] |
| **GS1 / Verified by GS1** | Offizielle GTIN-Stammdaten | Kernattribute (Marke, Bezeichnung, Bild-URL, Menge – laut allgemeinem Wissen, **nicht verifiziert**, Seite 403) | Zugang primär für GS1-Mitglieder/Handel; GS1 Germany listet es nur als Teil der Service-Plattform | Kein realistischer Kanal für eine Consumer-App ohne Vertrag | [11][12] |

### 3. Barcode-Scanner-Bibliotheken

| Lösung | Plattform | Formate (relevant: EAN-13/EAN-8) | Offline | Kosten / Lizenz | Hinweise | Quelle |
|---|---|---|---|---|---|---|
| **Google ML Kit Barcode Scanning** | Android, iOS | EAN-8, EAN-13, UPC-A/E, Code 39/93/128, ITF, Codabar, QR, Data Matrix, PDF417, Aztec | Ja, komplett on-device | Kostenlos nutzbar (keine Preisangabe); sendet Nutzungs-Metriken an Google – Hinweispflicht in Datenschutzerklärung | Max. 10 Codes pro Aufruf | [13][14] |
| **Google Code Scanner** | **nur Android** (API 23+, Play Services) | wie ML Kit | Ja | Kostenlos | Fertige Scan-UI, **keine Kamera-Berechtigung nötig**; Modul wird nachgeladen | [15] |
| **Apple VisionKit DataScannerViewController** | iOS/iPadOS 16+, visionOS 1+ | Barcodes + QR + **Text (OCR)** | Ja | Systembestandteil | Geräte ab 2018 mit Neural Engine; `isSupported`/`isAvailable` prüfen; kann gleichzeitig MHD-Text erkennen | [16][17] |
| **BarcodeDetector (Web API)** | Chrome Android, Samsung Internet voll; Chrome/Edge/Opera Desktop „partial"; **Safari: deaktiviert/nicht unterstützt; Firefox: nein** | ean_13, ean_8 u. a. (zur Laufzeit via `getSupportedFormats()`) | Ja | – | Experimentell, nicht Baseline, nur HTTPS | [18][19] |
| **barcode-detector (Sec-ant)** | Web (alle modernen Browser) | 40+ Formate | Ja | MIT | Polyfill/Ponyfill der BarcodeDetector-API auf Basis zxing-cpp/WASM; WASM selbst hostbar (Offline/PWA, CSP) | [20] |
| **zxing-cpp** | C++ mit Wrappern für Android, iOS, WASM, Kotlin/Native, Python … (Flutter extern) | EAN/UPC, DataBar, Code 39/93/128, QR, Data Matrix … | Ja | Apache-2.0 | Aktiv gepflegt | [21] |
| **zxing-js/library** | Web | diverse | Ja | Apache-2.0 | **Maintenance-Modus**, nur Patches aus der Community – für Neuprojekt nicht empfohlen | [22] |
| **Quagga2** | Web | nur 1D (EAN-13, EAN-8, UPC, Code 128 …) | Ja | MIT | Gepflegter Fork von QuaggaJS; Chrome, Edge, Firefox, iOS Safari | [23] |
| **Scanbot SDK** (kommerziell) | Mobile + Web | viele | Ja | ab ca. 2.500 USD/Jahr (Festpreis, Angebot) | Für MVP überdimensioniert | [24] |

Zur Desktop-Chrome-Einstufung „partial": Laut caniuse/MDN ist die Unterstützung auf bestimmte Betriebssysteme beschränkt (nach meinem Kenntnisstand macOS, ChromeOS, Android; Windows/Linux nicht) – **die genaue OS-Liste wurde hier nicht verifiziert** [19].

## Bedeutung für Preposaurus

1. **Datenquelle MVP:** Open Food Facts als einzige Produktdatenquelle. Scan → EAN → OFF-Lookup → Vorschlag (Name, Bild, Menge, Kategorie, kcal). Nutzer bestätigt/korrigiert. Kein Bezahl-Fallback im MVP.
2. **Rate-Limits umgehen, ohne zu tricksen:** Lookups direkt vom Endgerät (Limit gilt pro IP, also pro Nutzer) statt über einen zentralen Server. Ergebnisse lokal cachen. Falls ein Backend nötig wird: eigener Cache/Spiegel aus dem nächtlichen Dump (nur relevante Kategorien + DE), Delta-Updates.
3. **MHD separat erfassen:** OFF liefert kein brauchbares MHD. Optionen: Datumswähler mit Schnellauswahl (Monat/Jahr reicht bei Konserven), OCR des aufgedruckten MHD (VisionKit kann Text und Barcode im selben Scanner erkennen; auf Android ML Kit Text Recognition – separat zu recherchieren).
4. **Kategorie-Mapping:** OFF-`categories_tags` (Taxonomie, z. B. `en:canned-foods`, `en:pastas`) auf die BBK-Warengruppen (Getreide, Gemüse/Hülsenfrüchte, Obst, Milch, Fisch/Fleisch, Fette, Getränke …) mappen. So kann ein gescanntes Produkt automatisch auf das Vorratsziel angerechnet werden; `quantity` + `nutriments.energy-kcal_100g` ermöglichen eine kcal-basierte Reichweitenberechnung („reicht für X Tage").
5. **Bilder & Piktogramme:** OFF-Produktfotos sind CC-BY-SA – nutzbar mit Attribution, aber Qualität uneinheitlich. Empfehlung: In Listen eigene, einheitliche Kategorie-Piktogramme zeigen; OFF-Foto nur in der Detailansicht (mit Lizenzhinweis).
6. **Lizenz/Recht:** Sichtbare Attribution „Daten von Open Food Facts (ODbL)" mit Link. Achtung Share-Alike: Wer OFF-Daten mit eigenen Daten zu einer **öffentlich verteilten Datenbank** vermengt, muss diese unter ODbL stellen. Private Nutzerinventare sind voraussichtlich unkritisch – vor Launch juristisch prüfen. Haftungshinweis: Allergen-/Nährwertangaben ohne Gewähr.
7. **Community-Beitrag als Feature:** Wenn ein Produkt fehlt, Nutzer optional Fotos/Name an OFF beisteuern lassen (Write-API, OFF-Account nötig) – stärkt Datenbasis und ist ein schönes „Open"-Argument.
8. **Scanner-Technik nach Plattform:**
   - **Web/PWA-MVP:** native `BarcodeDetector` wo vorhanden, sonst Ponyfill `barcode-detector` (zxing-cpp/WASM, MIT). WASM lokal hosten für Offline-Fähigkeit. Nicht auf zxing-js setzen (Maintenance-Modus).
   - **Native/Flutter/React Native später:** Android Google Code Scanner (ohne Kamerarechte) oder ML Kit; iOS VisionKit DataScanner (Barcode + MHD-Text in einem).
9. **Non-Food später:** Open Products Facts (Batterien, Kerzen, Hygiene) über dieselbe API-Struktur anbinden; Datenbasis aber klein (~46.600 Produkte).
10. **PoC-Vorschlag (ohne Produktivcode):** 50–100 typische Notvorrats-Produkte aus deutschen Discountern scannen und Trefferquote, Feldvollständigkeit (Name, Menge, Bild, kcal, Kategorie) und Scan-Erfolg auf iPhone-Safari vs. Android-Chrome messen.

## Offene Fragen

- Wie hoch ist die tatsächliche OFF-Trefferquote für typische deutsche Vorratsprodukte (Eigenmarken, Konserven, Wasser)? → PoC-Messung.
- Reicht 15 Req./Min./IP bei gleichzeitigem Scannen mehrerer Haushaltsmitglieder hinter einer IP (WLAN)? Vermutlich ja (Einkauf einräumen ≈ 1 Scan alle paar Sekunden), aber Burst beim Ersterfassen eines großen Vorrats prüfen.
- Exakte ODbL-Folgen für Sync-Backend mit gespeicherten OFF-Daten (Cache = „Derivative Database"?) – juristische Klärung.
- Barcode Lookup und Verified by GS1: Preise/Konditionen nicht abrufbar (HTTP 403) – ggf. direkt anfragen.
- Exakte OS-Liste für BarcodeDetector auf Chrome Desktop nicht verifiziert.
- Bundle-Größe des zxing-cpp-WASM (relevant für PWA-Ladezeit) nicht erhoben.
- MHD-OCR auf Android (ML Kit Text Recognition) und im Web (z. B. Tesseract.js) – Genauigkeit bei Prägedruck auf Dosendeckeln unklar; eigene Recherche/PoC.
- Mehrfach-EANs / Multipacks (Sixpack Wasser mit Umkarton-EAN vs. Einzelflasche) – wie wird Menge korrekt gezählt?

## Quellen

1. Open Food Facts – API Documentation (Introduction), https://openfoodfacts.github.io/openfoodfacts-server/api/ (Abruf 2026-10-06)
2. Open Food Facts Deutschland – Startseite, https://de.openfoodfacts.org/ (Abruf 2026-10-06)
3. Open Food Facts – Data (Downloads & Lizenz), https://world.openfoodfacts.org/data (Abruf 2026-10-06)
4. Open Food Facts – Terms of use, https://world.openfoodfacts.org/terms-of-use (Abruf 2026-10-06)
5. Open Products Facts – Startseite, https://world.openproductsfacts.org/ (Abruf 2026-10-06)
6. Open Food Facts API v2 – Produkt 3017620422003 (Stichprobe), https://world.openfoodfacts.org/api/v2/product/3017620422003.json (Abruf 2026-10-06)
7. Open Food Facts – API Reference v2, https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/ (Abruf 2026-10-06)
8. EAN-Search.org – EAN Database API, https://www.ean-search.org/ean-database-api.html (Abruf 2026-10-06)
9. UPCitemdb – API Rate Limits, https://www.upcitemdb.com/wp/docs/main/development/api-rate-limits/ (Abruf 2026-10-06)
10. Barcode Lookup – API, https://www.barcodelookup.com/api (Abruf 2026-10-06, HTTP 403 – Inhalt nicht verifiziert)
11. GS1 – Verified by GS1, https://www.gs1.org/services/verified-by-gs1 (Abruf 2026-10-06, HTTP 403 – Inhalt nicht verifiziert)
12. GS1 Germany – Startseite, https://www.gs1-germany.de/ (Abruf 2026-10-06)
13. Google for Developers – ML Kit Barcode Scanning, https://developers.google.com/ml-kit/vision/barcode-scanning (Abruf 2026-10-06)
14. Google for Developers – ML Kit Terms, https://developers.google.com/ml-kit/terms (Abruf 2026-10-06)
15. Google for Developers – Google code scanner (Android only), https://developers.google.com/ml-kit/vision/barcode-scanning/code-scanner (Abruf 2026-10-06)
16. Apple Developer – DataScannerViewController, https://developer.apple.com/documentation/visionkit/datascannerviewcontroller (Abruf 2026-10-06)
17. Apple WWDC22 – Capture machine-readable codes and text with VisionKit, https://developer.apple.com/videos/play/wwdc2022/10025/ (Abruf 2026-10-06)
18. MDN Web Docs – BarcodeDetector, https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector (Abruf 2026-10-06)
19. Can I use – BarcodeDetector API, https://caniuse.com/mdn-api_barcodedetector (Abruf 2026-10-06)
20. GitHub – Sec-ant/barcode-detector, https://github.com/Sec-ant/barcode-detector (Abruf 2026-10-06)
21. GitHub – zxing-cpp/zxing-cpp, https://github.com/zxing-cpp/zxing-cpp (Abruf 2026-10-06)
22. GitHub – zxing-js/library, https://github.com/zxing-js/library (Abruf 2026-10-06)
23. GitHub – ericblade/quagga2, https://github.com/ericblade/quagga2 (Abruf 2026-10-06)
24. Scanbot SDK – Pricing, https://scanbot.io/pricing/ (Abruf 2026-10-06)
