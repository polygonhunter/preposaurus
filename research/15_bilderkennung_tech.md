# Technik der Bilderkennung für Vorräte (Stand 2026): On-Device vs. Cloud-Vision vs. multimodale LLMs

> **Kurzfazit:** Keine einzelne Technik deckt alles ab. Barcode und Text (MHD) lassen sich **kostenlos, offline und schnell auf dem Gerät** lesen (Apple VisionKit/Vision, Google ML Kit). Für „Foto vom Regal → Liste aller Artikel mit Kategorie, Menge und MHD als JSON“ sind **multimodale LLMs (Gemini, Claude, GPT)** derzeit das einzige praktikable Werkzeug. Sie kosten pro Foto grob **0,05 bis 2 US-Cent** (eigene Rechnung), liefern über Structured Outputs garantiert gültiges JSON und zählen bzw. lokalisieren nur ungefähr. Klassische Cloud-Vision-APIs (Google Vision, AWS Rekognition) liefern nur generische Labels wie „Food“ oder „Can“ und sind für Preposaurus kaum nützlich. **Empfehlung für den PoC:** hybrid. Barcode und MHD-OCR auf dem Gerät, dazu ein LLM-„Foto-Modus“ (Startkandidat: Gemini Flash-Lite/Flash, Vergleich mit Claude Haiku/Sonnet und einem kleinen GPT-Modell) auf 20 bis 30 echten Vorratsfotos messen.

Ergänzt Report `04_bilderkennung_apps.md` (Wettbewerber und Studien). Hier geht es um die **Technikwahl**.

## Ergebnisse

### 1. Überblick der Optionen

| Option | Was sie kann | Mehrere Artikel pro Foto | Strukturierte Ausgabe | Datenschutz | Kosten |
|---|---|---|---|---|---|
| **Apple VisionKit `DataScannerViewController`** | Live-Kamera-Scan von Text, Daten im Text und Codes; ab iOS 16, nur auf unterstützter Hardware (`isSupported`) [1] | Ja, `recognizesMultipleItems` [1] | Native Objekte (kein JSON nötig) | Auf dem Gerät | 0 € |
| **Apple Vision `RecognizeTextRequest`** | OCR, `.fast`/`.accurate`, Sprachwahl, `customWords`; ab iOS 18 [2] | Alle Textzeilen im Bild | Beobachtungen mit Position | Auf dem Gerät | 0 € |
| **Apple Vision `ClassifyImageRequest`** | Bildklassifikation mit festem Label-Satz (`supportedIdentifiers`); ab iOS 18 [3] | Nein, Klassifikation für das ganze Bild | Labels + Konfidenz | Auf dem Gerät | 0 € |
| **Apple Foundation Models** | On-Device-Sprachmodell mit „guided generation“ (`@Generable`, typsichere Swift-Strukturen); laut Doku auch **multimodale Prompts mit Bildanhängen** (`ImageAttachmentContent`); ab iOS 26, nur auf Geräten mit Apple Intelligence [4] | Unklar, nicht getestet | Ja (`@Generable`) | Auf dem Gerät (optional Private Cloud Compute) [4] | 0 € |
| **Apple Visual Intelligence** | Die App kann **eigene Treffer in die systemweite Visual-Intelligence-Suche** einspeisen (Kamera oder Screenshot → App-Ergebnisse), über App Intents und `SemanticContentDescriptor`; ab iOS 26 [5] | n/a | n/a | System | 0 € |
| **Google ML Kit Barcode** | EAN-8/13, UPC-A/E, QR, DataMatrix u. a., offline [6] | **Max. 10 Codes pro Aufruf** [6] | Native Objekte | Auf dem Gerät | 0 € |
| **Google ML Kit Text Recognition v2** | OCR (u. a. lateinische Schrift), Echtzeit, Blöcke/Zeilen/Elemente/Symbole mit Box und Konfidenz [7] | Ja | Native Objekte | Auf dem Gerät | 0 € |
| **Google ML Kit Object Detection** | Erkennt und verfolgt Objekte; Grobklassifikator mit nur 5 Klassen (u. a. „food“), eigene TFLite-Klassifikatoren einbindbar [8] | Ja | Box + Klasse | Auf dem Gerät | 0 € |
| **ML Kit GenAI Prompt API (Gemini Nano)** | On-Device-LLM, Text+Bild-Eingabe, strukturierte Ausgabe; **Beta, ohne SLA**, nur Android [9] | Unklar | Ja | Auf dem Gerät | 0 € |
| **LiteRT (Nachfolger von TensorFlow Lite)** | Laufzeit für eigene Modelle auf Android, iOS, Web und Desktop; GPU/NPU-Beschleunigung, Core-ML-Delegate [10] | Je nach eigenem Modell | Je nach Modell | Auf dem Gerät | 0 €, aber Trainingsaufwand |
| **Google Cloud Vision** | Labels, Objektlokalisierung, OCR, Logos [11] | Ja (Objektlokalisierung) | Feste Antwortstruktur | Cloud (Google) | 1,50 USD/1.000 (Label, Text, Logo), 2,25 USD/1.000 (Objekte); 1.000 Einheiten/Monat frei [11] |
| **AWS Rekognition** | `DetectLabels`, `DetectText`; Custom Labels trainierbar [12] | Ja | Feste Antwortstruktur | Cloud (AWS) | 0,001 USD/Bild (erste 1 Mio.); Custom Labels 4 USD pro Stunde Inferenz-Bereitstellung [12] |
| **Multimodale LLMs** (Gemini, Claude, GPT) | Freie Bildbeschreibung, Produkt, Marke, Kategorie, Menge, MHD-Text, alles in **einem** Aufruf | **Ja**, aber Zählen nur ungefähr [14][16] | **Ja, per JSON-Schema garantiert** (Claude GA [15], Gemini [13]) | Cloud, je nach Anbieter/Vertrag | ca. 0,05 bis 2 US-Cent/Foto (siehe 3.) |

