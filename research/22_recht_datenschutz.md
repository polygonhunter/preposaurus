# Recht, Datenschutz und Compliance für Preposaurus (DE/EU)

> **Kurzfazit:** Allergien, Medikamente und gesundheitsbedingte Diäten von Haushaltsmitgliedern sind **Gesundheitsdaten** im Sinne von Art. 9 DSGVO. Sobald Preposaurus sie auf eigenen Servern oder über Cloud-KI verarbeitet, braucht es dafür eine **ausdrückliche Einwilligung**. Die „Haushaltsausnahme“ schützt nur den Nutzer selbst, nicht den App-Anbieter. Die Strategie mit dem geringsten Risiko lautet daher: **local-first**, Gesundheitsangaben optional und grob (z. B. „Laktoseintoleranz: ja“ statt Diagnosen), Foto-Upload an KI nur nach separatem Opt-in. Texte, Grafiken und Logos von BBK, BLE und BZfE sind **nicht frei nutzbar**. Zahlen und Fakten mit Quellenangabe übernehmen, eigene Texte und Piktogramme gestalten, **keine Behördenlogos** und keinen Bundesadler verwenden. Mengenempfehlungen brauchen einen klaren Hinweis „keine amtliche Auskunft, ohne Gewähr“. Ein Haftungsausschluss für Personenschäden ist in AGB allerdings unwirksam, und ab dem 9.12.2026 fällt Software unter die neue Produkthaftung. Der AI Act betrifft Preposaurus nur am Rand (Transparenz, KI-Kompetenz); ein Hochrisikosystem ist die App nicht.

*Hinweis: Dieser Report ist eine Recherche und keine Rechtsberatung. Vor dem Launch sollten Anwält:innen für IT- und Datenschutzrecht die Punkte prüfen.*

## Ergebnisse

### 1. DSGVO: Welche Daten sind wie sensibel?

| Datum in Preposaurus | Einordnung | Rechtsgrundlage (Vorschlag) | Quelle |
|---|---|---|---|
| Anzahl, Alter und Rolle der Haushaltsmitglieder (Erwachsene, Kind, Senior:in), ohne Namen | Personenbezogen, sobald das Konto einer Person zugeordnet ist. Normales Datum | Art. 6 Abs. 1 lit. b (Vertrag/Nutzung der App) | [1][2] |
| Namen der Mitglieder, vor allem von Kindern | Personenbezogen. Daten Dritter, die der Kontoinhaber eingibt | Nicht nötig: nur Spitznamen oder Rollen („Kind 1“) | [2][3] |
| **Allergien, Unverträglichkeiten, Medikamente, Schwangerschaft, Babynahrung aus medizinischen Gründen** | **Gesundheitsdaten** (Art. 4 Nr. 15), also besondere Kategorie nach Art. 9 Abs. 1 und grundsätzlich verboten | **Ausdrückliche Einwilligung** nach Art. 9 Abs. 2 lit. a, für festgelegte Zwecke | [1][4] |
| Ernährungsform „vegan/vegetarisch“ | Normalerweise kein Gesundheitsdatum. Nach der Rechtsprechung können aber auch **mittelbar** abgeleitete sensible Informationen (z. B. Religion bei „halal/koscher“, Krankheit bei „glutenfrei“) unter Art. 9 fallen | Vorsichtig behandeln wie Art. 9 oder neutral formulieren | [5][6] |
| Vorratsliste (Produkte, MHD, Menge) | Personenbezogen (Konto), aber unkritisch. Rückschlüsse sind möglich (z. B. bei Medikamentenvorrat) | Art. 6 Abs. 1 lit. b | [1] |
| Lagerort, Adresse, Notfallkontakte, Treffpunkte (spätere Ausbaustufe) | Personenbezogen; Kontakte sind Daten Dritter. Sicherheitsrelevant, weil sie zeigen, **wo Vorräte liegen** | lit. b bzw. f; sparsam erheben | [1] |
| Fotos von Produkten | In der Regel kein Personenbezug. Aber: **EXIF-GPS**, Gesichter oder Hände im Hintergrund, Adressetiketten | lit. b; EXIF auf dem Gerät entfernen | [1][7] |

**Haushaltsausnahme:** Laut Art. 2 Abs. 2 lit. c gilt die DSGVO nicht für Verarbeitungen „zur Ausübung ausschließlich persönlicher oder familiärer Tätigkeiten“ durch natürliche Personen. Erwägungsgrund 18 stellt jedoch klar, dass die Verordnung **für Verantwortliche oder Auftragsverarbeiter gilt, die die Instrumente für solche Tätigkeiten bereitstellen** [3][8]. Der Familienvater, der die Allergie seines Kindes einträgt, ist also nicht DSGVO-pflichtig. Der Anbieter von Preposaurus ist es, sobald die Daten bei ihm landen (Server, Sync, Analytics, KI-Upload).

