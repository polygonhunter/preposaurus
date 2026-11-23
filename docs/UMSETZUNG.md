# Preposaurus – Umsetzungsplan MVP

> Stand: 22.11.2026. Grundlage: `05_STATUS_ENTSCHEIDUNGEN.md` (Freigabe vom 22.11.2026), `docs/CODE_PRINZIPIEN.md`, `docs/konzept/` (technik, features, design, PLAN, FAKTEN).
> Dieser Plan beschreibt nur. Jedes Arbeitspaket wird ein GitHub-Issue und später von einem Agenten in einer eigenen PR umgesetzt.
> **[USER]** markiert alles, was eine Entscheidung oder Handlung des Maintainers braucht. Die Sammelliste steht in Abschnitt 7.1.

**Kürzel für Fundstellen:** `F` = `features.html` (Funktions-ID), `T#anker` = `technik.html`, `D „…“` = Abschnitt in `design.html`, `CP §n` = `CODE_PRINZIPIEN.md`, `Proto` = `prototypes/` (Route `/d6`, nur Vorlage für Aussehen und Rechenidee, Zahlen sind Platzhalter).

## 1. Kurzfassung

**MVP-Umfang:** 77 Funktionen. Das sind die 92 MVP-Karten aus `features.html` minus 16 „Kandidaten für später“ (UEB-07, NK-06, ERF-13, ERF-14, HH-05, ZIEL-05, ERI-04, ERI-05, ROT-08, VOR-06, EIN-03, EIN-07, EIN-09, SYS-02, SYS-04, ERS-05) plus PWA-05 in Variante A. Drei Karten kommen nur teilweise: ZIEL-02 (nur „Offiziell“), HH-04 (nur das Feld), EIN-05 (nur die Schwellen).

| Nr. | Meilenstein | Ziel | Fertig, wenn … | Pakete |
|---|---|---|---|---|
| M0 | Projektgerüst | Lauffähige Next.js-App mit allen Qualitätswerkzeugen | `npm run check` und die CI sind grün, ein verbotener Import bricht den Linter. Issue #2 ist zu | 8 |
| M1 | Datenmodell und Seeds | Alle MVP-Tabellen als Migrationen, Stammdaten als Seeds | Migrationen laufen auf leerer DB durch (PGlite und PostgreSQL 18), Seeds sind idempotent | 10 |
| M2 | Fachlogik | Rechner, Ampel, Datum und Menge als reine Funktionen | `domain/` und `shared/lib` haben ≥ 90 % Zweigabdeckung, kein Import von React, Next oder DB | 10 |
| M3 | Anmeldung, Rahmen, Haushalt | Einrichten, anmelden, Haushalt und Ziel pflegen | Ein neuer Haushalt ist per Browser eingerichtet, ein Mitglied eingeladen | 11 |
| M4 | Vorrat und Rotation | Liste, Detail, Entnehmen, Entsorgen, Noch gut, Historie | Alle sechs Status-Filter stimmen, jede Aktion steht mit Datum und Nutzer in der Historie | 8 |
| M5 | Manuelle Erfassung | Produkt ohne Foto anlegen | Ein Produkt mit mehreren MHDs ist per Formular im Vorrat | 4 |
| M6 | Foto-Erfassung | Entwurf, Upload, KI-Adapter, Bestätigen | Der Foto-Ablauf läuft mit Fake-KI durch. Ein nicht lesbares Datum bleibt leer | 12 |
| M7 | Übersicht und Statistik | Kennzahlen und Kacheln | Beide Kennzahlen stimmen mit dem Rechner überein, Statistik zeigt drei Werte | 5 |
| M8 | Nachkaufen | Schlanke gemeinsame Liste | Lücke, Entnahme und Handeintrag landen auf der Liste, Abhaken führt zur Erfassung | 3 |
| M9 | Einstellungen und System | Profil, Stammdaten, Ampel, KI-Schalter, Export | Admin ändert, Mitglied liest, Export enthält alle Haushaltsdaten | 6 |
| M10 | PWA und Offline-Anzeige | Installierbar, letzter Stand ohne Verbindung | Ohne Verbindung sind Übersicht und Vorrat lesbar, Schreiben ist gesperrt | 3 |
| M11 | Erinnerungen | Worker, Push, Mail | Wochenübersicht und „Dringend“ kommen mit Fake-Adaptern an, höchstens eine pro Tag | 6 |
| M12 | Responsive Layouts | Stufen kompakt, mittel, breit, weit | Jeder Kern-Screen ist in fünf Viewports ohne waagrechtes Scrollen geprüft | 7 |
| M13 | Betrieb | Docker, Backups, Deployment, Anleitung | Image für amd64 und arm64 liegt in der Registry, Compose startet in der CI. Issue #1 ist zu | 6 |
| M14 | PoC Foto-Erkennung | Sonnet 5.5 gegen Haiku 5.5 messen | Bericht mit Trefferquote und erfundenen MHDs je Modell und Foto-Rolle liegt vor | 3 |

Summe: **102 Pakete.** M14 kann jederzeit nach M6-05 starten, sobald der Maintainer Fotos und Schlüssel liefert.

## 2. Grundentscheidungen der Planung

1. **App im Repo-Root**, nicht in `app/`. Gründe: `CODE_PRINZIPIEN` §2 nennt die Pfade `src/…`, `db/…`, `tests/e2e` schon so. Ein Ordner `app/` würde mit Next kollidieren (`app/src/app`). Dockerfile, CI, lefthook und knip brauchen dann keine Unterpfade. `prototypes/` bleibt als eigenes, unverändertes Projekt liegen und ist aus tsconfig, ESLint, knip, Vitest und dem Docker-Kontext ausgeschlossen.
2. **npm statt pnpm** (pnpm ist nicht installiert). `package-lock.json` ist eingecheckt, die CI nutzt `npm ci`.
3. **Node:** Ziel im Container war Node 24 LTS (`research/26`, FAKTEN F14). Seit #187 laufen Image, CI und lokale Entwicklung auf Node 26 LTS, `engines: ">=26"`.
4. **Versionen festhalten:** TypeScript 6.0.x (nicht 7), ESLint 9.x (nicht 10), bis die in CP §9 genannten Peers nachziehen. Alle übrigen Pakete in der beim Aufsetzen aktuellen Version, exakt gepinnt.
5. **Datenbank ohne Docker:** Den Treiber kennt nur `src/server/db/client.ts`.
   - `DATABASE_URL=postgres://…` nutzt node-postgres (NAS, CI, optional lokal).
   - `DATABASE_URL=pglite://…` nutzt PGlite (Apache-2.0, PostgreSQL als WASM, keine Installation). Das ist der lokale Standard für Dev-Server, Integrationstests und E2E.
   - Die CI wiederholt Integrationstests und E2E gegen einen echten `postgres:18`-Dienst.
   - Migrationen nutzen deshalb nichts, was es nur in PostgreSQL 18 gibt. IDs erzeugt die App (`crypto.randomUUID()`), nicht die DB.
   - pg-boss braucht echtes PostgreSQL. Worker-Tests laufen in der CI. Lokal nur, wenn PostgreSQL installiert ist **[USER, optional]**.
6. **Tabellen deutsch, Code englisch.** Tabellen- und Spaltennamen folgen dem freigegebenen Kanon (`einheit`, `mhd`, `nachkauf_eintrag`). Drizzle-Objekte, Typen und Funktionen sind englisch nach CP §4 (`units`, `bestBefore`). Die Zuordnung steht nur in `src/server/db/schema/*.ts`.
7. **Keine Tabellen und Spalten für „später“.** Nicht angelegt werden: `ziel_etappe`, `tag`, `produkt_tag`, `nutzer_einstellung`, Passkey-Tabelle, `inventur_intervall`, `ki_modell_*`. `ki_aufruf` bleibt, weil die Technik-Seite Fehlschläge dort protokolliert und der PoC die Kosten braucht.
8. **Alle Schemaänderungen in M1**, nacheinander. Zwei offene PRs mit Migrationen erzeugen Konflikte im drizzle-Journal. Regel: Es ist immer nur eine PR offen, die `db/migrations/` anfasst.
9. **Mobil zuerst.** M3 bis M11 bauen jede Oberfläche in der Stufe „kompakt“. Die Stufen-Varianten stehen ab M3-04 als Tailwind-Varianten bereit, M12 ordnet nur um.
10. **Animation nur mit CSS** (Übergänge, View Transitions). Keine Animationsbibliothek im MVP, kein GSAP. `prefers-reduced-motion` wird immer beachtet.
11. ~~**KI-Modell nur über `.env`**~~ überholt durch #108/#59: Modelle je Rolle kommen aus der Zuweisung in der App bzw. der Empfehlung in `ai-roles.ts`, `AI_MODEL_*` gibt es nicht mehr (siehe 05). Ursprünglich: (`AI_MODEL_PACKAGING`, `AI_MODEL_NUTRITION`, `AI_MODEL_BEST_BEFORE`, Standard `claude-sonnet-5-5`), weil EIN-07 später kommt.
12. **Externe Dienste in Tests immer als Fake:** `AI_PROVIDER=fake`, Mail- und Push-Fake, Speicher im Temp-Ordner. Echte Anthropic-Aufrufe gibt es nur im PoC (M14).
13. **Compose in zwei Dateien:** `compose.yaml` (ohne Tailscale, Port an 127.0.0.1, in der CI startbar) und `compose.tailscale.yaml` (Sidecar mit Serve als Überlagerung).

## 3. Ordnerstruktur

```
/                              Repo-Root = die App
├─ src/
│  ├─ app/                     Routing, dünn (CP §2)
│  │  ├─ (auth)/anmelden · einrichten · einladung/[token]
│  │  ├─ (app)/layout.tsx      Rahmen: Kopf, Dock bzw. Seitenleiste
│  │  ├─ (app)/uebersicht · vorrat · vorrat/[id] · neu · statistik · nachkaufen
│  │  ├─ (app)/einstellungen/… konto · haushalt · nutzer · system
│  │  ├─ api/auth/[...all] · api/photos · api/photos/[id] · api/recognize · api/push/subscribe · api/health
│  │  ├─ manifest.ts · sw.ts · globals.css (Design-Tokens)
│  ├─ features/
│  │  ├─ auth/        ERS, Nutzerverwaltung
│  │  ├─ household/   HH
│  │  ├─ supply/      ZIEL, Rechner, Übersicht, Statistik
│  │  ├─ inventory/   VOR, ROT
│  │  ├─ capture/     ERF (manuell, Foto, Entwurf, Erkennung)
│  │  ├─ restock/     NK
│  │  ├─ reminders/   ERI
│  │  ├─ settings/    EIN (Rahmen, Stammdaten, Ampel, KI-Schalter)
│  │  └─ system/      SYS (Export, Version)
│  │     └─ je Feature: ui/ · actions/ · application/ · domain/ · data/ · schemas.ts
│  ├─ server/         db/ (client, schema/, migrate) · auth/ · ai/ · storage/ · notify/ · jobs/
│  ├─ shared/         ui/ · hooks/ · lib/ (result, logger, dates, quantities) · config/ (env, constants)
│  └─ worker/main.ts  Einstieg Job-Container
├─ db/migrations/ · db/seeds/ (index.ts, stammdaten, quellen, demo)
├─ tests/e2e/ · tests/helpers/ (Test-DB, Fakes, Fabriken)
├─ docker/ (Dockerfile, backup/, tailscale/serve.json) · compose.yaml · compose.tailscale.yaml
├─ poc/ (Fotos, Erwartungen, Berichte, git-ignoriert) · scripts/ (Lizenzprüfung, PoC-Messskript #103)
├─ docs/ (UMSETZUNG, CODE_PRINZIPIEN, EINRICHTUNG, konzept/, quellen/) · research/ · prototypes/
└─ 00_…05_*.md · CLAUDE.md · README.md
```

Importrichtungen und Grenzen gelten wie in CP §2 und §3. Keine Barrel-Dateien, ein Use-Case und eine Action je Datei.

## 4. Arbeitspakete

