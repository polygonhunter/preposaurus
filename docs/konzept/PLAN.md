# Arbeitsplan: drei Konzept-Seiten (Stand 2026-11-22)

Ziel: drei HTML-Dokumente in `docs/konzept/`, die der Maintainer liest und freigibt.
Es wird **kein App-Code** geschrieben. Die Seiten beschreiben, sie setzen nichts um.

| Datei | `<title>` | Zweck |
|---|---|---|
| `technik.html` | Preposaurus Technik | Architektur, Abläufe, Daten, Betrieb, Lizenz |
| `design.html` | Preposaurus Design | Layout-Varianten für iPhone, iPhone Duo, PC |
| `features.html` | Preposaurus Funktionen | Funktionskatalog mit MVP/später, Rollen, Akzeptanzkriterien |

Formatregeln stehen in `SEITEN_REGELN.md` und gelten unverändert. Dieser Plan ergänzt sie nur.

---

## 1. Grundregeln für alle Autoren

### 1.1 Rangfolge der Quellen
Bei Widersprüchen gilt die höhere Zeile.

1. `05_STATUS_ENTSCHEIDUNGEN.md` (Stand 2026-11-22)
2. Abschnitte „Entscheidung(en)“ in `01`–`04`, das jüngere Datum gewinnt
3. übriger Text in `01`–`04`
4. `research/26_tech_stack_mvp.md` (Stack; **Hosting-Teile sind für den Mac geschrieben und überholt**)
5. `research/00_SYNTHESE.md` und Einzelreports (nur Hintergrund, vieles überholt: Expo, Barcode, Supabase)
6. `prototypes/` (zeigt Aussehen und Rechenidee, Zahlen sind Platzhalter)
7. `00_IDEE.md` Abschnitte 1–4 (historisch)

### 1.2 Nichts erfinden
- Jede Aussage braucht eine Fundstelle in den Konzeptdateien oder in `FAKTEN.md` (siehe AP0).
- Was die Konzeptdateien nicht regeln, darf vorgeschlagen werden, aber nur sichtbar markiert: Etikett **„Vorschlag“** am Absatz und ein Eintrag in der Checkliste „Offene Punkte / zur Freigabe“ am Seitenende.
- Keine Mengenwerte der Empfehlungen als feste Tatsache (BLE-Kilogramm, DGE-Werte). Sie sind laut `05` noch an Primärquellen zu prüfen. Beispiele immer mit „Beispiel“ kennzeichnen.
- Versionsnummern aus `research/26` nur mit „Stand 08.10.2026“ nennen, sonst nur Produktnamen.
- Preise und Modellnamen der KI nur aus `FAKTEN.md`.

### 1.3 Gemeinsamer Wortschatz (Kanon)
Diese Begriffe werden in allen drei Dokumenten gleich benutzt.

| Begriff | Bedeutung | Nicht verwenden |
|---|---|---|
| Produkt | Stammdaten (Bezeichnung, Kategorie, Behälter, Inhalt, Nährwerte, Fotos) | Artikel |
| Einheit | eine Packung mit eigenem MHD und Status | Charge, Stück als Fachbegriff |
| Warengruppe | Rechenebene aus der Quelle (BBK/BLE) | – |
| Kategorie | Anzeige-Ebene, System oder eigene, gehört zu einer Warengruppe | – |
| Merkmale | Behälter, Lagerort, Schlagwörter | „Dose“ als Kategorie |
| Status der Einheit | `vorrat` · `verbraucht` · `entsorgt` | weggeworfen |
| berechnete Zustände | gut · bald fällig · abgelaufen (aus MHD, nie gespeichert) | – |
| Nachkaufen | die schlanke Liste | Einkaufsliste, Einkauf |
| Wochenübersicht | wöchentliche Sammel-Benachrichtigung | Wochen-Digest |
| Check-in-Mail | regelmäßige Mail (wöchentlich/monatlich/aus) | – |
| Nutzer | Login-Konto mit Rolle Admin oder Mitglied | User |
| Haushaltsmitglied | Person im Haushalt, kann ohne Login sein | – |
| Tabs | Übersicht · Vorrat · Neu · Statistik · Nachkaufen, Einstellungen über das Zahnrad | Tab „Einkauf“ |
| Kennzahlen | „Heute versorgt: X Tage“ und „Ziel <Datum>: X von Y Tagen“ | – |

### 1.4 Funktions-IDs
`features.html` vergibt IDs nach dem Muster `BEREICH-NN`. Die Bereichskürzel sind fest, damit Technik und Design darauf verweisen können:
`ERS` Einrichtung & Anmeldung · `HH` Haushalt · `ZIEL` Ziel & Empfehlung · `UEB` Übersicht · `ERF` Erfassen · `VOR` Vorrat · `ROT` Rotation · `NK` Nachkaufen · `ERI` Erinnerungen · `STA` Statistik · `EIN` Einstellungen · `SYS` Daten & System · `PWA` Installation & Offline.
Technik und Design verweisen nur auf das **Bereichskürzel** (z. B. „Bereich ERF“), nicht auf Einzelnummern. So können alle Autoren gleichzeitig arbeiten.

### 1.5 Kanon der Tabellen (für ER-Grafik und Katalog)
Aus den DB-Skizzen in `01`–`04`. Mit * markierte Tabellen stehen in keiner Skizze und sind als „Vorschlag“ zu kennzeichnen.

- Haushalt: `haushalt`, `haushalt_einstellung`, `mitglied`, `mitglied_allergie`
- Konto: `nutzer`, `nutzer_einstellung`, Sitzungen und Passkeys (Tabellen von Better Auth), `benachrichtigung_einstellung`, `push_abo`
- Empfehlung: `quelle`, `quelle_version`, `quelle_bedarf` (Bedarf je Personengruppe, freigegeben 2026-11-22), `quelle_wert`, `warengruppe`, `ziel`, `ziel_etappe`
- Vorrat: `kategorie`, `behaelter`, `lagerort`, `tag`, `produkt_tag`, `produkt`, `einheit`
- Nachkaufen: `einkaufsliste_eintrag` (Tabellenname aus `03`; Vorschlag zur Umbenennung in `nachkauf_eintrag` als offenen Punkt führen)
- Vorschläge*: `foto` (Rolle, Pfad, Hash, Bezug zu Produkt/Einheit), `erfassung_entwurf` (unbestätigte Erfassung), `ki_aufruf` (Modell, Tokens, Kosten für die Monatsübersicht aus `04`), Job-Tabellen von pg-boss

---

## 2. Gemeinsame Gestaltungs-Tokens

Abgeleitet aus `prototypes/app/d6/theme.css`. Der Prototyp nutzt `light-dark()`. Die Seiten müssen laut `SEITEN_REGELN.md` das Muster mit Media-Query und `data-theme` nutzen, deshalb werden die Werte ausgeschrieben. Der `<style>`-Kopf (Tokens + Grundbausteine) ist in allen drei Dateien **zeichengleich**.