**Folgerung „local-first“ (Einschätzung, nicht verifiziert):** Bleiben Gesundheitsangaben ausschließlich auf dem Gerät und erhält der Anbieter keinen Zugriff, verarbeitet der Anbieter sie in der Regel gar nicht selbst. Die DSGVO-Last sinkt dann deutlich. Ob eine Ende-zu-Ende-verschlüsselte Synchronisation als „keine Verarbeitung durch den Anbieter“ zählt, ist juristisch umstritten (siehe Offene Fragen). Google Play muss in der Datensicherheits-Angabe Daten, die Ende-zu-Ende-verschlüsselt übertragen werden, ausdrücklich nicht melden [9]. Das ist ein Indiz für diese Sicht, aber keine Rechtsquelle.

**Kinder:** Kinder unter 16 Jahren können in DE nicht selbst wirksam in Dienste der Informationsgesellschaft einwilligen (Art. 8; Öffnungsklausel bis 13 Jahre) [10]. Die Zielgruppe sind Erwachsene als Kontoinhaber. Kinder sind nur „Datenobjekte“, aber Betroffene mit eigenen Rechten. Ihre Daten sollten so sparsam wie möglich erfasst werden: Alter in Jahren statt Geburtsdatum, kein Klarname.

**Datenschutz-Folgenabschätzung (DSFA):** Pflicht bei voraussichtlich hohem Risiko, insbesondere bei „umfangreicher Verarbeitung“ besonderer Kategorien (Art. 35 Abs. 3 lit. b) [11]. Bei einem MVP mit wenigen Nutzer:innen ist sie vermutlich nicht zwingend, wächst aber mit der Skalierung. Ob die **DSK-Muss-Liste** einschlägige Fälle enthält, konnte nicht verifiziert werden: Das PDF [12] war nicht maschinell lesbar. Empfehlung: von Anfang an eine schlanke DSFA anlegen. Das ist ohnehin gute Praxis nach Art. 25 (Privacy by Design).

**Endgeräte-Zugriff (§ 25 TDDDG):** Speichern oder Auslesen von Informationen auf dem Gerät ist einwilligungsfrei, wenn es **unbedingt erforderlich** ist, um den vom Nutzer ausdrücklich gewünschten Dienst zu erbringen. Das gilt z. B. für die lokale Datenbank und Push-Token für MHD-Erinnerungen. Für Analytics, Crash-Reporting mit Drittanbietern und Werbe-IDs braucht es eine Einwilligung [13].

### 2. Foto-Upload an KI-Dienste (Bilderkennung, MHD-OCR)

| Thema | Befund | Quelle |
|---|---|---|
| Rolle des KI-Anbieters | In der Regel **Auftragsverarbeiter**, also AVV/DPA nach Art. 28 nötig (Weisungsbindung, Vertraulichkeit, TOMs, Löschung) | [14] |
| Anthropic API | Commercial Terms: kein Training auf Kundeninhalten; DPA per Verweis Vertragsbestandteil | [15] |
| Google Gemini API | **Unbezahlte** Stufe: Inhalte werden zur Produktverbesserung genutzt, menschliche Prüfung möglich. **Bezahlte** Stufe: keine Nutzung zur Verbesserung. Wer Nutzern in EWR/UK/CH API-Clients bereitstellt, darf **nur Paid Services** verwenden. Nutzung ab 18 Jahren | [16] |
| OpenAI | EU-Datenschutzseite war nicht abrufbar (HTTP 403). **Nicht verifiziert** | – |
| Drittlandtransfer USA | EU-US Data Privacy Framework (Angemessenheitsbeschluss vom 10.07.2023). Das EuG hat die Nichtigkeitsklage Latombe am **03.09.2025** abgewiesen (T-553/23). Ein mögliches Rechtsmittel zum EuGH sowie der aktuelle Stand am 06.10.2026 wurden **nicht verifiziert**. Anbieter muss DPF-zertifiziert sein, sonst SCC | [17] |
| Apple-Vorgabe | 5.1.2(i): Wer personenbezogene Daten an Dritte gibt, „including with third-party AI“, muss das klar offenlegen und **vorher ausdrücklich zustimmen lassen** | [18] |
| Risiko im Foto | Personen, Kinder oder Gesichter im Hintergrund, Adressetiketten, Medikamentenpackungen (Gesundheitsdatum!), EXIF-Standort | [1][4] |

