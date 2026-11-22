# Design & Bildsprache: Piktogramme, Illustrationen, Farben, Barrierefreiheit, Tonalität

> **Kurzfazit:** Für ein schönes, konsistentes Lebensmittel- und Vorsorge-Bildset ist **Microsoft Fluent Emoji (MIT)** die rechtlich einfachste und optisch passendste Basis. Es gibt die Motive in 3D, Color, Flat und High Contrast, und viele vorratsrelevante Motive sind vorhanden (Konserve, Brot, Reis, Kerze, Batterie, Taschenlampe, Radio, Pflaster, Seife, Klopapier). Für die UI-Bedienelemente eignen sich **Phosphor, Tabler, Lucide oder Material Symbols** (alle MIT, ISC oder Apache 2.0). **OpenMoji (CC BY-SA)**, **Twemoji (CC BY 4.0)**, **Streamline Free** und **Icons8 Free** bringen Pflichten mit sich: Share-Alike, Namensnennung, Link-Pflicht oder Mengenlimits. **BBK-Piktogramme bzw. -Illustrationen (GOLDEN COSMOS) sind tabu**, wenn keine Zustimmung vorliegt. Eine MHD-Ampel darf nie nur über Farbe funktionieren (WCAG 1.4.1). Sie muss außerdem zwischen „Mindesthaltbarkeit“ (Qualität) und „Verbrauchsdatum“ (Sicherheit) unterscheiden. Beim Ton zeigt die Forschung (EPPM): Angst wirkt nur zusammen mit hoher Selbstwirksamkeit. Deshalb sollte Preposaurus ermutigend und „machbar“ statt alarmistisch kommunizieren.

## Ergebnisse

### 1. Icon- und Emoji-Sets im Vergleich

| Set | Lizenz | Umfang / Stile | Pflichten | Eignung für Preposaurus | Quelle |
|---|---|---|---|---|---|
| **Fluent Emoji** (Microsoft) | **MIT** | Je Motiv die Ordner **3D** (PNG), **Color**, **Flat**, **High Contrast** (eigene Prüfung am Beispiel „Red apple“, „Canned food“). Umfang über 1.000 Motive. Die genaue Zahl ist nicht verifiziert, weil die GitHub-API bei 1.000 kappt. | Copyright-Hinweis in der Lizenzdatei mitliefern | **Sehr hoch.** Freundlich, modern, „Duolingo-artig“. 3D für Hero-/Kachel-Bilder, Flat für Listen, High Contrast für den Barrierefrei-Modus | [1][2] |
| **Noto Emoji** (Google) | Bilder und Tools **Apache 2.0**, Font **OFL 1.1**, Flaggen gemeinfrei | Komplettes Unicode-Emoji-Set, flach und farbig | Lizenz- bzw. NOTICE-Hinweis | Hoch. Gute Alternative zu Fluent, etwas weniger „premium“ | [3] |
| **OpenMoji** | **CC BY-SA 4.0** | 4.495 Motive, Version 17.0.0, Color und Outline, Zusatzkategorien über Unicode hinaus | **Namensnennung + Share-Alike**: Bearbeitungen müssen wieder unter CC BY-SA stehen | Mittel. Optisch schön (hand-gezeichnet, einheitlich). Share-Alike ist für eigene abgeleitete Piktogramme hinderlich | [4][5] |
| **Twemoji** (Community-Fork jdecked) | Grafiken **CC BY 4.0**, Code MIT | Unicode/Emoji 17.0, aktiv gepflegt | Namensnennung | Mittel. Flach, sehr bekannt (Discord-Look) | [6] |
| **Phosphor Icons** | **MIT** | 1.248 Icons, 6 Stärken (Thin, Light, Regular, Bold, Fill, Duotone) | keine praktische | **Hoch für UI** (Navigation, Aktionen). Der Duotone-Stil passt zu freundlicher Optik | [7] |
| **Tabler Icons** | **MIT** | 6.238 Icons (5.184 Outline, 1.054 Filled), 24-px-Raster, 2-px-Strich | keine praktische | Hoch für UI. Größte freie Auswahl, auch Spezialmotive | [8] |
| **Lucide** | **ISC** (Teile MIT/Feather) | großer Outline-Satz | Copyright-Hinweis | Hoch für UI (Standard in shadcn/ui-Ökosystem) | [9] |
| **Material Symbols** (Google) | **Apache 2.0** | Outlined, Rounded, Sharp. Variable Font (Füllung, Strichstärke, Grade, optische Größe) | Namensnennung erwünscht, aber optional | Hoch, besonders bei Android/Material-Design | [10] |
| **Streamline** (Free) | eigene Lizenz, teils CC BY 4.0 | große Bibliothek inkl. Illustrationen und Emojis | **Pflicht-Link** „Free icons from Streamline“. **Limit pro Projekt**: 50 Icons, 25 Illustrationen, 25 Emojis. Kein Einsatz als in Apps herunterlad- oder anpassbare Bibliothek. Premium entfernt die Namensnennung | Niedrig bis mittel. Eine „Piktogramm-Auswahl“ in der App könnte als Bibliothek gelten, das ist unklar. Nur mit Premium sinnvoll | [11] |
| **Icons8** (Free) | „Universal Multimedia Licensing Agreement“ | sehr viele Stile (u. a. 3D Fluency) | Free: **sichtbarer, klickbarer Link** zu Icons8 überall dort, wo genutzt. Kein Weiterverteilen als Einzeldateien, keine KI-Trainingsnutzung, keine „konkurrierenden Produkte“ | Niedrig. Nur mit bezahltem Plan; die AGB sind restriktiv | [12] |