| Token | Hell | Dunkel | Herkunft (d6) |
|---|---|---|---|
| `--bg` | `#f4f3fa` | `#05080c` | `--d6-bg` |
| `--fg` | `#0f172a` | `#e8eef4` | `--d6-text` |
| `--muted` | `#475569` | `#a7b4c1` | `--d6-muted` |
| `--subtle` | `#5b6678` | `#82909d` | `--d6-subtle` |
| `--line` | `rgb(15 23 42 / 0.12)` | `rgb(255 255 255 / 0.12)` | `--d6-line`, etwas kräftiger für Lesbarkeit |
| `--surface` | `rgb(255 255 255 / 0.58)` | `rgb(15 21 28 / 0.64)` | `--d6-glass` |
| `--surface-strong` | `rgb(255 255 255 / 0.85)` | `rgb(26 34 43 / 0.8)` | `--d6-glass-strong` |
| `--surface-border` | `rgb(255 255 255 / 0.85)` | `rgb(255 255 255 / 0.08)` | `--d6-glass-border` |
| `--shadow` | `rgb(70 60 140 / 0.3)` | `rgb(0 0 0 / 0.7)` | `--d6-shadow` |
| `--track` | `rgb(15 23 42 / 0.07)` | `rgb(255 255 255 / 0.07)` | `--d6-track` |
| `--accent` | `#5b5bd6` | `#3ee6ff` | `--d6-accent` |
| `--accent-2` | `#a78bfa` | `#22b8d4` | `--d6-accent-2` |
| `--accent-text` | `#4338ca` | `#6eeaff` | `--d6-accent-text` |
| `--accent-soft` | `rgb(99 102 241 / 0.12)` | `rgb(62 230 255 / 0.12)` | `--d6-accent-soft` |
| `--ink` / `--on-ink` | `#0f172a` / `#ffffff` | `#3ee6ff` / `#03141a` | Primärknopf |
| `--ok` / `--ok-text` | `#10b981` / `#047857` | `#4ade80` / `#86efac` | Ampel grün |
| `--warn` / `--warn-text` | `#f59e0b` / `#854d0e` | `#facc15` / `#fde047` | Ampel gelb (`--d6-soon`) |
| `--urgent` / `--urgent-text` | `#f97316` / `#c2410c` | `#fb923c` / `#fdba74` | Ampel orange |
| `--bad` / `--bad-text` | `#f43f5e` / `#be123c` | `#f87171` / `#fca5a5` | Ampel rot (`--d6-expired`) |
| `--review` | `rgb(253 224 71 / 0.55)` | `rgb(253 224 71 / 0.12)` | „bitte prüfen“ |
| `--water` | `rgb(56 189 248 / 0.38)` | `rgb(34 211 238 / 0.22)` | Wasser-Kachel |
| `--protein` · `--carbs` · `--fat` | `#e11d74` · `#5b5bd6` · `#d97706` | `#f472b6` · `#3ee6ff` · `#fbbf24` | Makros |
| `--blob-1…4` | `#ffd6e0` `#d7d4ff` `#c9f2e3` `#cfe8ff` | `#0b3a48` `#17195a` `#05343a` `#0d2449` | weicher Hintergrund |

Regeln dazu:
- Ampelfarben als Fläche nur für Punkte, Balken und Ränder. Text in Ampelfarbe nutzt immer das `*-text`-Token (sonst zu wenig Kontrast auf hell).
- Ampel nie nur über Farbe: immer Punkt **plus** Wort („bald fällig“).
- Glasfläche: `background: var(--surface)`, `border: 1px solid var(--surface-border)`, `border-radius: 24px`, `backdrop-filter: blur(20px) saturate(1.5)`, Schatten `0 14px 40px -18px var(--shadow)`. Ohne `backdrop-filter` muss die Fläche trotzdem lesbar sein.
- Schriften laut `SEITEN_REGELN.md`: Space Grotesk (Überschriften), Inter (Text), Zahlen mit `tabular-nums`. Hinweis: Der Prototyp nutzt Inter + Geist Mono. In den **Mockups** des Design-Dokuments dürfen Etiketten in `ui-monospace` gesetzt sein, um d6 zu treffen.
- Gemeinsame Bausteine (Klassennamen fest): `.wrap` (äußerer Wrapper mit Safe-Area-Rändern), `.toc`, `.card` (Glasfläche), `.badge`, `.badge-vorschlag`, `.badge-mvp`, `.badge-spaeter`, `.dot-ok|warn|urgent|bad`, `.scroll-x` (für breite Tabellen/Diagramme), `.checklist`, `.note`, `figure` + `figcaption`.
- Mermaid: keine festen Farben über `style`/`classDef`. Wenn Hervorhebung nötig ist, inline-SVG mit Tokens verwenden.

---

## 3. Gliederung `technik.html`

Jeder Abschnitt nennt oben in einem Satz, was er beantwortet. Sprungmarken stehen in Klammern.