Für ein Produktfoto ohne Personenbezug ist das Datenschutzrisiko gering. Kritisch wird es bei **Medikamentenfotos**: Ein Foto einer Medikamentenschachtel, das einem Haushalt zugeordnet ist, kann ein Gesundheitsdatum sein. Der EuGH hat 2024 (C-21/23, Lindenapotheke) Bestelldaten für apothekenpflichtige Arzneimittel als Gesundheitsdaten eingestuft, auch ohne Gewissheit, für wen das Medikament bestimmt ist [6]. *Das Aktenzeichen und die Kernaussage stammen aus Vorwissen. Der Volltext auf curia/EUR-Lex war beim Abruf nicht lesbar und muss verifiziert werden.*

### 3. Haftung bei Mengenempfehlungen und Disclaimer

| Aspekt | Befund | Quelle |
|---|---|---|
| AGB-Haftungsausschluss | Unwirksam für Schäden an **Leben, Körper, Gesundheit** bei Fahrlässigkeit sowie für sonstige Schäden bei grober Fahrlässigkeit oder Vorsatz (§ 309 Nr. 7 BGB) | [19] |
| Produkthaftung (geltendes Recht) | Ersatzpflicht nach ProdHaftG darf **nicht im Voraus ausgeschlossen** werden (§ 14) | [20] |
| **Neue Produkthaftungsrichtlinie (EU) 2024/2853** | Erfasst ausdrücklich **Software, Apps, KI-Systeme**, auch Fehler durch Updates. Ersatzfähig sind u. a. Tod, Körper- und psychische Verletzung, Sachschäden und **Zerstörung oder Beschädigung von Daten**. Umsetzungsfrist **09.12.2026**; gilt für ab dann in Verkehr gebrachte Produkte | [21] |
| Umsetzung in DE | Regierungsentwurf zum neuen ProdHaftG (Stand 17.12.2025): Software, auch KI, wird „unabhängig von der Art ihrer Bereitstellung“ einbezogen. Ob das Gesetz bis 06.10.2026 verabschiedet wurde, ist **nicht verifiziert** | [22] |
| Open-Source-Ausnahme | Die Richtlinie nimmt nach Vorwissen freie und quelloffene Software aus, die **außerhalb einer Geschäftstätigkeit** bereitgestellt wird (Erwägungsgrund 14). Die abgerufene Kommissionsseite äußert sich dazu nicht, daher **nicht verifiziert** | [21] |
| Medizinprodukt? | Die MDR knüpft an die Zweckbestimmung an (Diagnose, Verhütung, Überwachung, Behandlung …) [23]. Eine Vorratsplanung **ohne medizinische Zweckbestimmung** ist nach Einschätzung kein Medizinprodukt. Keine Aussagen wie „schützt Allergiker“ oder „Medikamentenplan“ machen | [23] |

**Einschätzung zur Haftung:** Das Hauptrisiko ist kein Massenschaden. Realistischer sind drei Szenarien: (a) eine falsche Mengenberechnung (z. B. Wasser für Säuglinge oder Senior:innen zu niedrig), (b) ein falsch erkanntes MHD per OCR, durch das jemand Verdorbenes isst, (c) falsche Allergenangaben aus Open Food Facts. Gegenmittel sind **Transparenz** (Quelle + Datum + Rechenweg sichtbar), **Bestätigungspflicht** bei KI- oder OCR-Werten („Bitte MHD prüfen“), **konservative Rundung** und klare Kennzeichnung „Orientierungswert, keine amtliche Auskunft“. Ein Disclaimer allein schützt nicht vor Personenschäden-Haftung [19][20], senkt aber das Risiko eines Fehlgebrauchs und hilft bei der Beweislage.

### 4. Nutzung amtlicher Inhalte, Logos und Piktogramme