**So liest man ein Paket:** Kopfzeile mit ID, Titel, Größe (S bis etwa 200, M bis etwa 600 geänderte Zeilen, L nur wenn unteilbar), Funktions-IDs, Quelle und Ordnern. Darunter Akzeptanzkriterien, Tests und Abhängigkeiten. Ordner ohne Präfix liegen unter `src/features/`.
**Gilt für jedes Paket zusätzlich:** Pflichtlektüre `CLAUDE.md`, `05_STATUS_ENTSCHEIDUNGEN.md`, `docs/CODE_PRINZIPIEN.md` und der Abschnitt der genannten Quelle. Definition of Done aus Abschnitt 6. UI-Texte deutsch und ruhig. Jede Action prüft Sitzung, Rolle und Haushalt selbst.

### M0 · Projektgerüst (Issue #2)

- **M0-01 · Next.js-App im Repo-Root anlegen** (M) — IDs: keine · Quelle: CP §2, §9.3, `research/26` · Ordner: `/`, `src/app`
  - Fertig, wenn: Next 16 (App Router, Turbopack, `reactCompiler: true`, `output: 'standalone'`), React 19, TS 6.0.x und Tailwind v4 laufen. `tsconfig.json` enthält alle Optionen aus CP §9.3. `prototypes/` ist ausgeschlossen. Startseite zeigt einen Platzhalter mit `lang="de"`. Skripte `dev`, `build`, `start`, `typecheck`. Die beiden unsicheren tsconfig-Punkte aus CP §9.3 sind getestet und das Ergebnis steht in der PR.
  - Tests: `npm run build` und `npm run typecheck` grün · Braucht: nichts
- **M0-02 · ESLint mit harten Grenzen, Prettier, `lint:budget`** (M) — Quelle: CP §3, §9.1 · Ordner: `/`
  - Fertig, wenn: Flat Config wie CP §9.1 mit allen Grenzen aus CP §3 und `--max-warnings=0`. Skript `lint:budget` warnt ab 200 Zeilen. Die drei unsicheren Punkte (Plugin-Doppelung, jsx-a11y mit ESLint 9, Namespace `import/`) sind geprüft, Ergebnis in CP §9.1 nachgetragen.
  - Tests: je Grenze eine Fixture-Datei, die der Linter ablehnt (Vitest ruft die ESLint-API auf) · Braucht: M0-01
- **M0-03 · Schichtgrenzen erzwingen** (M) — Quelle: CP §2, §9.2 · Ordner: `/`, `src/**` (leere Ordnerstruktur)
  - Fertig, wenn: `eslint-plugin-boundaries` 7.x bildet jede Zeile der Importtabelle ab, Standard ist „verboten“. Feature-übergreifend sind nur `application/`, `schemas.ts` und `domain/`-Typen erlaubt. Falls die v7-Syntax nicht trägt: `dependency-cruiser` als Ersatz, begründet in der PR.
  - Tests: Tabelle erlaubter und verbotener Importpaare als parametrisierter Test (z. B. `ui → data` schlägt fehl, `domain → react` schlägt fehl) · Braucht: M0-02
- **M0-04 · Vitest, `Result`, Logger, `env.ts`, `.env.example`** (M) — Quelle: CP §6, §7, §10 · Ordner: `src/shared/lib`, `src/shared/config`
  - Fertig, wenn: Vitest läuft mit Abdeckungsschwelle 90 % Zweige für `**/domain/**` und `shared/lib/**`. `result.ts` und `logger.ts` existieren. `env.ts` validiert alle Variablen mit Zod und ist die einzige Stelle mit `process.env`. `.env.example` listet jede Variable mit Kommentar, ohne echte Werte.
  - Tests: Unit für `result`, `env` (fehlende Pflichtvariable liefert klare Meldung), Logger schreibt keine Schlüssel · Braucht: M0-02
- **M0-05 · knip, lefthook, commitlint** (S) — Quelle: CP §9.4, §9.5, §11 · Ordner: `/`
  - Fertig, wenn: `knip` meldet 0 Funde. lefthook: pre-commit (prettier, eslint, tsc), commit-msg (commitlint), pre-push (knip, vitest). `npm run check` fasst lint, budget, typecheck, knip und Tests zusammen. `{staged_files}` und `piped` sind real ausprobiert.
  - Tests: ein Commit mit falscher Nachricht wird abgelehnt (in der PR belegt) · Braucht: M0-04
- **M0-06 · Playwright mit axe und fünf Viewports** (M) — Quelle: CP §10, §12, D „Geräte und Umbruchpunkte“ · Ordner: `tests/e2e`, `playwright.config.ts`
  - Fertig, wenn: Projekte `iphone` (390×844, WebKit), `duo-aussen` (382×580), `duo-hoch` (669×867), `duo-quer` (951×585), `desktop` (1280×800, Chromium). Ein Helfer prüft je Seite axe ohne Verstöße und `scrollWidth <= innerWidth`. Der Webserver startet mit PGlite und Fake-Adaptern.
  - Tests: Rauchtest der Startseite in allen fünf Projekten · Braucht: M0-01
- **M0-07 · CI mit GitHub Actions** (M) — Quelle: CP §11 · Ordner: `.github/workflows/ci.yml`, `scripts/check-licenses.*`
  - Fertig, wenn: Jobs `lint` (+ budget), `typecheck`, `knip`, `test` (PGlite), `test-pg` (Dienst `postgres:18`), `build`, `e2e` laufen bei jeder PR. Ein Lizenzjob prüft die Produktionsabhängigkeiten gegen eine Erlaubnisliste (MIT, Apache-2.0, BSD, ISC, 0BSD, MIT-0) plus eine Ausnahmedatei mit Begründung je Eintrag.
  - Tests: die CI selbst, absichtlich roter Probelauf in der PR dokumentiert · Braucht: M0-05, M0-06 · **[USER]** U2, U10
- **M0-08 · Dokumente nachziehen** (S) — Quelle: Issue #2 letzter Punkt, Issue #3, PLAN §8 W1 · Ordner: `CLAUDE.md`, `docs/`, `00_IDEE.md`, `README.md`
  - Fertig, wenn: `CLAUDE.md` nennt die Phase „Umsetzung“. CP §5 nennt CSS statt GSAP, CP §10 nennt PGlite lokal und PostgreSQL 18 in der CI. `quelle_bedarf` steht im Kanon (PLAN §1.5). `00_IDEE.md` §5 nennt Tailscale. README beschreibt `npm install`, `npm run dev`, `npm run check`.
  - Tests: keine · Braucht: nichts · **[USER]** U1

### M1 · Datenmodell und Seeds

- **M1-01 · DB-Zugang, Migrationslauf, Test-DB** (M) — Quelle: CP §8, T#datenmodell · Ordner: `src/server/db`, `tests/helpers`, `drizzle.config.ts`
  - Fertig, wenn: `client.ts` wählt den Treiber nach `DATABASE_URL` (Grundentscheidung 5). Skripte `db:generate`, `db:migrate`, `db:seed`. `createTestDb()` liefert eine frische PGlite-DB mit allen Migrationen. Kein `drizzle-kit push`. Option `casing` ist geprüft.
  - Tests: Integration: leere DB → Migrationen → Abfrage klappt, einmal PGlite, einmal `postgres:18` (CI) · Braucht: M0-04
- **M1-02 · Schema Konto** (M) — IDs: ERS-01, ERS-02, HH-06 · Quelle: T#datenmodell „Haushalt und Konto“ · Ordner: `src/server/db/schema/account.ts`
  - Fertig, wenn: Tabellen von Better Auth liegen als Drizzle-Schema vor, mit deutschen Namen (`nutzer`, `sitzung`, `konto`, `verifizierung`) über die Namensoptionen der Bibliothek. `nutzer` hat `rolle` (admin, mitglied), `aktiv`, `haushalt_id`, `mitglied_id`. Geht die Umbenennung nicht sauber, bleiben die Standardnamen, begründet in der PR.
  - Tests: Integration: Migration läuft, Check-Constraint auf `rolle` greift · Braucht: M1-01
- **M1-03 · Schema Haushalt** (S) — IDs: HH-01 bis HH-04 · Quelle: T#datenmodell, `02` · Ordner: `schema/household.ts`
  - Fertig, wenn: `haushalt`, `haushalt_einstellung` (Standard-Ernährungsform, `ampel_gelb_tage` 90, `ampel_orange_tage` 28, `ki_aktiv`), `mitglied` (Typ: baby, kind, jugendlich, erwachsen, senior), `mitglied_allergie`. Jede Tabelle hat `id`, `created_at`, `updated_at`, jeder Fremdschlüssel ein `onDelete`.
  - Tests: Integration: Constraints (Typ, orange ≤ gelb) · Braucht: M1-02
- **M1-04 · Schema Empfehlung und Ziel** (S) — IDs: ZIEL-01 bis ZIEL-04 · Quelle: T#datenmodell „Empfehlung und Ziel“ · Ordner: `schema/recommendation.ts`
  - Fertig, wenn: `quelle`, `quelle_version` (Stand, Link, `standard_tage`, `geprueft`), `quelle_bedarf`, `warengruppe` (fester Schlüssel), `quelle_wert`, `ziel`. Alte Versionen bleiben erhalten (keine Überschreibung).
  - Tests: Integration: zwei Versionen einer Quelle nebeneinander · Braucht: M1-03
- **M1-05 · Schema Vorrat** (M) — IDs: VOR-01, VOR-05, ROT-01 bis ROT-05, ERF-09 · Quelle: T#datenmodell „Vorrat“ · Ordner: `schema/inventory.ts`
  - Fertig, wenn: `kategorie` (System oder eigen, ausgeblendet, Sortierung, kcal-Durchschnitt, übliche Haltbarkeit), `behaelter`, `lagerort`, `produkt` (Mengen `numeric`, `naehrwerte_geschaetzt`, eindeutige `erfassung_id` als Idempotenz-Schlüssel), `einheit` (`mhd date`, `mhd_genauigkeit`, `mhd_art`, `mhd_geschaetzt`, `status`, `entnommen_am`, `entnommen_von`, `geprueft_am`). Index auf `einheit(produkt_id, status, mhd)`.
  - Tests: Integration: Status-Constraint, doppelte `erfassung_id` wird abgelehnt · Braucht: M1-04
- **M1-06 · Schema Erfassung, Nachkaufen, Erinnerungen** (M) — IDs: ERF-15, NK-01 bis NK-04, ERI-01, ERI-07 · Quelle: T#datenmodell, T#speicherpunkte · Ordner: `schema/capture.ts`, `restock.ts`, `reminders.ts`
  - Fertig, wenn: `foto` (Rolle, Pfad, Hash, Größe, Typ, Status entwurf oder fest, `entwurf_id` mit `ON DELETE SET NULL`), `erfassung_entwurf` (`nutzer_id`, `daten jsonb`), `ki_aufruf`, `nachkauf_eintrag` (Quelle nachkauf oder manuell, erledigt), `benachrichtigung_einstellung`, `push_abo`.
  - Tests: Integration: Entwurf löschen lässt ein festes Foto stehen · Braucht: M1-05
- **M1-07 · Seed-Gerüst und Stammdaten** (M) — IDs: EIN-04 · Quelle: CP §8, `01` Ordnungssystem · Ordner: `db/seeds`
  - Fertig, wenn: `db/seeds/index.ts` spielt versionierte TS-Dateien per Upsert ein und ist beliebig oft wiederholbar. Enthalten: Warengruppen, System-Kategorien mit Warengruppe, Behälter. Wasser ist eine eigene Kategorie und Warengruppe (vorläufig, U11).
  - Tests: Integration: zweimal seeden ergibt denselben Stand · Braucht: M1-06
- **M1-08 · Empfehlungswerte recherchieren und zur Prüfung vorlegen** (M) — IDs: ZIEL-01, HH-03, ERF-09, ERF-11 · Quelle: `05` Nächste Schritte 3, PLAN §8 W14, L19 · Ordner: `docs/quellen/EMPFEHLUNGSWERTE.md`
  - Fertig, wenn: Ein Prüfblatt nennt je Wert die Primärquelle mit Link und Abrufdatum: Bedarf je Personengruppe (kcal, Wasser), Standardzeitraum, Mengen je Warengruppe (BBK/BLE), Ersatzregeln vegetarisch und vegan, kcal-Durchschnitt und übliche Haltbarkeit je Kategorie. Nicht belegbare Werte sind als solche markiert. Kein Wert aus dem Prototyp wird ungeprüft übernommen.
  - Tests: keine · Braucht: nichts · **[USER]** U3 gibt das Blatt frei
