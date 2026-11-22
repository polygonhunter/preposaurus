# 17 – Plattformentscheidung: Native vs. Flutter vs. React Native/Expo vs. PWA vs. Web

> **Kurzfazit:** Für Preposaurus sind zwei Dinge zentral: **zuverlässige MHD-Erinnerungen** (am besten lokal und offline geplant) und **Kamera, Barcode und OCR** ohne Reibung. Genau dort ist eine reine PWA auf iOS 2026 noch schwach: Web Push klappt nur über einen Server und erst nach Installation auf dem Home-Bildschirm, es gibt keine lokal geplanten Benachrichtigungen, und Safari unterstützt die BarcodeDetector-API nicht. **Empfehlung:** Den Proof of Concept als schnelle Web-App bauen (Foto → LLM-Vision → Produkt + MHD; das läuft in jedem Browser). Das **MVP mit React Native/Expo (TypeScript)** bauen: iOS + Android aus einer Codebasis, lokale Benachrichtigungen, Barcode in `expo-camera`, kostenloser Push-Dienst, gute KI-Unterstützung. Flutter ist technisch gleichwertig. Natives Swift/Kotlin lohnt sich für einen Solo-Entwickler erst später, falls überhaupt.

Stand: 2026-10-06. Wenn eine Aussage nicht aus einer Primärquelle belegt ist, steht **[Einschätzung]** oder **[nicht verifiziert]** dabei.

---

## Ergebnisse

### 1. Was Preposaurus technisch braucht (aus 00_IDEE.md)

| Anforderung | Wichtigkeit MVP | Warum es die Plattform bestimmt |
|---|---|---|
| Kamera-Foto + Bilderkennung (Produkt) | hoch | LLM-Vision läuft per Cloud-API und hängt **nicht** von der Plattform ab. On-device-ML braucht native APIs |
| Barcode-Scan (EAN-13/8, UPC) | hoch | Im Web fehlt das native API auf iOS, dort braucht man eine JS-Bibliothek |
| MHD-OCR | mittel–hoch | On-device geht nur nativ (Apple Vision/VisionKit, ML Kit), sonst Cloud/LLM |
| Erinnerungen „läuft in 30 Tagen ab“ | **sehr hoch** | Ideal sind lokal geplante Benachrichtigungen ohne Server. Im Web gibt es das nicht |
| Offline-Fähigkeit | hoch (Krisenkontext!) | Native: lokale DB. PWA: Service Worker + IndexedDB mit Löschrisiko |
| App-Store-Präsenz | mittel | Auffindbarkeit und Vertrauen bei Familien. Kostet Gebühren und Review |
| Sync / Haushalt teilen | später | Hängt nicht von der Plattform ab (Backend) |

### 2. Fakten zu iOS-PWA-Fähigkeiten (Stand 2026)

| Thema | Fakt | Quelle |
|---|---|---|
| Web Push iOS | Seit iOS/iPadOS 16.4, **nur für Web-Apps auf dem Home-Bildschirm**, Manifest mit `display: standalone/fullscreen`, Opt-in per Nutzeraktion. Keine Apple-Developer-Mitgliedschaft nötig | [1] |
| Declarative Web Push | Seit iOS 18.4 / macOS 15.5 (damals Beta) gibt es Push ohne Service Worker. Laut WebKit ist dafür **keine** Installation auf dem Home-Bildschirm nötig | [2] |
| Lokal geplante Benachrichtigungen im Web | Chrome hat die Notification Triggers API **eingestellt**. Es gibt keinen Web-Standard für „Benachrichtigung am Datum X ohne Server“ | [3] |
| Periodic Background Sync | Safari iOS und Firefox: **nicht unterstützt** (nur Chromium) | [4] |
| BarcodeDetector API | Safari iOS: **nicht unterstützt/deaktiviert**. Firefox: nein. Chrome Android: ja. Laut MDN „experimental“, „limited availability“, nur über HTTPS | [5], [6] |
| Speicher/Eviction | Home-Screen-Web-Apps bekommen dieselben Quoten wie Browser-Apps. Standard ist „best-effort“, Daten können also gelöscht werden. Persistenter Modus lässt sich anfragen, und WebKit gewährt ihn per Heuristik eher installierten Home-Screen-Web-Apps | [7] |
| EU / DMA | Apple wollte Home-Screen-Web-Apps in der EU mit iOS 17.4 abschaffen (Beta Jan. 2024) und hat das am **1. März 2024 zurückgenommen**. Laut OWA können Fremd-Browser-Engines auf iOS weiterhin **keine** Web-Apps installieren | [8] |
| EU / DMA, App-Distribution | Ab **1. Okt. 2026** ersetzt eine „Core Technology Commission“ (5 % auf digitale Transaktionen bei Vertrieb außerhalb des App Store) die Core Technology Fee. Die Kriterien für alternative Marktplätze wurden gelockert (Update 18. Aug. 2026) | [9] |

