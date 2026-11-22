# Preposaurus – Synthese der Recherche (Reports 01–25)

Stand: 2026-10-06 · Phase: Recherche/Ideensammlung, **es wird noch nichts programmiert**.
Grundlage: Ideenpapier `../00_IDEE.md` und die 25 Einzelreports in diesem Ordner. Verweise wie **[R07]** beziehen sich auf `07_bbk_deutschland.md` usw.

> Hinweis zur Belastbarkeit: Mehrere Agents hatten ihr Websuche-Kontingent aufgebraucht oder wurden von Seiten blockiert (Reddit, YouTube, zivilschutz.at, maff.go.jp, redcross.org, GS1 u. a.). Store-Zahlen und einige Behördenwerte sind daher nur teilweise verifiziert. Kritische Werte sind unten als „unverifiziert“ markiert.

---

## 1. Executive Summary

**Gibt es das schon?** Teilweise ja. Den Kern „Bedarf nach BBK berechnen + Vorrat mit MHD verwalten + Erinnerungen“ bieten in DACH bereits mehrere junge Apps (Vorratsplan, Vorratskompass, Blackout Prepper, Krisenvorrat Manager, demnächst SAFELIX) [R01]. International gibt es dazu ein Dutzend Prepper-Apps mit „Tage Abdeckung“ (BeaglePrep, Provision Planner, PPantry u. a.) [R02] und sehr viele allgemeine Pantry-/MHD-Apps, teils schon mit KI-Fotoerkennung [R03][R04]. Ein reines „Notvorrat + MHD“-Produkt wäre ein **Me-too**.

**Was es nicht gibt (Stand Recherche):** Keine gefundene App kombiniert
1. **mehrere auswählbare offizielle Quellen** (DE/AT/CH/EU/Nordics/FEMA) mit Versionsstand und Quellenlink (nur SAFELIX ansatzweise, noch nicht im Store) [R01][R02],
2. **detailliertes Haushaltsprofil** (Alter, Kinder, Senioren, Säuglinge, Ernährungsform, Haustiere),
3. **Ziel mit Tagen + Zieldatum** inkl. Stufenplan/Einkaufsverteilung [R21],
4. **Foto-/KI- und MHD-OCR-Erfassung** speziell für den Notvorrat [R01][R02][R04],
5. **hochwertige Piktogramm-Optik** und einen angstfreien „Haushaltsassistent“-Ton [R19][R20].

**Marktlücke: ja, aber eng und ehrlich gesagt klein.**
- Der Markt ist jung (2025/26), zersplittert, ohne Marktführer; keine private Notvorrat-App hat mehr als ~20 Store-Bewertungen [R01][R02].
- Kostenlose Behördenangebote (BLE-Kalkulator, BWL-Rechner, ZIVA in AT seit 09/2026) drücken die Zahlungsbereitschaft [R01][R09][R23].
- B2C-Umsatzschätzung: bei 50.000 Downloads/Jahr ca. 8.500–12.700 € Jahresumsatz → eher Nebenprojekt; tragfähig nur mit B2B2C (Versicherer, Kommunen, Arbeitgeber) oder Förderung [R23]. Realistisch erreichbar: 20.000–150.000 aktive Haushalte in 2–3 Jahren (Annahme) [R20].
- Das eigentliche Problem der Nutzer ist **nicht** die Berechnung, sondern die **dauerhafte Pflege** (Erfassungsaufwand, Vergessen, Ablauf) [R06]. Wer das löst (schnelle Erfassung, Rotation, Alltagsnutzen), hat den echten USP – nicht das Feature „Barcode + MHD“.
- Die Hauptbarriere in der Bevölkerung ist „nicht dran gedacht“ (59 %), nicht Geld oder Platz [R06][R20]. Positionierung als ruhiger Haushaltsassistent statt Prepper-App.

**Empfehlung:** Weitermachen, aber mit klarem Profil: *„Offizielle Empfehlungen, auf den eigenen Haushalt gerechnet – und ein Vorrat, der sich fast von selbst pflegt.“* Vor dem Bauen: Konkurrenz-UX-Test, Barcode-/OCR-PoC, 5–10 Nutzerinterviews, Namensentscheidung (siehe Abschnitt 6).