- **M1-09 · Seed Quelle BBK/BLE** (S) — IDs: ZIEL-01 · Quelle: M1-08 · Ordner: `db/seeds/quellen`
  - Fertig, wenn: Eine `quelle_version` mit Stand, Link und den freigegebenen Werten ist als Seed da. Ohne Freigabe bleibt `geprueft = false`, und die App zeigt bei der Quelle „Werte noch nicht geprüft“.
  - Tests: Integration: Seed lädt, Summen stimmen mit dem Prüfblatt · Braucht: M1-07, M1-08, U3
- **M1-10 · Demo-Daten für Entwicklung und E2E** (S) — Quelle: `Proto/lib/mock-data.ts` · Ordner: `db/seeds/demo.ts`, `tests/helpers/factories.ts`
  - Fertig, wenn: `npm run db:seed:demo` legt einen Beispielhaushalt mit Nutzern, Produkten und Einheiten in allen Ampelstufen an. Test-Fabriken erzeugen dieselben Objekte für Unit- und Integrationstests. Die Demo läuft nie automatisch im Container.
  - Tests: Integration: Demo lädt auf leerer DB · Braucht: M1-07

### M2 · Fachlogik als reine Funktionen

Alle Pakete: nur `domain/` oder `shared/lib`, keine Abhängigkeit zu React, Next, DB oder `process.env`. „Heute“ wird immer als Parameter übergeben. Tests als deutsche Sätze, Zweigabdeckung ≥ 90 %. E2E entfällt. M2 kann parallel zu M1 laufen.

- **M2-01 · Kalendertage** (S) — Quelle: T#ablauf-abgelaufen · Ordner: `src/shared/lib/dates.ts`
  - Fertig, wenn: Typ für Kalendertag (ISO `JJJJ-MM-TT`), `todayInBerlin(now)`, `daysBetween`, `endOfMonth`, `endOfYear`, `addMonths`. Keine Zeitzonen-Verschiebung um Mitternacht.
  - Tests: Unit inkl. Schaltjahr, Sommerzeitwechsel, Monatsende 31. → 30. · Braucht: M0-04
- **M2-02 · MHD-Parsing** (M) — IDs: ERF-05, ERF-08 · Quelle: T#ablauf-foto Wenn-Dann-Regeln · Ordner: `capture/domain/best-before.ts`
  - Fertig, wenn: Eingaben wie `09/2027`, `30.09.2027`, `2027` ergeben Datum plus Genauigkeit (tag, monat → Monatsende, jahr → 31.12.). Ungültiges oder Unvollständiges ergibt einen Fehlerwert, nie ein geratenes Datum. Schnellknöpfe +6 Monate, +1 Jahr, +2 Jahre rechnen ab heute.
  - Tests: Unit, Tabellen-Tests mit mindestens 30 Fällen inkl. Chargennummern und Uhrzeiten (kein Datum) · Braucht: M2-01
- **M2-03 · Mengen und Nährwerte** (M) — IDs: ERF-04, ERF-10, ERF-12 · Quelle: T#rechnung, T#api-ki Schema B · Ordner: `src/shared/lib/quantities.ts`, `capture/domain/nutrition.ts`
  - Fertig, wenn: Parsing von `500 g`, `1,5 l`, `1 kg` in g bzw. ml mit deutschem Komma. kJ → kcal (÷ 4,184), kcal gewinnt vor kJ. kcal je Einheit = Inhalt × kcal je 100 ÷ 100. Abtropfgewicht hat Vorrang. Ausgabe im deutschen Zahlenformat.
  - Tests: Unit inkl. Null, negativ, unbekannte Einheit · Braucht: M0-04
- **M2-04 · Ampel** (S) — IDs: ROT-01, EIN-05 · Quelle: T#ablauf-abgelaufen, `Proto/lib/ampel-rules.ts` · Ordner: `inventory/domain/unit-state.ts`
  - Fertig, wenn: Zustand gut, bald fällig, dringend, abgelaufen aus MHD, heute und Schwellen. Schwellenprüfung: orange darf nicht größer sein als gelb. Der Zustand wird nie gespeichert.
  - Tests: Unit an allen Grenzen (heute, 28, 29, 90, 91 Tage) · Braucht: M2-01
- **M2-05 · FIFO und Gruppierung** (S) — IDs: ROT-02, VOR-01, ERF-12 · Quelle: T#ablauf-entnehmen · Ordner: `inventory/domain/fifo.ts`, `group-units.ts`
  - Fertig, wenn: `pickFifoUnit` wählt die Einheit mit dem frühesten MHD im Status `vorrat`. Gruppierung liefert „09/2027 (6×)“ nach Datum sortiert.
  - Tests: Unit inkl. Gleichstand, leere Liste, geschätzte Daten · Braucht: M2-01
- **M2-06 · Tagesbedarf des Haushalts** (S) — IDs: ZIEL-02 (offiziell), HH-01, HH-02 · Quelle: T#rechnung, T#datenmodell `quelle_bedarf` · Ordner: `supply/domain/daily-need.ts`
  - Fertig, wenn: Bedarf an kcal und Wasser = Summe über die Mitglieder nach Personengruppe aus den übergebenen Quellwerten. Personengruppen ohne Wert (vorläufig: Baby) zählen nicht und werden im Ergebnis genannt.
  - Tests: Unit mit Testwerten, klar als Testdaten benannt · Braucht: M0-04
- **M2-07 · Vorratsrechner „Tage versorgt“** (M) — IDs: UEB-01, UEB-02, UEB-04 · Quelle: T#rechnung (inkl. Beispiel), `Proto/lib/supply.ts` · Ordner: `supply/domain/supply-days.ts`
  - Fertig, wenn: Aus Einheiten, Bedarf und Stichtag entstehen Energie-Tage, Wasser-Tage, Engpass (Minimum) und ein Kennzeichen „enthält Schätzwerte“. Stichtag heute oder Zieldatum. Abgelaufene zählen nicht. Die Regel für „Noch gut“ ist ein einzelner Parameter (vorläufig: zählt nicht, U11). Abrunden auf eine Nachkommastelle wie im Prototyp (vorläufig, U11). Liste der Einheiten, die vor dem Zieldatum ablaufen.
  - Tests: Unit, darunter das Rechenbeispiel aus T#rechnung (6,5 Tage, 6,2 von 10) · Braucht: M2-03, M2-06
- **M2-08 · Warengruppen-Fortschritt und Ziel-Lücke** (M) — IDs: UEB-03, NK-01, HH-03 · Quelle: T#rechnung, T#ablauf-nachkaufen · Ordner: `supply/domain/group-progress.ts`, `goal-gap.ts`
  - Fertig, wenn: Je Warengruppe „X von Y Tagen“ und die knappste Gruppe. Lücke = Ziel minus Bestand in kg oder l. Die Ernährungsform verschiebt nur die Zielmengen zwischen Warengruppen, je Person gerechnet und summiert, die kcal-Summe bleibt gleich. Die Verteilung kommt als Daten herein, nicht als fester Code.
  - Tests: Unit inkl. gemischtem Haushalt, Übererfüllung, Gruppe ohne Bestand · Braucht: M2-07
- **M2-09 · Plausibilität und Schätzwerte** (S) — IDs: ERF-06, ERF-09, ERF-11 · Quelle: T#ablauf-foto, T#api-ki „Nach der Antwort“ · Ordner: `capture/domain/plausibility.ts`, `estimates.ts`
  - Fertig, wenn: „bitte prüfen“ bei Datum in der Vergangenheit, weit weg vom üblichen Wert der Kategorie oder Sicherheit „niedrig“. Geschätztes MHD nur über einen ausdrücklichen Aufruf mit Kennzeichen `geschaetzt`. Fehlende Nährwerte → Kategorie-Durchschnitt mit Kennzeichen.
  - Tests: Unit: kein Pfad liefert ein Datum ohne Kennzeichen · Braucht: M2-02
- **M2-10 · Statistik und Nutzerregeln** (S) — IDs: STA-01 bis STA-03, EIN-10, HH-06 · Quelle: F#sta, `Proto/lib/user-rules.ts`, `unit-history.ts` · Ordner: `supply/domain/stats.ts`, `auth/domain/user-rules.ts`
  - Fertig, wenn: Erfüllungsgrad in Prozent mit Bezug als Parameter (vorläufig Zieldauer, U11), über 100 % möglich. Verbraucht gegen entsorgt je Zeitraum. Regel „mindestens ein aktiver Admin“ und „neue Verknüpfung löst die alte“.
  - Tests: Unit · Braucht: M2-07

### M3 · Anmeldung, Rahmen, Haushalt, Ersteinrichtung

- **M3-01 · Better Auth und Sitzungshelfer** (M) — IDs: ERS-02 · Quelle: T#api-intern, T#sicherheit, CP §1 Regel 7 · Ordner: `src/server/auth`, `src/app/api/auth/[...all]`
  - Fertig, wenn: E-Mail und Passwort, freie Registrierung aus. `requireSession()`, `requireAdmin()` und `requireHousehold()` geben ein `Result` zurück. Deaktivierte Nutzer bekommen keine Sitzung. Passwörter liegen nur gehasht in der DB (geprüft).
  - Tests: Integration: anmelden, falsches Passwort, deaktiviert · Braucht: M1-02
- **M3-02 · Anmeldeseite und Zugriffsschutz** (M) — IDs: ERS-02 · Quelle: F ERS-02 · Ordner: `auth/ui`, `auth/actions`, `src/app/(auth)/anmelden`, `src/proxy.ts`
  - Fertig, wenn: Ohne Sitzung ist nur die Anmeldung erreichbar. Der Fehlertext verrät nicht, ob E-Mail oder Passwort falsch war. Formular mit `useActionState`, Fehler am Feld mit `aria-live`.
  - Tests: E2E: anmelden, abmelden, Direktaufruf einer geschützten Seite · Braucht: M3-01, M3-04
- **M3-03 · Ersteinrichtung: erster Admin und Haushalt** (M) — IDs: ERS-01 · Quelle: F ERS-01, T#sicherheit · Ordner: `auth/application/setup-first-admin.ts`, `src/app/(auth)/einrichten`
  - Fertig, wenn: Existiert kein Nutzer, zeigt die App die Einrichtung statt der Anmeldung. Nutzer, Haushalt und Einstellungen entstehen in einer Transaktion. Danach ist die Seite nicht mehr erreichbar, auch nicht bei zwei gleichzeitigen Aufrufen.
  - Tests: Integration: zweiter Aufruf scheitert. E2E: Einrichtung bis zur Übersicht · Braucht: M3-01, M3-04
- **M3-04 · Design-Tokens und Grundbausteine** (M) — Quelle: `docs/konzept/DESIGN_SYSTEM.md` §2–5 (ersetzt d6/Glas) · Ordner: `src/app/globals.css`, `src/shared/ui`
  - Fertig, wenn: Tokens aus DESIGN_SYSTEM §2–4 als CSS-Variablen (hell und dunkel nach `prefers-color-scheme`, kein Schalter). Tailwind-Varianten für die Stufen mittel (≥ 640 px und ≥ 700 px hoch), breit (≥ 900), weit (≥ 1280). Bausteine aus DESIGN_SYSTEM §5, Piktogramme als Inline-SVG. Touch-Ziele ≥ 44 px.
  - Tests: E2E: Musterseite (nur im Dev-Modus) besteht axe in allen Viewports · Braucht: M0-06 · **[USER]** U11 (Schrift, Piktogramme)
- **M3-05 · App-Rahmen kompakt** (M) — IDs: EIN-01, PWA-03 · Quelle: `docs/konzept/DESIGN_SYSTEM.md` §6, UX_KONZEPT §6 · Ordner: `src/app/(app)/layout.tsx`, `src/shared/ui`
  - Fertig, wenn: Zahnrad oben rechts auf der Übersicht, Tab-Leiste Übersicht · Vorrat · Erfassen · Nachkaufen · Statistik mit rundem Akzent-Knopf „Erfassen“ in der Mitte, ab „breit“ Seitenleiste. Leere Seiten je Ziel. Tastatur und Fokus sichtbar. Safe-Area-Ränder.
  - Tests: E2E: Tabwechsel per Tippen und Tastatur · Braucht: M3-02