**Folgen für Preposaurus:**
- Push über eine iOS-PWA ist möglich, braucht aber **immer einen Push-Server**, der zum richtigen Zeitpunkt sendet (Cron-Job pro Nutzer und Artikel). Die App wird dadurch automatisch serverabhängig, und das passt schlecht zu „offline/Krise“ und zu Datensparsamkeit.
- Im Gegensatz dazu planen native Apps die Erinnerung lokal beim Erfassen des Artikels, z. B. `expo-notifications` mit `DateTriggerInput`, das offline funktioniert [10].
- Bei einer reinen PWA im Browser-Tab ohne Installation drohen Daten gelöscht zu werden. Eine Vorrats-DB „verschwindet“ zu lassen, ist für dieses Produkt **existenzbedrohend** [Einschätzung].
- Die DMA hat für PWAs auf iOS bisher **nichts verbessert**. Die Lage ist dieselbe wie vor 2024 (Status quo gesichert, keine neuen Fähigkeiten) [8]. Ob sich durch DMA-Verfahren 2026 etwas an Browser-Engines/Web-App-Installation geändert hat, konnte ich **nicht verifizieren**.

### 3. Kamera / Barcode / OCR je Plattform

| Plattform | Barcode | OCR (MHD) on-device | Quelle |
|---|---|---|---|
| Native iOS (Swift) | AVFoundation/Vision, VisionKit `DataScannerViewController` (Text + Barcode live) | Apple Vision / Live Text | [11] (Mindestversion iOS 16 und A12-Chip **nicht vollständig verifiziert**, die Seite ließ sich nicht vollständig laden) |
| Native Android (Kotlin) | ML Kit Barcode: on-device, offline, EAN-8/13, UPC-A/E u. a. | ML Kit Text Recognition v2 | [12] |
| Flutter | `mobile_scanner` 7.4.2: Android über ML Kit, iOS/macOS über Apple Vision, Web über ZXing | `google_mlkit_text_recognition` 0.17.1 (nur Android/iOS, **kein offizielles Google-Paket**, kein Web) | [13], [14] |
| React Native / Expo | `expo-camera` (SDK 57): QR, EAN-13/8, UPC-A/E, Code128 u. a. auf Android, iOS **und Web** | Kein offizielles Expo-OCR-Modul. Nötig sind Community-Module (z. B. Vision-Camera-Plugins) **[nicht verifiziert]** oder Cloud/LLM | [15] |
| Capacitor (Web-App im nativen Wrapper) | über Plugins (Community/kommerziell) | über Plugins | [16] (Plugin-Details **nicht verifiziert**) |
| PWA / Web | `getUserMedia` + JS-Bibliothek (z. B. ZXing). Natives BarcodeDetector-API fehlt auf iOS | nur WASM-OCR (z. B. Tesseract.js) oder Cloud | [5], [6] |

**Wichtig:** Die **Kernfunktion „Foto → Produkt + MHD“** soll laut Idee per LLM-Vision laufen (siehe research/04). Sie ist eine Cloud-API und funktioniert auf **jeder** Plattform gleich. Die Plattformwahl betrifft also vor allem Barcode-Komfort, Offline-OCR und Erinnerungen, nicht die KI selbst.