| Quelle / Element | Rechtslage | Quelle |
|---|---|---|
| § 5 Abs. 1 UrhG | Gemeinfrei sind nur **Gesetze, Verordnungen, amtliche Erlasse, Bekanntmachungen, Entscheidungen** und amtliche Leitsätze | [24] |
| § 5 Abs. 2 UrhG | Andere amtliche Werke sind gemeinfrei, wenn sie „im amtlichen Interesse zur allgemeinen Kenntnisnahme veröffentlicht“ wurden, aber mit **Änderungsverbot und Pflicht zur Quellenangabe** (§§ 62, 63) | [24][25] |
| Anwendbarkeit auf BBK-Ratgeber/Checklisten | **Umstritten und nicht verifiziert.** Das BBK beansprucht das Copyright selbst ausdrücklich. Darauf sollte man sich nicht verlassen | [26] |
| BBK-Webseite | Copyright für Texte und Bilder beim BBK; Texte, Grafiken, Tabellen, Bilder dürfen **ohne vorherige Zustimmung nicht vervielfältigt, verbreitet oder ausgestellt** werden | [26] |
| BBK-Ratgeber-PDF | Kommerzielle Nutzung, insbesondere für Werbung, untersagt; Zitate mit Quellenangabe zulässig; Illustrationen von einer Agentur | siehe 07_bbk_deutschland.md |
| ernaehrungsvorsorge.de (BLE/BMLEH) | Copyright für Texte und Bilder beim Ministerium, keine offene Lizenz; Kopfbild ist Adobe-Stock-Material | [27] |
| BZfE-Texte | CC BY-NC-ND 4.0, also **nicht kommerziell** und **ohne Bearbeitung** | siehe 08_bmel_ernaehrungsvorsorge.md |
| BBK-Checkliste auf GovData | **DL-DE BY 2.0**: kommerziell nutzbar und veränderbar mit Namensnennung (Bereitsteller, Lizenz-Link, Datensatz-URI, Hinweis auf Änderungen). CSV-Link laut Report 05 aber **tot (404)**; Stand 2022 | [28], siehe 05_open_source.md |
| Schweiz (admin.ch) | Reproduktion nur mit vorheriger schriftlicher Zustimmung | siehe 09_oesterreich_schweiz.md |
| **Datenbankschutz** (§ 87b UrhG) | Auch ohne Urheberrecht am Text: Entnahme **wesentlicher Teile** einer Datenbank (z. B. vollständige Vorratstabelle mit allen Beispielartikeln) kann das Recht des Datenbankherstellers verletzen; ebenso die wiederholte systematische Entnahme kleiner Teile | [29] |
| Einzelne Zahlen (2 l Wasser/Tag, 10 Tage, 2.200 kcal) | Fakten und Empfehlungswerte sind als solche nicht urheberrechtlich geschützt (allgemeine Rechtslage, nicht für den Einzelfall geprüft) | – |
| **Bundesadler, Bundes- oder Landeswappen** (auch in BMI-/BMLEH-Logos) | Unbefugte Benutzung ist eine **Ordnungswidrigkeit** (§ 124 OWiG), auch bei verwechselbar ähnlichen Zeichen | [30] |
| BBK-Logo / Behördenlogos allgemein | Logos sind Kennzeichen; ihre Verwendung kann eine **amtliche Herkunft oder Kooperation** suggerieren (Irreführung). Zusätzlich verbietet Apple 5.2.1 die Nutzung geschützter Drittmarken ohne Lizenz | [18][26] |
| Apple 5.2.2 | Wer Inhalte eines Drittdienstes anzeigt oder nutzt, muss dazu nach dessen Nutzungsbedingungen **ausdrücklich berechtigt** sein | [18] |

### 5. Open Food Facts: Lizenzpflichten

| Ebene | Lizenz | Pflicht | Quelle |
|---|---|---|---|
| Datenbank als Ganzes | ODbL | Namensnennung; **Share-Alike** für abgeleitete Datenbanken, die öffentlich genutzt werden | [31] |
| Einzelne Inhalte | Database Contents License | – | [31] |
| Produktfotos | CC BY-SA 3.0 | Namensnennung + Weitergabe unter gleichen Bedingungen | [31] |
| Namensnennung | „Open Food Facts“ mit Link auf openfoodfacts.org und Lizenzhinweis | sichtbar in der App (z. B. Detailansicht und Impressum/Lizenzen) | [31] |
| Rechte Dritter | Marken, Verpackungsdesigns und Persönlichkeitsrechte auf Fotos bleiben unberührt; der Nutzer muss selbst prüfen | [31] |
| Gewährleistung | OFF garantiert **keine Richtigkeit oder Vollständigkeit** und haftet nicht für Schäden durch fehlerhafte Daten, z. B. bei Allergenen | [31] |

Ob private Nutzerinventare mit OFF-Daten unter Share-Alike fallen, ist offen. Vermutlich nicht, solange sie nicht als öffentliche Datenbank verteilt werden (siehe 14_barcode_produktdaten.md). Ein eigener **öffentlicher** Produkt- oder Kategorie-Katalog, der OFF-Daten enthält, müsste dagegen unter ODbL stehen.

### 6. App-Store-Richtlinien