---

## 2. Konkurrenz-Matrix

Legende: ✅ ja · ◐ teilweise · ❌ nein · ? unklar/unverifiziert

### 2.1 Direkte Notvorrat-Apps (DACH) [R01]

| App | Plattform | Offizielle Quellen? | Haushalt? | Ziel/Datum? | Foto / Barcode / OCR | MHD-Reminder | Preis |
|---|---|---|---|---|---|---|---|
| Vorratsplan (T. Konrath) | iOS/macOS, Android laut Website (?) | nur BBK | ◐ Größe + Aktivität | ◐ Meilensteine 72 h/10 T, kein Datum | ❌ / ✅ (Premium, OFF) / ❌ | ✅ | Free (50 Produkte) / 9,99 € einmalig |
| Vorratskompass (Schwedes Tech) | nur iPhone | ? „offizielle Kategorien“ | ✅ Kinderalter, Tiere | ◐ „Autarkie-Tage“ | ❌ / ? / ❌ (KI-Assistent, kein Foto) | ✅ (2 Wochen vorher) | Free + IAP 4,99–89,99 € |
| Blackout Prepper (GoldApps) | iOS | BBK + DWD-Warnungen | ? | ? | ❌ / ✅ / ❌ | ◐ Hervorhebung | Free mit Werbung + Tracking, IAP/Abo |
| Krisenvorrat Manager | Web/PWA | BBK | ◐ Personen | ✅ Vorratsziel, Staffelkauf | ❌ / ❌ / ❌ | ? | kostenlos |
| SAFELIX | angekündigt (iOS/Android) | ✅ BBK, DRK, FEMA | ? | ◐ Readiness-Score | ? | ✅ gestaffelt | Free (3 Artikel) / ab 4,99 €/Monat |
| Ready24 | iOS/Android | ❌ | ✅ inkl. Haustiere | ❌ | ❌ / ❌ / ❌ | ✅ | kostenlos (Stand 2021) |
| Speisekammer – Prepper | iOS/Android | ❌ | ? | ❌ | ❌ / ✅ (unzuverlässig) / ❌ | ✅ | ? |

### 2.2 Behörden-Angebote [R01][R02][R09]

| Angebot | Plattform | Offizielle Quellen? | Haushalt? | Ziel/Datum? | Foto / Barcode / OCR | MHD-Reminder | Preis |
|---|---|---|---|---|---|---|---|
| BLE/BMLEH-Vorratskalkulator (DE) | Web | ✅ eigene | ◐ 1–10 Personen, kein Alter | ◐ 1–28 Tage | ❌ | ❌ | kostenlos |
| BWL-Notvorratsrechner (CH) | Web | ✅ eigene | ✅ 12+, 2–12, <2, Tiere, Ernährung | ◐ Tage (Std. 7) | ❌ | ❌ | kostenlos |
| ZIVA (AT, seit 7.9.2026) | iOS/Android | ✅ ÖZSV | ✅ Alter, Tiere, Erkrankungen | ❌ Checklisten | ❌ | ❌ (nicht belegt) | kostenlos |
| NINA (DE) | iOS/Android | ✅ BBK-Tipps | ❌ | ❌ | ❌ | ❌ | kostenlos (2,8★) |
| Alertswiss (CH) | iOS/Android/Web | ✅ BABS | ◐ Notfallplan | ❌ | ❌ | ❌ | kostenlos |
| Tokyo Bosai (JP) | iOS/Android | ✅ Tokyo | ◐ Kids/Senior-Modus | ❌ | ❌ | ✅ (einzige Behörden-App!) | kostenlos |

### 2.3 Internationale Prepper- und Pantry-Apps (Auswahl) [R02][R03][R04]