**Einordnung klassische Cloud-Vision:** Google Vision und Rekognition liefern generische Labels aus einem festen Vokabular. „Ravioli, Dose, 800 g, MHD 03/2028“ als Datensatz bekommt man so nicht, sondern höchstens „Food“, „Tin“ und einen OCR-Textblock, den man selbst parsen muss. Für Preposaurus bieten sie gegenüber On-Device-OCR **keinen Mehrwert** und kosten trotzdem Geld. Das ist eine eigene Bewertung auf Basis der Feature-Listen [11][12].

### 2. Multimodale LLMs im Detail

| Aspekt | Gemini (Google) | Claude (Anthropic) | GPT (OpenAI) |
|---|---|---|---|
| Aktuelle günstige Modelle (laut Preisseiten) | 3.5 Flash-Lite: 0,30 / 2,50 USD pro 1 Mio. Token (Ein-/Ausgabe); 3.8 Flash: 0,75 / 3,75 USD (Preis „bis 31.12.2026“) [13a] | Haiku 4.5: 1 / 5 USD; Sonnet 5.5: 2 / 10 USD; Opus 5.5: 4 / 20 USD [15a] | „gpt-6-luna“: 0,10 / 0,50 USD (**nur aus automatischer Zusammenfassung, unbedingt nachprüfen**) [17] |
| Batch-Rabatt | 50 % [13a] | 50 % [15a] | 50 % [17] |
| Bild-Token | 258 Token je Kachel (768×768), kleine Bilder ≤384 px = 258 Token [13] | `⌈B/28⌉ × ⌈H/28⌉`, max. 1.568 Token (Haiku 4.5) bzw. 4.784 (Modelle ab 4.7) [14] | Patches 32×32 px × 1,2 (neuere Modelle) [16] |
| Objektlokalisierung | Bounding Boxes `[ymin,xmin,ymax,xmax]` 0–1000 und Segmentierungsmasken, eigens trainiert [13] | Koordinaten möglich, laut Doku „approximate“ [14] | Präzise räumliche Lokalisierung ist laut Doku eine Schwäche [16] |
| Zählen | keine Angabe gefunden | „approximate counts … especially with large numbers of small objects“ [14] | „approximate counts“ [16] |
| Strukturierte Ausgabe | JSON-Schema (Pydantic/Zod) [13] | `output_config.format` mit JSON-Schema, **GA**, Constrained Decoding; keine `minimum`/`maxLength`-Constraints [15] | Structured Outputs vorhanden (Details nicht separat geprüft) |
| Training mit Kundendaten | Bezahlt: nein. Kostenlos: ja, außer im EWR/CH/UK, dort gelten die Paid-Regeln für alles. **Apps für Nutzer:innen im EWR dürfen nur Paid Services nutzen** [18] | Bilder werden nicht zum Training genutzt und nach Verarbeitung gelöscht [14] | API-Daten standardmäßig kein Training; 30 Tage Missbrauchs-Logs; ZDR auf Antrag [19] |
| EU-Datenresidenz | Gemini API: nicht geprüft; Vertex AI vermutlich mit EU-Regionen (**nicht verifiziert**, Doku-Seite nicht lesbar) | `inference_geo` nur „global“ oder „us“, Workspace-Speicherort nur „us“, **keine EU-Option** [20] | EWR+CH Speicherung und Verarbeitung möglich, aber nur mit Zusatzkontrollen und Vertrieb, +10 % Preis [19] |

