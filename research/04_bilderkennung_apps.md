# 04 – Bilderkennung für Lebensmittel und Produkte: Stand der Technik und Apps (Recherche, Stand 2026-10-06)

> **Kurzfazit:** In der Praxis gibt es drei Erfassungsarten: **Barcode plus Produktdatenbank** (zuverlässig und bewährt, z. B. Yuka, Grocy, KitchenPal), **Foto mit einem multimodalen KI-Modell** („Regal oder Kühlschrank fotografieren, viele Artikel auf einmal erkennen“, seit 2024/2025 in vielen neuen Pantry-Apps) und **Kassenbon-OCR**. Der Barcode ist nach wie vor der präzise Standard für Marke, Produkt und Größe. Fotos mit KI-Modellen sind sehr schnell und bequem, lassen sich aber kaum unabhängig auf ihre Genauigkeit prüfen und brauchen fast immer einen Bestätigungsschritt durch die Nutzer:innen. Am schwierigsten ist das **Mindesthaltbarkeitsdatum (MHD)**: Ein 1D-Barcode enthält es nicht, und die Daten auf der Packung sind in sehr vielen Formaten aufgedruckt. Die meisten Apps schätzen das Datum deshalb anhand der Kategorie oder lassen es von Hand eintragen. Für Preposaurus empfiehlt sich ein **hybrider Ansatz**: zuerst Barcode, dann ein KI-Foto für mehrere Artikel als Vorschlag mit Bestätigung, MHD per Foto-OCR erfassen und als Ausweichlösung die Haltbarkeit nach Kategorie schätzen. Langfristig lohnt der Blick auf GS1-2D-Codes (Sunrise 2027), weil diese das MHD maschinenlesbar enthalten können.

---

## Ergebnisse

### 1. Die dominierenden Ansätze im Überblick

| Ansatz | Was wird erkannt | Stärken | Schwächen | Beispiele |
|---|---|---|---|---|
| **Barcode (EAN/UPC) + Datenbank** | Exaktes Produkt (Marke, Name, Größe, oft Nährwerte, Bild) | Sehr präzise, läuft auf dem Gerät und offline (Scan), etabliert | Ein Scan pro Artikel. Kein MHD im 1D-Code. Lose Ware (Obst, Gemüse, Selbstgemachtes) hat keinen Code. Datenbanklücken bei Nischenprodukten | Yuka [1], Grocy/Barcode Buddy [12][13], KitchenPal [14] |
| **Foto → multimodales KI-Modell (mehrere Artikel)** | Viele Artikel pro Foto (Regal, Kühlschrank, Einkauf), Kategorie und grobe Menge | Sehr schnell („30+ Artikel in ca. 5 Sekunden“ laut Anbieter [9]), funktioniert auch bei Obst und Gemüse | Marke und Packungsgröße oft ungenau, Mengen geschätzt. Braucht Cloud und verursacht API-Kosten. Datenschutz. Kaum unabhängige Genauigkeitsdaten | AislePrompt [9], Pantry Pic, RecipeScan, Shelfze, Mealify, PantryChef AI [10] |
| **Feste Kamera im Gerät (Smart Fridge)** | Fest trainierte Klassen frischer Lebensmittel | Läuft automatisch, ohne Zutun | Sehr wenige Klassen (2024: 33, 2025: 37 frische Lebensmittel und bis zu 50 verpackte Produkte). Keine Türfächer, kein Gefrierfach. MHD muss von Hand eingegeben werden | Samsung Family Hub „AI Vision Inside“ [5][6][7] |
| **Kassenbon-OCR** | Gekaufte Positionen und Preise | Erfasst den ganzen Einkauf auf einmal | Händler kürzen Artikelnamen stark ab, Zeilen werden falsch zugeordnet. Zuordnung zu einem echten Produkt nötig. Kein MHD | Zettl Scanner, epap (Haushaltsbuch) [15], AislePrompt (Belege) [9] |
| **Visuelle Suche (allgemein)** | Beliebige Objekte → Websuche und Shopping | Riesige Reichweite und Wissensbasis | Kein Inventar, keine API für Endkunden-Apps im Sinne von „Vorrat“ | Google Lens: knapp 20 Mrd. visuelle Suchen pro Monat (Okt. 2024) [8] |
| **OCR für das MHD** | Datum auf der Verpackung | Erfasst das, was der Barcode nicht liefert | Viele Formate (TT.MM.JJ, MM/JJ, Codes, Punktmatrix-Druck, Prägung), schlechter Kontrast | Forschung [16][17][18], Gemini-Workflow bei Roboflow [19], Robotoff bei Open Food Facts [20] |

