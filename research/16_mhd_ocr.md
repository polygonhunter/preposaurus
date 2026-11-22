# MHD per Kamera erkennen: Formate, OCR-Ansätze, Genauigkeit, Fallback und Default-Haltbarkeiten

> **Kurzfazit:** Das Mindesthaltbarkeitsdatum (MHD) per Kamera zu lesen ist machbar, aber nicht zuverlässig genug für eine automatische Übernahme. Allgemeine OCR scheitert vor allem am Punktmatrix- und Prägedruck. In einer Studie erkannte Tesseract nur 10,6 % der Daten richtig und Google Cloud Vision 50 % [7]. Spezialmodelle kommen in Studien auf 73–99 %, allerdings nur mit kleinen oder synthetischen Datensätzen [7][8][9][10]. Die Rechtslage hilft beim Auslesen: Die EU-Lebensmittelinformationsverordnung schreibt das Datum unverschlüsselt in der Reihenfolge Tag/Monat/Jahr vor, und je nach Haltbarkeit reichen „TT.MM.“, „MM.JJJJ“ oder „JJJJ“ [1]. Daraus lässt sich ein guter Plausibilitäts-Parser bauen. Für Preposaurus empfehlen wir: OCR auf dem Gerät (Apple Vision/VisionKit, Google ML Kit) als **Vorschlag mit Bestätigung**, optional ein Vision-LLM als zweiten Versuch, und als Rückfallebene einen Monat/Jahr-Picker, der mit Kategorie-Defaults aus offiziellen Lagertabellen vorbelegt ist [11][12][13].

---

## Ergebnisse

### 1. Rechtlicher Rahmen: Wie das Datum auf der Packung stehen muss (EU/DE/AT)

Grundlage ist die Verordnung (EU) Nr. 1169/2011 (LMIV), Anhang X. Der Text wurde über die Fassung „as adopted“ auf legislation.gov.uk geprüft, weil EUR-Lex beim Abruf leer blieb [1].

| Regel | Inhalt | Bedeutung für die OCR |
|---|---|---|
| Formulierung MHD | „mindestens haltbar bis …“, wenn der Tag angegeben ist, sonst „mindestens haltbar bis Ende …“. Danach folgt das Datum oder ein Hinweis, wo es steht (z. B. „siehe Deckel“) [1] | Schlüsselwörter für den Anker: „mindestens haltbar“, „mind. haltbar“, „MHD“, „bis Ende“. Häufig steht das Datum woanders als der Text, etwa auf Deckel, Boden oder Falz |
| Reihenfolge | Tag, Monat, Jahr, **unverschlüsselt** [1] | Im EU-Markt ist TT.MM.JJ(JJ) der Normalfall. Formate wie MM/TT/JJ (USA) oder JJJJ/MM/TT (Importware) kommen trotzdem vor |
| Haltbarkeit < 3 Monate | Tag + Monat genügen [1] | Das Jahr kann fehlen und muss dann ergänzt werden (nächstes Vorkommen in der Zukunft) |
| 3–18 Monate | Monat + Jahr genügen [1] | Typisch bei Konserven, Nudeln, Reis: „12/2027“ oder „12.27“. Im System als Monatsende speichern |
| > 18 Monate | Jahr genügt [1] | Nur „2028“ ist möglich. Im System als 31.12. speichern |
| Ausnahmen ohne MHD | Frisches, ungeschältes Obst und Gemüse, Wein und Getränke ab 10 % Alkohol, Backwaren zum Verzehr binnen 24 h, Essig, Speisesalz, fester Zucker, Zuckerwaren, Kaugummi [1] | Für Salz, Zucker und Essig braucht die App einen Default, weil kein Datum aufgedruckt ist |
| Verbrauchsdatum | „zu verbrauchen bis …“ mit Tag, Monat, Jahr und Lagerbedingungen [1] | Eigenes Feld. Nach Ablauf entsorgen statt prüfen [12] |
| Einfrierdatum | „eingefroren am …“ mit Tag, Monat, Jahr (bei Fleisch, Fisch u. a.) [1] | Optionales Zusatzfeld |
| Losnummer | Wird meist mit „L“ eingeleitet. Sie darf entfallen, wenn das MHD mindestens Tag und Monat unverschlüsselt enthält [2] | **Häufige Verwechslungsquelle:** Zeilen wie „L 24312 1“ oder Uhrzeiten („14:32“) stehen oft direkt neben dem MHD und müssen herausgefiltert werden |