- **M3-06 · Einstellungen-Rahmen mit Sichtbarkeit nach Rolle** (S) — IDs: EIN-01 · Quelle: F EIN-01, D „Einstellungen im Detail“, `Proto/components/d6/settings/routes.ts` · Ordner: `settings/ui`, `src/app/(app)/einstellungen`
  - Fertig, wenn: Vier Gruppen. Mitglied sieht „Haushalt“ nur lesend und „Nutzerverwaltung“ sowie „Daten & System“ gar nicht, auch nicht per Direktaufruf.
  - Tests: E2E als Admin und als Mitglied · Braucht: M3-05
- **M3-07 · Haushaltsmitglieder und Ernährungsform** (M) — IDs: HH-01 bis HH-04 (Feld) · Quelle: F#hh, `02` · Ordner: `household/*`
  - Fertig, wenn: Anlegen, Bearbeiten, Entfernen (nur Admin). Pflicht: Name, Typ, Geburtsjahr, bei Babys der Monat. Optional die übrigen Felder aus HH-02 und Allergien. Ernährungsform je Person („wie Haushalt“ als Standard) und Haushalts-Standard.
  - Tests: Use-Case mit Fake-Repo, Integration Repository (Haushaltsfilter), E2E anlegen und als Mitglied nur lesen · Braucht: M3-06
- **M3-08 · Ziel und Empfehlung** (M) — IDs: ZIEL-01, ZIEL-03, ZIEL-04 · Quelle: F#ziel · Ordner: `supply/{ui,actions,application,data}`
  - Fertig, wenn: Quelle mit Stand, Name und Link sichtbar. Zieldauer 3, 10, 14 oder eigener Wert, Standard aus der Quelle. Zieldatum, bei Datum in der Vergangenheit eine freundliche Bitte um ein neues. Rechenmodus fest „Offiziell“, ohne Umschalter.
  - Tests: Use-Case, Integration, E2E · Braucht: M3-06, M1-09
- **M3-09 · Ersteinrichtung: Haushalt, Ziel, Home-Bildschirm** (M) — IDs: ERS-01, PWA-02 · Quelle: F ERS-01, D „Zustände“ e · Ordner: `auth/ui`, `src/app/(auth)/einrichten`
  - Fertig, wenn: Nach dem ersten Admin führen drei kurze Schritte durch Mitglieder, Ziel und den Hinweis „Zum Home-Bildschirm“ (nur im iPhone-Browser, nicht wenn schon installiert). Jeder Schritt lässt sich überspringen. Die Schritte nutzen die Formulare aus M3-07 und M3-08.
  - Tests: E2E: kompletter erster Start · Braucht: M3-03, M3-07, M3-08
- **M3-10 · Nutzerverwaltung: Liste, Rolle, deaktivieren, entfernen** (M) — IDs: EIN-10, HH-06 · Quelle: F EIN-10, T#api-intern · Ordner: `auth/*`
  - Fertig, wenn: Liste mit Rolle, Status, letztem Login. Der letzte aktive Admin kann weder herabgestuft noch deaktiviert noch entfernt werden. Deaktivieren beendet alle Sitzungen. Nutzer lässt sich mit einem Haushaltsmitglied verknüpfen (`linkMemberAction`).
  - Tests: Use-Case (Regel letzter Admin), Integration (Sitzungen weg), E2E · Braucht: M3-06, M2-10
- **M3-11 · Einladen und Passwort zurücksetzen** (M) — IDs: ERS-03, ERS-06 · Quelle: F ERS-03, ERS-06 · Ordner: `auth/*`, `src/app/(auth)/einladung/[token]`
  - Fertig, wenn: Admin lädt per Link ein (7 Tage gültig, einmal nutzbar) oder vergibt ein Startpasswort. Eingeladene stehen als „eingeladen“ in der Liste. Admin setzt ein Passwort ohne Mailversand zurück. Das Token liegt nur gehasht in der DB.
  - Tests: Integration (abgelaufen, doppelt genutzt), E2E Einladung annehmen · Braucht: M3-10

### M4 · Vorrat und Rotation

- **M4-01 · Vorrat lesen: Repository und Use-Case** (M) — IDs: VOR-01, VOR-02, VOR-03, VOR-05 · Quelle: F#vor, `Proto/components/d6/data/stock-status.ts` · Ordner: `inventory/{data,application,schemas.ts}`
  - Fertig, wenn: Ein Use-Case liefert Produkte mit Einheiten als DTO, gefiltert nach Status (sechs Filter mit Zählern), Kategorie, Behälter, Lagerort. Jede Abfrage filtert im Repository auf den Haushalt. Der Zustand kommt aus M2-04.
  - Tests: Use-Case mit Fake-Repo, Integration: fremder Haushalt liefert nichts · Braucht: M1-10, M2-04, M3-01
- **M4-02 · Vorratsliste** (M) — IDs: VOR-01 bis VOR-03 · Quelle: D „iPhone“ A Vorrat, `Proto/components/d6/stock` · Ordner: `inventory/ui`, `src/app/(app)/vorrat`
  - Fertig, wenn: Kachel je Produkt mit Bild, Bezeichnung und gruppierten Einheiten. Filter liegen in der URL (`searchParams`), Standard „Im Vorrat“. Drei Filterreihen wie Variante A (vorläufig, U11). Leerer Zustand freundlich.
  - Tests: E2E: Filter kombinieren, Zähler stimmen · Braucht: M4-01, M3-05
- **M4-03 · Produkt-Detail mit Einheiten** (M) — IDs: ROT-01, ROT-06 · Quelle: D „Einheiten als Blatt von unten“, T#ablauf-abgelaufen · Ordner: `inventory/ui`, `src/app/(app)/vorrat/[id]`
  - Fertig, wenn: Einheiten nach Datum gruppiert, je Einheit Punkt plus Wort. Hinweis „MHD ist kein Wegwerfdatum“ nur bei abgelaufenem MHD, nicht beim Verbrauchsdatum. Markierung „geschätzt“ sichtbar. Fremde oder unbekannte ID zeigt „nicht gefunden“.
  - Tests: E2E inkl. axe · Braucht: M4-02
- **M4-04 · „1 entnehmen“ und Verbraucht** (M) — IDs: ROT-02, ROT-03 · Quelle: T#ablauf-entnehmen, T#api-intern `consumeUnitAction` · Ordner: `inventory/{actions,application,data,ui}`
  - Fertig, wenn: Der Knopf schlägt die Einheit mit dem frühesten MHD vor, die Auswahl lässt sich ändern. Die Einheit bekommt `verbraucht`, Datum und Nutzer. Die Änderung greift nur, wenn der Status noch `vorrat` ist (bedingtes Update).
  - Tests: Use-Case, Integration: doppelte Entnahme ändert nur einmal, E2E · Braucht: M4-03, M2-05
- **M4-05 · Entsorgt und „Noch gut“** (M) — IDs: ROT-04, ROT-05, ROT-06 · Quelle: T#ablauf-abgelaufen · Ordner: `inventory/*`
  - Fertig, wenn: „Entsorgt“ setzt Status, Datum und Nutzer. „Noch gut“ setzt `geprueft_am`, die Einheit bleibt im Vorrat mit „geprüft am …“. „Noch gut“ gibt es nicht beim Verbrauchsdatum.
  - Tests: Use-Case, Integration, E2E · Braucht: M4-04 · **[USER]** U11 (zählt „Noch gut“ zu „versorgt“?)
- **M4-06 · Historie** (S) — IDs: ROT-07, VOR-02 · Quelle: F ROT-07 · Ordner: `inventory/{application,ui}`
  - Fertig, wenn: Filter „Verbraucht“ und „Entsorgt“ zeigen die Historie mit Datum und Nutzer, filterbar nach Zeitraum.
  - Tests: Integration (Zeitraumgrenzen), E2E · Braucht: M4-05
- **M4-07 · Produkt und Einheit bearbeiten** (M) — IDs: VOR-04, VOR-05 · Quelle: T#ablauf-verwalten · Ordner: `inventory/*`
  - Fertig, wenn: Admin und Mitglied ändern Bezeichnung, Kategorie, Behälter, Inhalt, Nährwerte, Lagerort und das MHD einer Einheit. Echte Nährwerte entfernen „geschätzt“. Dasselbe Zod-Schema wie bei der Erfassung.
  - Tests: Use-Case, Integration, E2E · Braucht: M4-03, M5-01
- **M4-08 · Fehlerfassung endgültig löschen** (S) — IDs: VOR-07 · Quelle: T#ablauf-verwalten, T#speicherpunkte · Ordner: `inventory/*`
  - Fertig, wenn: Nur Admin. Rückfrage mit dem Satz, dass es nicht rückgängig zu machen ist. Erst DB-Zeilen in einer Transaktion, danach die Dateien über den Speicher-Port. Das Produkt fehlt danach in Historie und Statistik.
  - Tests: Use-Case mit Fake-Speicher (Reihenfolge), Integration, E2E: Mitglied sieht den Knopf nicht und die Action lehnt ab · Braucht: M4-07, M6-01

### M5 · Manuelle Erfassung

- **M5-01 · Speichern-Use-Case für Foto und manuell** (M) — IDs: ERF-10, ERF-12 · Quelle: T#ablauf-manuell „Speichern“, T#api-intern `createStockAction` · Ordner: `capture/{schemas.ts,application,data,actions}`
  - Fertig, wenn: Ein Schema beschreibt Produkt plus Einheiten. `createStock` legt alles in einer Transaktion an. Derselbe Idempotenz-Schlüssel legt nichts doppelt an. Jede Einheit braucht ein Datum (erkannt, eingetragen oder ausdrücklich geschätzt), sonst lehnt der Use-Case ab.
  - Tests: Use-Case, Integration: doppelter Aufruf, Abbruch mitten in der Transaktion hinterlässt nichts · Braucht: M1-06, M2-02, M2-03, M3-01
- **M5-02 · Manuelles Formular** (M) — IDs: ERF-01, ERF-10, ERF-11 · Quelle: T#ablauf-manuell, `Proto/components/d6/add/ManualForm.tsx` · Ordner: `capture/ui`, `src/app/(app)/neu`
  - Fertig, wenn: Felder Bezeichnung, Kategorie, Behälter, Inhalt, optional kcal und Makros. Pflichtfelder laut Technik-Seite. Ohne kcal gilt der Kategorie-Durchschnitt, sichtbar als „geschätzt“. Prüfung auf dem Gerät und auf dem Server mit demselben Schema.
  - Tests: E2E: Fehler am Feld, Tastaturbedienung, axe · Braucht: M5-01, M3-05
- **M5-03 · MHD manuell eingeben** (M) — IDs: ERF-07, ERF-08, ERF-09 · Quelle: T#ablauf-foto MHD-Serie, `Proto/components/d6/add/MhdPicker.tsx` · Ordner: `capture/ui`
  - Fertig, wenn: Monat-Jahr-Wähler mit Schnellknöpfen, Anzahl mit − und +, mehrere Daten je Produkt. „Ohne Datum“ ist eine bewusste Wahl und setzt eine markierte Schätzung nach Kategorie.
  - Tests: E2E · Braucht: M5-02, M2-09
- **M5-04 · Zusammenfassung, Speichern, erster Start** (S) — IDs: ERF-12, UEB-09 · Quelle: F ERF-12, D „Zustände“ e · Ordner: `capture/ui`
  - Fertig, wenn: Zusammenfassung wie „10 × Nudeln 500 g = 5 kg · … · MHDs: 09/2027 (6×)“. Erst „Speichern“ legt an, der Knopf ist danach gesperrt. Bei leerem Vorrat zeigt die App den freundlichen Einstieg.
  - Tests: E2E: vollständige manuelle Erfassung bis in die Vorratsliste, doppeltes Tippen · Braucht: M5-03, M4-02

### M6 · Foto-Erfassung

- **M6-01 · Speicher-Port und Bildverarbeitung** (M) — IDs: ERF-15 · Quelle: T#speicherpunkte, T#sicherheit · Ordner: `src/server/storage`
  - Fertig, wenn: Port mit lokaler Datei-Implementierung und Fake. sharp verkleinert auf etwa 1600 px lange Kante, erzeugt ein Vorschaubild mit etwa 400 px, entfernt EXIF und berechnet den Hash. Das Original wird nicht aufbewahrt. Nur JPEG, PNG, WebP und HEIC bis zu einer festen Größe.
  - Tests: Unit mit Testbild inkl. GPS-Daten: Ausgabe ohne EXIF, falscher Dateityp wird abgelehnt · Braucht: M0-04