**Vorratsrelevante Motive in Fluent Emoji (eigene Prüfung per GitHub-API, 06.10.2026):** vorhanden sind *Canned food, Bread, Cooked rice, Rice ball, Spaghetti, Honey pot, Jar, Baby bottle, Potable water, Droplet, Candle, Battery, Flashlight, Radio, Pill, Adhesive bandage, Soap, Roll of paper, Bucket, Fire extinguisher, Package, Dog face*. **Nicht vorhanden** ist (in Unicode generell) ein spezifisches Motiv für *Wasserflasche/-kanister, Mehl, Haferflocken, H-Milch, Hülsenfrüchte-Konserve, Campingkocher/Gaskartusche, Powerbank, Kurbelradio, Dokumentenmappe, Bargeld-Reserve*. Diese müssten **selbst gestaltet** werden, im gleichen Stil oder als Kombination aus Emoji und Badge.

### 2. BBK-Piktogramme und amtliches Bildmaterial

| Punkt | Befund | Quelle |
|---|---|---|
| Urheberrecht BBK-Website | „Copyright für Texte und Bilder liegt, soweit nicht anders vermerkt“ beim BBK. Vervielfältigung oder Verbreitung **nur mit vorheriger Zustimmung** | [13] |
| Ratgeber 2025/2026 | Illustrationen von **GOLDEN COSMOS** (Drittrechte). Ratgeber laut BBK „visuell zugänglicher“ gestaltet und barrierearm, Leichte-Sprache-Ausgabe vom 02.06.2026 | [14] |
| Medienpaket/Multiplikatoren-Kit | Nutzung ohne Vorlage erlaubt, wenn **unverändert** und mit Quellenangabe; kommerzielle App-Nutzung nicht ausdrücklich geregelt (Details siehe Report 07) | [15][16] |
| Fazit | BBK-Grafiken **nicht** als UI-Piktogramme verwenden oder umgestalten. Höchstens unverändert in einem „Info / Offizielle Materialien“-Bereich und erst nach Rückfrage beim BBK. § 5 UrhG (amtliche Werke) ist für Broschüren **nicht verlässlich** anwendbar (nicht verifiziert) | [13][16] |

Die Seiten des österreichischen Zivilschutzverbands und von BWL/BABS (Schweiz) wurden hier **nicht** auf Bildrechte geprüft. Es gilt dieselbe Vorsicht.

### 3. KI-generierte Produkt- und Illustrationsbilder

| Aspekt | Befund | Quelle |
|---|---|---|
| Urheberschutz | Das US Copyright Office hat am 29.01.2025 Teil 2 seines KI-Reports zur Schutzfähigkeit von KI-Outputs veröffentlicht. Rein KI-generiertes Material ist danach grundsätzlich nicht schutzfähig, menschliche schöpferische Beiträge schon. **In Deutschland** gilt nach h. M. Ähnliches (§ 2 Abs. 2 UrhG, persönliche geistige Schöpfung); eine Quelle dazu wurde hier **nicht** geprüft. Folge: Wettbewerber könnten rein KI-generierte Bilder kopieren | [17] |
| Kennzeichnung (EU AI Act Art. 50) | Anbieter generativer KI müssen Outputs maschinenlesbar markieren (Abs. 2). Betreiber müssen **Deepfakes** offenlegen (Abs. 4). Gilt laut Quelle ab **02.08.2026**. Für stilisierte Lebensmittel-Illustrationen besteht wohl **keine** Deepfake-Offenlegungspflicht. Ob der „Digital Omnibus“ Fristen verschoben hat, ist **nicht verifiziert** | [18] |
| Produktfotos | KI-Bilder echter Markenprodukte (Logos, Verpackungen) bergen **Marken- und Irreführungsrisiko**. Produktbilder besser aus Open Food Facts (CC BY-SA, siehe Report 14) oder vom Nutzer-Foto | eigene Einschätzung, [Report 14] |
| Praktikabel | KI als **Werkzeug für Konzept-Skizzen** nutzen und dann von Mensch/Illustrator:in im einheitlichen Stil finalisieren (bringt Schutzfähigkeit und Konsistenz). Alternativ Fluent-Emoji-3D-Stil als Referenz für eigene Ergänzungsmotive | eigene Empfehlung |