**Typische Erscheinungsformen auf echten Packungen** (eigene Zusammenstellung aus den Regeln oben sowie [5][7][9]; nicht systematisch erhoben):

| Druckart / Format | Beispiel | Schwierigkeit für die OCR |
|---|---|---|
| Etikett/Offsetdruck, TT.MM.JJJJ | `31.12.2027` | gering |
| Tintenstrahl, Punktmatrix (CIJ) auf Folie oder Karton | `31.12.27 L2431` | **hoch**: Ziffern sind in Punkte zerlegt, oft wenig Kontrast [7][10] |
| Thermotransfer/Laser auf Folie mit Reflexion | `12/2027` | mittel bis hoch (Glanz) |
| Prägung oder Laser auf dem **Dosendeckel/-boden** | `311227` oder `12.2027` | **sehr hoch**: kaum Kontrast, gewölbte Fläche, Spiegelung |
| Nur Monat/Jahr, ohne Trennzeichen | `1227` | mehrdeutig (12/27 oder 12.2027 oder Tag+Monat?) |
| Nur Jahr | `2028` | gering, aber vom Produktionsjahr schwer zu unterscheiden |
| Importware, Text-Monat | `EXP 25DEC24`, `BB 2027-12-25` | mittel. Der Parser braucht Monatsnamen in mehreren Sprachen [5] |

### 2. Maschinenlesbare Alternative: GS1-2D-Codes

GS1-Datenbezeichner kodieren das MHD (AI 15), das Verkaufsdatum (AI 16) und das Verfallsdatum (AI 17) jeweils als `JJMMTT`. `TT=00` steht dabei für das Monatsende [14]. In einer GS1 DataMatrix oder einem GS1 Digital Link QR-Code lässt sich das MHD also fehlerfrei auslesen. ML Kit und VisionKit können diese Codes bereits lesen (siehe Bericht 14). Wie schnell deutsche Lebensmittel solche Codes mit MHD tragen werden, ist offen (siehe Bericht 04, „Sunrise 2027“).

### 3. OCR-Ansätze im Vergleich

| Ansatz | Plattform / Lauf­ort | Stärken | Schwächen | Kosten | Quellen |
|---|---|---|---|---|---|
| **Apple Vision `VNRecognizeTextRequest`** | iOS 13+, macOS, visionOS; on-device | Modi `.accurate` und `.fast`, `customWords`, Sprachkorrektur abschaltbar, `minimumTextHeight`, automatische Spracherkennung | Keine offiziellen Genauigkeitswerte. Für Ziffernfolgen sollte die Sprachkorrektur aus sein | kostenlos | [3] |
| **Apple VisionKit `DataScannerViewController`** (Live-Text-Kamera) | iOS/iPadOS 16+, Gerät mit Neural Engine (`isSupported`) | Fertige Live-Kamera-UI mit Hervorhebung, erkennt **Text und Barcode gleichzeitig**, Inhaltstyp `.dateTimeDuration` filtert Datumsangaben, `capturePhoto()` | Datumserkennung ist auf allgemeine Datumsangaben ausgelegt, nicht auf Punktmatrix. Nicht im Web nutzbar | kostenlos | [4][4a] |
| **Google ML Kit Text Recognition v2** | Android (API 21+) und iOS (64-bit); on-device | Latein-, Chinesisch-, Devanagari-, Japanisch- und Koreanisch-Schrift; Blöcke, Zeilen, Wörter, Symbole mit Konfidenz und Box; echtzeitfähig | Zeichen sollten mindestens 16×16 px groß sein. iOS-SDK rund 38 MB je Schrift, Android gebündelt ca. 4 MB bzw. ca. 260 KB über Play Services | kostenlos | [5a][5b][5c] |
| **Tesseract / Tesseract.js** | Web (WASM), Node, Desktop; offline | Open Source (Apache-2.0), über 100 Sprachen, Ziffern-Whitelist, PSM 7 („eine Zeile“) | Für gescannte Dokumente gebaut, nicht für Szenentext. In einer Studie lieferte es für die meisten MHD-Fotos **gar nichts** (10,6 % Präzision) [7]. Braucht Zuschnitt, Binarisierung und Entzerrung | kostenlos | [6][6a][7] |
| **Web `TextDetector` (Shape Detection API)** | Browser | Wäre native Browser-OCR | Nur ein WICG-Entwurf, kein Standard; Verfügbarkeit je Browser unklar | – | [15] |
| **Cloud-OCR (Google Cloud Vision)** | Cloud | Besser als Open Source „out of the box“ | In der Studie nur 50 % auf MHD-Fotos [7]. Datenschutz, Kosten, Netz nötig | pro Aufruf | [7] |
| **Vision-LLM** (z. B. Claude, Gemini, GPT) | Cloud (iOS 27 teils on-device, siehe Bericht 04) | Versteht Kontext („mindestens haltbar bis“ statt Losnummer), normalisiert Formate direkt zu JSON | Kann bei kleinen, gedrehten oder unscharfen Bildern **halluzinieren**, also ein plausibles, aber falsches Datum liefern [16]. Kosten je Bild, Latenz, Datenschutz. **Keine öffentliche MHD-Benchmark gefunden** | z. B. ca. 1,3 bis 6,5 US-$ je 1.000 Bilder à 1 MP, je nach Modell [16] | [16][5] |
| **Spezialmodell** (Detektor + Erkenner, z. B. YOLO/TextBoxes++ + CRNN) | on-device möglich (Peng et al.: FP16 auf CPU) | Höchste Genauigkeit bei Punktmatrix | Trainingsdaten sind knapp. Eigenes ML-Projekt mit Wartungsaufwand | Entwicklungsaufwand | [7][8][9][10] |