### 3. Kosten pro Foto (eigene Rechnung, unsicher)

Annahme: Handyfoto vor dem Upload auf **1.500 × 1.125 px** verkleinert, ca. 300 Token Prompt, Ausgabe 500 Token (Einzelartikel) bzw. 1.500 Token (Regalfoto mit ca. 15 bis 20 Artikeln).

| Modell | Bild-Token (Rechnung) | ca. Kosten Einzelartikel | ca. Kosten Regalfoto |
|---|---|---|---|
| Gemini 3.5 Flash-Lite | ca. 1.030 (4 Kacheln) | ca. 0,16 Cent | ca. 0,41 Cent |
| Gemini 3.8 Flash | ca. 1.030 | ca. 0,28 Cent | ca. 0,65 Cent |
| Claude Haiku 4.5 | ca. 1.560 (auf Standard-Tier gedeckelt) | ca. 0,44 Cent | ca. 0,94 Cent |
| Claude Sonnet 5.5 | ca. 2.210 | ca. 1,0 Cent | ca. 2,0 Cent |
| GPT „luna“ (unverifiziert) | ca. 2.030 | ca. 0,05 Cent | ca. 0,10 Cent |
| Google Vision (Label + Objekt + Text) | – | ca. 0,53 Cent (3 Einheiten) | gleich |
| AWS Rekognition (Labels + Text) | – | ca. 0,2 Cent | gleich |

Alle Werte in US-Cent, ohne Steuern. Mit Batch-API (nicht interaktiv) halbiert. **Schlussfolgerung:** Bei 50 KI-Fotos pro Haushalt und Jahr liegen die Kosten im Cent- bis niedrigen Euro-Bereich pro Haushalt und Jahr. Kosten sind kein K.-o.-Kriterium, wohl aber Missbrauch durch unlimitierte Free-User.

### 4. Latenz

Für On-Device-Barcode und OCR werben Google und Apple mit **Echtzeit** im Live-Kamerabild [1][7]. Für Cloud-LLMs habe ich **keine belastbaren, offiziellen Latenzzahlen** gefunden. Erfahrungsgemäß liegen einzelne Bildanfragen im Bereich einiger Sekunden, abhängig von Ausgabelänge, „Thinking“ und Region. Google empfiehlt für Objekterkennung, Thinking auf „minimal“ zu stellen [13]. **Das muss im PoC gemessen werden.** Die UX sollte deshalb so gebaut sein, dass das Foto sofort gespeichert wird und die Erkennung im Hintergrund nachläuft („wir erkennen gerade …“).

### 5. Genauigkeit: was belegt ist und was nicht

- **Dichte Regale sind schwer:** Viele gleiche Objekte dicht nebeneinander gelten selbst für spezialisierte Detektoren als „challenging frontier“ (SKU-110K) [21].
- **Feinklassifikation von Produkten:** VLMs erreichen auf dem MIMEX-Datensatz (28 Produktkategorien) „unsatisfactory“ Feinklassifikation. Ein Ensemble aus CLIP- und DINOv2-Embeddings schneidet besser ab [22]. Stand 2024, ältere Modelle, die Tendenz ist aber relevant: Marke und Variante sind schwerer als die Kategorie.
- **MHD-Lesen:** Spezialmodelle für Punktmatrix-Daten erreichen ca. 97 % (synthetischer Datensatz, arabische Ziffern) [23]. Ein Gemini-Tutorial von Roboflow nutzt ein JSON-Schema mit „Unknown“-Fallback, nennt aber **keine Messwerte**. Im gezeigten Beispiel fehlte das Datum [24].
- **Es gibt keinen öffentlichen Benchmark „Haushaltsvorrat-Foto → Artikelliste + MHD“.** Eine eigene Messreihe ist nötig (siehe auch Report 04).

### 6. Web/PWA-Einschränkung

Die Web-API `BarcodeDetector` ist **experimentell und nicht Baseline**, also nicht in allen großen Browsern verfügbar [25]. In einer PWA braucht man für Barcodes deshalb eine JS/WASM-Bibliothek, und On-Device-OCR ist im Browser deutlich schwächer als nativ. Das ist ein Argument für eine native bzw. Cross-Platform-App mit Kamerazugriff, oder für eine PWA, die Fotos an ein LLM schickt (dann aber immer Cloud).

## Bedeutung für Preposaurus