| Plattform | Regel | Bedeutung für Preposaurus | Quelle |
|---|---|---|---|
| Apple 5.1.1(i) | Datenschutzerklärung in App Store Connect **und** in der App; Angaben zu Datenarten, Zweck, Dritten, Aufbewahrung, Widerruf/Löschung | Pflicht ab Tag 1 | [18] |
| Apple 5.1.1(v) | „If your app supports account creation, you must also offer account deletion within the app.“ Kein Login-Zwang für Grundfunktionen | Kontolöschung in der App; App ohne Konto nutzbar machen | [18] |
| Apple 5.1.2(i) | Offenlegung und **ausdrückliche Zustimmung** vor der Weitergabe an Drittanbieter-KI | Opt-in-Dialog vor dem ersten KI-Foto | [18] |
| Apple 5.1.3(ii) | Apps dürfen **persönliche Gesundheitsinformationen nicht in iCloud speichern** | Keine Allergien oder Medikamente per CloudKit oder iCloud-Sync! Lokal oder eigener (EU-)Server | [18] |
| Apple 1.4.1 | Medizin-Apps mit möglicherweise ungenauen Daten werden strenger geprüft | Nicht als Gesundheits- oder Medizin-App positionieren | [18] |
| Apple 2.5.14 / 5.1.1(iii) | Klarer Zweck-Text für den Kamerazugriff; Datenminimierung, Picker statt Vollzugriff auf die Fotomediathek | Nur Kamera oder Photo-Picker | [18] |
| Google Play: Kontolöschung | In-App-Weg **und** Weblink zur Löschung von Konto und Daten | Web-Löschformular einplanen | [32] |
| Google Play: Datensicherheit | Pflichtformular zu Erhebung, Weitergabe (inkl. SDKs), Verschlüsselung, Löschung; Entwickler allein verantwortlich | Ehrlich ausfüllen; local-first vereinfacht das | [9] |
| Google Play: Health-Apps-Policy | **Erklärungsformular für Health Apps** im Play Console; Nicht-Medizin-Gesundheits-Apps brauchen einen Hinweis „kein Medizinprodukt“ | Prüfen, ob Allergie-/Medikamentenfunktionen eine Erklärung auslösen | [33] |

### 7. Impressum und Verbraucherrecht

| Thema | Befund | Quelle |
|---|---|---|
| Impressumspflicht (§ 5 DDG) | Für „geschäftsmäßige, in der Regel gegen Entgelt angebotene digitale Dienste“: Name, ladungsfähige Anschrift, E-Mail, ggf. Register-Nr., USt-ID usw., leicht erkennbar und ständig verfügbar | [34] |
| App und Website | Das Impressum muss **in der App** (z. B. unter Einstellungen > Rechtliches) und auf der Website erreichbar sein (Praxis-Empfehlung) | [34] |
| Barrierefreiheit (BFSG) | Gilt für Dienstleistungen im elektronischen Geschäftsverkehr (digitale Dienste mit Blick auf Verbraucherverträge, z. B. In-App-Abo über eigene Website). **Kleinstunternehmen** (unter 10 Beschäftigte und höchstens 2 Mio. EUR Umsatz oder Bilanzsumme) sind bei Dienstleistungen **ausgenommen** | [35][36] |
| Abos / Kündigungsbutton | Bei Abo-Verkauf über die eigene Website kommen weitere Pflichten hinzu (z. B. Kündigungsbutton nach § 312k BGB). **Nicht im Detail recherchiert** | – |

### 8. EU AI Act

| Pflicht | Gilt ab | Relevanz für Preposaurus | Quelle |
|---|---|---|---|
| Art. 4 KI-Kompetenz | 02.02.2025 | Anbieter und Betreiber von KI-Systemen müssen die KI-Kompetenz ihres Personals fördern; für ein Kleinteam reicht eine kurze dokumentierte Schulung | [37] |
| Art. 50 Abs. 1: Hinweis bei Interaktion mit KI | 02.08.2026 | Nur relevant bei einem **Chat- oder Assistenzfeature** („Frag den Vorrats-Assistenten“), sofern die KI-Interaktion nicht offensichtlich ist | [38] |
| Art. 50 Abs. 2: Kennzeichnung synthetischer Inhalte | 02.08.2026 | Relevant, falls die App **KI-generierte Bilder** (Piktogramme, Produktbilder) oder Texte erzeugt und ausliefert. Die Pflicht trifft primär den Anbieter des generierenden Systems | [38] |
| Hochrisiko (Anhang III) | – | Produkterkennung und Vorratsplanung fallen nach Einschätzung **nicht** darunter | [38] |
| Digital Omnibus (Fristverschiebungen) | ? | Ob und wie der „Digital Omnibus“ die Fristen geändert hat, konnte **nicht verifiziert** werden (Seite 404) | – |
| Anthropic AUP | – | Gesundheits-**Beratung** gilt dort als High-Risk-Use-Case (Fachprüfung, KI-Hinweis). Ernährungs- und Wellnesshinweise sind ausgenommen. Keine KI-Ratschläge zu Medikamenten | [39] |