**Kurzes API-Beispiel** (iOS, nur zur Illustration der Konfiguration):

```swift
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false        // Ziffern nicht "korrigieren"
req.recognitionLanguages = ["de-DE", "en-US"]
req.customWords = ["MHD", "mindestens", "haltbar", "verbrauchen"]
```

### 4. Belegte Genauigkeit (Literatur)

| Studie | Ansatz | Datensatz | Ergebnis | Einordnung |
|---|---|---|---|---|
| Florea & Rebedea 2020, IJUSI [7] | TextBoxes++ + CRNN, nachtrainiert; Regex und `dateutil` als Filter | ca. 660 echte Smartphone-Fotos, dazu synthetische 3D-Bilder; Validierung mit 66 Bildern | **Baselines:** Tesseract 10,6 %, SegLink+CRNN 16,6 %, Google Cloud Vision 50,0 %. **Eigenes Modell:** 63,3 % (nur echte Daten), **72,7 %** (echte + synthetische Daten) | Wichtigste Vergleichsstudie für allgemeine OCR. Inzwischen älter (2020), heutige Modelle sind vermutlich besser (nicht geprüft). Erfassung in der Demo-App: ca. 4 s für das Datum, ca. 15 s pro Produkt |
| Peng et al. 2025, *Algorithms* 18(5):286 [8] | CNN-Detektor + Erkenner, mobil optimiert | laut Abstract nicht näher beschrieben | Detektion F1 = 0,930, Erkennung 97,06 %, 63 ms auf der GPU; FP16 auf der CPU empfohlen für Mobilgeräte | Nur der Abstract war abrufbar (MDPI blockiert) |
| Andreotti et al. 2025, PUCRS [9] | YOLO, fein abgestimmt (nur **Lokalisierung**) | 668 Bilder brasilianischer Produkte (öffentlich) | Präzision 0,804, F1 0,812 | Nur das Finden des Datums, kein Lesen |
| Kusuma et al. 2026, ETASR [10] | YOLOv8 + OCR auf dem Raspberry Pi, CIJ-Punktmatrix auf glänzender Folie | Industrie-Linie | Detektion 99,2 %, Zeichenfehlerrate von 18,4 % (unvorverarbeitet) auf 2,3 % gesenkt | Feste Kamera und Beleuchtung. Nicht auf Handyfotos übertragbar |
| Lotfy et al. 2024, JESIT [10a] | CNN mit binären Einbettungen, arabische MHD | – | 98,94 % | Nur Metadaten aus Crossref geprüft |
| Zidane & Soliman 2023, arXiv [10b] | VAE-Bildübersetzung von Punktmatrix + CRNN | 60.000 synthetische / 3.000 Testbilder | 97 % (Bildübersetzung) | Rein synthetisch |
| Seker & Ahn 2022, *Expert Syst. Appl.* 203:117310 [10c] | FCN-Framework für MHD auf Verpackungen | Nicht verifiziert | Nicht verifiziert (Volltext 403) | Häufig zitiert, Inhalt hier nicht geprüft |