| App | Plattform | Offizielle Quellen? | Haushalt? | Ziel/Datum? | Foto / Barcode / OCR | MHD-Reminder | Preis |
|---|---|---|---|---|---|---|---|
| BeaglePrep | iOS/Android | ❌ | ✅ Prep Score nach Haushalt | ◐ Tage Abdeckung | ❌ / ✅ (OFF+USDA) / ❌ | ✅ | Free (75 Artikel) / Pro ~2–5 $ |
| Provision Planner | Web/iOS/Android | ❌ | ✅ Erw./Kinder | ✅ Lückenanalyse, Szenarien | ❌ / ✅ / ❌ | ✅ | Freemium, Abo/Lifetime |
| PPantry | PWA | ❌ | ✅ | ◐ | ❌ / ✅ / ❌ | ✅ Rotations-Queue | kostenlos (Patreon) |
| PrepperPro! | iOS | ❌ | ✅ mehrere Haushalte | ◐ Kalorien | ❌ / ? / ❌ | ✅ | 14,99 $/Jahr, 39,99 $ Lifetime |
| StashGuard | iOS/Mac | ❌ | ◐ | ◐ Mindestbestand | ❌ / ✅ / ❌ | ✅ | kostenlos |
| Pantry Check | iOS | ❌ | ❌ | ❌ | ◐ Produktfoto / ✅ / ❌ | ✅ | 200 Artikel gratis, ~12–30 $/Jahr |
| Grocy (OSS) | Self-hosted Web | ❌ | ❌ | ◐ Mindestbestand | ❌ / ✅ / ❌ | ✅ | kostenlos |
| VorratsApp / KI-Pantry-Apps (Shelfze, FreshSave, Fridgenie …) | iOS/Android | ❌ | ◐ Haushalt teilen | ❌ | ✅ KI-Foto / ✅ / ◐ | ✅ | Freemium/Abo |
| Japan: Ristock, 備蓄Widget, おすそぐら | iOS/Android | ❌ | ◐ Wasser-/Reisrechner | ◐ | ✅ Foto / ✅ / ❌ | ✅ Widgets, Ampel | meist kostenlos |
| Prepper_Log / PrepTrack (OSS, archiviert 18.09.2026) | PWA | ◐ BBK-Wasser | ◐ | ◐ Readiness-Score | ❌ / ✅ ZXing / ✅ Tesseract | ✅ 30/14/7/3/1 | Apache-2.0 [R05] |

**Fazit Matrix:** Barcode + MHD-Reminder sind Commodity. Lücke = Multi-Quellen-Vergleich × Haushaltsprofil × Zieldatum/Stufenplan × schnelle Foto-Erfassung × Design/Ton × DACH-Datenschutz (local-first).

---

## 3. Vergleichstabelle offizielle Empfehlungen

Alle Werte pro Person. „Mengen“ nur, wo die Quelle sie wirklich nennt; sonst nur Kategorien.