### 2. Kennzahlen und Fakten zu wichtigen Akteuren

| Akteur / Technik | Kennzahlen / Fakten | Quelle |
|---|---|---|
| **Yuka** (Barcode-App für Gesundheitsbewertung) | 80 Mio. Nutzer:innen, 12 Länder, 6 Mio. Produkte, 2,7 Mrd. Scans im Jahr 2024 (rund 85 pro Sekunde), 1.200 neue Produkte pro Tag. Nutzt das Scandit SDK. Fehlende Produkte ergänzen Nutzer:innen oder Marken, danach werden sie geprüft. OCR als Rückfallebene, wenn der Barcode beschädigt ist | [1] |
| **Open Food Facts** | Offene Datenbank, mehr als 4 Mio. Produkte weltweit (2025, laut Wikipedia). Für Deutschland zeigt de.openfoodfacts.org rund 429.000 Produkte an (Abruf 2026-10-06). Lizenz ODbL (Datenbank), DbCL (Inhalte), CC-BY-SA (Bilder). API-Regel: „1 API-Aufruf = 1 echter Scan“, für Massendaten gibt es tägliche Exporte | [2][3][4] |
| **Samsung Family Hub AI Vision Inside** | 2024: 33 frische Lebensmittel, trainiert mit rund 1 Mio. Fotos. Samsung weist selbst darauf hin, dass die Erkennung „unvollständig oder falsch“ sein kann. Türfächer und Gefrierfach werden nicht erfasst. Nicht erkannte Artikel und MHD müssen von Hand eingegeben werden. Update 2025: 37 frische Lebensmittel und bis zu 50 verpackte Produkte | [5][6][7] |
| **Google Lens** | „nearly 20 billion visual searches every month“ (Google, 03.10.2024). Der Shopping Graph umfasst mehr als 45 Mrd. Produkte. Sekundärquellen nennen 2026 über 25 Mrd. pro Monat (nicht von Google selbst bestätigt) | [8][21] |
| **Google ML Kit** (auf dem Gerät) | Barcode-Scan ohne Netz: EAN-8/13, UPC-A/E, QR, DataMatrix und weitere. Die Objekterkennung kennt nur 5 grobe Klassen (darunter „food“), eigene Klassifikationsmodelle lassen sich einbinden | [22][23] |
| **Apple VisionKit / Vision / Foundation Models** | `DataScannerViewController` erkennt Text und Barcodes live in der Kamera, auch mehrere Elemente gleichzeitig. Seit dem Update im Juni 2026 (iOS 27) kann man in Foundation Models ein Bild in den Prompt geben und Vision-Werkzeuge wie `OCRTool` und `BarcodeReaderTool` nutzen. Damit sind Bildanalyse und Barcode-Lesen per On-Device-LLM möglich | [24][25] |
| **Gemini API** (Cloud-Modell mit Bildeingabe) | Objekterkennung mit Begrenzungsrahmen (`box_2d`, normiert auf 0–1000) und Segmentierung, Ausgabe als strukturiertes JSON. Ein Bild kostet 258 Token je Kachel (768×768). Laut Preisseite liegen die Flash-Lite-Modelle bei etwa 0,25–0,30 USD pro 1 Mio. Eingabe-Token. **Im kostenlosen Tarif werden Daten zur Produktverbesserung genutzt, im bezahlten nicht.** Modellnamen und Preise ändern sich oft, vor der Umsetzung neu prüfen | [26][27] |

**Grobe Kostenabschätzung (eigene Rechnung, unsicher):** Ein Handyfoto, verkleinert auf etwa 1.500 px, ergibt einige wenige Kacheln, also rund 1.000–2.000 Eingabe-Token. Bei etwa 0,30 USD pro 1 Mio. Token sind das deutlich unter 0,1 Cent pro Foto, dazu kommen die Ausgabe-Token. Für ein MVP spielt das kaum eine Rolle, bei Missbrauch oder einem kostenlosen Modell mit vielen Nutzer:innen aber schon.

### 3. Wie gut funktioniert Foto-Erkennung in der Praxis? (Evidenz)