**Fazit zur Genauigkeit:** Für ein Handyfoto ohne Spezialmodell gibt es **keine belastbare aktuelle Zahl**. Die einzige direkte Vergleichsstudie ist von 2020 [7]. Die guten Werte von 97–99 % stammen aus kontrollierten oder synthetischen Umgebungen. Für Preposaurus heißt das: Wir müssen einen eigenen Testsatz anlegen (siehe Offene Fragen).

### 5. Bekannte Apps mit MHD-OCR

Details stehen in Bericht 03 und Bericht 05. Kurz zusammengefasst: Shelfze, FreshSave (OCR auf dem Gerät), Food Expiry AI und Scannly werben mit MHD-OCR, unabhängige Genauigkeitswerte gibt es nicht. Das archivierte Open-Source-Projekt PrepTrack/Prepper_Log nutzte Tesseract.js offline. Die Demo-App von Florea & Rebedea [7] hat den Ablauf „Barcode + MHD-Foto“ schon 2020 gezeigt. Laut den Autoren nutzten damals verbreitete MHD-Apps nur Datumswähler [7]. Open Food Facts speichert zwar ein Feld `expiration_date`, das gehört aber zu einer einzelnen fotografierten Packung und ist für den Vorrat wertlos (Bericht 14).

### 6. Datums-Parsing: Heuristiken, die sich aus Recht und Literatur ableiten

1. **Ankerwörter** suchen: „mindestens haltbar“, „mind. haltb.“, „MHD“, „zu verbrauchen bis“, „best before“, „BB“, „EXP“, „à consommer“. Die Zeile mit dem Anker und die nächsten 1–2 Zeilen bevorzugen.
2. **Ausschließen:** Zeilen mit „L“ und Ziffern (Losnummer [2]), Uhrzeiten `hh:mm`, EAN-Ziffernfolgen (8/13-stellig), Gewichte und Preise.
3. **Formate** in dieser Reihenfolge prüfen: `TT.MM.JJJJ`, `TT.MM.JJ`, `TT/MM/JJ`, `MM.JJJJ`, `MM/JJ`, `JJJJ`, `TTMMJJ`, Text-Monate (`DEC`, `DEZ`, `MRZ`). Bei Mehrdeutigkeit gilt die EU-Reihenfolge Tag-Monat-Jahr [1].
4. **Plausibilität:** Datum zwischen „heute − 2 Jahre“ (bereits abgelaufen ist möglich) und „heute + 30 Jahre“ (Langzeitnahrung bis 25 Jahre [13]). Florea & Rebedea filtern ±30 Jahre und nehmen das am weitesten in der Zukunft liegende Datum [7]. Bei mehreren Kandidaten (z. B. Produktions- und Ablaufdatum) ist das spätere Datum meist das MHD.
5. **Kategorie-Abgleich:** Ein erkanntes Datum, das stark vom Kategorie-Default abweicht (z. B. Konserve mit 5 Tagen Haltbarkeit), wird als „bitte prüfen“ markiert.
6. **Mehrere Bilder:** Live-Kamera-Frames sammeln und eine Mehrheitsentscheidung über 3–5 Frames treffen. Das ist eine eigene Idee und noch nicht getestet.

### 7. Default-Haltbarkeiten nach Lebensmittelgruppe (Fallback, wenn kein MHD erfasst wurde)

**Wichtig:** Diese Werte sind **Lager-Faustregeln ab Kauf bzw. Einlagerung**, kein Ersatz für das aufgedruckte MHD. Die Quellen widersprechen sich teilweise. Wir geben deshalb Spannen an und empfehlen als Default den **unteren, vorsichtigen Wert**.