| Quelle | Land | Zeitraum | Wasser/Tag | Lebensmittel-Mengen | Stand | Link | Report |
|---|---|---|---|---|---|---|---|
| BBK „Vorsorgen für Krisen und Katastrophen“ | DE | Ziel 10 Tage, Minimum 3 Tage; Stufen 3/5/7/10 | 2 l (1,5 Trinken + 0,5 Kochen) | keine eigene Tabelle mehr → verweist auf BLE | 11/2025, 2. Aufl. | bbk.bund.de/…/ratgeber-checkliste_node.html | [R07] |
| BLE/BMLEH ernaehrungsvorsorge.de (Mischkost) | DE | 10 Tage (Kalkulator 1–28) | 2 l; Kinder ≤12 J. 1 l; Senioren ≥65 J. 2 l | 10 Tage: Getreide/Brot/Kartoffeln 3,3 kg · Gemüse/Hülsenfrüchte 4,0 kg · Obst/Nüsse 2,5 kg · Milchprodukte 2,5 kg · Fleisch/Fisch/Eier 1,2 kg · Fette 0,33 kg · Getränke 20 l; Basis 2.200 kcal | Excel 24.03.2023 | ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratskalkulator | [R07][R08] |
| BLE vegetarisch | DE | 10 Tage | wie oben | wie oben, aber 1,3 kg Eier/Fleischersatz | 2023 | ernaehrungsvorsorge.de/…/vorratstabelle-vegetarisch | [R08] |
| *BBK alte Checkliste (historisch)* | DE | 10 Tage | 2 l | Getreide 3,5 · Milch 2,6 · Fleisch/Fisch/Eier 1,5 · Fette 0,357 kg | vor 2025, **veraltet**, noch oft zitiert | (Kommunen-PDFs) | [R07][R08] |
| ZSV Steiermark / ÖZSV | AT | meist 14 Tage (Tirol 1 Woche, Linz ≥10 T.) | 1,5 l (Tabelle), BMI ≥2 l, Tirol ≥2,5 l – **widersprüchlich** | 14 Tage, 2.000 kcal: Getreide 4,5 · Fleisch/Fisch 2,0 · Fette 0,5 · Gemüse/Obst 6,0 · Milchprodukte 4,5 kg · Getränke 21 l | ~2021 (Primärseite nicht abrufbar) | oesterreich.gv.at/…/katastrophenfaelle; tirol.gv.at/…/bevorratung | [R09] |
| BWL „Kluger Rat – Notvorrat“ | CH | ~7 Tage | Broschüre: ≥9 l gesamt (reicht 3 Tage); Rechner: ~2,5 l/Tag | Rechner gibt Packungen aus, keine öffentliche kg-Tabelle; 50 Masken, Medikamente ~4 Wochen | 17.02.2025 | bwl.admin.ch/de/notvorrat | [R09] |
| EU Preparedness Union / Stockpiling Strategy | EU | ≥72 h | – | keine Mengenliste | 26.03.2025 / 09.07.2025 | commission.europa.eu/topics/preparedness_en | [R10] |
| MCF (ex-MSB) „Om krisen eller kriget kommer“ | SE | 1 Woche | ≥3 l | nur Kategorien/Beispiele; Medikamente 1 Monat | 2024, Behörde umbenannt 01.01.2026 | mcf.se/sv/rad-till-privatpersoner/hemberedskap---preppa-for-en-vecka/ | [R10] |
| DSB | NO | 7 Tage (seit 29.05.2024, vorher 3) | ~3 l (20 l/Woche) | nur Kategorien | 2024/25 | dsb.no/sikkerhverdag/egenberedskap/ | [R10] |
| 72tuntia | FI | 72 h | 2 l (nur Sekundärquelle) | nur Kategorien | ? | 72tuntia.fi | [R10] |
| Styrelsen for Samfundssikkerhed (ex-Beredskabsstyrelsen) | DK | 3 Tage | 3 l | nur Kategorien | 2024 | brs.dk/…/prepared_for_crises_checklist.pdf | [R10] |
| Denk Vooruit | NL | 72 h | 3 l | nur Kategorien; Bargeld 70 €/Erw., 30 €/Kind | 2025/26 | denkvooruit.nl | [R10][R13] |
| FEMA / Ready.gov | US | „several days“ (früher 3), 2 Wochen zu Hause | 1 Gallone ≈ 3,8 l (inkl. Hygiene) | keine Mengen | laufend geändert | ready.gov/kit, ready.gov/water | [R11] |
| CDC / American Red Cross | US | 2 Wochen zu Hause, 3 Tage Go-Bag | 1 Gallone | keine Mengen; Medikamente 7 Tage | – | cdc.gov/water-emergency/…; redcross.org/…/survival-kit-supplies.html | [R11] |
| Public Safety Canada | CA | 72 h | ~4 l (früher 2 l) | keine Mengen | – | canada.ca/…/emergency-kits.html | [R11] |
| UK Prepare | UK | „a few days“ (72 h nur Medien, **unbestätigt**) | 3 l Minimum, 10 l komfortabel | keine Mengen | 24.07.2026 | prepare.campaign.gov.uk | [R11] |
| MAFF | JP | ≥3 Tage, besser 1 Woche | 3 l | Leitfaden inkl. Säuglinge/Senioren, Rolling Stock | – | maff.go.jp/j/zyukyu/foodstock/guidebook/ | [R11] |
| NEMA / WREMO | NZ | national 3 Tage / Wellington 7 Tage | 3 l / 20 l | keine Mengen | 2026 | getready.govt.nz; wremo.nz/water | [R11] |