- **M6-02 · Foto hochladen und ausliefern** (M) — IDs: ERF-15 · Quelle: T#api-intern Routen · Ordner: `src/app/api/photos`, `capture/{application,data}`
  - Fertig, wenn: `POST /api/photos` legt das Foto im Status „entwurf“ ab und erzeugt beim ersten Foto den Entwurf. `GET /api/photos/[id]` liefert Bild oder Vorschau nur an den eigenen Haushalt bzw. Entwurf. Fremde ID ergibt „nicht gefunden“.
  - Tests: Integration: Eigentumsprüfung, Größenlimit · Braucht: M6-01, M1-06, M3-01
- **M6-03 · Entwurf sichern, fortsetzen, verwerfen** (M) — IDs: ERF-12 · Quelle: T#speicherpunkte · Ordner: `capture/{schemas.ts,application,actions,ui}`
  - Fertig, wenn: `saveDraftAction` sichert den Stand bei jedem Schrittwechsel, validiert gegen ein Entwurfs-Schema. `discardDraftAction` löscht erst DB, dann Dateien. Beim Öffnen von „Neu“ fragt die App „Erfassung fortsetzen oder verwerfen?“. Ein Entwurf gehört nur seinem Nutzer und zählt nirgends mit.
  - Tests: Use-Case, Integration, E2E: Seite neu laden und fortsetzen · Braucht: M6-02
- **M6-04 · KI-Port, KI-Schemas, Fake-Adapter** (M) — IDs: ERF-03, ERF-04, ERF-05 · Quelle: T#api-ki, CP §7, §8 · Ordner: `src/server/ai`, `capture/schemas.ts`, `capture/domain/map-recognition.ts`
  - Fertig, wenn: Port `VisionRecognizer` mit drei Rollen. Drei schlanke KI-Schemas (alle Felder Pflicht und nullable, ohne Grenzen). Mapping ins strenge Fach-Schema. `null` bleibt `null`. Fake-Adapter mit festen Antworten je Testbild. Die Kategorie-Liste kommt zur Laufzeit aus dem Haushalt.
  - Tests: Unit: kein Mapping-Pfad erzeugt ein Datum aus `null` oder aus `roh_text` · Braucht: M2-09
- **M6-05 · Anthropic-Adapter** (M) — IDs: ERF-03 bis ERF-05, EIN-08 · Quelle: T#api-ki, FAKTEN F10 · Ordner: `src/server/ai/anthropic-adapter.ts`
  - Fertig, wenn: Einzige Datei mit dem Anthropic-SDK. Structured Outputs mit den Zod-Schemas, Modell je Rolle aus `env`, Prompt-Kopf „schätze und erfinde nichts“, bei MHD „ERFINDE NIEMALS EIN DATUM“. Zeitlimit, höchstens ein Wiederholversuch bei 429 und 5xx. Tokens und Kosten gehen an den Aufrufer zurück. SDK-Schnittstelle vor dem Schreiben gegen die aktuelle Doku prüfen.
  - Tests: Unit mit gemocktem SDK-Client (Erfolg, Zeitlimit, 429, Schema-Verstoß). Kein echter Aufruf · Braucht: M6-04
- **M6-06 · Erkennung auslösen** (M) — IDs: ERF-16, EIN-06 · Quelle: T#api-intern `/api/recognize`, T#ablauf-foto · Ordner: `src/app/api/recognize`, `capture/application/recognize-photo.ts`
  - Fertig, wenn: Erkennung nur bei `ki_aktiv` und hinterlegtem Schlüssel, nur für Fotos aus dem eigenen Entwurf. Höchstens wenige Aufrufe gleichzeitig. Jeder Aufruf steht in `ki_aufruf` (auch Fehlschläge). Fehler führt zu einem ruhigen Hinweis und zur manuellen Eingabe, bisherige Eingaben bleiben.
  - Tests: Use-Case mit Fake-KI, Integration: KI aus → kein Aufruf des Adapters · Braucht: M6-03, M6-04
- **M6-07 · Kamera-Baustein mit Upload-Warteschlange** (M) — IDs: ERF-02 · Quelle: D „Erfassen im Detail“, „Zustände“ b, `Proto/components/d6/add/Viewfinder.tsx` · Ordner: `capture/ui`, `src/shared/hooks`
  - Fertig, wenn: Live-Kamera im Vollbild ohne Dock, Auslöser sofort wieder bereit. Ohne Erlaubnis oder Kamera ist „Manuell eingeben“ der Hauptknopf. Scheitert der Upload, bleibt das Foto im Gerät und der Chip zeigt „nicht hochgeladen, erneut versuchen“.
  - Tests: E2E in Chromium mit Fake-Kamera: auslösen, Upload-Fehler, Erlaubnis verweigert · Braucht: M6-02, M3-05
- **M6-08 · Schritt Verpackung** (M) — IDs: ERF-01, ERF-03 · Quelle: T#ablauf-foto Schritte 1 und 2, `Proto/components/d6/add/CaptureSteps.tsx` · Ordner: `capture/ui`
  - Fertig, wenn: Nach dem Foto erscheint eine bearbeitbare Karte (Bezeichnung ohne Marke, Kategorie, Behälter, Inhalt, Abtropfgewicht). Nicht Lesbares bleibt leer und gelb. Der Umschalter Foto/Manuell ist in jedem Schritt sichtbar.
  - Tests: E2E mit Fake-KI: voller Vorschlag, teilweise `null` · Braucht: M6-06, M6-07, M5-02
- **M6-09 · Schritt Nährwerte** (S) — IDs: ERF-04, ERF-11 · Quelle: T#api-ki Schema B · Ordner: `capture/ui`
  - Fertig, wenn: Optionaler Schritt. kcal vor kJ, nur kJ wird umgerechnet. Bei „Portion“ ohne Portionsgröße fragt die App nach. Überspringen setzt den Kategorie-Durchschnitt als „geschätzt“.
  - Tests: E2E mit Fake-KI · Braucht: M6-08
- **M6-10 · MHD-Serie aufnehmen** (M) — IDs: ERF-05, ERF-07 · Quelle: T#ablauf-foto Schritte 3 und 4, `Proto/components/d6/add/MhdSeries.tsx` · Ordner: `capture/ui`
  - Fertig, wenn: Ein Foto je Packung, Zähler „Packung 7“, Chips erscheinen nacheinander. „Alle gleiches Datum“: ein Foto plus Anzahl. „Verbrauchen bis“ wird als Verbrauchsdatum geführt. Die Serie lässt sich erst abschließen, wenn mindestens ein Datum oder „Ohne Datum“ vorliegt.
  - Tests: E2E mit Fake-KI: 5 Fotos schnell hintereinander · Braucht: M6-08, M5-03
- **M6-11 · Datums-Chips korrigieren, Speicherregeln** (M) — IDs: ERF-06 · Quelle: F ERF-06, T#ablauf-foto „Speicherregel“ · Ordner: `capture/ui`, `capture/domain`
  - Fertig, wenn: Nicht lesbar → gelber Chip ohne Datum („bitte nochmal oder manuell“). „Bitte prüfen“ muss bestätigt oder korrigiert werden. Vor dem Speichern muss jeder gelbe Chip gelöst sein: neu fotografieren, Datum eintragen, „Ohne Datum“ oder Packung entfernen. Ein leerer Chip wird nie gespeichert.
  - Tests: Unit für die Speicherregel, E2E: Speichern bleibt gesperrt, bis der Chip gelöst ist · Braucht: M6-10
- **M6-12 · Bestätigen aus dem Entwurf, Aufräumen** (M) — IDs: ERF-12, ERF-15 · Quelle: T#speicherpunkte „Bestätigen“, „Aufräumen“ · Ordner: `capture/application`
  - Fertig, wenn: In einer Transaktion: Produkt und Einheiten anlegen, Fotos umhängen und auf „fest“ setzen, dann den Entwurf löschen. Idempotenz-Schlüssel ist die Entwurfs-ID. Ein eigener Use-Case räumt Entwürfe älter als 7 Tage und Dateien ohne DB-Zeile älter als 24 Stunden auf (Aufruf durch den Worker in M11-01).
  - Tests: Integration: Fotos bleiben nach dem Bestätigen, doppeltes Bestätigen, Aufräumen verschont frische Dateien. E2E: kompletter Foto-Ablauf · Braucht: M6-11, M5-01

### M7 · Übersicht und Statistik

- **M7-01 · Übersicht berechnen** (M) — IDs: UEB-01 bis UEB-06, UEB-08 · Quelle: T#rechnung · Ordner: `supply/{application,data}`
  - Fertig, wenn: Ein Use-Case lädt Bestand, Mitglieder, Quelle und Ziel, ruft die Fachlogik aus M2 und liefert ein schmales DTO für alle Kacheln. Keine Rechnung in der UI.
  - Tests: Use-Case mit Fake-Repos, Integration mit Demo-Daten · Braucht: M2-08, M3-08, M4-01
- **M7-02 · Kacheln „Heute versorgt“ und „Ziel“** (M) — IDs: UEB-01, UEB-02, UEB-10, ZIEL-06 · Quelle: D „iPhone“ A Übersicht, `Proto/components/d6/overview/GaugeTile.tsx`, `GoalTile.tsx` · Ordner: `supply/ui`, `src/app/(app)/uebersicht`
  - Fertig, wenn: Instrument mit „X Tage“, Engpass benannt, Schätzwerte erkennbar. „Ziel <Datum>: X von Y Tagen“ mit Hinweis „läuft vor Zieldatum ab“. ⓘ öffnet Rechenweg, Quelle, Stand und Link. „Bearbeiten →“ führt in die Einstellungen. Das Instrument hat eine Textalternative.
  - Tests: E2E mit Demo-Daten, axe · Braucht: M7-01, M3-05
- **M7-03 · Kacheln Wasser und Warengruppen** (M) — IDs: UEB-03, UEB-04 · Quelle: `Proto/components/d6/overview/WaterTile.tsx`, `CategoryTile.tsx` · Ordner: `supply/ui`
  - Fertig, wenn: Wasser in Litern und Tagen. Je Warengruppe ein Balken „X von Y Tagen“, die knappste Gruppe ist mit Wort markiert. Tippen öffnet den Vorrat.
  - Tests: E2E · Braucht: M7-02
- **M7-04 · Kacheln Bald fällig, Nachkaufen, Haushalt, Foto** (M) — IDs: UEB-05, UEB-06, UEB-08, UEB-09 · Quelle: `Proto/components/d6/overview/*` · Ordner: `supply/ui`
  - Fertig, wenn: „Bald fällig“ zeigt gelbe und orange Einheiten nach Datum und öffnet den Vorrat mit Filter. Nachkaufen zeigt die Zahl offener Einträge (bis M8 nur die Ziel-Lücke). Haushalt zeigt Mitglieder und Ernährungsform als Text. „Foto aufnehmen“ öffnet „Neu“.
  - Tests: E2E · Braucht: M7-02
- **M7-05 · Statistik** (M) — IDs: STA-01 bis STA-03 · Quelle: F#sta, `Proto/components/d6/stats` · Ordner: `supply/{application,ui}`, `src/app/(app)/statistik`
  - Fertig, wenn: Erfüllungsgrad (auch über 100 %), Durchhaltezeit passend zu „Heute versorgt“, verbraucht gegen entsorgt je Zeitraum. Ohne Entsorgtes steht ein freundlicher Satz.
  - Tests: Use-Case, E2E · Braucht: M7-01, M4-06, M2-10 · **[USER]** U11 (Bezug des Erfüllungsgrads)

### M8 · Nachkaufen

- **M8-01 · Liste zusammenstellen** (M) — IDs: NK-01, NK-03, NK-04 · Quelle: T#ablauf-nachkaufen · Ordner: `restock/{application,data,schemas.ts}`
  - Fertig, wenn: Die Liste besteht aus gespeicherten Einträgen (nachkauf, manuell) und live berechneten Einträgen aus der Ziel-Lücke je Warengruppe. Lücken-Einträge werden nie gespeichert und verschwinden, wenn die Lücke zu ist.
  - Tests: Use-Case mit Fake-Repos, Integration · Braucht: M7-01
