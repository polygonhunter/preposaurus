# Status & Entscheidungen (Stand 2026-11-22)

> Zentrale Übersicht für jede neue Session (lokal oder Cloud). Details stehen in den Konzeptdateien 00–04.

## Phase
Konzept ✅ · Recherche ✅ · UI-Prototyp ✅ · Konzept-Dokumente ✅ (`docs/konzept/`) · **Freigabe ✅ (2026-11-22)** · Umsetzungsplan ✅ (`docs/UMSETZUNG.md`) · Programmierung 🔄 (M0 Projektgerüst als PR) · PoC Foto-Erkennung ⬜

Der Maintainer hat am 2026-11-22 auf Rückfrage ausdrücklich bestätigt: Die drei Konzept-Dokumente sind samt aller Vorschläge freigegeben, das Programmieren des MVP ebenso. Gearbeitet wird nach `docs/UMSETZUNG.md` und `docs/CODE_PRINZIPIEN.md`.

## Getroffene Entscheidungen
| Thema | Entscheidung | Details |
|---|---|---|
| Zweck | Eigennutzung + Hobby, Open Source | 00_IDEE |
| Plattform | Web-App/PWA, mobil + PC-Browser, gleiche Daten | 00_IDEE |
| Hosting | **Update 2026-11-22:** Komplett auf dem **NAS** per Docker Compose (App + PostgreSQL + Fotos + Worker), Prinzip wie Paperless-ngx/Audiobookshelf. Zugriff als Web-App über Handy und PC **ausschließlich über Tailscale** (kein öffentliches Internet), HTTPS über Tailscale Serve. NAS-Modell noch offen | 00_IDEE |
| Markt/Quelle | Deutschland zuerst (BBK/BLE), AT/CH/EU vorbereitet | 02 |
| Haushalt | 1 Haushalt pro Installation (DB mit `haushalt_id` vorbereitet), mehrere Nutzer mit Login, Rollen Admin/Mitglied, Login ≠ Haushaltsmitglied | 02, 04 |
| Ernährung | vegetarisch/vegan pro Mitglied + Haushalts-Standard; Makros (Eiweiß, KH, Fett) werden getrackt | 02 |
| Zählweise | „Heute versorgt“ + „Ziel <Datum>: X von Y Tagen“ (nur am Zieldatum Haltbares) | 02 |
| Erfassung | Foto ODER manuell; kein Barcode, keine Marken; Maske: Verpackung → Nährwerte (optional) → MHD-Serie (Anzahl Fotos = Stückzahl); Live-Kamera; Fotos werden gespeichert | 01 |
| KI | **Anthropic API**; Start Sonnet 5.5, im PoC pro Foto-Rolle gegen Haiku 5.5 testen; Modell per Konfiguration; Structured Outputs; Ergebnis immer nur Vorschlag | 01 |
| Ordnung | Warengruppe (Rechnung) · Kategorie (inkl. eigene) · Merkmale (Behälter, Lagerort, Tags); „Dose“ ist Behälter, keine Kategorie | 01 |
| Rotation | Ampel, Status-Filter (Im Vorrat · Bald fällig · Abgelaufen · Nachkaufen · Verbraucht · Entsorgt), „Noch gut“, Historie statt Löschen | 03 |
| Erinnerungen | gebündelt (Wochenübersicht, Dringend, Etappen, Inventur), Web-Push + Check-in-Mails; schlanke „Nachkaufen“-Liste statt Einkaufslisten-App | 03 |
| Einstellungen | Dashboard zeigt an, Einstellungen (Zahnrad) ändern; Bereiche Mein Konto · Haushalt · Nutzerverwaltung · Daten & System | 04 |
| Design | **d6 „Glas-Cockpit“** (Mix aus d2 Kontrollzentrum + d3 Glas & Bento), **hell als Standard**, dunkel optional. **Animation ohne GSAP** (CSS bzw. Motion, MIT), damit jede Lizenzwahl offen bleibt | prototypes/, design.html |
| Code-Qualität | Dateien ≤ 200 Zeilen (max. 300), Schichten, Migrationen, Tests, TS strict, kein toter Code | CLAUDE.md |
| Name | **Preposaurus** (entschieden 2026-11-22). Ersetzt den früheren Arbeitstitel (Markenkollision, Name steht in research/25) | research/25 |
| Ordnung (Update) | **Baum Warengruppe → Kategorie → Lebensmittelart → Produkt → Einheit** (Maintainer-Entscheidung 2026-11-22). Lebensmittelart = neue Stammdaten-Ebene mit Startliste, eigene möglich; KI liefert die Lebensmittelart, Kategorie und Warengruppe werden abgeleitet. Makros/kcal werden über alle Ebenen summiert | #110, 01 |
| Design (Update) | Mockup-Richtung (d6-Stil, Schrift, Aufteilung) **abgelehnt** (2026-11-22). Gut: „Heute versorgt“, „Bald fällig“ (braucht Unterseite mit allen Einträgen). Vorrat-Baum nicht als Dropdowns. Eigene Design-Phase (Daten-/UX-Konzept → 2–3 visuelle Richtungen → Auswahl) vor den UI-Paketen | #111 |
| Nährwerte (Update) | Erster Schritt ist **immer das Foto der Nährwerttabelle**. Option „keine Nährwerttabelle“ → KI schätzt bzw. Richtwert der Lebensmittelart, sichtbar markiert („ca.“) und **gesondert zu bestätigen**. Nährwerte sind nachträglich immer bearbeitbar (Maintainer, 2026-11-22) | UX_KONZEPT F3 |
| Ohne MHD (Update) | Packung wird als **„Datum fehlt“** gespeichert (MHD leer), Datum später manuell nachtragbar. KI-Schätzung ist **wählbar**, dann als „geschätzt“ markiert. Nie automatisch geschätzt (Maintainer, 2026-11-22) | UX_KONZEPT F4 |
| „Noch gut“ (Update) | Zählt standardmäßig **nie** zu „Heute versorgt“; **Schalter in den Einstellungen** (Haushalt) kann das umstellen (Maintainer, 2026-11-22) | UX_KONZEPT F10 |
| KI-Modell (Update) | Standard **Haiku 5.5** für alle Foto-Rollen; bei MHD „unsicher“/unlesbar automatisch zweiter Versuch mit Sonnet 5.5; PoC misst Fehlerquote; je Rolle umstellbar (#108). Vorschlag vom 2026-11-22, Maintainer-Anregung | 01, #108 |
| Mandanten | Eine Installation = ein Haushalt; Trennung über Repositories mit `haushalt_id`-Filter. Zusammengesetzte FKs je Haushalt erst, falls Mehr-Haushalt kommt | M1-Review |
| Anmeldung (Update) | Nur **Benutzername + Passwort**, keine E-Mail-Pflicht. Admin legt Nutzer an, vergibt und setzt Passwörter zurück; Passwort wird beim Anlegen/Zurücksetzen **einmal angezeigt**, gespeichert nur als Hash (nicht einsehbar). Keine privaten Daten: alles gilt für den Haushalt (Maintainer, 2026-11-22) | EINSTELLUNGEN_NUTZER.md |
| Arbeitsweise | PRs werden vom Agenten gemergt (Rebase), sobald die CI grün ist und ein zweiter Agent sie geprüft hat, auch in unbeaufsichtigten Durchläufen (Maintainer-Entscheidung 2026-11-22) | UMSETZUNG.md |
| Lizenz | **AGPL-3.0-or-later** (Entscheidung des Maintainers 2026-11-22). Abhängigkeiten müssen AGPL-kompatibel sein | technik.html, FAKTEN.md |
| Repo | github.com/polygonhunter/preposaurus, **öffentlich** (Open Source, AGPL-3.0-or-later). `prototypes/` ist ausgenommen (eigener Lizenzhinweis wegen GSAP), `research/` und `docs/konzept/` sind eigene Zusammenfassungen mit Rechten der zitierten Quellen bei den Herausgebern | README.md, THIRD_PARTY_NOTICES.md |

## Tech-Stack (abgenommen 2026-11-22)
Next.js 16 Full-Stack · PostgreSQL 18 + Drizzle · Zod 4 · Better Auth · Anthropic SDK hinter Adapter · sharp (Fotos, EXIF entfernen) · web-push + Nodemailer · pg-boss Worker-Container · Tailscale Serve für HTTPS · Serwist (PWA) · Vitest/Playwright/ESLint/Prettier/lefthook · Docker Compose. Details: research/26_tech_stack_mvp.md

## Freigabe der Konzept-Dokumente (2026-11-22)
Vom Maintainer auf Rückfrage bestätigt: **Alle als „Vorschlag“ markierten Punkte und alle Empfehlungen** in `docs/konzept/technik.html`, `features.html` und `design.html` sind angenommen, darunter:
- **Speicherablauf:** Entwurf auf dem NAS (`erfassung_entwurf`), Fotos sofort hochladen, Bestätigen als Transaktion, Aufräumen nach 7 Tagen, Idempotenz-Schlüssel, Löschen erst in der DB, dann die Datei.
- **MVP-Zuschnitt:** Was als „Kandidat für später“ markiert ist, kommt nach „später“ (92 → ca. 73 MVP-Funktionen).
- **Design:** iPhone A mit Vollbild-Kamera aus B; Duo zugeklappt „Kompakt“, aufgeklappt quer E (Übersicht) bzw. D, hochkant J; PC H mit Einstellungen aus I. Umbruchpunkte 640 / 900 / 1280 px, „mittel“ ab 700 px Höhe.
- **Datenmodell:** neue Tabellen `foto`, `erfassung_entwurf`, `ki_aufruf`, `behaelter`, `quelle_bedarf`; `nachkauf_eintrag` statt `einkaufsliste_eintrag`; Lagerort am Produkt; an `einheit` die Felder `mhd_genauigkeit`, `mhd_art`, `mhd_geschaetzt`.
- **Rollen:** Mitglieder dürfen bearbeiten, echt löschen darf nur der Admin.
- **Backups:** täglich pg_dump und Fotos, 7 tägliche und 4 wöchentliche Stände.

**Vorläufige Annahmen**, vom Maintainer bestätigt bis zur endgültigen Entscheidung:
| Frage | Annahme |
|---|---|
| Offline | MVP **zeigt ohne Verbindung nur den letzten Stand**. Offline eintragen kommt später |
| Lizenz | ~~vorläufig~~ entschieden: AGPL-3.0-or-later, siehe oben |
| NAS | Docker-Images für **amd64 und arm64**, Tailscale als **Sidecar-Container** |

## Technische Festlegungen aus M0 (2026-11-22)
Beim Aufsetzen von M0 getroffen, Details in `docs/CODE_PRINZIPIEN.md` §9:
- **Versionen:** Next 16.4.6, React 19.3, TypeScript 6.0.3, ESLint 9.39.5, typescript-eslint 8.73.0, Tailwind 4.3, Vitest 5.1, Zod 4.6, Playwright 1.65, alle exakt gepinnt. CI auf Node 24.
- **Schichtgrenzen** mit `eslint-plugin-boundaries` 7.4.4 (kein `dependency-cruiser` nötig). `worker/` darf vorläufig `application`, `server` und `shared` importieren, weil die Tabelle in CP §2 ihn nicht nennt.
- **Lizenzprüfung** (`npm run licenses`) mit Ausnahmedatei `scripts/license-exceptions.json`: libvips (LGPL-3.0-or-later, über sharp aus next) und zusätzlich `caniuse-lite` (CC-BY-4.0, Browserdaten von next). Beides wartet auf [USER] U2.
- **Prettier** formatiert keine Markdown-Dokumente und nichts unter `docs/` und `research/`, damit von Hand gepflegte Tabellen nicht umbrechen.
- **E2E in der CI** laufen gegen den Standalone-Server (`npm run start:standalone`, wie später im Container), nicht gegen `next start`, das nicht zu `output: 'standalone'` passt.
- **E2E** laufen auf Port 3100 (Prototyp bleibt auf 3000). `playwright.config.ts` darf `process.env` lesen (nur `CI`), weil es Werkzeug und nicht App ist.

## Fachliche Festlegungen aus M2 (2026-11-22, vorläufig)
Beim Umsetzen der Fachlogik getroffen, jeweils als benannte Konstante, damit eine andere Antwort nur eine Stelle ändert:
- **Aus UMSETZUNG §7.3 (U11) übernommen:** „Noch gut“ zählt nicht zu „versorgt“ (`STILL_GOOD_COUNTS_AS_SUPPLIED`), Kennzahlen auf eine Nachkommastelle abgerundet, Baby zählt nicht im Bedarf und nicht in den Zielmengen (`MEMBER_TYPES_WITHOUT_NEED`), Erfüllungsgrad bezogen auf die Zieldauer (`FULFILLMENT_BASIS`), keine eigene Ampelstufe für das Verbrauchsdatum (nur ROT-06), Wasser als eigene Warengruppe.
- **Neu, nicht im Konzept beziffert:** „Weit weg vom üblichen Wert der Kategorie“ heißt: MHD mehr als doppelt so weit in der Zukunft wie die übliche Haltbarkeit (`FAR_FROM_TYPICAL_FACTOR = 2`). Kürzere Restlaufzeiten werden nicht markiert.
- **MHD-Parsing:** Zweistellige Jahre bei Tagesdaten (`30.09.27`) gelten als 20JJ. Nur Jahre 2000 bis 2099. `09/27` ist mehrdeutig und wird abgelehnt, `30.09` ohne Jahr ebenso. Eine Uhrzeit hinter dem Datum wird ignoriert.
- **Mengen:** `1.000 g` ist deutsch 1000 g, `1.5 l` wird als 1,5 l gelesen. Einheiten g, kg, ml, cl, l und Stück.
- **Geschätztes MHD** („Ohne Datum“) = heute + übliche Haltbarkeit der Kategorie, Genauigkeit Tag, immer mit Kennzeichen. Ohne üblichen Wert gibt es keine Schätzung.
- **Ernährungsform:** Die Verschiebung zwischen Warengruppen ist mengengleich je Einheit (g bzw. ml). Verteilungsdaten werden vor dem Rechnen geprüft: unbekannte Gruppe, Anteile ≠ 1 oder ein Wechsel zwischen g und ml ergeben einen Fehlerwert. Ob dabei auch die kcal-Summe gleich bleibt, hängt an den geprüften Ersatzregeln (U3).
- **FIFO und knappste Warengruppe:** Bei Gleichstand gewinnt die zuerst genannte Einheit bzw. Gruppe.

## Offene Fragen an den Maintainer (endgültige Entscheidung steht noch aus)
1. **Offline**: nur anzeigen oder auch eintragen (mit späterem Abgleich)?
2. ~~**Lizenz**~~ entschieden 2026-11-22: AGPL-3.0-or-later (siehe oben). Der Prototyp mit GSAP ist ausgenommen, siehe `prototypes/README.md`
3. **NAS**: Welches Modell bzw. Hersteller (Synology, QNAP, Unraid; x86 oder ARM)?

## Nächste Schritte
1. Pakete aus `docs/UMSETZUNG.md` als GitHub-Issues abarbeiten, mit Tests (M0 liegt als PR vor, dann M1 und M2)
2. PoC Foto-Erkennung: ca. 15 Verpackungs-, 10 Nährwert-, 30 MHD-Fotos vom Maintainer; Sonnet 5.5 vs. Haiku 5.5 messen (Kennzahl Nr. 1: erfundene MHDs)
3. Offizielle Werte (BBK/BLE, DGE) an Primärquellen prüfen, bevor sie als Seed-Daten übernommen werden
4. Danach Programmierung