**Konsequenzen fürs Produkt** [R07–R12]:
- Nur DE (BLE) und AT (Steiermark) haben echte kg-Tabellen. Für alle anderen Quellen: **Kategorien-Checkliste + Wasser + Dauer**, kcal-Hochrechnung nur als klar gekennzeichnete Schätzung.
- Jede Quelle als **versioniertes Datenobjekt** (Herausgeber, Land, Ebene national/regional/NGO, Stand, Abrufdatum, URL, Lizenz). Widersprüche offen anzeigen, nicht glätten.
- Altersskalierung (DGE-kcal / 2.200 = Personen-Äquivalent) ist eine **eigene Ableitung**, kein offizieller Wert → Modus „Offiziell (Pauschale)“ als Default, „Individuell“ optional [R12].

---

## 4. Technik-Empfehlung

| Bereich | Empfehlung | Begründung | Reports |
|---|---|---|---|
| **PoC** | Schnelle Web-App, komplett lokal, ohne Backend: Empfehlungskatalog als JSON, Bedarfsrechner, Barcode → OFF, Foto → LLM-Vision mit Bestätigungs-Screen | Validiert Kernablauf und Erkennungsqualität ohne Store/Backend | [R17][R18] |
| **Plattform MVP** | React Native + Expo (TypeScript), iOS + Android; Fachlogik (Quellen, Rechner, Kategorien) als plattformunabhängiges TS-Paket; öffentlicher Web-Rechner als SEO-Einstieg | Reine PWA scheitert auf iOS an lokalen Erinnerungen (nur Server-Push, Home-Screen-Pflicht), fehlendem BarcodeDetector in Safari, und Speicher-Löschrisiko. Flutter gleichwertig | [R17] |
| **Erfassung Stufe 1** | Piktogramm-Schnellerfassung nach Kategorie + Menge („6× Dose 400 g, MHD 03/2028“), Monat/Jahr-Picker mit +6M/+1J/+2J | Erfassungsaufwand ist Abbruchgrund Nr. 1; schneller als jede KI, offline | [R03][R06][R16] |
| **Erfassung Stufe 2** | Barcode on-device (expo-camera / ML Kit / VisionKit) + Open Food Facts API v3 mit eigenem User-Agent, lokalem Cache, Attribution; OFF-Kategorien → BLE-Warengruppen; kcal + Nettogewicht übernehmen | Kostenlos, präzise, liefert Gruppe/Gewicht/kcal; **liefert aber nie ein MHD** | [R14][R05] |
| **Erfassung Stufe 3** | MHD-OCR on-device (VisionKit/ML Kit) + eigener Parser nach LMIV Anhang X (Losnummern/Uhrzeiten filtern, Plausibilität), immer nur Vorschlag; nach ~3 s → Picker | Allgemeine OCR versagt bei Punktmatrix/Prägung (Tesseract 10,6 % Präzision) | [R16] |
| **Erfassung Stufe 4** | „Magic Foto“ per Cloud-LLM (Gemini Flash-Lite/Flash, Claude Haiku/Sonnet, GPT) hinter dünnem Backend-Proxy, Structured Output mit Kategorie-enum und `mhd_iso` oder `null`; nur Opt-in, EXIF entfernen, Kontingent | ~0,2–2 US-Cent/Foto; gut bei Warengruppen, schwach bei Zählen/Marke/MHD; Halluzinationsrisiko | [R04][R15] |
| **Später** | GS1 DataMatrix/Digital Link lesen (AI 15/17 = MHD), Kassenbon nur wenn überhaupt | GS1 Sunrise 2027 könnte MHD-Scan lösen; Bon liefert kein MHD | [R04][R16] |
| **Datenmodell** | Grocy-artig: Produkt (Stammdaten) ≠ Charge (MHD, Lagerort, Menge); MHD und Verbrauchsdatum getrennt; Bestand als **Ereignislog** (stock_movement); Client-UUIDs, Soft Delete; Katalog source → recommendation_set → recommendation_line | Konfliktrobust beim Sync, liefert Historie/Verschwendungsstatistik, FIFO/Rotation | [R03][R05][R18] |
| **Lokal/Offline** | SQLite als Quelle der Wahrheit, lokale Erinnerungen (expo-notifications DateTrigger), Export/Backup (CSV/PDF) ab MVP | Keller ohne Netz, Krisenfall ohne Server; Datenverlust zerstört Vertrauen und ist ab 12/2026 Produkthaftungsthema | [R17][R18][R22] |
| **Backend/Sync (nach MVP)** | Supabase (Frankfurt) + PowerSync (EU) für Haushalts-Sync; anonymer Start, Konto erst beim Teilen; Einladung per Code/QR. Alternativen: Firestore, PocketBase | Offizielle Integration, Free-Tier (pausiert nach 1 Woche), ~75 USD/Monat bezahlt; Open-Source-Ausweg bevorzugen (InstantDB-Abschaltung als Warnung) | [R18] |
| **Design** | Fluent Emoji (MIT) für Inhalte, Phosphor/Lucide für UI, 15–25 eigene Ergänzungsmotive (Kanister, Mehl, Kocher, Powerbank …); MHD-Ampel 4 Stufen mit Farbe + Form + Text (Teal/Orange) | Lizenzsauber; OpenMoji = Share-Alike; BBK-Grafiken tabu; WCAG | [R19] |
| **UX** | Onboarding 3 Screens (Haushalt, Quelle, Ziel+Datum) + Grob-Schätzung → „Ihr seid schon für 2,5 Tage versorgt“; Hauptkennzahl „X Tage versorgt“ (schwächstes Glied); Stufen 3/5/7/10/14; MHD-Sammelpush max. 1×/Woche, 3–6 Monate Vorlauf; Notification-Erlaubnis erst beim ersten MHD | Endowed Progress, Goal-Gradient, EPPM; keine Streaks/Angst-Countdowns | [R21][R20] |