### 4. Bewertungsmatrix (1 = schlecht, 5 = sehr gut)

Die Punkte sind eine Einschätzung auf Basis der Fakten oben, für einen Solo-Entwickler mit KI-Unterstützung.

| Kriterium | Native (Swift + Kotlin) | Flutter | React Native / Expo | Capacitor (Web + Wrapper) | PWA | Reine Web-App |
|---|---|---|---|---|---|---|
| Kamera/Barcode | 5 | 5 | 4–5 | 4 | 2–3 (iOS ohne natives API) | 2 |
| OCR on-device | 5 | 4 | 3 (Community) | 3 | 1–2 | 1 |
| Lokale Erinnerungen (MHD) | 5 | 5 | 5 | 4–5 (Plugin) | 1 (nur Server-Push) | 0 |
| Offline/Datensicherheit | 5 | 5 | 5 | 4 | 2–3 (Eviction) | 1 |
| App-Store-Präsenz | 5 | 5 | 5 | 4 (Risiko Guideline 4.2 bei dünnem Wrapper [17]) | 0 (nur Link/Home-Screen) | 0 |
| Aufwand Solo + KI | 1–2 (zwei Codebasen) | 4 | 4–5 (TypeScript, riesiger Trainingskorpus der LLMs) | 4–5 | 5 | 5 |
| Web-Version zusätzlich | 0 | 3 (Flutter Web eher schwer) | 3–4 (Expo/React Native Web) | 5 | 5 | 5 |
| Laufende Kosten | Store-Gebühren | Store + ggf. EAS-unabhängig | Store + EAS (Free-Tier reicht anfangs) | Store | ≈ Hosting | ≈ Hosting |
| **Gesamt (Tendenz)** | stark, aber teuer im Aufwand | **sehr gut** | **sehr gut** | gut | nur für PoC | nur Landing/Begleit-Tool |

### 5. Kosten (Stand Abruf)

| Posten | Kosten | Quelle |
|---|---|---|
| Apple Developer Program | 99 USD/Jahr (TestFlight bis 10.000 externe Tester) | [18] |
| Google Play Developer | 25 USD einmalig. Ausweis und Kreditkarte können verlangt werden | [19] |
| Google Play, neue private Konten | **Pflicht: geschlossener Test mit ≥ 12 Testern über ≥ 14 Tage durchgehend** vor dem Produktionsrelease | [20] |
| Apple-Provision | 15 % im Small Business Program (< 1 Mio. USD Erlös/Jahr). In der EU unter alternativen Bedingungen 10 % (Abos ab dem 2. Jahr) | [21] |
| Expo EAS Build | Free: 15 Android- + 15 iOS-Builds/Monat. Starter 19 USD/Monat, Production 199 USD/Monat | [22] |
| Expo Push Service | kostenlos (Limit 600 Benachrichtigungen/s pro Projekt). FCM/APNs auch direkt nutzbar | [23] |
| Web Push (PWA) | ohne Apple-Mitgliedschaft möglich, braucht aber einen eigenen Server | [1] |

**Hinweis zur Google-Play-Testpflicht:** Ein Solo-Entwickler muss 12 Tester zwei Wochen lang organisieren. Das sollte man früh einplanen (z. B. Familie und Freunde als „Prepper-Testhaushalte“).

### 6. Aufwand Solo-Entwickler mit KI-Unterstützung [Einschätzung]