| Studie / Test | Ergebnis | Einordnung |
|---|---|---|
| GPT-4V, Ernährungserfassung (IEEE JBHI, arXiv 2312.08592) | Lebensmittelerkennung mit 87,5 % Genauigkeit, wenn Kontext zur Herkunft der Speise mitgegeben wird. Portionsschätzung mit Referenzobjekten liegt nahe an gewogenen Mengen | Gerichte, keine verpackten Vorräte. Älteres Modell [28] |
| GPT-4o, Obstklassifikation („Putting GPT-4o to the Sword“) | F1 ≈ 0,98 bei rund 400 Bildern und 10 Klassen | Einfache Aufgabe mit je einem Objekt pro Bild [29] |
| ChatGPT-4o, Nährwerte aus Fotos (J. Food Comp. Anal.) | Ohne Zusatzinfos Fehler bis 54 % (Energie) und 76 % (Fett). Mit Zusatzinfos steigt R² von 0,59 auf 0,94 | Zeigt: Mengen und Inhalte schätzt das Modell schlecht, solange keine Zusatzinformationen vorliegen [30] |
| YOLO-Erkennung des MHD (PUCRS, 2025) | 668 Bilder brasilianischer Verpackungen, Precision 0,80, F1 0,81 | Nur das Auffinden des Datums, noch nicht das Lesen [17] |
| Synthetische Trainingsdaten für MHD-OCR (Florea/Rebedea) | +9,4 % Genauigkeit durch synthetische Bilder | Zeigt, dass Trainingsdaten knapp sind [16] |
| Samsung AI Vision | Der Hersteller selbst warnt vor unvollständigen oder falschen Ergebnissen, kein unabhängiger Test gefunden | [6] |
| KI-Pantry-Apps (AislePrompt, Pantry Pic usw.) | Nur Herstellerangaben („120K+ Zutaten“, „30+ Artikel pro Foto“), **keine unabhängigen Genauigkeitsdaten gefunden** | Marketing, mit Vorsicht lesen [9][10] |
| Beleg-OCR mit LLMs | Sekundärquellen nennen rund 97 % Erfolg (Claude 3.5 Sonnet), Methodik nicht prüfbar. Bekannte Probleme: Abkürzungen, mehrzeilige Positionen, falsche Zuordnung von Preisen | Nicht belastbar [31][32] |

**Zusammengefasst:** Für die Frage, welche Arten von Lebensmitteln auf einem Bild zu sehen sind (Kategorie-Ebene), sind multimodale Modelle inzwischen gut genug. Für die genaue Marke, Packungsgröße, Stückzahl und das MHD reichen sie nicht ohne Bestätigungsschritt. Einen unabhängigen Benchmark speziell für Vorratsregale oder Inventar mit mehreren Artikeln habe ich nicht gefunden (siehe Offene Fragen).

### 4. Sonderthema MHD: Warum es schwierig ist und was sich ändert

- **1D-Barcodes (EAN-13) enthalten kein MHD.** Jede App muss das Datum per OCR lesen, schätzen oder von Hand abfragen [33].
- **Druckformate** sind sehr verschieden (z. B. „Best Before: 12/25/2024“, Herstellercodes, kryptische Stempel), das bestätigt auch Roboflow (Jan. 2026) [19]. In der Forschung gibt es deshalb eigene Detektoren und spezialisierte OCR [16][17][18].
- **Typische Lösung in Apps:** Haltbarkeit nach Kategorie schätzen, z. B. mit Ampel-Badges bei AislePrompt [9] oder einem Abgleich mit dem USDA-FoodKeeper-Datensatz bei PantryChef AI [10]. Samsung lässt das MHD von Hand eingeben [6].
- **Was sich ändert: GS1 Sunrise 2027.** Bis Ende 2027 sollen Kassensysteme weltweit auch 2D-Codes (GS1 DataMatrix, GS1 Digital Link QR) lesen können. Diese Codes können MHD und Charge enthalten. Tesco testet die Erfassung des Verbrauchsdatums an der Kasse. In der Übergangszeit tragen Produkte beide Codes („dual marking“) [33][34]. *Hinweis: Wie schnell Lebensmittel in Deutschland tatsächlich 2D-Codes mit MHD bekommen, ist offen. Die GS1-Primärseite war beim Abruf nicht erreichbar (HTTP 403), die Angaben stammen aus Sekundärquellen.*