---

## 5. Recht und Risiken

### 5.1 Recht [R07][R08][R09][R22][R23][R24][R25]
- **Urheberrecht Behördeninhalte:** BBK- und BLE-Texte/Grafiken geschützt, kommerzielle Nutzung der BBK-Broschüre untersagt; BZfE unter CC BY-NC-ND; admin.ch nur mit schriftlicher Zustimmung. → **Nur Zahlen als Fakten mit Quellenangabe**, eigene Texte und Piktogramme, keine Logos/Bundesadler (§ 124 OWiG), keine 1:1-Tabellenübernahme (Datenbankschutz § 87b UrhG). Kooperations-/Freigabeanfrage an BBK, BLE (info@ble.de), BWL, ÖZSV.
- **Werbeaussagen:** Kein „vom BBK empfohlen“ (UWG), Hinweis „kein Angebot einer Behörde“.
- **DSGVO Art. 9:** Allergien, Medikamente, Schwangerschaft = Gesundheitsdaten. Local-first, im MVP nur Ernährungs-Flags, Mitglieder ohne Klarnamen (Rolle + Altersgruppe). Apple 5.1.3(ii): keine Gesundheitsdaten in iCloud.
- **Cloud-KI:** Apple 5.1.2(i) Offenlegung + Zustimmung; AVV/DPA; nur bezahlte API-Tarife (Gemini-Free für EWR unzulässig); Claude derzeit ohne EU-Datenresidenz.
- **Open Food Facts:** ODbL (Share-Alike bei öffentlich verteilter abgeleiteter DB), Bilder CC BY-SA, sichtbare Attribution; keine Gewähr für Allergene/Nährwerte.
- **Haftung:** Personenschäden nicht per AGB ausschließbar; neue Produkthaftungsrichtlinie gilt ab 09.12.2026 auch für Software und Datenverlust. → Disclaimer, konservative Rundung, sichtbarer Rechenweg, „Mensch bestätigt“-Prinzip, MHD ≠ Verbrauchsdatum.
- **Warn-APIs:** NINA-Backend ohne offene Lizenz, MoWaS „nicht gewerblich, unverändert“; DWD Open Data CC BY 4.0 ist sauber [R24].
- **Store/Pflichten:** Kontolöschung in App + Web, Datenschutzerklärung, Impressum (§ 5 DDG), Google-Datensicherheitsformular, Play-Testpflicht 12 Tester × 14 Tage [R17][R22].
- **Name:** Der frühere Arbeitstitel kollidierte mit bestehenden Marken und Domains, Prepper-Image problematisch → nur Codename [R25]. Entscheidung 2026-11-22: Preposaurus.