| Gruppe (Preposaurus-Kategorie) | DE/AT-Quelle (offiziell/Verbraucherschutz) | USDA FoodKeeper (Speisekammer, ungeöffnet)* | **Vorschlag Default** |
|---|---|---|---|
| Trinkwasser (Mineral-/Tafelwasser) | Nahezu unbegrenzt haltbar. Typisches MHD: Glas 2 J., PET 1 J. [12a] (via Bericht 08); auch nach MHD trinkbar [13] | – | PET 12 Mon., Glas 24 Mon. |
| Gemüse-/Hülsenfrucht-Konserven | 1–2 Jahre [12] | low-acid 2–5 Jahre | 18 Mon. |
| Obstkonserven, Marmelade | 1 Jahr [12] | high-acid 12–18 Mon.; Marmelade 6–18 Mon. | 12 Mon. |
| Fisch-/Fleischkonserven | „mehrere Jahre“ [12]; Supermarkt-Konserven haben meist 18 Mon. MHD ab Abfüllung, sind oft noch Jahre danach essbar [13] | Fleisch 5 J., Thunfisch 3 J., Meeresfrüchte 1 J. | 24 Mon. |
| Fertiggerichte in Dosen | MHD meist 18 Mon. ab Abfüllung [13]; „über ein Jahr“ [11] | low-acid 2–5 J. | 18 Mon. |
| Reis, Nudeln, Grieß | 1 Jahr [12]; „über Jahre“ bei kühler, trockener Lagerung [11] | weißer Reis 2 J., Vollkornreis 1 J., Nudeln 2 J. | 12 Mon. (Vollkornreis 6–12 Mon.) |
| Getreide (ganze Körner) | 2 Jahre [12] | Hafer (Vollkorn) 4 Mon. | 12 Mon. |
| Mehl | „über Jahre“ (luftdicht, kühl) [11] | Weißmehl 6–12 Mon., Vollkornmehl 3–6 Mon. | Weißmehl 6 Mon., Vollkorn 3 Mon. |
| Haferflocken / Getreideflocken | – | gekochtes Müsli/Haferbrei 12 Mon. | 9 Mon. |
| Knäckebrot, Zwieback, Kekse | „besonders lange haltbar“ [11] | Cracker 8 Mon. | 6 Mon. |
| Hülsenfrüchte, getrocknet | über 1 Jahr [11] | Bohnen 1–2 J., Linsen 1 J. | 12 Mon. |
| H-Milch | ungeöffnet bis 6 Mon. [11] | 6–12 Mon. | 4 Mon. |
| Milchpulver | Wird für den Vorrat empfohlen, ohne Dauer [11] | 3–5 J. | 12 Mon. |
| Hartkäse (gekühlt) | 8–10 Tage (Schnitt-/Hartkäse) [12] | – | 10 Tage |
| Speiseöl | Lein-, Walnuss-, Kürbiskernöl ca. 6 Mon.; Sonnenblumen-/Rapsöl ca. 1 J. [11] | Pflanzenöl 6–12 Mon., Raps/Sonnenblume 1 J. | 6 Mon. bzw. 12 Mon. |
| Nüsse, Samen | „monatelang“ [11] | Nüsse in Glas/Dose 1 J.; Walnüsse 2–4 Wochen | 6 Mon. |
| Honig | – | 2 J. | 24 Mon. |
| Zucker, Salz, Essig | Kein MHD vorgeschrieben [1]; für den Vorrat geeignet wegen langer Haltbarkeit [11] | – | „unbegrenzt“ (jährliche Sichtprüfung) |
| Säfte (ungeöffnet) | bis 12 Mon. [11] | high-acid 12–18 Mon. | 9 Mon. |
| Kaffee, Tee | – | Instantkaffee 1 J., gemahlen (Handel) 2 J., Teebeutel 18–36 Mon. | 12 Mon. |
| Schokolade | – | 1–2 J. | 12 Mon. |
| Trockenfertiggerichte, Suppenpulver, Brühe | geeignet wegen langer Haltbarkeit [11] | Brühe/Suppenmix 1 J. | 12 Mon. |
| Tiefkühlware (−18 °C) | Obst 8–12, Gemüse 6–12, Brot 1–3, Fleisch 3–12 Mon. [12]; Rind 10–12, Schwein 6–8, Huhn 8–10 Mon. [11] | – | Fleisch 6, Gemüse 6, Brot 1 Mon. |
| Lager-Frischware (Keller 1–4 °C) | Äpfel 3–5 Mon., Birnen 1–3 Mon., Wurzel-/Kohlgemüse 3–4 Mon. [12] | – | Äpfel 3 Mon., Kartoffeln/Wurzelgemüse 3 Mon. |
| „Langzeit-Notnahrung“ (Spezialkonserven) | Herstellerangaben 7–25 Jahre; laut VZ Sachsen nur bedingt sinnvoll [13]; Tirol: „ca. 15 Jahre und länger“ [11] | – | **Kein Default**, MHD immer erfassen |

\* *FoodKeeper-Werte (USDA FSIS, CC0) [17]: Die Primärdatei war beim Abruf gesperrt (HTTP 403). Die Werte stammen aus einer in Tage umgerechneten Kopie in einem Drittanbieter-Repository auf GitHub [17a]. Sie sind auf Monate/Jahre gerundet und **müssen vor einer Übernahme gegen das Original geprüft werden**. FoodKeeper unterscheidet teils „ab Kauf“ und „ab Packungsdatum“. Dieser Unterschied ging in der Kopie verloren.*