## Bedeutung für Preposaurus

1. **Privacy-Architektur als Feature:** Local-first (Daten auf dem Gerät), Konto optional, Sync später und dann EU-gehostet und möglichst Ende-zu-Ende-verschlüsselt. Marketingbotschaft: „Dein Vorrat gehört dir. Wir sehen nicht, was in deinem Keller steht.“ Das ist gleichzeitig ein **Sicherheitsargument**, denn Vorratsorte sind im Krisenfall sensible Informationen.
2. **Gesundheitsdaten minimieren:** Im MVP nur **Ernährungs-Flags** (laktosefrei, glutenfrei, vegetarisch, Babynahrung) ohne Diagnose oder Freitext, ausschließlich lokal gespeichert. Medikamente nur als **Non-Food-Kategorie „Hausapotheke“** (Packung + MHD), ohne Bezug zu einer Person. Wenn Personenbezug nötig ist: eigener Einwilligungsdialog nach Art. 9 Abs. 2 lit. a, jederzeit widerrufbar, und **kein iCloud** (Apple 5.1.3(ii)).
3. **Haushaltsmitglieder ohne Klarnamen:** Rolle + Alter (oder Altersgruppe) + Emoji-Avatar. Das reicht für die Bedarfsberechnung, und es fallen weniger Daten Dritter an.
4. **KI-Pipeline gestuft:** (a) Barcode + on-device OCR ohne Upload als Standard; (b) Cloud-KI nur nach **separatem Opt-in** mit Klartext, an welchen Anbieter die Daten gehen; (c) nur zahlungspflichtige API-Stufen mit DPA/AVV und ohne Training (Gemini: nur Paid; Anthropic: DPA inklusive); (d) EXIF entfernen, Bild verkleinern bzw. auf das Produkt zuschneiden, keine Speicherung beim Anbieter über den Zweck hinaus; (e) Warnhinweis „Keine Personen oder Medikamente fotografieren“ bzw. Medikamente nur on-device.
5. **„Mensch bestätigt“-Prinzip:** Jedes KI- oder OCR-Ergebnis (Produkt, MHD, Menge) wird als **Vorschlag** angezeigt und muss bestätigt werden. Das reduziert Haftungs- und Qualitätsrisiken.
6. **Quellen-Transparenz statt Logo:** Jede Empfehlung mit Herausgeber, Titel, Stand und Link anzeigen, z. B. „Quelle: BMLEH/BLE, Vorratskalkulator, abgerufen 06.10.2026“. **Keine Behördenlogos**, keinen Bundesadler, keine Formulierungen wie „offizielle BBK-App“. Stattdessen: „basiert auf Empfehlungen von …“, dazu ein Hinweis „Preposaurus ist kein Angebot einer Behörde“.
7. **Eigene Texte und Piktogramme:** Eigene Texte und Piktogramme gestalten bzw. offene Sets nutzen (Fluent Emoji, MIT; siehe Report 05). Behördentexte nicht kopieren, nur Zahlen übernehmen. Eine **Erlaubnis- oder Kooperationsanfrage an BBK und BLE** stellen: Die Antwort klärt die Rechtslage und könnte ein Vertrauenssignal liefern.
8. **Empfehlungs-Datensatz rechtssicher kuratieren:** Pro Wert Quelle, Abrufdatum und Lizenz speichern; nicht die gesamte BLE-Beispielartikel-Tabelle 1:1 übernehmen (§ 87b-Risiko), sondern eigene Struktur und Gruppierung mit Quellenwerten.
9. **Disclaimer-Set:** (a) Onboarding: „Orientierungswerte, keine amtliche oder medizinische Beratung; im Zweifel offizielle Quelle prüfen“; (b) bei Säuglingen, Schwangeren, Kranken: „Bedarf individuell mit Ärzt:in/Hebamme klären“; (c) bei MHD und Allergenen: „Angaben ohne Gewähr, Packung prüfen“; (d) OFF-Hinweis zur Datenqualität. AGB-Haftungsbegrenzung nur im zulässigen Rahmen (§ 309 Nr. 7 BGB).
10. **Pflicht-Checkliste vor dem Launch:** Impressum (App + Web), Datenschutzerklärung (App + Store), Kontolöschung in der App + Weblink, Apple-Datenschutzangaben, Google-Datensicherheitsformular, ggf. Health-Apps-Erklärung, AVV mit Hosting, KI und Mail, Verzeichnis der Verarbeitungstätigkeiten, schlanke DSFA, OFF-Attribution, Lizenzseite (OSS + OFF + Icons), Consent nur für optionale Analytics (§ 25 TDDDG).
11. **Produkthaftung ab 09.12.2026 einplanen:** Der Launch fällt voraussichtlich unter das neue Recht. Daher Änderungen an der Rechenlogik versionieren und dokumentieren, Tests für Mengenberechnungen (z. B. Wasser für Kleinkinder) aufbauen und Sicherheitsupdates bereitstellen. Ab dann gelten auch **Datenverluste** als ersatzfähiger Schaden: Export- und Backup-Funktion früh einbauen.