| Nr. | Abschnitt (Anker) | Inhaltspunkte | Diagramm |
|---|---|---|---|
| 1 | Überblick (`#ueberblick`) | Was läuft wo, in fünf Sätzen. Prinzip „wie Paperless-ngx/Audiobookshelf“ | – |
| 2 | Architektur (`#architektur`) | iPhone/PC → Tailscale → NAS (App, Worker, PostgreSQL, Foto-Volume, Backup) → ausgehend Anthropic API, Push-Dienste, SMTP. Was das NAS verlässt und was nicht | **inline-SVG**, hochkant, 3 Ebenen (Geräte · Tailnet/NAS · externe Dienste), Pfeile beschriftet |
| 3 | Schichten der App (`#schichten`) | UI → Server Actions/Routen → Use-Cases → reine Fachlogik → Datenzugriff/Adapter. Bezug zu CLAUDE.md | Mermaid `flowchart TD` (5 Kästen) |
| 4 | Wann wird gespeichert (`#speicherpunkte`) | Tabelle: Schritt · Was · Wohin (Gerät, Foto-Volume, DB, Anthropic) · Wann. Fotos, Entwurf, Bestätigung, Abbruch, Aufräumen verwaister Fotos. Entwurf = Vorschlag (siehe Lücke L12) | Tabelle + Mermaid `sequenceDiagram` (Gerät, App, Volume, DB, Anthropic) |
| 5 | Ablauf: per Foto hinzufügen (`#ablauf-foto`) | Verpackung → Nährwerte (optional) → MHD-Serie → KI-Vorschlag je Foto → Korrigieren → Zusammenfassung → Bestätigen → Speichern. Wenn-Dann: nicht lesbar → gelber Chip; Datum in Vergangenheit → „bitte prüfen“; KI aus oder Fehler → manuell weiter; Abkürzungen „Alle gleiches Datum“, „Datum manuell“, „Ohne Datum“ | Mermaid `flowchart TD`, in **zwei** Diagramme geteilt (Schritte 1–2, Schritte 3–4), damit es schmal bleibt |
| 6 | Ablauf: manuell hinzufügen (`#ablauf-manuell`) | Formular, Pflichtfelder, Kategorie-Durchschnitt für kcal („geschätzt“), Validierung, Speichern | Mermaid `flowchart TD` |
| 7 | Ablauf: entnehmen und verbrauchen (`#ablauf-entnehmen`) | „1 entnehmen“ → FIFO-Vorschlag → Auswahl ändern → Status `verbraucht` mit Datum und Nutzer → Frage „Nachkaufen?“ | Mermaid `flowchart TD` |
| 8 | Ablauf: abgelaufen, entsorgen, „Noch gut“ (`#ablauf-abgelaufen`) | Lebenszyklus der Einheit. Unterschied MHD und Verbrauchsdatum. Zählt für „versorgt“ ja/nein (siehe L9) | Mermaid `stateDiagram-v2` (vorrat → verbraucht / entsorgt, „Noch gut“ als Schleife mit `geprueft_am`) |
| 9 | Ablauf: bearbeiten, löschen, Historie (`#ablauf-verwalten`) | Produkt und Einheit bearbeiten, Historie statt Löschen, Verlauf leeren/archivieren (Admin). Echtes Löschen bei Fehlerfassung ist offen (L13) | Mermaid `flowchart TD` |
| 10 | Ablauf: Erinnerungen (`#ablauf-erinnerungen`) | Worker-Jobs: Wochenübersicht, Dringend (max. 1×/Tag), Etappe, Inventur, Check-in-Mail. Wenn Push-Abo ungültig → löschen. Wenn Push aus → Mail. iPhone: nur als Home-Bildschirm-App | Mermaid `sequenceDiagram` (Worker, DB, Push-Dienst, SMTP, Gerät) + Tabelle der Jobs |
| 11 | Ablauf: Nachkaufen (`#ablauf-nachkaufen`) | Quellen der Liste: Ziel-Lücke, Nachkauf nach Entnahme, manuell. Abhaken → direkt in die Erfassung | Mermaid `flowchart TD` |
| 12 | Rechnung „Tage versorgt“ (`#rechnung`) | Engpass aus Energie und Wasser. Zwei Zählweisen (heute / am Zieldatum haltbar). Rechenmodus offiziell/individuell. Ernährungsform verschiebt Warengruppen. Schätzwerte markiert. Makros nur als Hinweis. Ein durchgerechnetes Beispiel, als „Beispiel“ markiert | Mermaid `flowchart TD` (Eingaben → Filter „haltbar am Stichtag“ → Energie-Tage, Wasser-Tage → Minimum) |
| 13 | Schnittstellen intern (`#api-intern`) | Tabelle: Server Actions je Bereich (Name, Zweck, Rolle) und Routen (`/api/auth/*`, `/api/photos`, `/api/recognize`, `/api/push/subscribe`, `/api/health`). Namen sind Vorschläge aus `research/26` | Tabelle in `.scroll-x` |
| 14 | Schnittstelle Anthropic (`#api-ki`) | Drei Aufrufe (Verpackung, Nährwerte, MHD) mit Schema aus `01`, Structured Output, alle Felder nullable, „nie ein Datum erfinden“, Plausibilitätsprüfung danach in der App, Modell je Foto-Rolle, Kostenformel aus `FAKTEN.md` | Mermaid `sequenceDiagram` + drei kurze Schema-Kästen (`<pre>`, umbrechend) |
| 15 | Datenmodell (`#datenmodell`) | Tabellen aus Kanon 1.5, wichtigste Felder, Beziehungen | Mermaid `erDiagram`, in **vier kleine Diagramme** geteilt: Haushalt & Konto · Empfehlung & Ziel · Vorrat · Erinnerungen & Nachkaufen. Jedes in `.scroll-x` |
| 16 | Container (`#docker`) | Dienste `db`, `migrate`, `web`, `worker`, `backup`, dazu Tailscale (Host-Paket oder Sidecar-Container, je nach NAS). Volumes, Ports nur lokal, Start-Reihenfolge | **inline-SVG** (Kästen im NAS-Rahmen, Volumes als Zylinder) + Tabelle |
| 17 | Tailscale und HTTPS (`#tailscale`) | Warum HTTPS nötig ist (Kamera, Push, Service Worker, Passkeys). Tailscale Serve, MagicDNS, kein Funnel. Folgen: App auf jedem Gerät, Gerätename im Zertifikatslog, Passkeys hängen am Hostnamen | kleines Mermaid `flowchart TD` |
| 18 | Sicherheit und Datenschutz (`#sicherheit`) | Login, Rollen, kein offener Port, API-Schlüssel nur in `.env`, EXIF/GPS weg, Bild verkleinert, was an Anthropic geht, Hinweis in der UI, Gesundheitsangaben bleiben auf dem NAS | Tabelle „Daten · Ort · wer sieht sie“ |
| 19 | Backups (`#backups`) | `pg_dump` mit Rotation, Fotos, NAS-Snapshots, Wiederherstellung testen. Mac-spezifisches aus `research/26` (Time Machine) nicht übernehmen | – |
| 20 | Offline (`#offline`) | Zwei Varianten neutral gegenüberstellen: nur lesen / auch eintragen mit Abgleich. Aufwand und Risiko je Variante. Keine Entscheidung vorwegnehmen | Vergleichstabelle |
| 21 | Lizenzen (`#lizenz`) | MIT, GPL-3.0, AGPL-3.0: erlaubt, verlangt, Folge für Eigennutzer, Folge für Fremd-Hosting. Was Paperless-ngx und Audiobookshelf nutzen (aus `FAKTEN.md`). Empfehlung aus `research/26` (AGPL-3.0-or-later) mit Begründung, plus Prüfung der Abhängigkeiten (siehe F9) | Vergleichstabelle |
| 22 | Vorschau Einrichtung (`#einrichtung`) | 8–10 Schritte in Kurzform nach GitHub-Issue #1, mit Hinweis, dass die volle Anleitung später kommt | nummerierte Liste (hier ist Reihenfolge echt) |
| 23 | Offene Punkte / zur Freigabe (`#offen`) | Checkliste: Offline, Lizenz, NAS-Modell, Stack-Abnahme, alle „Vorschlag“-Stellen | Checkliste |

---

## 4. Gliederung `design.html`

Aufbau: erst das Gemeinsame, dann je Gerät die Varianten, am Ende der Vergleich. Mockups sind **HTML/CSS-Zeichnungen** aus einem kleinen Baukasten (leichter als SVG, Text bleibt scharf). Runde Instrumente (Gauge, Ringe) als kleine inline-SVG. Alle Mockups nutzen die Tokens und müssen in hell und dunkel stimmen.

Gezeigte Screens je Variante: **Übersicht, Vorrat, Erfassen mit Kamera, Einstellungen**.
Inhalte der Mockups nur aus Konzept und Prototyp (Kacheln: Tage versorgt, Ziel, Wasser, Foto aufnehmen, Warengruppen, Bald fällig, Nachkaufen, Makros, Haushalt). Beispielzahlen als Beispiel kennzeichnen.