### 5. Bestehende Apps im Bereich Vorrat (Auswahl mit Bilderkennungsbezug)

| App | Erfassung | MHD | Bemerkung |
|---|---|---|---|
| Grocy (selbst gehostet, Open Source) | Barcode (Kamera/Scanner), Open-Food-Facts-Plugin, Erweiterung Barcode Buddy | Ja, Vorratsbuchungen mit MHD | Sehr mächtig, aber eher etwas für technisch versierte Nutzer:innen [12][13] |
| KitchenPal | Barcode | Ja | Premium für 1,99 USD pro Monat oder 29,99 USD einmalig (Sekundärquelle) [14] |
| AislePrompt | KI-Foto (Regal/Beleg), Barcode | Kategorie-Schätzung | Kostenlos, Web und Apps, Daten in Azure [9] |
| Pantry Pic, RecipeScan, Shelfze, Mealify, PantryChef AI | KI-Foto, teils Video | teils automatisch geschätzt | Meist auf Rezepte und Lebensmittelverschwendung ausgerichtet, **kein Fokus auf Notvorrat** [10][11] |
| Samsung Family Hub | Kamera im Kühlschrank | Von Hand | An Hardware gebunden [5][6][7] |

*Hinweis: Viele KI-Pantry-Apps sind kleine, neue Projekte (App Store, Hackathons). Ihre Verfügbarkeit und Qualität können sich schnell ändern. Für diese Recherche nicht einzeln getestet.*

---

## Bedeutung für Preposaurus

1. **Erfassung mehrstufig planen**
   - **Stufe 1 (MVP): Barcode-Scan auf dem Gerät** (ML Kit / VisionKit), dazu eine Abfrage bei **Open Food Facts** (für DE gut abgedeckt, ODbL-Attribution beachten, 1 Aufruf = 1 echter Scan, Ergebnisse lokal zwischenspeichern). Nicht gefundene Produkte legen Nutzer:innen selbst an und können sie optional an OFF zurückmelden.
   - **Stufe 2: „Vorrats-Foto“** mit einem multimodalen Modell erkennt mehrere Artikel auf einmal. Das Ergebnis ist ausdrücklich **eine Vorschlagsliste**, die Nutzer:innen bestätigen, korrigieren oder ablehnen. Das passt gut zum Notvorrat, denn eine Erstinventur betrifft oft 50–200 Artikel auf einmal.
   - **Stufe 3: MHD-Foto.** Nach dem Barcode-Scan fragt die App: „Datum fotografieren?“. OCR läuft auf dem Gerät (VisionKit/ML Kit Text) oder in einem LLM. Das erkannte Datum wird plausibel geprüft (liegt es in der Zukunft? passt es zur Kategorie?) und als Vorschlag angezeigt.
   - **Ausweichlösung:** eine **Standard-Haltbarkeit pro Kategorie** (z. B. Konserven, Nudeln, Wasser), die Nutzer:innen anpassen können. Das ist für einen Notvorrat ohnehin oft genauer als ein genaues Datum, und eine „Rotations“-Erinnerung reicht.