---

## Bedeutung für Preposaurus

1. **Erfassungsablauf „Scan → Datum → Bestätigen“:** Zuerst den Barcode scannen (Produkt und Kategorie). Danach fragt die App „Datum fotografieren?“ und öffnet eine Live-Kamera mit Suchrahmen. Unter iOS liefert VisionKit Text und Barcode in einem Scanner [4]. Das erkannte Datum erscheint als großer, editierbarer Vorschlag, z. B. „31.12.2027 – stimmt das?“. **Nie ohne Bestätigung übernehmen.**
2. **Monat/Jahr als Standard-Granularität:** Bei Vorräten mit 3–18 Monaten Haltbarkeit reicht laut LMIV Monat und Jahr [1]. Der manuelle Picker sollte deshalb standardmäßig „Monat + Jahr“ anbieten (mit Schnell-Buttons wie „+6 Mon.“, „+1 J.“, „+2 J.“). Der Tag lässt sich optional angeben. Intern wird das Monatsende gespeichert, so wie GS1 `TT=00` behandelt [14].
3. **Batch-Erfassung:** Für „6 gleiche Dosen“ wird das Datum einmal erfasst und dann „auf alle anwenden“. Gleiche Charge bedeutet in der Regel gleiches MHD.
4. **Kategorie-Defaults als Fallback:** Ohne Datum belegt die App das MHD mit dem vorsichtigen Default aus Tabelle 7 vor und markiert es als **„geschätzt“** (eigenes Icon). So bleibt der Vorrat planbar, und Erinnerungen fragen später nach: „Bitte echtes MHD prüfen“.
5. **Zwei Datumsfelder:** MHD („prüfen statt wegwerfen“) und Verbrauchsdatum („entsorgen“) getrennt führen [1][12]. Für Vorräte ist fast immer das MHD relevant.
6. **Stufenplan für die Technik:**
   - *PoC/MVP:* Manueller Picker mit Kategorie-Defaults und OCR auf dem Gerät (VisionKit bzw. ML Kit), dazu ein Regex-/Plausibilitäts-Parser (Abschnitt 6). Für eine Web-App ist Tesseract.js offline möglich, aber nur mit Zuschnitt auf den Suchrahmen, Ziffern-Whitelist und PSM 7. Laut [7] taugt es für Punktmatrix kaum.
   - *Stufe 2:* Vision-LLM als **optionaler zweiter Versuch**, wenn die On-Device-OCR nichts Plausibles findet. Nur mit Opt-in und nur mit dem zugeschnittenen Bildausschnitt, nicht dem ganzen Regalfoto. Ausgabe als JSON mit `mhd`, `typ`, `konfidenz`, `rohtext`.
   - *Stufe 3:* Eigener Detektor (YOLO o. ä.) für den MHD-Bereich, falls der Test zeigt, dass das Finden des Datums das Hauptproblem ist [9].
   - *Zukunft:* GS1 DataMatrix / Digital Link mit AI 15/17 auslesen, das ergibt das MHD ohne OCR [14].
7. **UX-Tricks für bessere Fotos:** Suchrahmen-Overlay („Datum hier hinein“), Taschenlampe automatisch an, Hinweis „Dose leicht kippen“ gegen Spiegelungen bei Prägung, Mindestgröße der Zeichen ca. 16 px [5b]. Wenn die Erkennung fehlschlägt, nach 3 Sekunden direkt den Picker anbieten. Ein frustrierender Endlos-Scan muss vermieden werden.
8. **Lernender Default pro Produkt:** Pro EAN merkt sich die App die Differenz „MHD minus Erfassungsdatum“ und schlägt sie beim nächsten Kauf vor (z. B. „Diese Dose hatte letztes Mal 22 Monate“). Das ist eine eigene Idee, und die Werte bleiben lokal.
9. **Transparenz der Quellen:** Jeder Default bekommt eine Quellenangabe (z. B. „ernaehrungsvorsorge.de“). Das passt zum Grundprinzip von Preposaurus, nur offizielle und auswählbare Quellen zu nutzen.

---

## Offene Fragen