- **TypeScript/React** hat sehr viel Trainingsmaterial, und Code-Assistenten (Claude, Copilot) liefern hier erfahrungsgemäß die verlässlichsten Ergebnisse. Mit Expo kommen Router, Kamera, Notifications und Builds aus einer Hand, und **EAS Build** baut iOS-Apps in der Cloud. Dazu kommt der Vorteil gegenüber Flutter: Die Logik (Bedarfsrechner, Empfehlungsdaten BBK/BMEL/…) lässt sich als reines TypeScript-Paket in App **und** Website/Landingpage wiederverwenden.
- **Flutter/Dart** ist technisch genauso geeignet, mit sehr guter UI-Konsistenz (schöne Piktogramme und Animationen). Das Barcode-Paket `mobile_scanner` ist ausgereift [13]. Die KI-Unterstützung ist ebenfalls gut, die Web-Ausgabe aber weniger „webby“. Flutter ist **gleichwertig**. Entscheidend ist die persönliche Vorliebe.
- **Native** bedeutet zwei Sprachen, zwei UIs und doppelten Test-Aufwand. Für ein Solo-MVP ist das nicht sinnvoll.
- **PWA** ist am schnellsten gebaut, scheitert aber am Kern-Nutzenversprechen „rechtzeitig erinnern“ auf iOS (Server-Push, Home-Screen-Pflicht) und am Löschrisiko [1][3][7].

---

## Bedeutung für Preposaurus

### Empfehlung (gestuft)

1. **Proof of Concept (Woche 1–2): Web-App (z. B. Next.js/Vite), kein Store**
   - Ziel: Foto → LLM-Vision → {Produkt, Kategorie, Menge, MHD} validieren und den Bedarfsrechner (BBK etc.) ausprobieren.
   - Im Browser auf dem Handy reichen `<input type="file" accept="image/*" capture>` und ein Cloud-Vision-Call. Es gibt keine Store-Hürde, und der Link lässt sich an Testhaushalte schicken.
   - Die Fachlogik (Empfehlungsdaten, Bedarfsberechnung, Kategorien) von Anfang an **als plattformunabhängiges TypeScript-Modul** anlegen. Das MVP übernimmt es dann unverändert.

2. **MVP: React Native + Expo (TypeScript), iOS + Android**
   - `expo-camera` für Barcode (EAN) [15], LLM-Vision für Foto/MHD, optional später On-device-OCR per Community-Modul.
   - `expo-notifications` mit **lokal geplanten** MHD-Erinnerungen [10]. Das geht ohne Server, funktioniert offline und ist datensparsam (passt zur DSGVO-Story).
   - Lokale Datenbank (z. B. SQLite) als **Offline-first-Quelle der Wahrheit**. Sync kommt später.
   - EAS-Free-Tier reicht für den Anfang [22]. Kosten: 99 USD/Jahr Apple + 25 USD einmalig Google [18][19].
   - Google-Play-Testpflicht (12 Tester × 14 Tage) gleich in die Beta-Planung einbauen [20].

3. **Später**
   - Web-Begleitversion (Expo Web oder eigene Website) für Planung am Desktop, Einkaufsliste und Teilen mit dem Haushalt.
   - Native Module nur gezielt einsetzen (z. B. VisionKit-DataScanner für Live-MHD-Erkennung auf iOS), eingebunden als Expo-Modul.
   - Haushalts-Sync über ein Backend (Supabase/Firebase o. ä.), dann auch Remote-Push über den kostenlosen Expo Push Service [23].
   - Eine EU-Alternativdistribution ist unnötig. Der App Store mit Small Business Program (15 %) reicht [21].

### Konkrete Produktideen, die sich aus der Plattform ergeben
- **Erinnerungen ohne Cloud** als Verkaufsargument: „Deine Vorratsdaten bleiben auf deinem Gerät. Erinnerungen funktionieren auch offline und im Stromausfall-Szenario.“
- **Krisenmodus offline:** Vorratsliste, Notfallplan und Rezepte sind vollständig lokal verfügbar. Mit einer reinen PWA ließe sich das auf iOS nicht garantieren [7].
- **Home-Screen-Badge** mit der Zahl bald ablaufender Artikel (nativ einfach, im Web nur bei installierter PWA über die Badging API [1]).
- **Ein Datenmodul, mehrere Oberflächen:** Bedarfsrechner und offizielle Empfehlungen als TS-Paket, auch nutzbar für einen öffentlichen Web-„Vorratsrechner“ als SEO-Einstieg zur App.