1. **Drei Erfassungswege, ein Ergebnis-Schema.** Alle Wege füllen dasselbe Datenmodell (Artikel, Kategorie, Menge, Einheit, MHD, Konfidenz, Quelle):
   - **Barcode (Standard, offline, kostenlos):** VisionKit/ML Kit → Open Food Facts (ODbL, User-Agent Pflicht, Rate-Limits laut Doku 15 Produktabfragen/Min. pro IP; Wert prüfen, ggf. lokal cachen [26]).
   - **MHD-Foto (offline, kostenlos):** On-Device-OCR liefert den Rohtext. Eine eigene Datums-Parsing-Logik (TT.MM.JJ, MM/JJJJ, „mind. haltbar bis Ende“) plus Plausibilitätsprüfung macht daraus ein Datum. Fallback: LLM.
   - **„Magic Foto“ (Cloud-LLM, Premium/kontingentiert):** Regal- oder Einkaufsfoto → JSON-Liste mit Bounding Boxes → **Bestätigungs-Screen**, auf dem Nutzer:innen jeden Vorschlag antippen, korrigieren oder verwerfen. Nie ohne Bestätigung speichern.
2. **Structured Outputs nutzen.** Das JSON-Schema mit `enum` für die Preposaurus-Kategorien (passend zu BBK/BMEL-Warengruppen), `confidence`, `mhd_text_raw` und `mhd_iso` (oder `null`). Mit Claude/Gemini wird das Schema technisch erzwungen [13][15]. Kurzes Beispiel (nur Schema-Skizze):
   ```json
   {"items":[{"name":"Ravioli","kategorie":"fertiggerichte","menge":2,"einheit":"dose","packungsgroesse":"800 g","mhd_iso":"2028-03-31","mhd_text_raw":"03/2028","confidence":0.8,"box_2d":[120,40,480,300]}]}
   ```
3. **Modell austauschbar halten.** Preise und Modellnamen ändern sich im Monatstakt (siehe Gemini-Preis „bis 31.12.2026“). Ein dünner Backend-Proxy (der API-Key gehört nie in die App) mit einem Adapter pro Anbieter ermöglicht A/B-Tests und schnellen Wechsel.
4. **Datenschutz als Feature.** On-Device zuerst („Deine Vorratsfotos verlassen dein Handy nicht“), Cloud-Foto-Modus nur per Opt-in mit klarer Erklärung. Fürs Hosting in der EU spricht nach aktuellem Stand Gemini über Vertex AI (EU-Region noch zu verifizieren) oder OpenAI mit EU-Residenz. Bei Claude gibt es derzeit nur „global“ oder „us“ [20]. Gemini-Free-Tier ist für eine EWR-App ohnehin ausgeschlossen [18]. Fotos vor dem Upload verkleinern und EXIF/GPS entfernen.
5. **Apple-Extras als „Wow“-Momente (später):** Visual Intelligence: Nutzer:in richtet die Kamera auf eine Dose → Preposaurus erscheint als Treffer („im Vorrat: 3 Stück, MHD 2027“) [5]. Foundation Models mit Bildanhang könnte einen **kostenlosen On-Device-Foto-Modus** auf neueren iPhones ermöglichen [4]. Die Qualität ist unbekannt und muss im PoC getestet werden.
6. **Kein eigenes Modelltraining im MVP.** Eigene Detektoren (LiteRT/Core ML, Rekognition Custom Labels) lohnen sich erst mit eigenen Trainingsdaten. Die könnten später aus bestätigten Nutzerkorrekturen entstehen, nur mit Einwilligung.
7. **PoC-Vorschlag (Recherche-PoC, kein Produktcode):**
   - 30 Fotos: 10 Einzelartikel, 10 MHD-Nahaufnahmen (inkl. Punktmatrix/Prägung), 10 Regal-/Kistenfotos.
   - Gleiches JSON-Schema an Gemini Flash-Lite, Gemini Flash, Claude Haiku 4.5, Claude Sonnet 5.5 und ein kleines GPT-Modell; dazu Apple Vision OCR bzw. ML Kit OCR für MHD.
   - Messen: Kategorie-Trefferquote, Zählfehler, MHD exakt richtig / falsch / „unknown“, **Halluzinationsrate beim MHD** (wichtigste Kennzahl), Latenz p50/p95, Kosten pro Bild.
   - Entscheidungskriterium: Ein falsches MHD ist schlimmer als „unbekannt“. Das Modell mit der niedrigsten MHD-Halluzinationsrate bei akzeptabler Latenz gewinnt.

## Offene Fragen