2. **Für den Notvorrat passt die Kategorie-Ebene oft:** Die offiziellen Empfehlungen (z. B. vom BBK) rechnen in Warengruppen und Mengen (kg, Liter), nicht in Marken. Die Bilderkennung muss also vor allem **Warengruppe und Menge** erfassen, und genau darin sind KI-Modelle relativ gut. Die Menge (Gewicht) liefert oft der Barcode-Eintrag, z. B. das Feld `quantity` bei OFF.
3. **Mengen-Vorlagen nach dem Erkennen:** „6 × Dose Kidneybohnen 400 g“ wird einmal per Barcode erfasst, danach wird nur die Stückzahl geändert. Das ist schneller als jede Fotoerkennung.
4. **Datenschutz als Pluspunkt:** Fotos aus der Wohnung (Keller, Vorratsregal) sind sensibel. Möglichst viel sollte auf dem Gerät laufen (Barcode, OCR, ab iOS 27 auch Bildanalyse mit Foundation Models). Cloud-KI nur mit Opt-in, bezahlter API-Tarif (keine Trainingsnutzung) und keine Speicherung der Fotos.
5. **Kosten und Missbrauch:** Wenn die Bilderkennung über ein Cloud-Modell läuft, braucht es Rate-Limits und ein Kontingent pro Haushalt (z. B. Freemium: X KI-Scans pro Monat). Barcode und OCR auf dem Gerät kosten dagegen nichts.
6. **Kassenbon-Scan erst später:** Deutsche Belege kürzen Artikelnamen stark ab, die Zuordnung zu Produkten ist aufwendig, und ein MHD fehlt. Für einen Notvorrat (seltene, große Einkäufe) bringt das wenig. Allenfalls als „Einkauf schnell erfassen, Details später“.
7. **Zukunftssicherheit:** Die App sollte GS1-DataMatrix- und Digital-Link-QR-Codes jetzt schon lesen können (ML Kit und VisionKit unterstützen DataMatrix/QR). Sobald Verpackungen das MHD im 2D-Code tragen, wird die MHD-Erfassung zu einem Scan.
8. **Schöne Darstellung ohne Fotos:** Die erkannte Warengruppe wird einem **eigenen Piktogramm** zugeordnet. Optional kommt das Produktbild aus OFF hinzu (CC-BY-SA, Namensnennung). So entsteht ein einheitliches, schönes Erscheinungsbild auch ohne Produktfoto.
9. **Möglicher Proof of Concept (ohne Programmierung für das Produkt):** 10–20 Fotos eines echten Vorratsregals mit 2–3 Modellen testen (z. B. Gemini Flash, GPT, Claude) und messen, wie gut sie Kategorien erkennen, Artikel zählen und das MHD lesen. Das ist eine kleine eigene Messreihe, weil es dazu keinen öffentlichen Benchmark gibt.

---

## Offene Fragen

- Wie genau erkennen aktuelle multimodale Modelle **dicht gestapelte Vorratsregale** (Dosen von der Seite, gleich aussehende Packungen, Anzahl der Artikel)? Es gibt keinen unabhängigen Benchmark, ein eigener Test ist nötig.
- Wie gut lesen LLMs **deutsche MHD-Aufdrucke** (z. B. „mind. haltbar bis: 12.2027“, nur Monat und Jahr, Punktmatrix-Druck auf Dosenböden)? Keine belastbaren Zahlen gefunden.
- Wie vollständig ist Open Food Facts für **typische Notvorratsprodukte** (Handelsmarken von Aldi und Lidl, Wasser, Langzeitnahrung, Outdoor-Fertiggerichte)? Eine Stichprobe wäre sinnvoll.
- Wann tragen Lebensmittel im deutschen Handel tatsächlich **2D-Codes mit MHD**? Die GS1-Primärquelle war nicht abrufbar.
- Plattform: Braucht es eine native App (für Kamera, On-Device-OCR und Foundation Models), oder reicht eine PWA bzw. Web-App (Barcode-Scan im Browser ist möglich, On-Device-KI aber eingeschränkt)?
- Sind die hier genannten Modellversionen und Preise der Gemini API stabil? Sie wurden automatisiert zusammengefasst und **müssen vor einer Entscheidung direkt auf der Preisseite geprüft werden**.
- Die Angaben zu Apps wie Pantry Pic, Shelfze oder PantryChef AI stammen aus App-Store-Einträgen und Verzeichnissen und wurden nicht selbst getestet.

---

## Quellen

Alle abgerufen am 2026-10-06.