---

## Offene Fragen

1. **Persönliche Vorliebe:** Kennst du eher React/TypeScript oder Dart/Flutter? Das sollte die Wahl zwischen Expo und Flutter entscheiden.
2. **OCR-Strategie:** Nur LLM-Vision in der Cloud (einfach, kostet pro Bild, braucht Netz) oder zusätzlich On-device-OCR (offline, aufwendiger)? → Abgleich mit research/04.
3. Aktuelle **Expo-Community-Module für On-device-OCR** (z. B. Vision-Camera-Frame-Processor-Plugins) und ihre Wartung in 2026 sind **nicht verifiziert**.
4. Ob DMA-Verfahren 2026 die **Installation von Web-Apps durch Fremd-Browser-Engines** auf iOS ermöglicht haben, konnte nicht verifiziert werden. Für die Empfehlung ist das zweitrangig.
5. Die genauen Systemvoraussetzungen von VisionKit `DataScannerViewController` (iOS 16+, A12+) sind nur teilweise belegt.
6. Ist eine Web-Version für das MVP nötig (Desktop-Planung), oder reicht die mobile App?
7. Ist eine Monetarisierung über In-App-Käufe geplant? Dann gelten Apple/Google-Provision und Paid-Apps-Agreement.

---

## Quellen

Alle abgerufen am 2026-10-06.

1. WebKit Blog: „Web Push for Web Apps on iOS and iPadOS“, https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
2. WebKit Blog: „Meet Declarative Web Push“, https://webkit.org/blog/16535/meet-declarative-web-push/
3. Chrome for Developers: „Notification Triggers“ (Entwicklung eingestellt), https://developer.chrome.com/docs/web-platform/notification-triggers
4. Can I use: PeriodicSyncManager, https://caniuse.com/mdn-api_periodicsyncmanager
5. Can I use: BarcodeDetector, https://caniuse.com/mdn-api_barcodedetector
6. MDN Web Docs: „Barcode Detection API“, https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
7. WebKit Blog: „Updates to Storage Policy“, https://webkit.org/blog/14403/updates-to-storage-policy/
8. Open Web Advocacy: „Apple backs off killing web apps“, https://open-web-advocacy.org/blog/apple-backs-off-killing-web-apps/ (Advocacy-Quelle, nicht neutral)
9. Apple Developer: „Updates to apps in the EU“ (DMA), https://developer.apple.com/support/dma-and-apps-in-the-eu/
10. Expo Docs: Notifications (SDK latest), https://docs.expo.dev/versions/latest/sdk/notifications/
11. Apple Developer Documentation: DataScannerViewController, https://developer.apple.com/documentation/visionkit/datascannerviewcontroller (Inhalt nur teilweise abrufbar)
12. Google for Developers: ML Kit Barcode Scanning, https://developers.google.com/ml-kit/vision/barcode-scanning
13. pub.dev: mobile_scanner, https://pub.dev/packages/mobile_scanner
14. pub.dev: google_mlkit_text_recognition, https://pub.dev/packages/google_mlkit_text_recognition
15. Expo Docs: Camera (SDK 57), https://docs.expo.dev/versions/latest/sdk/camera/
16. Capacitor Docs, https://capacitorjs.com/docs
17. Apple: App Review Guidelines (4.2 Minimum Functionality), https://developer.apple.com/app-store/review/guidelines/
18. Apple Developer: Programs / Membership (99 USD/Jahr), https://developer.apple.com/programs/
19. Google Play Console Help: Registrierung (25 USD), https://support.google.com/googleplay/android-developer/answer/6112435
20. Google Play Console Help: Testanforderungen für neue private Entwicklerkonten, https://support.google.com/googleplay/android-developer/answer/14151465
21. Apple: App Store Small Business Program, https://developer.apple.com/app-store/small-business-program/
22. Expo: Pricing (EAS), https://expo.dev/pricing
23. Expo Docs: Push Notifications FAQ, https://docs.expo.dev/push-notifications/faq/