- **M8-02 · Seite Nachkaufen** (M) — IDs: NK-03, NK-04 · Quelle: `Proto/components/d6/restock/RestockScreen.tsx` · Ordner: `restock/{ui,actions}`, `src/app/(app)/nachkaufen`
  - Fertig, wenn: Von Hand ergänzen, abhaken, Erledigte rutschen nach unten, „0 offen“ bei leerer Liste. Alle Nutzer des Haushalts sehen denselben Stand nach dem Neuladen.
  - Tests: E2E mit zwei Nutzern · Braucht: M8-01, M3-05
- **M8-03 · Nach der Entnahme fragen, nach dem Abhaken erfassen** (S) — IDs: NK-02, NK-05 · Quelle: T#ablauf-entnehmen, T#ablauf-nachkaufen · Ordner: `restock/*`, `inventory/ui`, `capture/ui`
  - Fertig, wenn: Nach „1 entnehmen“ fragt die App „Auf Nachkaufen setzen?“. Nach dem Abhaken bietet sie „Jetzt erfassen“ an und öffnet die Erfassung mit Bezeichnung und Kategorie vorausgefüllt.
  - Tests: E2E: entnehmen → Liste → abhaken → Erfassung · Braucht: M8-02, M4-04, M5-02

### M9 · Einstellungen und System

- **M9-01 · Profil** (M) — IDs: EIN-02 · Quelle: F EIN-02 · Ordner: `auth/{ui,actions,application}`
  - Fertig, wenn: Name, E-Mail und Passwort ändern. Das alte Passwort gilt sofort nicht mehr. Keine Sitzungsliste (ERS-05 ist später).
  - Tests: Integration, E2E · Braucht: M3-06
- **M9-02 · Stammdaten Kategorien** (M) — IDs: EIN-04 · Quelle: F EIN-04, `01` Ordnungssystem · Ordner: `settings/*`
  - Fertig, wenn: Admin legt an, benennt um, wählt Piktogramm und Warengruppe, blendet aus und sortiert. System-Kategorien lassen sich ausblenden, nicht löschen. Eigene Kategorie braucht eine Warengruppe. Mitglied liest nur.
  - Tests: Use-Case, Integration, E2E · Braucht: M3-06
- **M9-03 · Stammdaten Lagerorte** (S) — IDs: EIN-04, VOR-05 · Ordner: `settings/*`
  - Fertig, wenn: Admin legt Lagerorte an, benennt um und entfernt unbenutzte. In der Erfassung und beim Bearbeiten stehen sie zur Wahl.
  - Tests: Integration, E2E · Braucht: M9-02
- **M9-04 · Ampel-Schwellen** (S) — IDs: EIN-05 (nur Schwellen) · Quelle: F EIN-05 · Ordner: `settings/*`
  - Fertig, wenn: Admin ändert gelb und orange, orange nie größer als gelb. Vorrat und Übersicht zeigen sofort die neue Ampel. Kein Inventur-Intervall.
  - Tests: Use-Case, E2E · Braucht: M3-06, M2-04
- **M9-05 · Foto-Erkennung an oder aus, Schlüssel-Status** (S) — IDs: EIN-06, EIN-08 · Quelle: F EIN-06, EIN-08, D „Zustände“ c · Ordner: `settings/*`
  - Fertig, wenn: Schalter für den Haushalt mit dem Satz „Fotos werden zur Erkennung an Anthropic (USA) gesendet.“ Anzeige „hinterlegt ✓“ oder „nicht hinterlegt“, der Schlüssel ist nirgends lesbar. Bei „aus“ startet „Neu“ direkt im Formular mit dem Hinweis aus dem Design.
  - Tests: Integration: bei „aus“ erreicht kein Foto den Adapter. E2E · Braucht: M3-06, M6-06
- **M9-06 · Export als JSON, Version und Quellen** (M) — IDs: SYS-01, SYS-06 · Quelle: F#sys · Ordner: `system/*`
  - Fertig, wenn: Nur Admin. Der Export enthält alle Daten des Haushalts ohne Passwort-Hashes, Sitzungen und Push-Schlüssel, vorläufig ohne Fotos (U11). Die Seite zeigt Version, Lizenz der App (bis zur Entscheidung „noch nicht festgelegt“), BBK/BLE mit Stand und Link und die Lizenzen Dritter aus der Lizenzprüfung.
  - Tests: Integration: Export enthält keine Geheimnisse und keinen fremden Haushalt. E2E: Mitglied sieht die Seite nicht · Braucht: M3-06, M0-07

### M10 · PWA und Offline-Anzeige

- **M10-01 · Manifest, Icons, Service Worker** (M) — IDs: PWA-01 · Quelle: `research/26`, T#offline · Ordner: `src/app/manifest.ts`, `src/app/sw.ts`, `public/`
  - Fertig, wenn: Manifest mit Name „Preposaurus“, Icons, `display: standalone`, Startadresse. Serwist in der Turbopack-Variante speichert die App-Hülle. Im Dev-Modus ist der Service Worker aus. Ein Update der App ersetzt den alten Service Worker ohne hängenden Stand.
  - Tests: E2E gegen `next start`: Manifest erreichbar, Service Worker registriert · Braucht: M3-05
- **M10-02 · Letzter Stand ohne Verbindung** (M) — IDs: PWA-05 (Variante A), PWA-04 · Quelle: D „Zustände“ d1, T#offline · Ordner: `src/app/sw.ts`, `src/shared/ui`, `src/shared/hooks`
  - Fertig, wenn: Ohne Verbindung zeigen Übersicht und Vorrat den zuletzt geladenen Stand mit „Keine Verbindung zum NAS. Du siehst den Stand von …“. Erfassen, Entnehmen und alle Formulare sind gesperrt und sagen ruhig warum. Daten eines abgemeldeten Nutzers bleiben nicht im Cache.
  - Tests: E2E mit `context.setOffline(true)`: Anzeige, Sperre, Rückkehr · Braucht: M10-01, M7-04, M4-02
- **M10-03 · Hinweis „Zum Home-Bildschirm“** (S) — IDs: PWA-02 · Quelle: F PWA-02 · Ordner: `src/shared/ui`
  - Fertig, wenn: Im iPhone-Browser erscheint der Hinweis mit kurzer Erklärung, warum das für Push nötig ist. In der installierten App erscheint er nicht. Er lässt sich schließen und bleibt dann weg.
  - Tests: Unit für die Erkennung, E2E · Braucht: M10-01

### M11 · Erinnerungen

- **M11-01 · Worker mit pg-boss** (M) — Quelle: T#ablauf-erinnerungen, CP §7 · Ordner: `src/worker/main.ts`, `src/server/jobs`
  - Fertig, wenn: Der Worker startet aus demselben Code, registriert Zeitpläne in Europe/Berlin und validiert jede Job-Payload mit Zod. `try/catch` nur im Job-Runner. Erster Job: tägliches Aufräumen aus M6-12. Sauberes Beenden bei SIGTERM.
  - Tests: Integration gegen `postgres:18` (nur CI bzw. lokal mit PostgreSQL): Job läuft, Fehler wird protokolliert und wiederholt · Braucht: M6-12
- **M11-02 · Fachlogik der Erinnerungen** (M) — IDs: ERI-02, ERI-03 · Quelle: T#ablauf-erinnerungen Tabelle der Jobs · Ordner: `reminders/domain`
  - Fertig, wenn: Reine Funktionen entscheiden, was für wen fällig ist, und bauen die Texte: Wochenübersicht (Standard Sa 10:00) und „Dringend“ (höchstens eine am Tag, mehrere Einheiten gebündelt). Ton ruhig, keine Nachricht pro Packung.
  - Tests: Unit inkl. Zeitzonen, nichts fällig → keine Nachricht · Braucht: M2-07, M2-04
- **M11-03 · Push: Port, Adapter, Abo** (M) — IDs: ERI-01 · Quelle: T#ablauf-erinnerungen, FAKTEN F12 · Ordner: `src/server/notify`, `src/app/api/push/subscribe`, `src/app/sw.ts`
  - Fertig, wenn: Port mit web-push-Adapter (VAPID aus `env`) und Fake. Das Gerät meldet sich nur nach einem Tipp an. Antwort 404 oder 410 löscht das Abo. Tippen auf die Benachrichtigung öffnet die passende Seite. Im iPhone-Browser erklärt die App, dass Push erst als Home-Bildschirm-App geht.
  - Tests: Unit Adapter mit gemocktem Versand, Integration Abo speichern und entfernen · Braucht: M10-01, M1-06 · **[USER]** U2 (Lizenz web-push)
- **M11-04 · Mail: Port, Adapter, Vorlagen** (S) — IDs: ERI-06 · Quelle: T#ablauf-erinnerungen · Ordner: `src/server/notify`
  - Fertig, wenn: Port mit Nodemailer-Adapter (SMTP aus `env`) und Fake. Ohne SMTP-Angaben meldet der Port „nicht eingerichtet“. Textvorlagen für Wochenübersicht und Check-in-Mail als Text und schlichtes HTML.
  - Tests: Unit mit Fake-Transport · Braucht: M0-04
- **M11-05 · Jobs Wochenübersicht, Dringend, Check-in-Mail** (M) — IDs: ERI-02, ERI-03, ERI-06 · Quelle: T#ablauf-erinnerungen · Ordner: `reminders/application`, `src/server/jobs`
  - Fertig, wenn: Versand je Nutzer nach seinen Einstellungen. Ohne gültiges Push-Abo geht die Wochenübersicht als Mail. „Dringend“ höchstens einmal je Nutzer und Tag (pg-boss-Schlüssel je Nutzer und Tag, keine neue Tabelle). Check-in-Mail wöchentlich, monatlich oder aus. Vorläufig sind Ausweich-Mail und Check-in-Mail zwei Vorgänge mit gemeinsamen Vorlagen (U11).
  - Tests: Use-Case mit Fake-Push und Fake-Mail, Integration in der CI · Braucht: M11-01 bis M11-04
- **M11-06 · Benachrichtigungen einstellen** (M) — IDs: ERI-07, ERI-01 · Quelle: F ERI-07, `Proto/components/d6/settings/account` · Ordner: `reminders/{ui,actions,application}`
  - Fertig, wenn: Jeder Nutzer schaltet Wochenübersicht (Tag, Uhrzeit), Dringend und Check-in-Mail für sich. Push je Gerät an und aus. Ohne eingerichteten Mailversand ist die Check-in-Mail nicht wählbar, mit ruhiger Erklärung.
  - Tests: Integration: Änderung betrifft nur den eigenen Nutzer. E2E · Braucht: M11-03, M3-06

### M12 · Responsive Layouts

Alle Pakete: Quelle D „Geräte und Umbruchpunkte“, „iPhone Duo“, „PC-Browser“, „Wechsel beim Auf- und Zuklappen“. Nur Anordnung, keine neue Logik. Beim Wechsel der Stufe lädt nichts neu: Seite, Filter, Auswahl und laufende Erfassung bleiben. Nichts Antippbares liegt auf der Mitte (Falz). Tests: E2E in allen fünf Viewports plus visuelle Prüfung.

- **M12-01 · Navigation in den Stufen breit und weit** (M) — IDs: PWA-03 · Quelle: D Variante H · Ordner: `src/app/(app)/layout.tsx`, `src/shared/ui`
  - Fertig, wenn: Ab 900 px ersetzt eine Leiste am Rand das Dock, mit denselben fünf Tabs und dem Zahnrad. Bei sehr niedriger Höhe (Duo außen quer, 368 px) ist die Kopfzeile kleiner, das Dock bleibt.
  - Braucht: M3-05
- **M12-02 · Übersicht breit und weit** (M) — IDs: UEB-01 bis UEB-10 · Quelle: D Idee E, Variante H · Ordner: `supply/ui`
  - Fertig, wenn: Bento mit 4 Spalten ab 900 px. Ab 1280 px eine feste rechte Spalte „Bald fällig“.
  - Braucht: M12-01, M7-04