### 5.2 Produkt- und Marktrisiken
1. **Retention**: Vorsorge passiert anlassbezogen; Tracking wird nach Tagen/Wochen abgebrochen [R06][R20][R21].
2. **Erfassungsaufwand**: langsamer als Edding/Notizblock = Scheitern [R06].
3. **Erkennungsqualität unbewiesen**: OFF-Trefferquote bei Eigenmarken unbekannt (NoWaste-Test ~50 %), MHD-OCR auf Dosen unklar, LLM-Halluzination [R03][R14][R15][R16].
4. **Falsche Sicherheit** durch ungenaue „X Tage versorgt“-Kennzahl [R21].
5. **Kleiner Markt, geringe Zahlungsbereitschaft**, Abo-Aversion, kostenlose Behördenangebote; ZIVA könnte Inventar nachrüsten [R09][R23].
6. **Pflegeaufwand Quellendaten**: Empfehlungen ändern sich (BBK 2025, NO 2024, Ready.gov, Kanada, Behörden-Umbenennungen SE/DK) [R10][R11]; Solo-Projekte schlafen ein (Prepper_Log nach 6 Monaten archiviert) [R05].
7. **Laufende Kosten/Missbrauch** bei Cloud-KI und Sync im Free-Tier [R15][R18].

---

## 6. Widersprüche zwischen Reports und offene Fragen

### 6.1 Widersprüche
| Thema | Widerspruch | Einordnung / Vorschlag |
|---|---|---|
| Plattform | [R05] empfiehlt Offline-PWA (ggf. Prepper_Log-Fork); [R17] sagt reine PWA scheitert auf iOS | [R17] ist detaillierter → PWA nur für PoC und Web-Rechner, MVP nativ (Expo) |
| Web-Barcode | [R05] ZXing-JS; [R14] zxing-js kaum gepflegt, besser `barcode-detector` (zxing-cpp WASM) | Für PoC [R14] folgen |
| Web-OCR | [R05] Tesseract.js als MHD-OCR; [R16] Tesseract nur 10,6 % Präzision bei MHD | Tesseract nicht als MHD-Lösung einplanen |
| Medikamente | [R13]: persönliche Medikamente pro Mitglied = stärkstes Non-Food-Feature; [R22]: im MVP nur personenunabhängige „Hausapotheke“ (Art. 9) | MVP nach [R22]; personenbezogen später, lokal, mit Einwilligung |
| Mitgliederprofil | [R12]: Alter + Geschlecht als Pflichtfelder; [R18]/[R22]: Altersgruppe statt Geburtsdatum, Datenminimierung | Altersgruppe + optional Geschlecht, nur lokal |
| Wasser CH | [R09]: Broschüre ≥9 l (3 Tage), Rechner laut Beobachter ~2,5 l/Tag (70 l / 4 Pers. / Woche) | Beide Werte als Teil der Quelle anzeigen, manuell verifizieren |
| Wasser/Dauer AT | [R01]: „mindestens 7 Tage“; [R09]: meist 14 Tage, Wasser 1,5/2/2,5 l | Mehrere AT-Profile (ÖZSV-14T, Tirol) statt eines „AT“-Werts |
| BBK-Mengen | [R08]: unklar, ob aktuelles BBK-PDF angeglichen ist; [R07]: neuer Ratgeber hat keine kg-Tabelle mehr und verweist auf BLE | [R07] ist aktueller; alte Werte als „historisch“ führen |
| Senioren-Wasser | [R07] Idee: „ab 65 erhöht“; [R08]/[R12]: BLE-Fußnote nennt 2 l, also gleich wie Standard | Fußnote im Original prüfen |
| Kosten 10-Tage-Vorrat | [R06]: unter 100 € (VZ Sachsen 02/2025); [R08]: „knapp über 90 €“ ohne Bezugsjahr | VZ-Wert 2025 verwenden |
| MHD-Vorlauf | Vorratskompass 2 Wochen, Prepper_Log 30/14/7/3/1 Tage [R05], [R03]/[R21]: 3–6 Monate | Für Notvorrat 3–6 Monate (Rotation), konfigurierbar |
| Monetarisierung | [R01]: günstiges Familien-Abo möglich; [R02]/[R06]: Abos werden abgelehnt; [R23]: Fair Freemium + Einmalkauf, Abo nur für Sync/KI | [R23] als Arbeitshypothese, per Fake-Door testen |
| Cloud-KI-Anbieter | [R15]: Claude ohne EU-Residenz; [R22]: Anthropic DPA/kein Training ok | Datenschutzrechtlich mit SCC/DPF möglich, aber EU-Residenz als Kriterium prüfen |
| Jodtabletten | [R10]/[R13]: NO/DK empfehlen, DE-BfS „angeblich abratend“ (unverifiziert) | Nicht ins MVP; nur wörtliche Länderhinweise |
| ISBN BBK-Ratgeber | [R07]: PDF und Webseite nennen verschiedene ISBN | Irrelevant fürs Produkt, in Quellenangabe Titel/Stand nutzen |
| Marktgröße | [R20]: 20.000–150.000 aktive Haushalte; [R23]: Rechnung mit 50.000 Downloads/Jahr | Beides Annahmen ohne Konkurrenzzahlen |