1. Scandit – Case Study Yuka: https://www.scandit.com/resources/case-studies/yuka
2. Open Food Facts – Data / API-Nutzung und Lizenz: https://world.openfoodfacts.org/data
3. Wikipedia – Open Food Facts (Produktzahlen, Historie): https://en.wikipedia.org/wiki/Open_Food_Facts
4. Open Food Facts Deutschland (Produktzahl DE): https://de.openfoodfacts.org/
5. Samsung Newsroom US – Family Hub 2024 Update: https://news.samsung.com/us/samsungs-most-intelligent-fridge-is-getting-smarter-with-family-hub-for-2024-update
6. Samsung AU – Family Hub (Einschränkungen AI Vision Inside): https://www.samsung.com/au/family-hub-refrigerator ; Tom's Guide: https://www.tomsguide.com/news/samsung-unveils-2024-bespoke-family-hub-refrigerator-with-vision-ai-heres-what-it-can-do
7. Samsung Newsroom US – Family Hub 2025 Update (37 frische und 50 verpackte Produkte): https://news.samsung.com/us/samsung-family-hub-2025-update-elevates-smart-home-ecosystem
8. Google Blog – Search & Lens Updates, Oktober 2024: https://blog.google/products-and-platforms/products/search/google-search-lens-october-2024-updates/
9. AislePrompt – AI Pantry Scanner: https://aisleprompt.com/ai-pantry-scanner
10. Stork.ai – Pantry Pic: https://www.stork.ai/en/pantry-pic ; RecipeScan: https://www.stork.ai/en/recipescan ; PantryChef AI (Hinweis aus Suchergebnis, Primärseite nicht geprüft)
11. App Store – Mealify 2.0: https://apps.apple.com/sa/app/id6746368726
12. Barcode Buddy for Grocy – Dokumentation: https://barcodebuddy-documentation.readthedocs.io/
13. Grocy-Übersicht: https://kx.cloudingenium.com/en/grocy-self-hosted-grocery-household-management-erp/
14. SquareTrade Blog – Pantry-Apps (KitchenPal): https://blog.squaretrade.com/strategies-apps-to-help-with-organizing-a-pantry/
15. heise – Kassenbons scannen: https://www.heise.de/tipps-tricks/Kassenbons-scannen-mit-diesen-Apps-klappt-s-7543851.html ; App Store Zettl Scanner: https://apps.apple.com/hn/app/zettl-scanner/id1539291543
16. Florea/Rebedea – Expiry date OCR mit synthetischen Daten (IJUSI): https://rochi.utcluj.ro/ijusi/articles/IJUSI-13-1-Florea.pdf
17. Andreotti et al. (PUCRS, 2025) – Detection of Expiration Dates in Product Images Using YOLO: https://sol.sbc.org.br/index.php/eramiars/article/view/39448
18. Springer (2025) – Expiry-Date-Erkennung (Artikel s43067-025-00210-3): https://link.springer.com/article/10.1186/s43067-025-00210-3 (nur Suchtreffer, Inhalt nicht im Detail geprüft)
19. Roboflow Blog – Expiration Date Inspection mit Gemini (16.01.2026): https://roboflow.com/blog/expiration-date-inspection
20. Robotoff (Open Food Facts) – Paket/Doku: https://pypi.org/project/robotoff/1.0.8 ; https://github.com/openfoodfacts/robotoff
21. Scalevise – Google Lens über 25 Mrd. Suchen (Sekundärquelle): https://scalevise.com/resources/google-lens-25-billion-monthly-visual-searches/
22. Google ML Kit – Barcode Scanning: https://developers.google.com/ml-kit/vision/barcode-scanning/android
23. Google ML Kit – Object Detection: https://developers.google.com/ml-kit/vision/object-detection
24. Apple – VisionKit: Scanning data with the camera: https://developer.apple.com/documentation/visionkit/scanning-data-with-the-camera
25. Apple – Foundation Models updates (Juni 2026): https://developer.apple.com/documentation/updates/foundationmodels
26. Google – Gemini API Image understanding: https://ai.google.dev/gemini-api/docs/image-understanding
27. Google – Gemini API Pricing: https://ai.google.dev/gemini-api/docs/pricing
28. Lo et al. – Dietary Assessment with Multimodal ChatGPT (arXiv 2312.08592): https://arxiv.org/abs/2312.08592v1
29. Putting GPT-4o to the Sword (arXiv 2407.09519): https://arxiv.org/pdf/2407.09519
30. Image-based nutritional assessment: ChatGPT-4o (Uludağ Univ.): https://avesis.uludag.edu.tr/yayin/4dd659a6-bb7a-4945-a926-b7f043a9a7fd/image-based-nutritional-assessment-evaluating-the-performance-of-chatgpt-4o-on-simple-and-complex-meals
31. AIMultiple – Receipt OCR: https://aimultiple.com/receipt-ocr
32. US-Patent 10943139 – Extracting information from a receipt (Abkürzungsproblem): https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10943139
33. inFlow – GS1 Sunrise 2027: https://www.inflowinventory.com/blog/gs1-sunrise-2027/
34. Videojet – GS1 Sunrise 2027 Transition: https://www.videojet.com/us/homepage/resources/learn/gs1-sunrise-2027.html ; TEC-IT: https://www.tec-it.com/support/knowbase/gs1-digital-link-sunrise/Default.aspx