### 4. Design-Inspiration (Pantry/Inventory)

- **Dribbble und Mobbin** konnten per Abruf nicht ausgewertet werden (leere Seite bzw. HTTP 403). Eine manuelle Sichtung im Browser ist **offen**.
- Aus den bisherigen Reports bekannt: **Bring!** nutzt ein **Raster handgezeichneter Icons** statt einer Textliste. Das ist ein bewährtes UX-Muster für schnelles Erfassen ohne Barcode (siehe Report 03). Die DACH-Konkurrenz wirkt „funktional oder schlicht“, nur Vorratsplan hat Illustrationen (Report 01). **Design ist damit ein echter Differenzierungshebel.**
- Empfohlene Suchbegriffe für die manuelle Sichtung: Dribbble „pantry app“, „food inventory“, „expiry tracker“, „emergency kit app“. Mobbin: Flows von *Bring!, Too Good To Go, Yuka, Duolingo (Fortschritt/Streaks), Apple Fitness (Ringe als Fortschritt)*.

### 5. Farbsystem und MHD-Ampel

| Thema | Befund | Quelle |
|---|---|---|
| Farbe nie allein | WCAG 2.2 SC 1.4.1: Farbe darf **nicht das einzige** visuelle Mittel zur Informationsvermittlung sein | [19] |
| Kontraste | SC 1.4.11: grafische Objekte und UI-Komponenten mindestens **3:1**. Für Text gilt SC 1.4.3 (4,5:1, aus WCAG bekannt, hier nicht separat abgerufen) | [20] |
| Farbsehschwäche | Etwa **1 von 12 Männern (8 %)** und 1 von 200 Frauen. Rot-Grün ist am häufigsten, verwechselt werden *alle* Farben mit Rot-/Grünanteil | [21] |
| MHD ≠ Verbrauchsdatum | EU: „use by“ (Verbrauchsdatum) ist ein **Sicherheits**hinweis, „best before“ (MHD) ein **Qualitäts**hinweis. Bis zu **10 % der Lebensmittelabfälle** in der EU hängen mit der Datumskennzeichnung zusammen | [22][23] |

**Vorschlag Ampel (4 Stufen + Form + Text):**

| Stufe | Farbe (Richtwert) | Form/Icon | Text-Beispiel |
|---|---|---|---|
| Gut | Grün/Teal | Kreis mit Haken | „Haltbar bis 03/2028“ |
| Bald verbrauchen | Gelb/Amber | Dreieck oder Uhr | „Noch 45 Tage – einplanen“ |
| MHD erreicht | Orange | Lupe/Auge | „MHD überschritten – prüfen, riechen, schmecken“ |
| Verbrauchsdatum überschritten | Rot | Kreuz | „Nicht mehr essen“ (nur bei Verbrauchsdatum!) |

Statt reinem Rot/Grün eher **Teal/Blau vs. Orange** verwenden (für Rot-Grün-Schwäche besser unterscheidbar). Immer **Text plus Form**, im Dark Mode eigene Tokens.

### 6. Barrierefreiheit (rechtlich)

- Das **BFSG** gilt seit **28.06.2025** u. a. für Online-Handel und bestimmte Apps. **Kleinstunternehmen** (unter 10 Beschäftigte, höchstens 2 Mio. € Umsatz), die **Dienstleistungen** anbieten, sind ausgenommen [24]. Eine reine Vorrats-App ohne E-Commerce fällt vermutlich nicht darunter (**nicht rechtlich geprüft**). Bei Affiliate-/Shop-Funktion neu bewerten.
- Unabhängig davon: Senior:innen sind Zielgruppe, deshalb **große Touch-Ziele, skalierbare Schrift, Screenreader-Labels für jedes Piktogramm, High-Contrast-Modus** (Fluent-Emoji-HC-Variante nutzen). Leichte Sprache als spätere Option, analog zum BBK.