### 6.2 Offene Fragen (für die gemeinsame Ideen-/MVP-Runde)
1. **Positionierung:** Notvorrat-Spezialist oder „Vorrat + Vorsorge-Assistent“ mit Alltagsnutzen (Verschwendung, Rotation)?
2. **Name:** Vorratsklug (Favorit [R25]), Vorrapp, Proviantor, Vorsorgly, Kellerkiste? Namenstest mit 5–10 Personen, Domains sichern, Markenrecherche DPMA/EUIPO.
3. **MVP-Scope:** Welche Quellen zum Start (Vorschlag: DE-BLE/BBK, AT-ÖZSV, CH-BWL, EU-72h, FEMA)? Non-Food im MVP nur als Checkliste?
4. **Rechenmodell:** Nur offizielle Pauschale oder zusätzlich individueller DGE-Modus? Welcher Default-PAL (1,4/1,6)?
5. **Erfassung:** Ist „Magic Foto“ MVP oder Stufe 2? → abhängig vom PoC-Benchmark.
6. **Sync:** Im MVP nur lokal + Export, oder Haushalts-Sync von Anfang an (Konkurrenz Vorratskompass hat ihn)?
7. **Plattform-Präferenz:** Expo vs. Flutter – persönliche Vorliebe?
8. **Geschäftsmodell:** Hobby/Open Source (Prototype Fund) vs. Fair Freemium vs. B2B2C-Pilot (Versicherer/Kommune)?
9. **Behördenkontakt:** Wann BBK/BLE/BWL/ÖZSV anfragen (Lizenz, Kooperation, Multiplikatorenvereinbarung)?

### 6.3 Vorgeschlagene PoC-/Validierungsschritte (vor Programmierung des MVP)
1. Konkurrenz-UX-Test: Vorratsplan, Vorratskompass, Blackout Prepper installieren; Onboarding-Dauer und Sekunden pro Artikel messen [R01].
2. Barcode-Test: 50–100 typische Discounter-Vorratsprodukte gegen OFF, Trefferquote und Feldvollständigkeit [R03][R14].
3. Foto-/MHD-Benchmark: 30–100 Fotos (Regale, Dosen, Etiketten) gegen VisionKit/ML Kit und 2–3 LLMs; Kennzahl MHD-Halluzinationsrate [R15][R16].
4. Code-Review Prepper_Log (Apache-2.0) als Abkürzung/Referenz [R05].
5. 5–10 Interviews mit Familien/Paaren 30–50 in DACH; Fake-Door-Test zur Zahlungsbereitschaft [R06][R20][R23].
6. Quellendatensatz v0 manuell kuratieren und verifizieren (insb. AT, CH-Rechner, Senioren-Fußnote BLE) [R07–R11].