| Nr. | Abschnitt (Anker) | Inhaltspunkte | Darstellung |
|---|---|---|---|
| 1 | Worum es geht (`#einstieg`) | Was gewählt wurde (d6), was hier entschieden werden soll, wie man die Seite liest | – |
| 2 | Bildsprache (`#bildsprache`) | Glasflächen, Bento-Raster, Instrumente, Ampel mit Punkt + Wort, hell als Standard, dunkel optional, ruhige Bewegung, „Animationen reduzieren“ | Farbfelder aus Tokens, Ampel-Legende, 4–5 Bausteine (Kachel, Chip, Knopf, Dock, Gauge) |
| 3 | Geräte und Umbruchpunkte (`#geraete`) | Breiten je Gerät (aus `FAKTEN.md`), vorgeschlagene Umbruchpunkte, was sich je Stufe ändert. Hinweis: Prototyp kennt nur „Handy“ und „ab 768 px“ | **inline-SVG**: Geräte-Silhouetten maßstäblich nebeneinander, in `.scroll-x` |
| 4 | iPhone (`#iphone`) | Drei Varianten, je 4 Screens: **A „Bento-Dock“** (d6 wie im Prototyp: 2 Spalten, schwebendes Dock, Zahnrad im Kopf) · **B „Fokus“** (großes Instrument oben, darunter einspaltige Karten, Dock mit betontem Kamera-Knopf in der Mitte) · **C „Heute zuerst“** (oben, was jetzt zu tun ist: bald fällig, Nachkaufen; Kennzahlen kompakt darunter). Je Variante 2–3 Sätze: Stärke, Schwäche, Einhand-Bedienung | 12 Mockups, je Variante eine waagrecht wischbare Reihe (`.scroll-x`, `scroll-snap`) |
| 5 | iPhone Duo zugeklappt (`#duo-aussen`) | Außenbildschirm: schmal und kurz. Variante der iPhone-Layouts in „kompakt“: weniger Kacheln je Blick, Schnellaktionen (Foto, 1 entnehmen, bald fällig) | 4 Mockups (eine Variante) + Notiz, was gegenüber iPhone wegfällt |
| 6 | iPhone Duo aufgeklappt (`#duo-innen`) | Innenbildschirm: fast quadratisch, Falz in der Mitte. Zwei bis drei Ideen: **D „Zwei Seiten“** (links Liste oder Kamera, rechts Detail oder Zusammenfassung; nichts Wichtiges auf der Falz) · **E „Breites Cockpit“** (4-Spalten-Bento, Navigation als Leiste am Rand) · optional **F „Arbeitsfläche“** (Vorrat links, Erfassen rechts gleichzeitig) | 8–12 Mockups, Falz als gestrichelte Linie |
| 7 | Wechsel beim Auf- und Zuklappen (`#duo-wechsel`) | Gleiche Seite bleibt offen, laufende Erfassung geht nicht verloren, Kamera-Schritt behält die Fotos | Mermaid `stateDiagram-v2` oder kleine SVG-Bildfolge (zu → auf) |
| 8 | PC-Browser (`#pc`) | Drei Varianten: **G „Säule mit Dock“** (wie Prototyp: zentriert, 4 Spalten, Dock unten) · **H „Seitenleiste“** (Navigation links, breites Bento, rechte Spalte „Bald fällig“) · **I „Arbeitsplatz“** (Vorrat als Tabelle, Einstellungen zweispaltig, Erfassen über Datei-Auswahl/Webcam oder manuell – das ist ein Vorschlag, siehe L24) | 12 Mockups im Browser-Rahmen, verkleinert, je Reihe in `.scroll-x` |
| 9 | Erfassen im Detail (`#erfassen`) | Die vier Schritte (Verpackung, Nährwerte, MHD-Serie, Zusammenfassung) als Bildfolge für die empfohlene iPhone-Variante: Sucher, Zähler „Packung 7“, Datums-Chips (grün erkannt, gelb „bitte nochmal“), Umschalter Foto/Manuell | 4–5 Mockups als Folge |
| 10 | Einstellungen im Detail (`#einstellungen`) | Gruppen Mein Konto · Haushalt · Nutzerverwaltung · Daten & System, Sicht für Admin und Mitglied (nur lesen / ausgeblendet) | 2 Mockups (Admin, Mitglied) |
| 11 | Vergleich und Empfehlung (`#vergleich`) | Tabelle Variante × Kriterien (Einhand, Überblick, Erfassungstempo, Aufwand, Nähe zum Prototyp). Empfehlung je Gerät als Vorschlag | Tabelle |
| 12 | Offene Punkte / zur Freigabe (`#offen`) | Checkliste: je Gerät eine Variante wählen, Umbruchpunkte, Schriften, Emoji oder eigene Piktogramme | Checkliste |

Mockup-Baukasten (Klassen fest, damit zwei Autoren zusammenpassen): `.dev` (Geräterahmen) mit `.dev-iphone`, `.dev-duo-aussen`, `.dev-duo-innen`, `.dev-pc`; innen `.m-head`, `.m-grid` (mit `--cols`), `.m-tile`, `.m-tile-wide`, `.m-gauge`, `.m-bar`, `.m-chip`, `.m-row`, `.m-dock`, `.m-rail`, `.m-table`, `.m-cam`, `.m-fold`. Mockup-Breiten sind feste Pixelwerte **innerhalb** von `.scroll-x`; die Seite selbst scrollt nie waagrecht. Jedes Mockup hat eine `figcaption` und ein `aria-label`.

Größenbudget: gesamt unter 600 KB. Keine eingebetteten Bilder.

---

## 5. Gliederung `features.html`

Aufbau je Bereich: ein Satz Zweck, dann eine Karte pro Funktion. Karten statt breiter Tabelle, damit es bei 375 px lesbar bleibt.

Karte: **ID · Name** · Etikett `MVP` oder `später` · Rollen (Admin / Mitglied / beide, bei Einstellungen auch „Mitglied nur lesen“) · 1–2 Sätze · Akzeptanzkriterien (2–4 Punkte, prüfbar, Form „Wenn …, dann …“) · Fundstelle (z. B. „01, Erfassungs-Maske“).

**Wichtig:** Die MVP-Definition ist laut `05` noch offen. Die Zuordnung MVP/später ist deshalb durchgehend ein **Vorschlag** und steht als erster Punkt in der Freigabe-Checkliste. Als „später“ gilt sicher nur, was die Konzeptdateien ausdrücklich so nennen.