### 7. Tonalität: freundlich statt angstmachend

- **EPPM (Witte 1992):** Furchtappelle wirken nur, wenn die Menschen auch **hohe Selbstwirksamkeit** wahrnehmen. Sonst folgen „Fear Control“, Verdrängung und Reaktanz [25].
- Das BBK selbst betont 2025 einen „praxisorientierten“, zugänglicheren Ratgeber [14].
- Ableitung: Kleine, erreichbare Schritte (3 → 5 → 7 → 10 Tage, siehe Report 07), positive Fortschrittssprache („Ihr seid für 6,5 Tage versorgt 🎉“), keine Katastrophenbilder, keine Militär-/Prepper-Ästhetik (Tarnfarben, Gasmasken), dazu ein Bezug zu Alltagsnutzen (weniger Lebensmittelverschwendung, Stromausfall, Krankheit, Unwetter).

## Bedeutung für Preposaurus

1. **Zwei-Schichten-Bildsprache:** *Inhalts-Piktogramme* (Lebensmittel, Vorsorgeartikel) = **Fluent Emoji** (3D für Kacheln/Onboarding, Flat für Listen, High Contrast für den A11y-Modus). *UI-Icons* (Navigation, Aktionen) = **Phosphor** (Duotone passt zum freundlichen Stil) oder Lucide/Tabler. Beide sind MIT/ISC, es gibt keinen Attribution-Zwang in der UI; ein Lizenz-Screen genügt.
2. **Eigenes Ergänzungsset** (ca. 15–25 Motive) für Lücken: Wasserkanister, Mehl, Haferflocken, H-Milch, Linsen, Campingkocher, Gaskartusche, Powerbank, Kurbelradio, Dokumentenmappe, Bargeld, Babynahrung-Gläschen, Tierfutter. Im Fluent-3D-Stil von Illustrator:in zeichnen lassen (KI als Skizze erlaubt). Damit sind die Rechte klar und es entsteht ein Wiedererkennungswert.
3. **Kategorie-Farben** (Wasser = Blau, Kohlenhydrate = Weizengelb, Protein = Terrakotta, Obst/Gemüse = Grün, Fette = Oliv, Hygiene = Lila, Energie/Licht = Amber, Medizin = Rot/Pink). Diese Farben müssen getrennt von den **Statusfarben** der MHD-Ampel bleiben, sonst entsteht Verwechslungsgefahr. Das ist ein Design-Token-System von Anfang an.
4. **MHD-Ampel mit 4 Stufen und Unterscheidung MHD vs. Verbrauchsdatum.** Das ist fachlich korrekt, reduziert Verschwendung und ist ein Vertrauensmerkmal gegenüber Konkurrenz-Apps (die meist nur „abgelaufen = rot“ zeigen; Annahme, nicht systematisch geprüft).
5. **Fortschrittsvisualisierung** als zentrales „schönes“ Element: z. B. ein **Vorratsregal**, das sich füllt, oder Ringe je Kategorie (Wasser, Essen, Hygiene, Licht/Energie). Dazu Etappen-Badges 3/5/7/10 Tage.
6. **Ton-Leitfaden** (1 Seite) vor dem Design schreiben: Du/Ihr, ermutigend, sachlich, Quellenangabe statt Drama. Keine roten Warnbanner auf dem Home-Screen. „Krise“ nur im Info-Bereich.
7. **Produktfotos:** Nutzerfoto > Open-Food-Facts-Bild (mit Namensnennung) > Kategorie-Piktogramm als Fallback. Keine KI-Fotos realer Marken.
8. **BBK-Materialien** nur verlinken. Für einen „Offizielle Infos“-Bereich beim BBK anfragen, ob Medienpaket-Grafiken unverändert in der App gezeigt werden dürfen.
9. **A11y von Anfang an:** jedes Piktogramm mit Text-Label, Dark Mode, Dynamic Type, Kontrast-Checks (3:1 für Icons, 4,5:1 für Text), Farbenblind-Simulation im Design-Review.

## Offene Fragen