- **M12-03 · Vorrat: Liste und Detail nebeneinander** (M) — IDs: VOR-01, ROT-01 · Quelle: D Idee D · Ordner: `inventory/ui`, `src/app/(app)/vorrat`
  - Fertig, wenn: Ab 900 px Liste links, Detail rechts, die Auswahl bleibt markiert. In der Stufe kompakt ist das Detail wieder eine eigene Seite, „Zurück“ führt zur Liste.
  - Braucht: M12-01, M4-07
- **M12-04 · Vorrat als Tabelle am PC** (M) — IDs: VOR-01 bis VOR-03 · Quelle: D Variante I · Ordner: `inventory/ui`
  - Fertig, wenn: Ab 1280 px eine Tabelle mit Produkt, Kategorie, Behälter, Lagerort, Einheiten, nächstem MHD, Zustand, sortiert nach nächstem MHD. Echte Tabelle mit Spaltenköpfen.
  - Braucht: M12-03
- **M12-05 · Stufe mittel: oben und unten** (M) — Quelle: D Idee J · Ordner: `inventory/ui`, `capture/ui`, `supply/ui`
  - Fertig, wenn: Bei 640 bis 899 px und mindestens 700 px Höhe: Liste oben, Detail unten. Erfassen: Sucher oben, Auslöser und Chips unten. Dock unten. Reihen brechen an der Mitte um.
  - Braucht: M12-03, M6-10
- **M12-06 · Erfassen und Einstellungen breit** (M) — IDs: ERF-01 bis ERF-12, EIN-01 · Quelle: D Idee D, Variante I, „Einstellungen im Detail“ · Ordner: `capture/ui`, `settings/ui`
  - Fertig, wenn: Erfassen ab 900 px: Sucher bzw. Formular links, wachsender Vorschlag und Zusammenfassung rechts. Am PC ohne Kamera startet „Neu“ im Formular (ERF-18 ist später). Einstellungen zweispaltig.
  - Braucht: M12-01, M6-12, M9-05
- **M12-07 · Prüfrunde über alle Screens** (S) — Quelle: Abschnitt 5 dieses Plans · Ordner: `tests/e2e`
  - Fertig, wenn: Jeder Kern-Screen (Anmelden, Übersicht, Vorrat, Detail, Neu manuell, Neu Foto, Nachkaufen, Statistik, Einstellungen) besteht in fünf Viewports axe und die Breitenprüfung. Bildschirmfotos liegen als Vergleichsstand im Repo. Abweichungen vom Design stehen als Issues.
  - Braucht: M12-01 bis M12-06

### M13 · Betrieb: Docker, Backups, Deployment, Anleitung (Issue #1)