- **Eigener Benchmark nötig:** Wie gut erkennen Apple Vision, ML Kit, Tesseract.js und ein bis zwei Vision-LLMs echte deutsche Vorratsprodukte? Vorschlag: rund 100 Fotos (Konservendeckel mit Prägung, Punktmatrix auf Folie, Etiketten, Tetra Pak, Glas) und als Messgröße die exakte Treffer-Quote des normalisierten Datums. Aktuelle Vergleichszahlen gibt es nicht. Die einzige Vergleichsstudie ist von 2020 [7].
- Schafft `DataScannerViewController` mit `.dateTimeDuration` deutsche Formate wie „12.27“ oder nur Monat/Jahr? Das ist nicht dokumentiert und muss getestet werden [4a].
- Seker & Ahn (2022) und Peng et al. (2025) konnten wir nicht im Volltext prüfen (403). Gibt es einen öffentlichen Datensatz (z. B. „ExpDate“), den man für Tests oder Training nutzen darf (Lizenz)?
- Vision-LLMs: Wie oft halluzinieren sie bei unlesbaren Prägungen ein Datum? Antworten sie zuverlässig mit „unbekannt“? Was kostet das pro Haushalt? Wie lässt sich das datenschutzkonform umsetzen (Bilder aus der Wohnung)?
- Gibt es eine **deutsche/EU-Primärquelle mit maschinenlesbaren Lagerdauern**, ähnlich FoodKeeper? Bisher haben wir nur HTML-Tabellen (ernaehrungsvorsorge.de) und Broschüren (Tirol). Die BBK-Open-Data-CSV liefert 404 (siehe Bericht 05).
- Dürfen die FoodKeeper-Werte (CC0) übernommen werden? Die Lizenz erlaubt es, aber sie müssen gegen die Originaldatei geprüft werden, deren Abruf gesperrt war.
- Wie verbreitet sind im DACH-Handel 2026/27 schon 2D-Codes mit MHD auf Endverbraucher-Packungen?
- Web-App oder native App: Ohne native OCR (VisionKit/ML Kit) wird die MHD-Erkennung im Browser deutlich schlechter, weil Tesseract.js schwach ist und `TextDetector` nur ein Entwurf ist [6][15]. Das ist ein Argument für eine native App oder eine Hybrid-App (Capacitor/Flutter).

---

## Quellen

Alle abgerufen am 2026-10-06.