## Offene Fragen

1. Gilt Ende-zu-Ende-verschlüsselte Synchronisation von Gesundheitsangaben als Verarbeitung durch den Anbieter (Art. 9-Einwilligung nötig)? Juristisch prüfen lassen.
2. Fallen „vegan/vegetarisch/halal/koscher/glutenfrei“ als Ernährungsform unter Art. 9 (mittelbare Offenlegung)? Volltexte EuGH C-184/20 und C-21/23 prüfen; der Abruf ist fehlgeschlagen, die Angaben stammen aus Vorwissen.
3. Ist § 5 Abs. 2 UrhG auf BBK-Checklisten anwendbar? Das BBK beansprucht Copyright. Direkte Anfrage beim BBK (Pressestelle bzw. Ratgeber-Redaktion) und bei der BLE (info@ble.de) stellen.
4. Welche Einträge enthält die DSK-DSFA-Muss-Liste genau, und greift einer davon? Das PDF konnte nicht ausgewertet werden.
5. Wurde das neue ProdHaftG bis 06.10.2026 verabschiedet, und welche Ausnahme gilt für kostenlose bzw. Open-Source-Software genau?
6. Stand des Digital Omnibus zum AI Act (Fristen für Art. 50) und des Rechtsmittels gegen EuG T-553/23 (DPF).
7. Lösen Allergie- oder Medikamentenfelder die Google-Play-Health-Apps-Erklärung bzw. eine strengere Apple-Prüfung aus?
8. ODbL-Share-Alike: Wann wird eine nutzerseitige oder geteilte Vorratsliste (Haushalts-Sync) zur „öffentlich genutzten abgeleiteten Datenbank“?
9. OpenAI-API-Bedingungen (Training, Aufbewahrung, EU-Datenresidenz): Die Seite war nicht abrufbar.
10. Rechtsform und Betreiber (Privatperson vs. UG/GmbH): Das beeinflusst Impressum, Haftung und die BFSG-Kleinstunternehmer-Ausnahme.

## Quellen

Alle Quellen abgerufen am 2026-10-06, sofern nicht anders vermerkt.