| Nr. | Abschnitt (Anker) | Funktionen (Stichworte) |
|---|---|---|
| 1 | So liest man den Katalog (`#lesehilfe`) | Legende Etiketten, Rollen, IDs. Kleine Übersicht: Anzahl Funktionen je Bereich, MVP/später |
| 2 | Rollen (`#rollen`) | Matrix Admin/Mitglied nach `04` und `settings/routes.ts` (alle · Admin, Mitglied liest · nur Admin). Regel „mindestens ein Admin“ |
| 3 | Einrichtung & Anmeldung (`#ers`) | erster Nutzer wird Admin, Login, Einladung oder Startpasswort, Passkey, Sitzungen beenden, Passwort zurücksetzen ohne Mail |
| 4 | Haushalt (`#hh`) | Mitglieder anlegen/bearbeiten/entfernen, Felder aus `02`, Ernährungsform je Mitglied und Haushalts-Standard, Baby-Sonderbedarf, Verknüpfung Nutzer ↔ Mitglied. Später: Haustiere |
| 5 | Ziel & Empfehlung (`#ziel`) | Quelle BBK/BLE mit Stand und Link, Rechenmodus, Zieldauer, Zieldatum, Etappen, Infopunkt „So wird gerechnet“. Später: AT/CH/EU |
| 6 | Übersicht (`#ueb`) | beide Kennzahlen, Engpass, Balken je Warengruppe, Wasser, Bald fällig, Nachkaufen, Makro-Kachel, Haushalt, „Bearbeiten →“ in die Einstellungen, nur Anzeige |
| 7 | Erfassen (`#erf`) | Foto-Schritte Verpackung/Nährwerte/MHD-Serie, Live-Kamera, Chips mit Korrektur, drei Abkürzungen, manuelle Maske, Zusammenfassung, Bestätigen, neue Kategorie in der Maske, Schätzwerte markiert, Hinweis bei Ernährungsform. Später: „gleiches Produkt nochmal“ |
| 8 | Vorrat (`#vor`) | Liste, Status-Filter (6), Kategorie- und Behälterfilter, Einheiten je Produkt gruppiert nach Datum, Produkt bearbeiten, Lagerort, Schlagwörter |
| 9 | Rotation (`#rot`) | Ampel mit einstellbaren Schwellen, „1 entnehmen“ (FIFO), Verbraucht, Entsorgt, „Noch gut“, Historie mit Zeitraumfilter, Hinweis MHD ≠ Wegwerfdatum, Inventur-Modus |
| 10 | Nachkaufen (`#nk`) | automatisch aus Ziel-Lücke und nach Entnahme, manuell ergänzen, gemeinsam für alle, Abhaken → Erfassung. Wochenweise Aufteilung des Einkaufsplans (MVP oder später offen, L18) |
| 11 | Erinnerungen (`#eri`) | Wochenübersicht, Dringend, Etappe, Inventur, Check-in-Mail, Push je Gerät, Einstellungen je Nutzer. Später: ntfy |
| 12 | Statistik (`#sta`) | Erfüllungsgrad in %, „so viele Tage haltet ihr durch“, Check-in-Serie, verbraucht gegen entsorgt |
| 13 | Einstellungen (`#ein`) | Mein Konto (Profil, Benachrichtigungen, Darstellung), Haushalt (Stammdaten, Ampel & Regeln, Foto-Erkennung mit KI an/aus, Modell je Foto-Art, Schlüssel-Status, Kostenübersicht), Nutzerverwaltung |
| 14 | Daten & System (`#sys`) | Export JSON/CSV, Import, Backup-Status, Verlauf leeren/archivieren, Version, Lizenz, Quellenangaben |
| 15 | Installation & Offline (`#pwa`) | „Zum Home-Bildschirm“, Hinweis im Onboarding, Offline-Verhalten (offen, beide Varianten als Kriterien formuliert) |
| 16 | Bewusst nicht dabei (`#nicht`) | kein Barcode, keine Marken, keine allgemeine Einkaufslisten-App, kein öffentliches Hosting, nur ein Haushalt pro Installation |
| 17 | Später (`#spaeter`) | Non-Food, Haustiere, Rezepte, Notfallplan, weitere Quellen, mehrere Haushalte, Warn-Apps (nur was in `00`–`04` steht) |
| 18 | Offene Punkte / zur Freigabe (`#offen`) | Checkliste, zuerst „MVP-Zuschnitt bestätigen“ |

Kein Diagramm nötig. Erlaubt ist eine kleine inline-SVG-Übersicht (Balken MVP/später je Bereich).

---

## 6. Arbeitspakete

Modell für alle Pakete: Opus. Jeder Agent liest zuerst `CLAUDE.md`, `05`, `SEITEN_REGELN.md` und diesen Plan.

### Reihenfolge
```
AP0 Fakten ─┐
            ├─► AP2 Technik ─┐
AP1 Basis ──┼─► AP3 Features ├─► R1a–c Inhalt ─► R2 Querschnitt ─► R3 Format ─► Korrektur ─► Veröffentlichen
            ├─► AP4a Design ─┤
            └─► AP4b Design ─┘ (AP4a führt zusammen)
```
AP0 und AP1 laufen gleichzeitig. AP2, AP3, AP4a, AP4b laufen danach gleichzeitig.

### AP0 · Faktenblatt (1 Agent, mit Websuche)
- Ergebnis: `docs/konzept/FAKTEN.md`. Je Fakt: Aussage, Primärquelle mit Link, Abrufdatum, Status „geprüft“ oder „nicht prüfbar“.
- Umfang: Liste in Abschnitt 7.
- Abnahme: Jeder Punkt aus Abschnitt 7 hat einen Eintrag. Keine Aussage ohne Link. Nicht prüfbare Punkte sind klar benannt.

### AP1 · Gemeinsamer Kopf (1 Agent)
- Ergebnis: `docs/konzept/_basis.html` mit `<meta>`, `<style>` (Tokens aus Abschnitt 2 in allen drei Theme-Blöcken, Grundbausteine, Mockup-Baukasten) und einer kurzen Musterseite mit jedem Baustein.
- Abnahme: Muster bei 375 px ohne waagrechtes Scrollen. Hell und dunkel vollständig. Kein Farbwert außerhalb der Token-Blöcke. Unter 25 KB.

### AP2 · Autor Technik (1 Agent)
- Ergebnis: `technik.html` nach Abschnitt 3. Übernimmt den Kopf aus `_basis.html` unverändert.
- Liest zusätzlich: `01`–`04`, `research/26`, `FAKTEN.md`, `prototypes/lib/` (supply, ampel-rules, unit-history, diet, nutrition), GitHub-Issue #1.

### AP3 · Autor Features (1 Agent)
- Ergebnis: `features.html` nach Abschnitt 5.
- Liest zusätzlich: `00`–`04`, `prototypes/components/d6/` (Screens, `settings/routes.ts`, `data/stock-status.ts`), `prototypes/lib/user-rules.ts`.

### AP4a · Autor Design: Rahmen, iPhone, Erfassen, Einstellungen (1 Agent)
- Ergebnis: `design.html` mit Abschnitten 1–4, 9–12 und Platzhalter-Kommentaren für 5–8. Führt am Ende `_teile/design-b.html` ein.
- Liest zusätzlich: `prototypes/components/d6/` (overview, stock, add, settings, ui), `research/19`, `FAKTEN.md`.

### AP4b · Autor Design: iPhone Duo und PC (1 Agent)
- Ergebnis: `docs/konzept/_teile/design-b.html` mit Abschnitten 5–8, nur Inhalt, keine eigenen Stile außer über den Baukasten.
- Fehlt ein Baustein, meldet AP4b ihn an AP4a, statt eigene Klassen zu erfinden.

Nach dem Zusammenführen werden `_basis.html` und `_teile/` gelöscht.

