# Status & Entscheidungen (Stand 2026-11-22)

> Zentrale Übersicht für jede neue Session (lokal oder Cloud). Details stehen in den Konzeptdateien 00–04.

## Phase
Konzept ✅ · Recherche ✅ · UI-Prototyp ✅ · Konzept-Dokumente ✅ (`docs/konzept/`) · **Freigabe ✅ (2026-11-22)** · Umsetzungsplan ✅ (`docs/UMSETZUNG.md`) · Programmierung 🔄 (M0 und M2 gemergt, M1 Datenmodell als PR) · PoC Foto-Erkennung ⬜

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
- **Aus UMSETZUNG §7.3 (U11) übernommen:** „Noch gut“ zählt nicht zu „versorgt“ (seit #117 Haushalts-Einstellung, in der Fachlogik Pflichtparameter `stillGoodCounts` ohne Standardwert, Schalter in der DB standardmäßig aus; gilt nur für heute, nie fürs Zieldatum), Kennzahlen auf eine Nachkommastelle abgerundet, Baby zählt nicht im Bedarf und nicht in den Zielmengen (`MEMBER_TYPES_WITHOUT_NEED`), Erfüllungsgrad bezogen auf die Zieldauer (`FULFILLMENT_BASIS`), keine eigene Ampelstufe für das Verbrauchsdatum (nur ROT-06), Wasser als eigene Warengruppe.
- **Neu, nicht im Konzept beziffert:** „Weit weg vom üblichen Wert der Kategorie“ heißt: MHD mehr als doppelt so weit in der Zukunft wie die übliche Haltbarkeit (`FAR_FROM_TYPICAL_FACTOR = 2`). Kürzere Restlaufzeiten werden nicht markiert.
- **MHD-Parsing:** Zweistellige Jahre bei Tagesdaten (`30.09.27`) gelten als 20JJ. Nur Jahre 2000 bis 2099. `09/27` ist mehrdeutig und wird abgelehnt, `30.09` ohne Jahr ebenso. Eine Uhrzeit hinter dem Datum wird ignoriert.
- **Mengen:** `1.000 g` ist deutsch 1000 g, `1.5 l` wird als 1,5 l gelesen. Einheiten g, kg, ml, cl, l und Stück.
- ~~**Geschätztes MHD** („Ohne Datum“) = heute + übliche Haltbarkeit der Kategorie~~ ersetzt durch #116/#121: Ohne MHD gilt **„Datum fehlt“** (`bestBefore = null`), es gibt keine automatische Schätzung (`estimateBestBeforeOnRequest` entfernt). Ein MHD schätzt nur die KI auf ausdrückliche Wahl (#124), immer mit Kennzeichen. Der Richtwert zur Haltbarkeit ist nur Hinweistext (#110).
- **„Datum fehlt“ in der Fachlogik (#121):** zählt heute mit, am Zieldatum nicht (auch nicht im Warengruppen-Fortschritt, daher erscheint es in der Ziel-Lücke). Ampel: eigener Zustand `date-missing` ohne Farbe, weil sich weder Ablauf noch Entwarnung behaupten lässt. FIFO: zuletzt, weil eine Packung mit bekanntem nahem Datum nicht liegen bleiben soll. „Läuft vor Zieldatum ab“ nennt sie nicht, sie stehen gesondert (`withoutDate`). Filter „Unvollständig“: Packungen ohne Datum und Produkte ohne kcal (auch ohne Richtwert), Produkte ohne eigene Werte (es zählt der Richtwert) und unbestätigte KI-Schätzungen.
- **Nährwert-Herkunft (#121, #115, E-5):** Gespeichert wird nur `StoredNutritionSource` (`label` = `tabelle`, `manual` = `manuell`, `ai-estimate` = `ki_schaetzung`) oder leer. Richtwerte der **Lebensmittelart** werden nie ins Produkt kopiert, sondern beim Lesen je Feld ergänzt (`resolveNutrition`, Herkunft `reference`). `richtwert` ist als Wert von `naehrwerte_quelle` entfallen (#132). „ca.“ und `isKcalEstimated` richten sich nach der Herkunft der kcal (Richtwert oder KI-Schätzung, auch bestätigt). Die Bestätigung zählt nur für den Filter „Unvollständig“ (bis Frage 7 entschieden ist).
- **Summen je Baumknoten (#122):** Jede Einheit trägt ihren Pfad (Warengruppe, Kategorie, Lebensmittelart, Produkt), ein Knoten ist Ebene + Schlüssel, der Baum steht also nicht im Code. Gezählt wird wie bei „versorgt“ (Stichtag, „Noch gut“, „Datum fehlt“). Packungen ohne Datum werden gesondert gezählt, das nächste MHD stammt nur aus Packungen, deren Datum am Stichtag noch hält (also nie von abgelaufenen „Noch gut“-Packungen). Ohne Bedarf (nur Babys) sind die Tage `null`, Menge, kcal und Makros werden trotzdem gerechnet. **„ca.“ ab 10 %** der kcal aus Richtwerten bzw. unbestätigten Schätzungen (`APPROXIMATE_SHARE_THRESHOLD`, Grenze eingeschlossen wie in #115 „ab 10 %“; UX §4 sagt „mehr als 10 %“). Der Anteil steht auch bei „Heute versorgt“ (`estimatedKcalShare`, `isApproximate`) und ersetzt `containsEstimates`; ein geschätztes MHD zählt dafür nicht. Genau 10 % bekommt „ca.“, auch wenn die Division 0,0999… ergibt (Epsilon).
- **Ernährungsform:** Die Verschiebung zwischen Warengruppen ist mengengleich je Einheit (g bzw. ml). Verteilungsdaten werden vor dem Rechnen geprüft: unbekannte Gruppe, Anteile ≠ 1 oder ein Wechsel zwischen g und ml ergeben einen Fehlerwert. Ob dabei auch die kcal-Summe gleich bleibt, hängt an den geprüften Ersatzregeln (U3).
- **FIFO und knappste Warengruppe:** Bei Gleichstand gewinnt die zuerst genannte Einheit bzw. Gruppe.

## Technische Festlegungen aus M1 (2026-11-22)
Beim Datenmodell getroffen, Details in den Kopfkommentaren von `src/server/db/schema/*.ts`:
- **Versionen:** drizzle-orm 0.45.4, drizzle-kit 0.31.11 (stabile Linie, nicht 1.0-rc), PGlite 0.5.17, pg 8.23.1, tsx 4.23.15 für die Skripte `db:migrate`, `db:seed`, `db:seed:demo`.
- **Migrationen** spielt `npm run db:migrate` mit dem Migrator von drizzle-orm ein (derselbe Code wie in den Tests), nicht `drizzle-kit migrate`. So braucht der spätere `migrate`-Container kein drizzle-kit.
- **Basisstand (#120):** Die nie veröffentlichten Migrationen 0000–0017 sind zu einer einzigen `0000_basis.sql` zusammengefaltet, ohne tote Zwischenstände. Eine lokale Dev-DB von vorher (`.data/`) muss einmal gelöscht und neu aufgesetzt werden. Ab jetzt gilt: nur neue Migrationen, und eine neue Pflichtspalte braucht einen Standardwert oder einen Backfill im selben Schritt.
- **Namen:** Tabellen und eigene Spalten deutsch, jeder Spaltenname steht ausdrücklich im Schema, `casing` bleibt aus. Spalten, die nur Better Auth nutzt (`email_verified`, `token`, `expires_at` …), behalten die englischen Namen der Bibliothek, Fremdschlüssel heißen trotzdem `nutzer_id`.
- **Wertelisten** als `text` mit CHECK statt PostgreSQL-Enum, die Listen stehen in `src/shared/config/constants.ts`.
- **System-Stammdaten** (Kategorien, Lebensmittelarten, Behälter) liegen ohne `haushalt_id` und mit festem `schluessel`, eigene Einträge mit `haushalt_id`. Ein CHECK hält beides auseinander. Eigene Kategorien und Arten heißen je Haushalt nur einmal so. Der Seed überschreibt Name, Zuordnung, Sortierung und die Richtwerte (kcal, übliche Haltbarkeit), nie `ausgeblendet`.
- **`haushalt_id`** steht an jeder Tabelle mit direktem Haushaltsbezug. Kindtabellen (`einheit`, `mitglied_allergie`, `sitzung`, `konto`) erreichen den Haushalt über ihre Elterntabelle, damit nichts doppelt gespeichert ist.
- **`nutzer.haushalt_id`** ist vorerst nullable, damit Better Auth einen Nutzer anlegen kann, bevor die Einrichtung ihn zuordnet (M3 prüft das).
- **Konto (EINSTELLUNGEN_NUTZER §6.1):** Anmeldung nur mit Benutzername und Passwort. `benutzername` klein, 3–30 Zeichen (a–z, 0–9, Punkt, Unterstrich), vorne ein Buchstabe oder eine Ziffer (`^[a-z0-9][a-z0-9._]{2,29}$`), eindeutig über `lower()`. `email` bleibt Pflicht, weil Better Auth sie im Kernschema verlangt (`required`, `unique`). Die App erzeugt dafür die technische Adresse `<id>@nutzer.invalid` und zeigt sie nie an. Passwörter liegen nur als scrypt-Hash von Better Auth in `konto.password`. Dazu `passwort_vorlaeufig`, `passwort_geaendert_am`/`_von`, `letzte_anmeldung_am`, `ki_hinweis_bestaetigt_am`. Die Anmeldebremse zählt in `anmelde_sperre` (ohne Fremdschlüssel).
- **Nutzer werden nie hart gelöscht**, nur deaktiviert (`aktiv = false`), damit Historie und Verweise erhalten bleiben (auch CODE_PRINZIPIEN §8).
- **`einheit.mhd`** darf leer sein und heißt dann „Datum fehlt“ (später von Hand nachtragbar). `mhd_genauigkeit` ist ohne Standard und genau dann leer, wenn `mhd` leer ist. `mhd_geschaetzt` markiert eine ausdrücklich gewählte Schätzung und ist nur mit Datum erlaubt. CHECKs: bei `verbraucht`/`entsorgt` immer `entnommen_am`, `entnommen_von` nur dann.
- **Erfassung (#120):** neue Tabelle `erfassung` (`haushalt_id`, `nutzer_id`, `weg` foto/manuell). Ihre `id` ist der Idempotenz-Schlüssel des Speicherns. Jede Einheit verweist mit `einheit.erfassung_id` (Pflicht) darauf, auch beim Nachschub zu einem bestehenden Produkt. `produkt.erfassung_id` entfällt. `einheit.erfassung_id` löscht per CASCADE, weil eine Erfassung nur mit ihrem Haushalt verschwindet und NO ACTION dort vor der tieferen Kaskade Haushalt → Produkt → Einheit prüfen würde.
- **Nährwerte am Produkt:** `naehrwerte_quelle` (`tabelle`, `manuell`, `ki_schaetzung`) und `naehrwerte_bestaetigt_am` statt `naehrwerte_geschaetzt`. CHECK: Die Quelle ist genau dann leer, wenn alle vier Werte (kcal, Eiweiß, KH, Fett) leer sind. **`richtwert` ist keine gespeicherte Quelle** (E-5, Entscheidung zu #132): Richtwerte der Lebensmittelart werden nur beim Lesen ergänzt, nie ins Produkt kopiert. Der Name bleibt `tabelle`, nicht `etikett`.
- **Haushaltseinstellungen:** `noch_gut_zaehlt_mit` (Standard aus), Wochenübersicht (aktiv, Samstag, 10:00), `dringend_aktiv`, `einrichtung_abgeschlossen_am`, `einrichtung_schritt` (smallint ≥ 0, bewusst ohne Obergrenze).
- **Weitere Punkte aus ABGLEICH §4 A (#120):** `haushalt.aktive_quelle_version_id` statt `aktive_quelle_id` (Stand und Link der genutzten Fassung). `lagerort.ausgeblendet`. `lebensmittelart` mit Makro-Richtwerten `eiweiss_100`, `kh_100`, `fett_100`. `quelle_bedarf.personengruppe` mit CHECK auf `MEMBER_TYPES`, Wasser als `wasser_ml_tag` (integer). `foto.nutzer_id` (SET NULL) und CHECK „Einheit nur mit Produkt“. `ki_aufruf.versuch` (1 oder 2) und `sicherheit` (hoch, mittel, niedrig). Entfernt (E-22): `foto.hash`, `foto.groesse_bytes`, `mitglied.piktogramm`, `kategorie.kcal_durchschnitt_100` und `kategorie.uebliche_haltbarkeit_monate`.
- **Löschschutz** für Kategorie, Lebensmittelart und KI-Verbindung als `NO ACTION` statt `RESTRICT`: Beide verhindern das Löschen eines benutzten Eintrags, `NO ACTION` prüft aber erst am Ende der Anweisung. Nur so entfernt das Löschen eines Haushalts alles gemeinsam per `CASCADE`.
- **Lebensmittelart** (Maintainer-Entscheidung 2026-11-22): Baum Warengruppe → Kategorie → Lebensmittelart → Produkt → Einheit. `produkt.kategorie_id` bleibt Pflicht, `produkt.lebensmittelart_id` ist optional. Ein zusammengesetzter Fremdschlüssel `(lebensmittelart_id, kategorie_id)` sichert ohne Trigger, dass die Kategorie des Produkts die der Art ist, und zieht sie per `ON UPDATE CASCADE` mit. Jede Art hat einen `schluessel` (für die KI als Enum, #110): System-Arten einen festen Slug, eigene einen erzeugten mit Präfix `eigen_`, eindeutig je Haushalt. Die Startliste (70 Arten, nach Review überarbeitet) ist vorläufig und wartet auf Prüfung durch den Maintainer, Richtwerte bleiben bis M1-08 leer.
- **KI-Anbindung (#108):** mehrere `ki_verbindung` je Haushalt (Anbieter, Name, Schlüssel nur als Chiffrat + IV + Tag in Base64, `schluessel_hinweis` mit den letzten 4 Zeichen, `schluessel_version`, `basis_url`, Teststatus, `aktiv`) und je Foto-Rolle eine `ki_rollen_zuweisung` (Rollen `verpackung`, `naehrwerte`, `naehrwerte_schaetzen`, `mhd`, `mhd_zweitversuch`, Verbindung aus demselben Haushalt, Modell, `aktiv`). Der Haushaltsschalter bleibt `ki_aktiv`. Empfohlene Modelle stehen einmal in `src/shared/config/ai-roles.ts` (Haiku 5.5, Zweitversuch beim MHD Sonnet 5.5), `env.ts` nutzt sie als Standard. `ki_aufruf` protokolliert Rolle und Verbindung.

## Offene Fragen an den Maintainer (endgültige Entscheidung steht noch aus)
1. **Offline**: nur anzeigen oder auch eintragen (mit späterem Abgleich)?
2. ~~**Lizenz**~~ entschieden 2026-11-22: AGPL-3.0-or-later (siehe oben). Der Prototyp mit GSAP ist ausgenommen, siehe `prototypes/README.md`
3. **NAS**: Welches Modell bzw. Hersteller (Synology, QNAP, Unraid; x86 oder ARM)?

## Nächste Schritte
1. Pakete aus `docs/UMSETZUNG.md` als GitHub-Issues abarbeiten, mit Tests (M0 liegt als PR vor, dann M1 und M2)
2. PoC Foto-Erkennung: ca. 15 Verpackungs-, 10 Nährwert-, 30 MHD-Fotos vom Maintainer; Sonnet 5.5 vs. Haiku 5.5 messen (Kennzahl Nr. 1: erfundene MHDs)
3. Offizielle Werte (BBK/BLE, DGE) an Primärquellen prüfen, bevor sie als Seed-Daten übernommen werden
4. Danach Programmierung