- **M13-01 · Dockerfile und Startbefehle** (M) — Quelle: T#docker · Ordner: `docker/Dockerfile`, `.dockerignore`, `src/app/api/health`
  - Fertig, wenn: Mehrstufiges Image auf Node 24 (slim, seit #187 Node 26), läuft als Nicht-Root. Ein Image, drei Befehle: `web`, `worker`, `migrate` (Migrationen plus Seeds, dann Ende). `/api/health` antwortet ohne Anmeldung und ohne Daten. sharp läuft auf amd64 und arm64.
  - Tests: CI baut das Image für amd64 und startet es gegen `postgres:18` · Braucht: M3-01 für `web` und `migrate`. Der Befehl `worker` kommt mit M11-01 dazu
- **M13-02 · Compose-Dateien** (M) — Quelle: T#docker, T#tailscale, FAKTEN F5, F14 · Ordner: `compose.yaml`, `compose.tailscale.yaml`, `docker/tailscale/serve.json`
  - Fertig, wenn: Dienste `db` (PostgreSQL 18, Volume auf `/var/lib/postgresql`, Healthcheck), `migrate`, `web`, `worker`, `backup`. Reihenfolge db → migrate → web und worker. Ordner `db`, `fotos`, `backups` als Bind-Mounts. Port 3000 nur an 127.0.0.1. Die Überlagerung hängt `web` an den Tailscale-Sidecar mit Serve, Funnel bleibt aus. Images mit fester Versionsnummer.
  - Tests: CI: `docker compose up` (ohne Tailscale) bis `/api/health` grün · Braucht: M13-01 · **[USER]** U7, U8
- **M13-03 · Backup-Container und Wiederherstellung** (M) — Quelle: T#backups · Ordner: `docker/backup`
  - Fertig, wenn: Täglich `pg_dump -Fc` (Version 18) und eine versionierte Sicherung der Fotos nach `backups`. Aufbewahrung 7 tägliche und 4 wöchentliche Stände. Ein Skript spielt einen Stand in eine leere DB zurück.
  - Tests: CI: sichern, in leere DB zurückspielen, Zeilenzahlen vergleichen. Unit für die Rotation · Braucht: M13-02
- **M13-04 · Release-Workflow für amd64 und arm64** (M) — Quelle: `05` Annahme NAS · Ordner: `.github/workflows/release.yml`
  - Fertig, wenn: Ein Git-Tag `vX.Y.Z` baut mit buildx beide Architekturen und schiebt das Image mit Versions-Tag in die GitHub Container Registry. Kein `latest` in der Compose-Datei.
  - Tests: Probelauf mit einem Vorab-Tag · Braucht: M13-01 · **[USER]** U10
- **M13-05 · Einrichtungsanleitung** (M) — Quelle: Issue #1 (11 Punkte), T#einrichtung · Ordner: `docs/INSTALLATION.md` (umbenannt, siehe `05` M13), `README.md`
  - Fertig, wenn: Jeder Punkt aus Issue #1 ist als Schritt mit Befehl und erwartetem Ergebnis beschrieben, dazu Updates, Rückweg und Fehlerbehebung. Beide Tailscale-Wege sind erklärt, der Sidecar ausführlich. Hinweise: neutraler Gerätename, `.env` nie ins Repository, zweiter Backup-Ort verschlüsselt.
  - Tests: keine · Braucht: M13-02, M13-03, M13-04 · **[USER]** U7
- **M13-06 · Erste Installation und Abnahme auf echten Geräten** (S) — Quelle: FAKTEN F12, F13, D „Offene Punkte“ · Ordner: `docs/INSTALLATION.md` (Prüfliste)
  - Fertig, wenn: **[USER]** hat nach der Anleitung installiert und die Prüfliste abgehakt: Kamera in der Home-Bildschirm-App, Push, Verhalten bei ausgeschaltetem Tailscale, Wiederherstellung eines Backups. Fehler stehen als Issues.
  - Braucht: M13-05 · **[USER]** U7, U8, U9, U13

### M14 · PoC Foto-Erkennung

- **M14-01 · Messskript** (M) — Quelle: `01` PoC, `05` Nächste Schritte 2 · Ordner: `scripts/poc-recognition/`, Daten in `poc/` (Anleitung `docs/POC_ERKENNUNG.md`)
  - Fertig, wenn: `npm run poc:recognition` liest Fotos je Rolle aus `poc/fotos/` (nicht im Repository) samt einer Datei mit den erwarteten Werten, schickt jedes Foto über den Adapter aus M6-05 an beide Modelle und schreibt je Modell und Rolle: Treffer je Feld, Zahl der `null`, **erfundene MHDs**, Dauer, Kosten.
  - Tests: Unit für die Auswertung mit Fake-KI · Braucht: M6-05
- **M14-02 · Fotos und Erwartungswerte** (S) — **[USER]** U5, U6
  - Fertig, wenn: Etwa 15 Verpackungs-, 10 Nährwert- und 30 MHD-Fotos liegen in `poc/fotos/`, darunter schwierige Fälle (geprägt, schräg, nur Monat und Jahr, „zu verbrauchen bis“, unleserlich). Die erwarteten Werte sind eingetragen, der Anthropic-Schlüssel steht in `.env`.
  - Braucht: M14-01
- **M14-03 · Messlauf und Bericht** (S) — Ordner: `docs/poc/FOTO_ERKENNUNG.md`
  - Fertig, wenn: Der Bericht vergleicht Sonnet 5.5 und Haiku 5.5 je Rolle und empfiehlt ein Modell je Rolle. Jedes erfundene MHD ist mit Foto-Name aufgeführt. **[USER]** entscheidet das Modell je Rolle, die Entscheidung steht in `05`.
  - Braucht: M14-02

## 5. Teststrategie

| Wann | Was läuft | Dauer-Ziel |
|---|---|---|
| **pre-commit** (lefthook) | Prettier und ESLint auf den geänderten Dateien, `tsc --noEmit` | unter 30 s |
| **pre-push** (lefthook) | knip, Vitest komplett: Unit, Use-Case mit Fakes, Integration gegen PGlite | unter 2 min |
| **CI je PR** | lint, `lint:budget`, typecheck, knip, Vitest mit Abdeckung (PGlite), Vitest-Integration und Worker gegen `postgres:18`, `next build`, Playwright gegen `next start`, Lizenzprüfung | unter 15 min |
| **CI auf `main` und Tags** | zusätzlich Docker-Build, Compose-Rauchtest, bei Tags Multi-Arch-Release | – |
| **von Hand bzw. im PoC** | echte Anthropic-Aufrufe (M14), Abnahme auf iPhone und NAS (M13-06) | – |

- **Ebenen** wie CP §10. Unit für `domain/` und `shared/lib`, Use-Case-Tests mit Fake-Repos und Fake-Adaptern, Integration für Repositories und Migrationen, E2E für Kernabläufe.
- **E2E mit Playwright:** lokal gegen den Dev-Server (`npm run dev`, PGlite mit Demo-Daten, alle Fakes), in der CI gegen `next build` plus `next start` und `postgres:18`. Jeder Test startet mit frischer DB. Jede Seite durchläuft axe. Kamera-Tests laufen nur in Chromium mit Fake-Kamera, WebKit prüft Layout und Bedienung.
- **Kernabläufe als E2E:** Ersteinrichtung · anmelden · manuell erfassen · per Foto erfassen mit Fake-KI inklusive nicht lesbarem Datum · entnehmen und Nachkaufen · entsorgen und Historie · Rollen (Mitglied sieht und darf weniger) · offline lesen.
- **Die Regel „kein erfundenes Datum“** ist dreifach abgesichert: Unit (M2-02, M2-09, M6-04), Use-Case (M5-01 ergänzt kein Datum: ohne Datum gilt „Datum fehlt“ (#116), eine Schätzung braucht das Kennzeichen und ist nie taggenau), E2E (M6-11 sperrt Speichern).
- **Visuelle Prüfung im Browser:** bei jedem Paket mit `ui/`-Änderung, vor dem Öffnen der PR. Fünf Größen: 375×812, 382×580 (Duo außen), 669×867 (Duo innen hochkant), 951×585 (Duo innen quer), 1280×800. Geprüft wird: kein waagrechtes Scrollen, Touch-Ziele, Fokus, Ampel mit Wort, Text nicht abgeschnitten. Bildschirmfotos kommen in die PR. Bis M12 genügt 375 px plus ein Blick auf 1280 px (darf einfach, aber nicht kaputt aussehen). Ab M12 alle fünf.
- **Nicht automatisch prüfbar** und deshalb in M13-06: Kamera in der Home-Bildschirm-App unter iOS, Web-Push auf dem iPhone, Maße der Home-Bildschirm-App auf dem Duo (Xcode-Simulator), Tailscale Serve.

## 6. Definition of Done je Paket

- [ ] Alle Akzeptanzkriterien des Pakets und der genannten Funktionskarten sind erfüllt, nicht mehr und nicht weniger. Nichts aus „später“ ist mitgebaut.
- [ ] `npm run check` ist grün (lint, budget ohne neue Warnungen, typecheck, knip, Tests). Die CI ist grün.
- [ ] Datei ≤ 200 Zeilen (hart 300), Funktionen klein, richtige Schicht, kein `eslint-disable` ohne Begründung.
- [ ] Die genannten Tests existieren. Neue Fachlogik hat Unit-Tests, ein Bugfix einen Regressionstest.
- [ ] Jede Action und Route prüft Sitzung, Rolle und Haushalt und validiert mit Zod. Repositories filtern auf den Haushalt.
- [ ] KI-Ergebnisse sind nur Vorschläge, kein Pfad erfindet ein Datum, manuell geht immer.
- [ ] Schemaänderung nur als neue Migration, SQL gelesen, läuft auf PGlite und PostgreSQL 18.
- [ ] UI: deutsch, ruhiger Ton, Tastatur, Labels, Kontrast, `prefers-reduced-motion`, visuell geprüft (Abschnitt 5), Bildschirmfotos in der PR.
- [ ] Keine Geheimnisse, Fotos oder personenbezogenen Daten in Code, Logs oder Tests. Neue Variablen stehen in `.env.example`.
- [ ] Neue Abhängigkeit: Lizenz geprüft, exakt gepinnt, in der PR begründet.
- [ ] Eine PR je Paket, Conventional Commit, Squash-Merge, Issue verlinkt. Entscheidungen stehen in `05_STATUS_ENTSCHEIDUNGEN.md`.
- [ ] Stößt der Agent auf einen **[USER]**-Punkt ohne vorläufige Annahme, baut er nicht weiter, sondern schreibt die Frage ins Issue.

## 7. Risiken und offene Punkte

### 7.1 [USER]-Punkte

Punkte, die eine Entscheidung oder Handlung des Maintainers brauchen. Die vorläufige Annahme sorgt dafür, dass die Arbeit bis dahin weitergehen kann.

| Nr. | Was | Wann nötig | Vorläufige Annahme, damit die Arbeit weitergeht |
|---|---|---|---|
| U1 | Die fünf Vorschläge aus CP §14 bestätigen (Issue #2) | M0 | gelten wie in CP beschrieben |
| U2 | Lizenz-Ausnahmen: `web-push` ist MPL-2.0, sharp bringt libvips als LGPL-3.0-or-later mit, Nodemailer ist MIT-0. Das passt nicht wörtlich zu „nur MIT, Apache, BSD, ISC“ | M0-07, M11-03 | Ausnahmen zulassen, weil der Stack diese Pakete nennt und alle drei mit MIT, GPL und AGPL vereinbar sind (FAKTEN F9). Alternative: Web-Push selbst umsetzen |
| U3 | Empfehlungswerte freigeben: BBK/BLE-Mengen, Bedarf je Person, Ersatzregeln vegetarisch und vegan, kcal-Durchschnitt und übliche Haltbarkeit je Kategorie | M1-09, vor M13-06 | Code und Tests nutzen Testwerte. Der Seed bleibt „nicht geprüft“ |
| U4 | Optional: PostgreSQL 18 lokal installieren, damit Worker-Tests auch lokal laufen | M11 | ohne Installation laufen sie nur in der CI |
| U5 | Anthropic-API-Schlüssel für die Testumgebung des PoC und für den Betrieb | M14-02, M13-06 | bis dahin nur Fake-KI |
| U6 | Testfotos für den PoC bereitstellen | M14-02 | Fotos bleiben außerhalb des Repositorys (`poc/` ist ignoriert) |
| U7 | Zielumgebung NAS: Architektur, Docker, Ordnerstruktur | M13-02, M13-05 | amd64 und arm64, Sidecar |
| U8 | Tailscale-Testumgebung: MagicDNS und HTTPS, neutraler Gerätename, Auth-Schlüssel für den Sidecar | M13-06 | – |
| U9 | SMTP-Zugang für die Mail-Tests | M13-06 | ohne SMTP sind Mails aus, Push geht trotzdem |
| U10 | GitHub: Registry-Zugang für das NAS (Lese-Token), Regel für das Mergen der Agenten-PRs | M0-07, M13-04 | PRs bleiben offen, bis der Maintainer oder ein Review-Agent mergt |
| U11 | Offene Fachfragen ohne Empfehlung im Konzept (siehe 7.3) | jeweils genannt | je Zeile in 7.3 |
| U12 | Endgültig: Offline-Verhalten | vor dem ersten Release | Offline nur lesen. Lizenz (AGPL-3.0-or-later) und Name (Preposaurus) sind entschieden |
| U13 | Abnahme auf einem echten iPhone, optional im Simulator für das iPhone Duo | M13-06, M12-07 | – |
| U14 | Optional: Docker lokal | nie zwingend | Docker läuft nur in der CI und auf dem NAS |

### 7.2 Technische Risiken

| Risiko | Folge | Gegenmaßnahme |
|---|---|---|
| PGlite weicht von PostgreSQL 18 ab oder läuft im Dev-Server instabil | lokale Tests grün, CI rot | CI wiederholt alles gegen `postgres:18`. Ausweg: PostgreSQL lokal (U4) |
| pg-boss läuft nicht auf PGlite | Worker lokal nicht testbar | Fachlogik und Use-Cases der Erinnerungen sind ohne Worker testbar, nur M11-01 braucht echtes PostgreSQL |
| Unsichere Werkzeugpunkte aus CP §9 (Plugins, boundaries v7, tsconfig) | M0 dauert länger | M0-02 und M0-03 prüfen gezielt, Ersatz `dependency-cruiser` |
| Next 16 weicht vom Trainingswissen der Agenten ab | falsche APIs | Jedes Paket liest die Doku unter `node_modules/next/dist/docs/` (wie `prototypes/AGENTS.md`) |
| Better Auth: deutsche Tabellennamen, Registrierung aus, Einladung, Startpasswort | Mehraufwand in M1-02 und M3 | Rückfall auf Standardnamen. Einladung notfalls als eigene Tabelle statt Plugin |
| Anthropic-SDK hat sich seit der Recherche geändert (0.132 → 1.x) | Adapter passt nicht | M6-05 prüft die Schnittstelle gegen die aktuelle Doku |
| Serwist mit Turbopack und Server Components, Cache enthält Nutzerdaten | veraltete oder fremde Daten | M10-02 löscht den Cache beim Abmelden, E2E prüft es |
| Zwei Migrations-PRs gleichzeitig | Konflikt im Journal | Schema nur in M1, nacheinander |
| Kamera und Push auf iOS nur auf echtem Gerät prüfbar | späte Überraschung | M13-06 früh einplanen, sobald M6 und M11 stehen. Manuell geht immer |
| Docker lokal nicht vorhanden | Compose-Fehler erst in der CI | CI-Rauchtest in M13-02, Tailscale-Überlagerung nur auf dem NAS prüfbar |
| 102 Pakete, viele hängen aneinander | parallel arbeitende Agenten blockieren sich | Reihenfolge aus Abschnitt 8, M2 und M1-08 laufen parallel zu allem |

### 7.3 Widersprüche und Lücken, soweit sie die Umsetzung betreffen

**Entschieden durch Rangfolge und Freigabe** (PLAN §8, nur zur Klarheit für die Agenten):
W1 Zugriff immer über Tailscale · W3 nur Anthropic, Adapter bleibt austauschbar · W5 Rollen Admin und Mitglied · W6 Status `entsorgt` · W7 Tabelle `nachkauf_eintrag`, Tab „Nachkaufen“ · W8 Modell im MVP nur über `.env` · W9 Start mit Sonnet 5.5 · W11 Schätzung nur auf Wunsch und markiert · W13 fünf Mitgliedstypen nach `02` · W14 keine Mengen aus dem Prototyp · W16 Offline nur lesen · L8, L10, L12, L13, L14 wie freigegeben (neue Tabellen, Lagerort am Produkt, Entwurf auf dem NAS, Löschen nur Admin, Mitglieder dürfen bearbeiten). W17, W19, L17, L18, L21, L23, L24 entfallen im MVP, weil die Funktionen später kommen.

**Vom Plan aufgelöst** (bitte prüfen):
- **KI-Einwilligung:** Die Technik-Seite schlägt eine einmalige Bestätigung je Nutzer vor, der Katalog führt sie als EIN-11 „später“. Der MVP-Zuschnitt gewinnt: im MVP nur Haushaltsschalter und sichtbarer Hinweis.
- **Idempotenz-Schlüssel:** braucht eine Spalte, die in keiner Skizze steht. Lösung: `produkt.erfassung_id`, eindeutig.
- **Ernährungsform in den Quellwerten:** Die Verteilung kommt als versionierte Seed-Daten, nicht als fester Code. Die genaue Tabellenform legt M1-04 nach dem Prüfblatt fest.
- **„Dringend höchstens einmal am Tag“:** über einen pg-boss-Schlüssel je Nutzer und Tag, ohne zusätzliche Tabelle.
- **Erster Admin (L2):** Die Einrichtung ist nur erreichbar, solange kein Nutzer existiert. Die App hängt nie am offenen Internet.
- **Login, Einladung, Ersteinrichtung ohne Gestaltung (L3):** werden aus den Bausteinen in `src/shared/ui` (DESIGN_SYSTEM.md) gebaut, schlicht und einspaltig.
- **CP §5 nennt noch GSAP, CP §10 eine Compose-Test-DB:** überholt, M0-08 korrigiert beides.

**Nicht freigegeben, [USER] U11.** Die vorläufige Annahme ist jeweils so gebaut, dass eine andere Antwort nur eine Stelle ändert:

| Frage | Betrifft | Vorläufige Annahme |
|---|---|---|
| Zählt „Noch gut“ zu „versorgt“, und wie lange gilt die Prüfung? (W12, L9) | M2-07, M4-05 | zählt nicht, wie im Prototyp |
| Wasser als eigene Kategorie und Warengruppe, getrennt von Getränken? (W10) | M1-07, M2-07 | ja, die Rechnung braucht es |
| Baby im MVP, solange HH-05 später ist (L20) | M2-06, M7-02 | Baby lässt sich anlegen, zählt nicht im Bedarf. „So wird gerechnet“ sagt das |
| Bezug des Erfüllungsgrads (STA-01) | M2-10, M7-05 | Zieldauer |
| Check-in-Mail und Ausweich-Mail: eine oder zwei? (L16) | M11-05 | zwei Vorgänge, gleiche Vorlagen |
| KI aus: Fotos trotzdem als Produktbild? (ERF-16) | M9-05 | nein, nur Formular |
| Fotos im JSON-Export? (SYS-01) | M9-06 | nein |
| Rundung der Kennzahlen | M2-07 | abrunden auf eine Nachkommastelle |
| Schrift und Piktogramme (W18, L26) | M3-04 | entschieden: Systemschrift und eigene Linien-Piktogramme (DESIGN_SYSTEM.md §2, §5) |
| Vorrat-Filter: drei Reihen (A) oder eine Reihe plus „Filter“ (B) | M4-02 | drei Reihen |
| Eigene Ampelstufe für das Verbrauchsdatum | M2-04 | nein, nur die Regel aus ROT-06 |
| Tailscale-Zugang für weitere Haushaltsmitglieder (L4) | M13-05 | Anleitung beschreibt beide Wege |

**Noch offen aus Issue #3:** ROT-08 entfällt (später). `linkMemberAction` für HH-06 ist in M3-10 eingeplant. `quelle_bedarf` kommt mit M0-08 in den Kanon. Die Freigaben stehen schon in `05`. Issue #3 kann nach M0-08 und M3-10 geschlossen werden.

## 8. Reihenfolge für die ersten drei Durchläufe

Regeln: Pakete einer Kette laufen nacheinander, jede PR baut auf dem gemergten Stand der vorigen auf. Parallel läuft nur, was keine gemeinsamen Dateien anfasst. Ein blockiertes Paket hält die Kette an, die Parallel-Spur läuft weiter.

| Durchlauf | Kette (nacheinander) | Parallel dazu | Danach prüft der Maintainer |
|---|---|---|---|
| 1 | M0-01 → M0-02 → M0-03 → M0-04 → M0-05 | M1-08 (Prüfblatt, nur Dokument) · M0-08 (Dokumente) | U1, U2 beantworten, Prüfblatt lesen (U3) |
| 2 | M0-06 → M0-07 → M1-01 → M1-02 → M1-03 → M1-04 | M2-01 → M2-02 → M2-04 → M2-05 · M2-03 | CI grün? U10 klären |
| 3 | M1-05 → M1-06 → M1-07 → M1-10 → M3-01 | M2-06 → M2-07 → M2-08 · M2-09 · M3-04 (Tokens und Bausteine) | U11-Fragen zu „Noch gut“, Wasser, Rundung, Schrift |

Danach: M3 (Anmeldung und Rahmen) → M5-01 → M4 → M5 → M7 → M6 → M8 → M9 → M10 → M11 → M12 → M13. M14 startet, sobald M6-05 fertig ist und U5 sowie U6 erfüllt sind. M13-01, M13-02 und M13-04 können schon nach M3 vorgezogen werden (zunächst ohne Worker und Backup), damit das NAS früh ein lauffähiges Image bekommt.