### Reviewer
| Paket | Prüft | Vorgehen |
|---|---|---|
| R1a/b/c · Inhalt (je Dokument 1 Agent) | Korrektheit gegen Konzeptdateien, nichts erfunden | Jede Sachaussage einer Fundstelle zuordnen. Liste „ohne Beleg“, „widerspricht“, „fehlt gegenüber Plan“ |
| R2 · Querschnitt (1 Agent, liest alle drei) | Widersprüche zwischen den Dokumenten, Kanon | Begriffe, Tabellen, Rollen, Tabs, Kennzahlen, MVP-Zuordnung, offene Punkte abgleichen |
| R3 · Format und mobil (1 Agent, mit Browser) | `SEITEN_REGELN.md`, Lesbarkeit | Datei in ein Testgerüst im Scratchpad setzen, bei 375 px und 400 px laden, hell und dunkel, Diagramme ansehen |

Reviewer ändern nichts, sie liefern Befunde mit Datei, Anker und Vorschlag. Der jeweilige Autor korrigiert, der Reviewer prüft nur die Befunde nach.

### Abnahme-Checkliste (gilt je Dokument)

**Inhalt (R1)**
- [ ] Alle Abschnitte aus der Gliederung dieses Plans sind vorhanden, Anker stimmen.
- [ ] Jede Sachaussage hat eine Fundstelle in `00`–`05`, `research/26` oder `FAKTEN.md`.
- [ ] Bei Widersprüchen wurde die Rangfolge aus 1.1 angewendet (Stichproben: NAS statt Mac, nur Anthropic, kein Barcode, `entsorgt` statt `weggeworfen`, Rollen Admin/Mitglied, Tailscale statt Heimnetz).
- [ ] Alles Nicht-Belegte trägt das Etikett „Vorschlag“ und steht in der Freigabe-Checkliste.
- [ ] Keine Empfehlungsmenge und kein DGE-Wert als Tatsache. Beispiele sind als Beispiel markiert.
- [ ] Kein Datum wird erfunden: In jedem Ablauf mit KI führt „nicht lesbar“ zu `null` und zur manuellen Eingabe.
- [ ] Jede Erfassung ist per Foto **oder** manuell beschrieben.
- [ ] Ton ruhig und sachlich, keine Angstmache, Fachbegriffe beim ersten Auftreten erklärt.
- [ ] Die drei offenen Fragen (Offline, Lizenz, NAS-Modell) sind nirgends als entschieden dargestellt.

**Querschnitt (R2)**
- [ ] Begriffe entsprechen dem Kanon 1.3, kein „Einkaufsliste“, „Digest“, „weggeworfen“, „Artikel“.
- [ ] Tabellennamen in Technik und Features sind gleich (Kanon 1.5).
- [ ] Rollenrechte sind in Features, Technik (Schnittstellen) und Design (Einstellungen-Mockup) gleich.
- [ ] Tabs, Filter und Kachelnamen sind in Design und Features gleich.
- [ ] Jeder Ablauf in Technik hat mindestens eine Funktion im passenden Bereich von Features, und umgekehrt hat jede MVP-Funktion mit Serverwirkung einen Ablauf oder eine Schnittstelle.
- [ ] Ampelschwellen, Standardwerte (Wochenübersicht Sa 10:00, Inventur alle 3 Monate, Ziel 10 Tage) sind überall gleich.
- [ ] Die Listen „Offene Punkte“ widersprechen sich nicht, gleiche Punkte sind gleich formuliert.
- [ ] Der `<style>`-Kopf ist in allen drei Dateien zeichengleich (per `diff` geprüft; Design darf einen zusätzlichen, getrennten Mockup-Block haben).

**Format und mobil (R3)**
- [ ] Kein `<!doctype>`, `<html>`, `<head>`, `<body>`. Oben `<title>` (2–4 Wörter), Viewport-Meta, dann `<style>`.
- [ ] Wrapper mit Safe-Area-Rändern, vertikal nur `padding-block`.
- [ ] Bei 375 px und 400 px gilt `document.documentElement.scrollWidth <= innerWidth`.
- [ ] Jede breite Tabelle, jedes Diagramm und jede Mockup-Reihe steckt in `.scroll-x`.
- [ ] Textspalten höchstens rund 65 Zeichen, Fließtext mindestens 16 px, in Diagrammen und Mockups nichts unter 11 px.
- [ ] Alle Farben über Tokens. Suche nach `#` und `rgb(` findet Treffer nur in den drei Token-Blöcken.
- [ ] Hell und dunkel durchgesehen: Text, Diagramme, Mockups lesbar. Ampelfarbe nie ohne Wort.
- [ ] Mermaid nur über `<pre class="mermaid">`, Richtung `TD`, höchstens etwa 12 Knoten je Diagramm, Beschriftung höchstens 4 Wörter, keine festen Farben. Jedes Diagramm rendert ohne Fehler.
- [ ] Kein externes Skript. Schriften nur Google Fonts mit Fallback. Datei unter 1 MB.
- [ ] Kein `window.print()`, `alert/confirm/prompt`, iframe, Download-Link.
- [ ] Inhaltsverzeichnis mit Sprunglinks, alle Anker existieren, nur Buchstaben/Ziffern/Bindestriche.
- [ ] Kein Emoji als Abschnittsmarker, keine Nummerierung ohne echte Reihenfolge.
- [ ] Seite endet mit „Offene Punkte / zur Freigabe“ als Checkliste.
- [ ] Mockups: `aria-label` und `figcaption` vorhanden, Tippflächen in den Zeichnungen maßstäblich mindestens 44 pt.

---

## 7. Fakten, die vor dem Schreiben zu prüfen sind

Status „vorgeprüft“ heißt: am 2026-11-22 beim Planen einmal nachgesehen, AP0 bestätigt mit Link.