- Genaue Motivzahl in Fluent Emoji und ob es eine offizielle 3D-SVG- bzw. Hi-Res-Version gibt (im Repo nur PNG gesehen; Auflösung nicht geprüft).
- Gilt die Streamline-Free-Regel „keine In-App-Bibliotheken“ für eine Piktogramm-Auswahl beim Erfassen? Vermutlich ja, deshalb meiden oder Premium-Lizenz prüfen.
- Darf Preposaurus das BBK-Medienpaket in einer (ggf. kommerziellen) App zeigen? Das erfordert eine Anfrage beim BBK.
- Bildrechte bei Zivilschutzverband AT und BWL/BABS CH sind nicht geprüft.
- Stand des EU AI Act Art. 50 nach „Digital Omnibus“ (Fristverschiebung?) ist nicht verifiziert.
- Design-Inspiration (Dribbble, Mobbin) muss manuell gesichtet werden, weil der Abruf blockiert war.
- Soll ein Illustrator oder eine Illustratorin beauftragt werden? Wie hoch ist das Budget für etwa 20 Zusatzmotive und 3–5 Onboarding-Illustrationen?
- Fällt Preposaurus bei geplanter Monetarisierung (Shop/Affiliate) unter das BFSG?

## Quellen

Alle abgerufen am 2026-10-06.

1. Microsoft: fluentui-emoji (Repository). https://github.com/microsoft/fluentui-emoji
2. Microsoft: fluentui-emoji LICENSE (MIT) und Asset-Ordner (z. B. „Canned food“) per GitHub-API. https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/LICENSE, https://api.github.com/repos/microsoft/fluentui-emoji/contents/assets/Canned%20food
3. Google: noto-emoji (Repository, Lizenzhinweise). https://github.com/googlefonts/noto-emoji
4. OpenMoji: FAQ (Lizenz, Attribution). https://openmoji.org/faq/
5. OpenMoji: Startseite (Umfang, Version 17.0.0). https://openmoji.org/
6. jdecked: twemoji (Community-Fork, Lizenzen). https://github.com/jdecked/twemoji
7. Phosphor Icons (Repository). https://github.com/phosphor-icons/homepage
8. Tabler Icons (Repository). https://github.com/tabler/tabler-icons
9. Lucide: License. https://lucide.dev/license
10. Google: material-design-icons (Repository). https://github.com/google/material-design-icons
11. Streamline Help Center: „Streamline Free License“. https://help.streamlinehq.com/en/articles/5354376-streamline-free-license
12. Icons8: „Universal Multimedia Licensing Agreement“. https://intercom.help/icons8-7fb7577e8170/en/articles/5534926-universal-multimedia-licensing-agreement-for-icons8
13. BBK: Impressum, Abschnitt Urheberrecht. https://www.bbk.bund.de/DE/Service/Impressum/impressum_node.html
14. BBK: Ratgeber & Checkliste (Übersichtsseite). https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/ratgeber-checkliste_node.html
15. BBK: Medienpaket zum Ratgeber. https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/Medienpaket-Ratgeber-BBK/medienpaket-ratgeber-bbk_node.html
16. BBK: Nutzungsbedingungen Multiplikatoren-Kit (via Report 07_bbk_deutschland.md). https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/Medienpaket-Ratgeber-BBK/Nutzungsbedingungen/multiplikatoren-nutzungsbedingungen_node.html
17. U.S. Copyright Office: Copyright and Artificial Intelligence (Part 2: Copyrightability, 29.01.2025). https://www.copyright.gov/ai/
18. EU AI Act, Artikel 50 (Transparenzpflichten). https://artificialintelligenceact.eu/article/50/
19. W3C: Understanding SC 1.4.1 Use of Color (WCAG 2.2). https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
20. W3C: Understanding SC 1.4.11 Non-text Contrast (WCAG 2.2). https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
21. Colour Blind Awareness: Colour Blindness. https://www.colourblindawareness.org/colour-blindness/
22. Europäische Kommission: Date marking and food waste prevention. https://food.ec.europa.eu/food-safety/food-waste/eu-actions-against-food-waste/date-marking-and-food-waste-prevention_en
23. Wikipedia: Best before (EU-VO 1169/2011, Sekundärquelle). https://en.wikipedia.org/wiki/Best_before
24. Bundesfachstelle Barrierefreiheit: Barrierefreiheitsstärkungsgesetz. https://www.bundesfachstelle-barrierefreiheit.de/DE/Fachwissen/Produkte-und-Dienstleistungen/Barrierefreiheitsstaerkungsgesetz/barrierefreiheitsstaerkungsgesetz_node.html
25. Wikipedia: Extended parallel process model (Witte 1992, Sekundärquelle). https://en.wikipedia.org/wiki/Extended_parallel_process_model

Querverweise: research/01_konkurrenz_dach.md, 03_pantry_apps_mhd.md, 05_open_source.md, 07_bbk_deutschland.md, 14_barcode_produktdaten.md.