1. DSGVO, Art. 4 (Begriffsbestimmungen, Nr. 15 Gesundheitsdaten) – https://dsgvo-gesetz.de/art-4-dsgvo/
2. DSGVO, Art. 6 / allgemeine Grundsätze (Textsammlung) – https://dsgvo-gesetz.de/art-6-dsgvo/ (nicht separat abgerufen)
3. DSGVO, Art. 2 (Haushaltsausnahme Abs. 2 lit. c) – https://dsgvo-gesetz.de/art-2-dsgvo/
4. DSGVO, Art. 9 (besondere Kategorien) – https://dsgvo-gesetz.de/art-9-dsgvo/
5. EuGH, Urt. v. 01.08.2022, C-184/20 (OT), mittelbar sensible Daten – https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:62020CJ0184 (Abruf ohne lesbaren Inhalt; Aussage aus Vorwissen, **zu verifizieren**)
6. EuGH, Urt. v. 04.10.2024, C-21/23 (Lindenapotheke), Arzneimittelbestellungen als Gesundheitsdaten – https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:62023CJ0021 (Abruf ohne lesbaren Inhalt; Aussage aus Vorwissen, **zu verifizieren**)
7. DSGVO, Art. 25 (Datenschutz durch Technikgestaltung) – https://dsgvo-gesetz.de/art-25-dsgvo/ (nicht separat abgerufen)
8. DSGVO, Erwägungsgrund 18 – https://dsgvo-gesetz.de/erwaegungsgruende/nr-18/
9. Google Play Console-Hilfe: Data safety section – https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
10. DSGVO, Art. 8 (Einwilligung eines Kindes) – https://dsgvo-gesetz.de/art-8-dsgvo/
11. DSGVO, Art. 35 (Datenschutz-Folgenabschätzung) – https://dsgvo-gesetz.de/art-35-dsgvo/
12. DSK: Liste der Verarbeitungstätigkeiten, für die eine DSFA durchzuführen ist (Muss-Liste), V1.1 – https://www.datenschutzkonferenz-online.de/media/ah/20181017_ah_DSK_DSFA_Muss-Liste_Version_1.1_Deutsch.pdf (Inhalt nicht auswertbar)
13. § 25 TDDDG – https://www.gesetze-im-internet.de/ttdsg/__25.html
14. DSGVO, Art. 28 (Auftragsverarbeiter) – https://dsgvo-gesetz.de/art-28-dsgvo/
15. Anthropic: Commercial Terms of Service – https://www.anthropic.com/legal/commercial-terms
16. Google: Gemini API Additional Terms of Service – https://ai.google.dev/gemini-api/terms
17. EuG, Pressemitteilung Nr. 106/25 vom 03.09.2025, T-553/23 Latombe/Kommission – https://curia.europa.eu/jcms/upload/docs/application/pdf/2025-09/cp250106en.pdf
18. Apple: App Review Guidelines (1.4.1, 2.5.14, 4.1, 5.1.1, 5.1.2, 5.1.3, 5.2.1, 5.2.2) – https://developer.apple.com/app-store/review/guidelines/
19. § 309 BGB (Klauselverbote, Nr. 7) – https://www.gesetze-im-internet.de/bgb/__309.html
20. § 14 ProdHaftG (Unabdingbarkeit) – https://www.gesetze-im-internet.de/prodhaftg/__14.html
21. EU-Kommission: Liability for defective products (RL (EU) 2024/2853) – https://single-market-economy.ec.europa.eu/single-market/goods/free-movement-sectors/liability-defective-products_en
22. BMJV: Gesetzgebungsverfahren Modernisierung Produkthaftungsrecht – https://www.bmjv.de/SharedDocs/Gesetzgebungsverfahren/DE/2025_Produkthaftung.html
23. Verordnung (EU) 2017/745 (MDR), Art. 2 Nr. 1 – https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32017R0745 (Zusammenfassung des Abruf-Tools generisch, **Wortlaut prüfen**)
24. § 5 UrhG (Amtliche Werke) – https://www.gesetze-im-internet.de/urhg/__5.html
25. § 63 UrhG (Quellenangabe) – https://www.gesetze-im-internet.de/urhg/__63.html
26. BBK: Impressum, Abschnitt Urheberrecht – https://www.bbk.bund.de/DE/Service/Impressum/impressum_node.html
27. ernaehrungsvorsorge.de (BLE): Impressum – https://www.ernaehrungsvorsorge.de/impressum
28. GovData: Datenlizenz Deutschland – Namensnennung – Version 2.0 – https://www.govdata.de/dl-de/by-2-0
29. § 87b UrhG (Rechte des Datenbankherstellers) – https://www.gesetze-im-internet.de/urhg/__87b.html
30. § 124 OWiG (Benutzen von Wappen oder Dienstflaggen) – https://www.gesetze-im-internet.de/owig_1968/__124.html
31. Open Food Facts: Terms of use / Lizenzen – https://world.openfoodfacts.org/terms-of-use
32. Google Play Console-Hilfe: Understanding Google Play's app account deletion requirements – https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
33. Google Play Console-Hilfe: Health apps policy / Health apps declaration – https://support.google.com/googleplay/android-developer/answer/16679511?hl=en
34. § 5 DDG (Allgemeine Informationspflichten) – https://www.gesetze-im-internet.de/ddg/__5.html
35. § 2 BFSG (Begriffsbestimmungen) – https://www.gesetze-im-internet.de/bfsg/__2.html
36. § 3 BFSG (Barrierefreiheitsanforderungen, Abs. 3 Kleinstunternehmen) – https://www.gesetze-im-internet.de/bfsg/__3.html
37. AI Act, Art. 4 (KI-Kompetenz) – https://artificialintelligenceact.eu/article/4/
38. AI Act, Art. 50 (Transparenzpflichten) – https://artificialintelligenceact.eu/article/50/
39. Anthropic: Usage Policy (High-Risk Use Cases) – https://www.anthropic.com/legal/aup

Querverweise auf Schwester-Reports: `07_bbk_deutschland.md` (BBK-Lizenz), `08_bmel_ernaehrungsvorsorge.md` (BLE/BZfE-Lizenz), `05_open_source.md` (GovData DL-DE BY 2.0, Icon-Lizenzen), `09_oesterreich_schweiz.md` (admin.ch), `14_barcode_produktdaten.md` (OFF).