| Nr. | Fakt / Annahme | Stand | Unsicher? |
|---|---|---|---|
| F1 | Lizenz Paperless-ngx: **GPL-3.0** | vorgeprüft über GitHub-API (`license.spdx_id`) | nein. Achtung: nicht AGPL, wie man vermuten könnte |
| F2 | Lizenz Audiobookshelf: **GPL-3.0** | vorgeprüft über GitHub-API | nein |
| F3 | Vergleichsprojekte: Immich AGPL-3.0, Mealie AGPL-3.0, Grocy MIT | vorgeprüft über GitHub-API | nein. Nur nennen, wenn es der Erklärung hilft |
| F4 | Kernaussagen MIT, GPL-3.0, AGPL-3.0 (Netzwerk-Klausel § 13 nur AGPL; „or-later“) | gegen Lizenztexte prüfen | gering |
| F5 | Tailscale Serve auf dem NAS: Geht es mit dem Synology-/QNAP-Paket, oder braucht es einen Tailscale-Container als Sidecar im Compose-Stack? Erlaubte Ports (Community nennt 443, 8443, 10000) | Websuche zeigte nur Forenbeiträge mit Problemen (Portkonflikte mit DSM auf 443, TUN-Einstellungen), keine klare Herstellerseite | **ja, hoch**. Hängt am NAS-Modell. In der Seite beide Wege zeigen und als offen markieren |
| F6 | Tailscale: MagicDNS + HTTPS-Zertifikate müssen im Admin-Bereich aktiviert sein; Gerätename landet im Certificate-Transparency-Log; Funnel bleibt aus | steht so in `research/26` (Quellen 22, 23) | gering, erneut prüfen |
| F7 | Tailscale-Tarif: Wie viele Nutzer und Geräte sind kostenlos? Brauchen Haushaltsmitglieder ein eigenes Konto, oder reicht Geräte-Freigabe? | nicht geprüft | **ja**. Betrifft die Frage, ob die Familie die App ohne Kosten nutzen kann |
| F8 | iPhone Duo: Außen 5,4" mit 1398 × 2034 px (460 ppi), innen 7,6" mit 1878 × 2670 px (430 ppi) | vorgeprüft über Websuche, Treffer waren Apples Spezifikationsseiten (`apple.com/iphone-duo/specs`), Seite selbst nicht geöffnet | Pixelwerte gering. **Hoch unsicher:** Breite in CSS-Pixeln. Bei Faktor 3 wären es etwa 466 × 678 (außen) und 626 × 890 (innen); das ist nur gerechnet. Ebenso offen: Lage der Falz, Verhalten von Safari und Home-Bildschirm-Apps beim Aufklappen, CSS-Abfragen für Falz/Segmente |
| F8b | Folge aus F8: Innen wären rund 626 px Breite **unter** dem einzigen Umbruchpunkt des Prototyps (768 px). Ohne neuen Umbruchpunkt bekäme das aufgeklappte Duo das Handy-Layout | eigene Ableitung | ja, hängt an F8 |
| F9 | Lizenz von GSAP und Verträglichkeit mit AGPL/GPL. GSAP hat eine eigene Lizenz, keine klassische Open-Source-Lizenz | nicht geprüft | **ja, hoch**. Kann die Lizenzwahl oder die Wahl der Animationsbibliothek berühren. Auch prüfen: web-push (MPL-2.0 lt. `research/26`), sharp/libvips, Lucide, Schriften |
| F10 | Anthropic: Modellnamen und API-IDs (Sonnet 5.5, Haiku 5.5), Preise, Structured Outputs (Helfer, Einschränkungen des Schemas), Bild-Token-Formel | Stand `01`/`research/26` vom 08.10.2026 | mittel. Preise ändern sich; mit Datum nennen |
| F11 | Anthropic Datenschutz: kein Training mit API-Daten, Aufbewahrungsdauer, Datenresidenz (laut `01` keine EU-Residenz) | nicht geprüft | mittel |
| F12 | iOS: Web-Push nur für Home-Bildschirm-Apps (ab 16.4), Kamera in der Home-Bildschirm-App, Verhalten wenn Tailscale-VPN aus ist | teils in `research/26` (Quellen 20, 21) | mittel. Kamera in der installierten Web-App auf aktuellem iOS gezielt prüfen |
| F13 | Push bei reinem Tailscale-Betrieb: Der Worker braucht ausgehendes Internet zu den Push-Diensten; die Benachrichtigung kommt an, die App öffnet aber nur mit aktivem VPN | Schluss aus `research/26` | mittel |
| F14 | PostgreSQL 18 im Docker: geänderter Datenpfad im Image gegenüber 17, Unterstützung ARM64, Mindest-Kernel alter NAS-Geräte; Node 24 auf ARM | nicht geprüft | **ja**, wegen unbekanntem NAS. 32-Bit-ARM-Geräte dürften ausscheiden |
| F15 | Mermaid in der Claude-Artifact-Ansicht: Welche Diagrammtypen (`erDiagram`, `stateDiagram-v2`, `sequenceDiagram`) werden gerendert, und folgen sie hell/dunkel? | nicht geprüft | **ja**. AP1 testet das mit der Musterseite, bevor die Autoren viele Diagramme schreiben. Ausweichplan: inline-SVG |
| F16 | BLE/BBK-Mengen und DGE-Werte | laut `05` noch zu prüfen | ja. In den drei Seiten deshalb nicht als Tatsache nennen (kein Auftrag für AP0) |
| F17 | Inhalt GitHub-Issue #1 (Einrichtungsanleitung) | beim Planen gelesen, 11 Punkte | nein |

---

## 8. Widersprüche und Lücken in den Konzeptdateien

### Widersprüche (mit vorgeschlagener Lesart nach Rangfolge 1.1)
| Nr. | Fundstellen | Widerspruch | Lesart für die Seiten |
|---|---|---|---|
| W1 | `00` §5 „nur im Heimnetz, unterwegs bei Bedarf VPN“ ↔ `05` „ausschließlich über Tailscale“ | Zugriffsweg | Tailscale immer. `00` nachziehen |
| W2 | `00` §2 D „Barcode-Scan“ ↔ `01` „kein Barcode, keine Marken“ | Erfassung | kein Barcode |
| W3 | `01` „Anthropic oder OpenAI“, „Key nur auf dem Mac-Server“ ↔ `01` Entscheidung 08.10. und `05` | Anbieter, Ort | nur Anthropic, Schlüssel auf dem NAS, Adapter bleibt austauschbar |
| W4 | `research/26` durchgehend Mac (Titel, Docker Desktop/OrbStack, Time Machine, Tailscale als Mac-App, Backup in den Benutzerordner) ↔ `05` NAS | Hosting, Backup | Stack übernehmen, Betriebsteile neu für NAS beschreiben und als Vorschlag markieren |
| W5 | `02` „alle gleichberechtigt“ ↔ `04` Rollen Admin/Mitglied | Rechte | Rollen nach `04` |
| W6 | `03` §6 `weggeworfen` ↔ `03` vom 08.10. `entsorgt` | Statuswert | `entsorgt` |
| W7 | `03` „Einkaufsliste“, Tabelle `einkaufsliste_eintrag`, Prototyp-Tab „Einkauf“ ↔ `03` Entscheidung und `04` „Nachkaufen“ | Name | „Nachkaufen“ |
| W8 | `01` „Modell per Konfiguration (Env)“ ↔ `04` Modell je Foto-Art in den Einstellungen und in `haushalt_einstellung` | Wo wird das Modell gewählt | offen. Vorschlag: Env gibt den Standard vor, Admin kann in der Oberfläche übersteuern |
| W9 | `01`/`05` „Start mit Sonnet 5.5 für alle Rollen“ ↔ `research/26` Tabelle „Haiku 5.5 Standard“ | Startmodell | Sonnet zum Start, Haiku nach PoC |
| W10 | `01` Kategorie `getraenke` = „Getränke & Wasser“ und `non_food` ↔ Prototyp `wasser` als eigene Gruppe, kein `non_food`; `01` nennt die Trennung nur „vorgeschlagene Ergänzung“ | Kategorienliste | Die Rechnung braucht Wasser getrennt. Als offenen Punkt zur Bestätigung führen |
| W11 | `01` „Ohne Datum: Schätzung nach Kategorie“ ↔ Grundregel „Ein Datum wird nie erfunden“ | geschätztes MHD | Die KI erfindet nie. Eine Schätzung gibt es nur auf Wunsch des Nutzers, sichtbar als „geschätzt“. In der DB-Skizze fehlt dafür ein Feld |
| W12 | `03` „Noch gut → bleibt im Vorrat“ und „Abgelaufene zählen nicht zu versorgt“ ↔ Prototyp-Text „zählt vorsichtshalber nicht zu versorgt“ | Zählt „Noch gut“ mit? | nicht entschieden. Offener Punkt |
| W13 | `02` Typen Baby · Kind · Jugendliche:r · Erwachsene:r · Senior:in ↔ Prototyp ohne Jugendliche | Mitgliedstypen | nach `02` |
| W14 | Prototyp `categories.ts` (3,5 / 2,6 / 1,5 / 0,357 kg) ↔ `research/00_SYNTHESE` (diese Werte sind die alte BBK-Liste; aktuelle BLE-Werte weichen ab) | Mengen | keine Mengen als Tatsache nennen |
| W15 | `research/00_SYNTHESE` (native App, Barcode, Ereignislog, Altersgruppe statt Name) ↔ spätere Entscheidungen | vieles | Synthese nur als Hintergrund |
| W16 | `research/18` nennt Offline-Schreiben als Pflicht ↔ `research/26` plant nur Offline-Lesen | Offline | offene Frage 1, beide Varianten zeigen |
| W17 | `01` „+ Neue Kategorie“ direkt in der Erfassungsmaske ↔ `04` Stammdaten nur Admin, Mitglied liest | Darf ein Mitglied Kategorien anlegen? | offen |
| W18 | `SEITEN_REGELN` Schriften Space Grotesk + Inter ↔ Prototyp Inter + Geist Mono | Schrift | Seiten nach `SEITEN_REGELN`. Schrift der App im Design-Dokument als offenen Punkt |
| W19 | `03` Benachrichtigungsarten enthalten „Inventur“ ↔ `04` Liste unter Mein Konto ohne Inventur | Einstellung | Inventur-Erinnerung in beiden Dokumenten nennen, Ort offen |