- **OpenAI-Modellnamen und -Preise** („gpt-6-luna“ usw.) stammen aus einer automatischen Zusammenfassung der Preisseite und sind **nicht verifiziert**.
- **Gemini-Tokenformel für Gemini-3.x-Modelle:** Die Doku nennt die 258-Token-Kachelregel und zusätzlich `media_resolution`. Welche Regel für die aktuellen Modelle genau gilt, ist unklar, deshalb im PoC über die `usage`-Felder messen.
- **EU-Datenresidenz:** Vertex AI EU-Regionen für Gemini konnte ich nicht verifizieren (Doku-Seite nicht lesbar). Auftragsverarbeitung und Drittlandtransfer (DPF/SCC) prüft der Rechts-Report.
- **Apple Foundation Models mit Bildeingabe:** Ab welcher OS-Version gilt das genau, auf welchen Geräten, und wie gut ist die Qualität bei Verpackungen und MHD? Die Doku listet die Typen, nennt aber keine Version pro Feature.
- **Visual Intelligence:** Bekommt die App Bilddaten oder nur Labels (`SemanticContentDescriptor`)? Das war aus der Doku-Zusammenfassung nicht ersichtlich.
- **Latenz** aller Cloud-Modelle in der EU: keine offiziellen Zahlen, muss gemessen werden.
- **Open-Food-Facts-Rate-Limit** (15/Min. laut Abruf): mit dem Barcode-Report (14) abgleichen.
- Plattformentscheidung (nativ vs. PWA) beeinflusst die On-Device-Optionen stark.

## Quellen

Alle abgerufen am 2026-10-06.

1. Apple Developer: DataScannerViewController – https://developer.apple.com/documentation/visionkit/datascannerviewcontroller
2. Apple Developer: RecognizeTextRequest – https://developer.apple.com/documentation/vision/recognizetextrequest
3. Apple Developer: ClassifyImageRequest – https://developer.apple.com/documentation/vision/classifyimagerequest
4. Apple Developer: Foundation Models – https://developer.apple.com/documentation/foundationmodels
5. Apple Developer: Visual Intelligence – https://developer.apple.com/documentation/visualintelligence
6. Google: ML Kit Barcode Scanning – https://developers.google.com/ml-kit/vision/barcode-scanning
7. Google: ML Kit Text Recognition v2 – https://developers.google.com/ml-kit/vision/text-recognition/v2
8. Google: ML Kit Object Detection and Tracking – https://developers.google.com/ml-kit/vision/object-detection
9. Google: ML Kit GenAI Prompt API (Android) – https://developers.google.com/ml-kit/genai/prompt/android
10. Google: LiteRT – https://developers.google.com/edge/litert
11. Google Cloud: Vision API Pricing – https://cloud.google.com/vision/pricing
12. AWS: Amazon Rekognition Pricing – https://aws.amazon.com/rekognition/pricing/
13. Google: Gemini API – Image understanding – https://ai.google.dev/gemini-api/docs/image-understanding
13a. Google: Gemini API – Pricing – https://ai.google.dev/gemini-api/docs/pricing
14. Anthropic: Claude Vision – https://platform.claude.com/docs/en/build-with-claude/vision
15. Anthropic: Structured outputs – https://platform.claude.com/docs/en/build-with-claude/structured-outputs
15a. Anthropic: Pricing – https://platform.claude.com/docs/en/about-claude/pricing
16. OpenAI: Images and vision – https://developers.openai.com/api/docs/guides/images-vision
17. OpenAI: API Pricing – https://developers.openai.com/api/docs/pricing (automatisch zusammengefasst, nicht verifiziert)
18. Google: Gemini API Additional Terms of Service – https://ai.google.dev/gemini-api/terms
19. OpenAI: Your data – https://developers.openai.com/api/docs/guides/your-data
20. Anthropic: Data residency – https://platform.claude.com/docs/en/manage-claude/data-residency
21. Goldman et al.: Precise Detection in Densely Packed Scenes (SKU-110K), arXiv 1904.00853 – https://arxiv.org/abs/1904.00853
22. Exploring Fine-grained Retail Product Discrimination with Zero-shot Object Classification Using Vision-Language Models, arXiv 2409.14963 – https://arxiv.org/abs/2409.14963
23. Ladder Bottom-up Convolutional Bidirectional VAE for Image Translation of Dotted Arabic Expiration Dates, arXiv 2310.14069 – https://arxiv.org/abs/2310.14069
24. Roboflow Blog: Expiration Date Inspection (Gemini) – https://roboflow.com/blog/expiration-date-inspection
25. MDN: BarcodeDetector – https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
26. Open Food Facts: API-Dokumentation – https://openfoodfacts.github.io/openfoodfacts-server/api/