1. Verordnung (EU) Nr. 1169/2011 (LMIV), Anhang X – Mindesthaltbarkeitsdatum, Verbrauchsdatum, Datum des Einfrierens (Fassung „as adopted“): https://www.legislation.gov.uk/eur/2011/1169/annex/X/adopted. Die EUR-Lex-Fassung https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32011R1169 lieferte beim Abruf keinen Inhalt.
2. Richtlinie 2011/91/EU (Losnummer), Art. 4 und Art. 5: https://www.legislation.gov.uk/eudr/2011/91/article/5/adopted ; https://www.legislation.gov.uk/eudr/2011/91/article/4/adopted
3. Apple Developer – VNRecognizeTextRequest: https://developer.apple.com/documentation/vision/vnrecognizetextrequest
4. Apple Developer – DataScannerViewController: https://developer.apple.com/documentation/visionkit/datascannerviewcontroller
4a. Apple Developer – DataScannerViewController.TextContentType (u. a. `dateTimeDuration`): https://developer.apple.com/documentation/visionkit/datascannerviewcontroller/textcontenttype
5. Roboflow Blog – Expiration Date Inspection (Gemini + Workflows), 16.01.2026: https://roboflow.com/blog/expiration-date-inspection
5a. Google for Developers – ML Kit Text Recognition v2: https://developers.google.com/ml-kit/vision/text-recognition/v2
5b. Google for Developers – ML Kit Text Recognition v2, Android: https://developers.google.com/ml-kit/vision/text-recognition/v2/android
5c. Google for Developers – ML Kit Text Recognition v2, iOS: https://developers.google.com/ml-kit/vision/text-recognition/v2/ios
6. Tesseract.js (GitHub, Apache-2.0): https://github.com/naptha/tesseract.js
6a. Tesseract-Dokumentation – Improving the quality of the output: https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
7. Florea, V.; Rebedea, T. (2020): Expiry date recognition using deep neural networks. International Journal of User-System Interaction 13(1), 1–17, DOI 10.37789/ijusi.2020.13.1.1: https://rochi.utcluj.ro/ijusi/articles/IJUSI-13-1-Florea.pdf (Code/Daten: https://github.com/vladalexgit/expiry_date_recognition/)
8. Peng, H.; Bayon, J.; Recas, J.; Guijarro, M. (2025): Efficient Expiration Date Recognition in Food Packages for Mobile Applications. Algorithms 18(5):286, DOI 10.3390/a18050286. Abstract via Crossref: https://api.crossref.org/works?query.bibliographic=generalized+framework+recognition+expiration+dates+product+packages+fully+convolutional ; Volltext https://www.mdpi.com/1999-4893/18/5/286 (403, nicht geprüft)
9. Andreotti, L. et al. (2025): Detection of Expiration Dates in Product Images Using YOLO (ERAMIA-RS/SBC): https://sol.sbc.org.br/index.php/eramiars/article/view/39448
10. Kusuma, H. et al. (2026): Real-Time Expiry Date Verification of CIJ Dot-Matrix Codes on Glossy Food Packaging Using a Raspberry Pi-Based YOLOv8–OCR Pipeline. ETASR, DOI 10.48084/etasr.20202 (Metadaten/Abstract über Crossref: https://api.crossref.org/works?query.bibliographic=expiry+date+recognition+OCR+food+package)
10a. Lotfy, M. et al. (2024): CNN-optimized text recognition with binary embeddings for Arabic expiry date recognition. JESIT, DOI 10.1186/s43067-024-00136-2: https://link.springer.com/article/10.1186/s43067-024-00136-2 (Volltext nicht abrufbar, Kennzahl aus Crossref)
10b. Zidane, A.; Soliman, G. (2023/2024): Ladder Bottom-up Convolutional Bidirectional Variational Autoencoder for Image Translation of Dotted Arabic Expiration Dates. arXiv:2310.14069: https://arxiv.org/abs/2310.14069
10c. Seker, A. C.; Ahn, S. C. (2022): A generalized framework for recognition of expiration dates on product packages using fully convolutional networks. Expert Systems with Applications 203:117310, DOI 10.1016/j.eswa.2022.117310 (nur Metadaten, Volltext 403)
11. Land Tirol / Zivilschutz Tirol – Bevorratungsratgeber „Vorgesorgt!“ (Abschnitt „Wie lange Lebensmittel haltbar sind“): https://www.tirol.gv.at/fileadmin/themen/sicherheit/zivil-und-katastrophenschutz/Blackout_UEbung_Energie21/Land_Tirol_Bevorratungsratgeber.pdf
12. BLE/BMEL – ernaehrungsvorsorge.de: So können Lebensmittel gelagert werden: https://www.ernaehrungsvorsorge.de/private-vorsorge/empfehlungen-tipps/so-koennen-lebensmittel-gelagert-werden ; BZfE – Haltbarkeit von Lebensmitteln (Stand 20.02.2025): https://www.bzfe.de/kueche-und-alltag/kochen/haltbarkeit-von-lebensmitteln
12a. ernaehrungsvorsorge.de – So kann Mineralwasser gelagert werden: https://www.ernaehrungsvorsorge.de/private-vorsorge/empfehlungen-tipps/so-kann-mineralwasser-gelagert-werden (Werte übernommen aus Preposaurus-Bericht 08, nicht erneut abgerufen)
13. Verbraucherzentrale Sachsen – Marktcheck „Lebensmittelvorrat – gut und praktisch?“ (Feb. 2025): https://verbraucherzentrale-sachsen.de/sites/default/files/2025-02/250206_marktcheck_notfallvorrat_vzs.pdf
14. GS1 – Application Identifier (15) Best before date (sowie AI 16, 17): https://ref.gs1.org/ai/15
15. WICG – Accelerated Text Detection in Images (Shape Detection API, Draft Community Group Report): https://wicg.github.io/shape-detection-api/text.html
16. Anthropic – Claude Docs: Vision (Grenzen, Token-Kosten): https://platform.claude.com/docs/en/build-with-claude/vision
17. USDA FSIS – FoodKeeper Data (CC0, Stand 22.01.2025): https://catalog.data.gov/dataset/fsis-foodkeeper-data (Primärdatei https://www.fsis.usda.gov/shared/data/EN/foodkeeper.json: HTTP 403)
17a. Drittanbieter-Kopie der FoodKeeper-Daten (in Tage umgerechnet, nicht offiziell): https://github.com/josephb333/SmartPantry/blob/1a4cd2275a325757ed8185f0f3fb80397356d9e3/data/foodkeeper.json