### Lücken (in den Seiten als „Vorschlag“ oder offener Punkt führen)
| Nr. | Lücke | Betroffen |
|---|---|---|
| L1 | **MVP-Zuschnitt fehlt.** `05` führt die MVP-Definition als offen. Jede Zuordnung MVP/später ist ein Vorschlag | Features |
| L2 | Ersteinrichtung und Onboarding (erster Admin, Haushalt, Ziel, „Zum Home-Bildschirm“) sind nirgends als Ablauf beschrieben, nur in Issue #1 und in der Synthese angedeutet | Technik, Features, Design |
| L3 | Login-Seite und Einladungsablauf ohne Gestaltung und ohne Ablauf | Design, Technik |
| L4 | Tailscale für weitere Haushaltsmitglieder: eigenes Konto, Gerät freigeben, Kosten (F7) | Technik |
| L5 | NAS-Modell unbekannt: Architektur (x86/ARM), Docker-Unterstützung, Tailscale-Weg (F5, F14) | Technik |
| L6 | Backup auf dem NAS: Ziel, Rotation, Snapshots, zweiter Ort außerhalb des NAS | Technik |
| L7 | Updates der App (neues Image, Migrationen, Rückweg) nur als Stichwort in Issue #1 | Technik |
| L8 | DB-Skizzen ohne Tabellen für Fotos, KI-Aufrufe/Kosten und Behälter-Stammdaten; `einheit` ohne Felder für Genauigkeit, Art (MHD/Verbrauchsdatum), „geschätzt“, obwohl das KI-Schema sie liefert | Technik |
| L9 | Zählt eine als „Noch gut“ geprüfte Einheit zu „versorgt“? Wie lange gilt die Prüfung? (siehe W12) | Technik, Features |
| L10 | Lagerort am Produkt oder an der Einheit? `01` nennt ihn als Merkmal, der Prototyp führt ihn am Produkt | Technik |
| L11 | Mengen ohne Packung (lose Ware, angebrochene Packung, Teilentnahme) nicht geregelt | Features |
| L12 | **Entwurf einer Erfassung:** Wann werden Fotos hochgeladen, wo liegt der unbestätigte Stand, was passiert bei Abbruch, wann werden verwaiste Fotos gelöscht? Der Maintainer fragt ausdrücklich danach, die Konzeptdateien sagen nur „gespeichert wird erst nach Bestätigung“ | Technik |
| L13 | Echtes Löschen: Fehlerfassung rückgängig machen, Produkt samt Fotos löschen, wer darf das. Bisher nur „Historie statt Löschen“ und „Verlauf leeren“ (Admin) | Technik, Features |
| L14 | Rechte beim Bearbeiten: Darf ein Mitglied Produkte bearbeiten und Entscheidungen anderer rückgängig machen? `04` nennt nur „erfassen, entnehmen, entsorgen“ | Features |
| L15 | Einwilligung zur KI: `research/26` nennt „Einwilligung pro Nutzer“, `04` kennt nur den Haushaltsschalter „KI an/aus“ | Technik, Features |
| L16 | Verhältnis „E-Mail-Zusammenfassung als Ausweichkanal“ (`03` §3) zu „Check-in-Mail“ (`03` Entscheidungen): dasselbe oder zwei Dinge? | Features, Technik |
| L17 | Inventur-Modus nur in zwei Sätzen beschrieben, ohne Ablauf | Features |
| L18 | Einkaufsplan mit Aufteilung auf Wochen (`02`) gegenüber schlanker Nachkaufen-Liste (`03`): gehört die Wochenplanung dazu? | Features |
| L19 | Makro-Bedarf, Ersatzregeln vegetarisch/vegan, B12-Hinweis: im Prototyp ausdrücklich ungeprüfte Annahmen | Technik (Rechnung) |
| L20 | Baby-Sonderbedarf: „zählt nicht in die normalen Warengruppen“, aber keine Regel, wie er angezeigt und gerechnet wird | Features |
| L21 | Passkeys hängen am Hostnamen. Ändert sich der Tailnet-Name, sind sie ungültig. MVP oder später ist nicht festgelegt | Technik, Features |
| L22 | Import: Format und Verhalten bei vorhandenen Daten offen | Features |
| L23 | Statistik „Check-in-Serie“: Was zählt als Check-in? Die Synthese rät von Serien eher ab | Features |
| L24 | Erfassen am PC: Die Konzeptdateien kennen nur die Live-Kamera. Datei-Auswahl oder Webcam am PC ist nicht beschrieben | Design, Features |
| L25 | Kein Konzept für breite Bildschirme außer „4 Spalten ab 768 px“ im Prototyp, keines für faltbare Geräte | Design |
| L26 | Piktogramme: Der Prototyp nutzt Emoji, `research/19` empfiehlt Fluent Emoji plus eigene Motive. Nicht entschieden | Design |

---

## 9. Nach der Abnahme
1. Die drei Dateien werden dem Maintainer zur Freigabe vorgelegt.
2. Entscheidungen des Maintainers aus den Freigabe-Checklisten in `05_STATUS_ENTSCHEIDUNGEN.md` nachtragen (und W1 in `00_IDEE.md` bereinigen).
3. `FAKTEN.md` bleibt als Beleg im Ordner, Hilfsdateien (`_basis.html`, `_teile/`) werden entfernt.
