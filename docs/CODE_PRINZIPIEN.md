# Preposaurus – Code-Prinzipien

> Verbindliche Referenz für den Code. Sie ergänzt `CLAUDE.md` (Abschnitte „Code-Qualität“ und „Datenbank“) und widerspricht ihr nicht. Abweichungen stehen als **Vorschlag** markiert. Bis sie beschlossen sind, gilt `CLAUDE.md`.
> Stand: 22.11.2026. Stack laut `research/26_tech_stack_mvp.md`. Mit **(unsicher)** markierte Punkte beim Aufsetzen gegen die Doku prüfen.

## 1. Kurzfassung: 10 Regeln

1. **Kleine Dateien:** Richtwert ≤ 200 Zeilen, harte Grenze 300. Der Linter bricht ab 300 ab.
2. **Kleine Funktionen** mit einer Aufgabe: ≤ 40 Zeilen (Komponenten ≤ 80), Komplexität ≤ 10, höchstens 3 Parameter.
3. **Schichten nur nach unten:** `ui → actions → application → domain`, Datenzugriff nur über `data`. Ein Lint-Plugin erzwingt das.
4. **Fachlogik ist rein:** `domain/` kennt weder React noch Next, DB oder `process.env` und ist zu 100 % per Vitest testbar.
5. **Ein Schema, viele Nutzer:** Zod-Schemas einmal definieren und für Formular, Action, API und KI-Output verwenden. Validiert wird an jeder Systemgrenze.
6. **Erwartete Fehler sind Rückgabewerte** (`Result`), unerwartete werden geworfen und landen in `error.tsx`.
7. **Server-Code bleibt auf dem Server:** `import 'server-only'` in `data/`, `application/` und `server/`. Jede Server Action prüft selbst Session und Berechtigung.
8. **Externe Dienste nur über Adapter** (KI, Speicher, Mail, Push). Ein Anbieterwechsel betrifft eine Datei.
9. **Kein toter Code:** knip, `no-console` und typescript-eslint laufen vor Commit bzw. Push. TODOs gibt es nur mit Issue-Nummer.
10. **Barrierefrei und auf Deutsch:** WCAG 2.2 AA, semantisches HTML, ruhiger Ton. Code-Bezeichner sind englisch, UI-Texte deutsch.

## 2. Ordnerstruktur und Schichten

```
src/
├─ app/                      # Routing: page/layout/route/error, dünn, keine Logik
│  ├─ (app)/vorrat/page.tsx  # Server Component: Use-Case aufrufen → UI rendern
│  └─ api/…/route.ts         # Route Handler: wie eine Action (validieren → Use-Case)
├─ features/<feature>/       # fachlich geschnitten: inventory, recognition, household-goal …
│  ├─ ui/                    # Komponenten + Client-Hooks NUR dieses Features
│  ├─ actions/               # 'use server', eine Action pro Datei
│  ├─ application/           # Use-Cases, eine Datei pro Use-Case, server-only
│  ├─ domain/                # reine Funktionen + Typen (+ *.test.ts)
│  ├─ data/                  # Repositories (Drizzle), server-only
│  └─ schemas.ts             # Zod-Schemas des Features (zu groß: Ordner schemas/, #175)
├─ server/                   # Infrastruktur: db/, auth/, ai/, storage/, notify/, jobs/
├─ shared/                   # featurefrei: ui/, hooks/, lib/ (dates, quantities, result), config/
└─ worker/                   # Einstieg Job-Container
db/migrations/ · db/seeds/ · tests/e2e/
```

**Erlaubte Importrichtungen** (alles andere ist ein Lint-Fehler):

| Von ↓ darf importieren → | ui | actions | application | domain | data | schemas | server | shared |
|---|---|---|---|---|---|---|---|---|
| `app/` | ✓ | ✓ | ✓ (nur Server Components) | ✓ | – | ✓ | `auth` | ✓ |
| `ui/` | ✓ | ✓ | – | ✓ (Typen, reine Helfer) | – | ✓ | – | ✓ |
| `actions/` | – | – | ✓ | ✓ | – | ✓ | `auth` | ✓ |
| `application/` | – | – | ✓ | ✓ | ✓ | ✓ | ✓ (Ports/Adapter) | ✓ |
| `domain/` | – | – | – | ✓ | – | – | – | `shared/lib`, Typen aus `shared/config` |
| `data/` | – | – | – | ✓ (Typen) | ✓ | – | `db` | ✓ |
| `server/` | – | – | – | ✓ (Typen) | – | ✓ | ✓ | ✓ |
| `shared/` | – | – | – | – | – | – | – | ✓ |

- **Zwischen Features** sind nur `application/`, `schemas.ts` und `domain/`-Typen des anderen Features erlaubt. Es gibt **keine Barrel-Dateien** (`index.ts`), weil sie Server- und Client-Code vermischen und knip ausbremsen.
- **Server/Client:** Seiten und Layouts sind Server Components. `'use client'` steht nur an Blättern (Formular, Interaktion). Client-Komponenten bekommen schmale DTOs, nie DB-Zeilen [1][2].
- **`process.env`** liest nur `shared/config/env.ts` (Zod-validiert). Keine Schlüssel mit `NEXT_PUBLIC_` [1].

## 3. Harte Grenzen

| Regel | Grenze | Erzwungen durch |
|---|---|---|
| Zeilen pro Datei | Richtwert 200 (Warnung), hart 300 (Fehler); Leer- und Kommentarzeilen zählen nicht | `max-lines` + Skript `lint:budget` |
| Zeilen pro Funktion | 40, in `*.tsx` 80, in Tests aus | `max-lines-per-function` |
| Zyklomatische Komplexität | 10 | `complexity` |
| Verschachtelungstiefe | 3 | `max-depth` |
| Parameter | 3, darüber ein Options-Objekt | `max-params` |
| Callback-Verschachtelung | 3 | `max-nested-callbacks` |
| JSX-Tiefe | 6 | `react/jsx-max-depth` |
| Komponenten pro Datei | 1 exportierte | `react/no-multi-comp` (Warnung) + Review |
| Ungenutzte Dateien, Exporte, Abhängigkeiten | 0 | knip |
| Importrichtungen | Tabelle oben | `eslint-plugin-boundaries` |
| Warnungen im Commit | 0 | `eslint --max-warnings=0` |

ESLint kennt pro Regel nur eine Stufe. Deshalb steht in der Config die harte 300, und der Richtwert 200 läuft als eigenes Skript (siehe 9.1). Ausnahmen wie generierte Migrationen oder Seeds stehen in `ignores`, nie per `eslint-disable` im Code. Ein `eslint-disable` braucht eine Begründung (`-- weil …`) [3].

## 4. Benennung

- **Dateien:** Komponenten `PascalCase.tsx` (wie im Prototyp `d6`), sonst `kebab-case.ts`. Hooks heißen `use-xyz.ts`, Tests liegen daneben als `xyz.test.ts`.
- **Bezeichner englisch**, Fachbegriffe einheitlich: MHD → `bestBefore`, Einheit/Packung → `unit`, Vorrat → `stock`, Haushalt → `household`, Versorgungstage → `supplyDays`.
- **Funktionen** beginnen mit einem Verb (`calculateSupplyDays`, `pickFifoUnit`), **Booleans** mit `is/has/can`. Use-Cases heißen nach der Absicht (`addUnits`), Actions mit Suffix `Action`.
- **Konstanten** stehen zentral in `shared/config/constants.ts` bzw. in `schemas.ts` des Features. Statt TS-`enum` gilt `as const` + Union-Typ, weil `erasableSyntaxOnly` Enums verbietet. Stammdaten (Kategorien, Einheiten) liegen in der DB bzw. in Seeds.
- **Kein `default export`**, außer wo Next ihn verlangt (`page`, `layout`, `error`, `route`-Konfigurationen, Config-Dateien).
- Kommentare erklären nur das **Warum**. Für das Was sorgen gute Namen.

## 5. Komponenten-Regeln

- Eine Komponente pro Datei, Props als benannter `type …Props`. Mehr als 5 Props deutet auf eine nötige Aufteilung hin.
- Präsentation (`shared/ui`, ohne Fachwissen) und Feature-Komponenten (`features/*/ui`) bleiben getrennt. Wiederkehrende UI wandert nach `shared/ui`.
- Keine Daten-Fetches in Client-Komponenten. Daten kommen von der Server-Seite oder über Actions.
- Formulare nutzen `useActionState` + Server Action. Fehlermeldungen pro Feld aus `z.flattenError` und Status mit `aria-live` [4].
- **React Compiler** einschalten (`reactCompiler: true`, seit Next 16 stabil) [5]. Dann gibt es kein `useMemo`/`useCallback` „auf Verdacht“, und die Compiler-Regeln aus `eslint-plugin-react-hooks` (`purity`, `refs`, `set-state-in-effect` …) bleiben an [6].
- Animationen nur mit **CSS** (Übergänge, View Transitions), keine Animationsbibliothek und kein GSAP (UMSETZUNG Grundentscheidung 10). `prefers-reduced-motion` gilt immer, die Grundregel steht in `src/app/globals.css`.

## 6. Fehlerbehandlung

- **Erwartete Fehler** (Validierung, „nicht gefunden“, „kein Recht“, „KI hat nichts erkannt“) sind **Rückgabewerte**. Next empfiehlt für Server Functions ausdrücklich Rückgabewerte statt `throw` [4]. Typ in `shared/lib/result.ts`: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`, keine Bibliothek.
- Fehlerarten als diskriminierte Union (`{ kind: 'not-found' } | { kind: 'invalid', issues }`), `switch` erschöpfend. Die Action übersetzt `Result` in ein `ActionState` mit freundlichem deutschem Text.
- **Unerwartete Fehler** (Bug, DB weg) werden geworfen und vom nächsten `error.tsx` aufgefangen. `try/catch` steht nur an Grenzen: Adapter, Job-Runner, Event-Handler.
- `catch (e)` ist `unknown` (`useUnknownInCatchVariables`). Nie still schlucken, immer loggen oder weitergeben.
- Logging läuft über einen kleinen Logger in `shared/lib/logger.ts`, nicht über `console.*`. Keine Fotos, Keys oder personenbezogenen Daten ins Log.
- `neverthrow` ist bewusst **nicht** eingeplant: Die letzte Version ist von Feb. 2025, und der eigene Typ reicht.

## 7. Validierung an Systemgrenzen (Zod 4)

Validiert wird **überall, wo Daten von außen kommen**, und danach nicht mehr:
- `FormData` und Argumente jeder Server Action (die Action ist per POST direkt aufrufbar [1])
- Route Handler: Body, Query, `params`, `searchParams`
- KI-Antworten: eigenes, schlankes KI-Schema (alle Felder Pflicht und nullable), dann Mapping ins Domain-Schema. Ein fehlendes Datum bleibt `null`, nie erfunden.
- ENV beim Start (`env.ts`), Job-Payloads im Worker, Datei-Uploads (Typ, Größe)

Regeln:
- `safeParse` an Grenzen, Typen per `z.infer` statt doppelter Interfaces.
  - **Ausnahme: gespiegelte Antworttypen in `domain/`.** `domain/` darf kein Zod importieren. Braucht die Fachlogik die Form einer KI-Antwort (z. B. `capture/domain/ai-answers.ts`), steht der Typ dort noch einmal von Hand. Ein Typtest mit `expectTypeOf<z.infer<…>>().toEqualTypeOf<…>()` (z. B. `src/server/ai/schema-types.test.ts`) hält beide deckungsgleich, `tsc` bricht bei jeder Abweichung ab. Quelle bleibt das Zod-Schema. Ohne einen solchen Typtest ist die Spiegelung nicht erlaubt.
- Fehler fürs Formular mit `z.flattenError`, für Logs mit `z.prettifyError`. `formatError` ist veraltet [7].
- Innerhalb von `domain/` und `application/` gelten die Typen. Dort wird nicht erneut validiert.

## 8. Datenbank, Migrationen, Adapter

- **Schema in `server/db/schema/*.ts`**, eine Datei pro Bereich. Migrationen nur über `drizzle-kit generate` (`npm run db:generate`) → Review der SQL-Datei → `npm run db:migrate` (Container `migrate`). **Kein `drizzle-kit push`**, auch nicht lokal gegen die Projekt-DB [8].
  - **Umgesetzt in M1-01:** `db:migrate` ruft `src/server/db/migrate.ts` auf, das den Migrator von drizzle-orm nutzt (gleicher Code wie `createTestDb()` in den Tests). So braucht der Container später kein `drizzle-kit`, das nur Entwicklungsabhängigkeit ist. Beide Wege schreiben in dieselbe Tabelle `drizzle.__drizzle_migrations`.
  - **Umgesetzt in M13-01:** Im Container läuft derselbe Code, vorab gebündelt mit `npm run build:cli` (esbuild) nach `scripts/migrate.mjs` und `scripts/seed.mjs`. `db/migrations` liegt im Image unter `/app/db/migrations`.
- Migrationen sind eingecheckt und werden nach dem Merge nie mehr editiert. Eine Korrektur ist eine neue Migration.
- Typen: Mengen als `numeric`, MHD als `date`, Zeitpunkte als `timestamptz`. Jede Tabelle hat `id`, `created_at`, `updated_at`. Fremdschlüssel bekommen ein explizites `onDelete`.
- Spalten in `snake_case`. **Geprüft in M1-01:** drizzle-orm 0.45.4 und drizzle-kit 0.31.11 kennen `casing: 'snake_case'` weiterhin (in `drizzle()` und `defineConfig`). Wir brauchen die Option aber nicht: Tabellen und Spalten tragen deutsche Namen (UMSETZUNG Grundentscheidung 6), die Drizzle-Eigenschaften englische. Deshalb steht jeder Spaltenname ausdrücklich im Schema (`text('bezeichnung')`), und `casing` bleibt aus.
- **Nutzer werden nie hart gelöscht**, nur deaktiviert (`aktiv = false`). So bleiben Historie (`entnommen_von`, `passwort_geaendert_von`) und Verweise erhalten. Ein Repository bietet dafür kein `delete`.
- **Jede Abfrage ist auf `householdId` gefiltert**, und zwar im Repository statt in der UI (Schutz gegen IDOR [1]).
- Repositories geben Domain-Typen bzw. DTOs zurück, nie die rohe Drizzle-Zeile an die UI.
- Seeds sind versionierte TS-Dateien mit idempotentem Upsert. Empfehlungswerte haben Quelle, Stand und Link.
- **Adapter:** Den Port (Interface) definiert der Verbraucher, z. B. `server/ai/vision-recognizer.ts`. Implementierungen liegen je in einer Datei (`anthropic-adapter.ts`, `openai-adapter.ts`, `local-file-storage.ts`). Die Auswahl übernimmt eine Factory per ENV. Tests nutzen Fake-Adapter.

## 9. Werkzeuge und Konfiguration

### 9.1 ESLint (Flat Config, `eslint.config.mjs`)

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import boundaries from 'eslint-plugin-boundaries'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules, // Plugin ist schon in eslint-config-next registriert
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'no-console': 'error',
      'no-nested-ternary': 'error',
      eqeqeq: 'error',
      'no-restricted-properties': ['error', { object: 'process', property: 'env', message: 'Nur über shared/config/env.ts' }],
      'react/jsx-max-depth': ['error', { max: 6 }],
      'react/no-multi-comp': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-default-export': 'error',
    },
  },
  { files: ['**/*.tsx'], rules: { 'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }] } },
  { files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**'], rules: { 'max-lines-per-function': 'off', 'max-nested-callbacks': 'off' } },
  { files: ['src/app/**', '*.config.*'], rules: { 'import/no-default-export': 'off' } },
  { files: ['src/shared/config/env.ts'], rules: { 'no-restricted-properties': 'off' } },
  { plugins: { boundaries }, settings: { /* siehe 9.2 */ }, rules: { /* boundaries/dependencies */ } },
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'db/migrations/**']),
])
```

Richtwert 200 als Skript: `"lint:budget": "eslint src --rule \"max-lines: [warn, {max: 200, skipBlankLines: true, skipComments: true}]\""`. Das läuft in CI und im Review und erzeugt eine Warnung, keine Blockade.

**Geprüft in M0-02 (22.11.2026)**, maßgeblich ist die echte `eslint.config.mjs`:
- (a) **Plugin-Doppelung:** `eslint-config-next` 16.4.6 und `typescript-eslint` 8.73.0 teilen sich dieselbe Instanz (npm dedupliziert, kein „Cannot redefine plugin“). Global gespreizt wendet `strictTypeChecked` aber den Type-Checker auch auf `.mjs`-Konfigurationsdateien an („not found by the project service“). Deshalb liegen `strictTypeChecked` und `stylisticTypeChecked` per `extends` nur auf `files: ['**/*.{ts,tsx,mts,cts}']`.
- (b) **jsx-a11y mit ESLint 9:** 6.10.2 läuft mit ESLint 9.39.5 ohne Peer-Warnung. Wir bleiben bei ESLint 9.
- (c) **Namespace `import/`:** `eslint-config-next` registriert `eslint-plugin-import` unter `import`. `import/no-default-export` greift (Fixture-Test).
- Die Ausnahme für Tests gilt für `**/*.test.ts(x)`, `tests/e2e/**` und `tests/helpers/**`, nicht pauschal für `tests/**`, weil dort auch die Lint-Fixtures liegen (`tests/lint/fixtures/`, im normalen Lauf ignoriert).
- `consistent-type-imports`: Einen Wert-Import, der nur als Typ dient, lehnt schon `tsc` ab (`verbatimModuleSyntax`). Die Regel fängt zusätzlich `import('…')`-Typen.

`strict-type-checked` ist laut typescript-eslint nicht semver-stabil, also Regeländerungen bei Updates prüfen [9].

### 9.2 Schichtgrenzen (`eslint-plugin-boundaries` 7.x)

Elemente: `app`, `ui`, `actions`, `application`, `domain`, `data`, `schemas`, `server`, `shared`, `worker` (Muster wie `src/features/*/ui`). Die Regel `boundaries/dependencies` mit `default: 'disallow'` und einer Policy je Zeile der Tabelle in Abschnitt 2. Die Syntax (`policies`, `from/allow`, Captures für „gleiches Feature“) hat sich in v7 geändert, deshalb gegen den Quick Start schreiben [10]. Alternative ohne ESLint-Bindung: `dependency-cruiser` 18.x [11].

**Umgesetzt in M0-03** (`eslint/boundaries.mjs`, v7.4.4 trägt, `dependency-cruiser` ist nicht nötig):
- Elemente mit Rechts-nach-links-Muster (`src/features/*/ui`, Capture `feature`; `src/server/*` und `src/shared/*` mit Capture `module`). `schemas.ts` ist eine Datei und deshalb ein Datei-Deskriptor (`boundaries/files`, Kategorie `schemas`), weil Element-Muster Ordner meinen und `mode: 'file'` veraltet ist.
- „Gleiches Feature“ per Template: `captured: { feature: '{{ from.element.captured.feature }}' }`. „Nur Typen“ per `dependency: { kind: 'type' }`.
- `checkAllOrigins: true`: Auch externe Pakete und Node-Module brauchen eine Policy. `domain/` darf keine externen Pakete importieren (auch nicht `react` oder `node:fs`).
- `boundaries/no-unknown-files` und `boundaries/no-unknown-dependencies` (v7-Name von `no-unknown`) gelten für `src/**`: Jede Datei muss zu einer Schicht gehören, sonst wären Barrel-`index.ts` oder `src/lib/…` ein Umweg (z. B. `ui → index.ts → data`).
- `worker/` steht nicht in der Tabelle. Vorläufig: `worker → application, server, shared`.
- **Ordner `schemas/` (#175):** Wird `schemas.ts` zu groß, teilt ein Ordner `src/features/*/schemas/` sie in Dateien nach Thema auf (z. B. `capture/schemas/{ai-answers,photos,draft,stock,manual-capture}.ts`). Jede Datei darin ist ebenfalls ein Datei-Deskriptor der Kategorie `schemas` mit denselben Regeln, dazu dürfen Schema-Dateien desselben Features einander importieren (fremde Features nicht, Fixture-Test). Eine Barrel-Datei `schemas/index.ts` gibt es nicht, importiert wird die Teil-Datei.
- Geprüft durch `tests/lint/boundaries.test.ts` (Tabelle erlaubter und verbotener Paare gegen Fixtures in `tests/lint/fixtures/boundaries`).

### 9.3 TypeScript (`tsconfig.json`, Auszug)

```jsonc
{ "compilerOptions": {
  "strict": true, // ab TS 6 Standard, trotzdem explizit
  "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true, "noImplicitOverride": true,
  "noImplicitReturns": true, "noFallthroughCasesInSwitch": true, "noPropertyAccessFromIndexSignature": true,
  "useUnknownInCatchVariables": true, "verbatimModuleSyntax": true, "erasableSyntaxOnly": true,
  "noUncheckedSideEffectImports": true, "allowUnreachableCode": false
} }
```

Ungenutzte Variablen meldet typescript-eslint (`noUnusedLocals` bleibt aus, um doppelte Meldungen zu vermeiden). TypeScript bleibt bei **6.0.x**, weil typescript-eslint 8.73 `typescript <6.1` verlangt. TS 7 nur über die Alias-Lösung aus der Next-Doku [12]. **Geprüft in M0-01:** `noUncheckedSideEffectImports` ist aktiv (ein Import einer fehlenden Datei bricht `tsc` mit TS2882 ab), `import './globals.css'` klappt ohne eigene Deklaration, weil `next/types/global.d.ts` `declare module '*.css'` mitbringt (über `next-env.d.ts`). `verbatimModuleSyntax` läuft mit `next.config.ts`, `vitest.config.ts` und `playwright.config.ts`, weil das Paket `"type": "module"` hat. Next ergänzt beim ersten Lauf selbst `esModuleInterop: true`. `typecheck` ruft vorher `next typegen` auf, weil `next-env.d.ts` nicht eingecheckt wird.

### 9.4 knip (`knip.json`)

```json
{ "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/worker/main.ts", "db/seeds/index.ts"],
  "project": ["src/**/*.{ts,tsx}", "db/**/*.ts"], "ignoreDependencies": ["server-only"] }
```

Plugins für Next.js, Drizzle, Vitest, Playwright, ESLint, Prettier und lefthook erkennt knip automatisch [13]. Die Schema-URL `https://unpkg.com/knip@6/schema.json` ist geprüft (M0-05). Maßgeblich ist `knip.json`: `project` umfasst auch `*.css` (sonst gilt `tailwindcss` als ungenutzt), die Lint-Fixtures sind ausgenommen, `ignoreDependencies` kommt erst mit `server-only`. `npm run knip` läuft zusätzlich mit `--production` (nur ausgelieferter Code, `src/**` deshalb mit `!`). So fallen Exporte auf, die nur Tests nutzen. **Vorläufige Ausnahme seit M2:** `src/features/*/domain/**` sowie `src/shared/lib/dates.ts` und `quantities.ts` sind aus dem `--production`-Lauf ausgenommen, weil die Fachlogik vor den Use-Cases (M3 bis M7) entsteht und bis dahin nur von Tests genutzt wird. Der normale knip-Lauf prüft sie weiter. Die Ausnahme fällt weg, sobald Use-Cases die Fachlogik aufrufen ([#113](https://github.com/polygonhunter/preposaurus/issues/113)). **Seit M6-01/M6-04** gilt dasselbe für `src/server/{ai,storage}/**`, `src/features/capture/application/**` und `capture/schemas.ts` (seit #175 nur noch `capture/schemas/ai-answers.ts`): Ports und Adapter entstehen vor den Routen (M6-02, M6-06). Seit M6-02 nutzen die Foto-Routen `capture/application`, ausgenommen bleiben dort seit M6-06 nur noch `find-open-draft.ts` (bis die Seite „Neu“ ihn aufruft) und `estimate-on-request.ts` (#124). Seit der Foto-Oberfläche (#61 bis #66) rufen die Seite „Neu“ und `requestEstimateAction` beide auf, das Aufräumen ruft der Worker-Job `capture-cleanup`. Ausgenommen bleibt nur `capture/schemas/ai-answers.ts` (nur von `server/ai` genutzt). Damit `sharp` im `--production`-Lauf nicht als ungenutzt gilt, steht `sharp-photo-processor.ts` vorläufig als Produktions-`entry` in `knip.json`. Damit `sharp` im `--production`-Lauf nicht als ungenutzt gilt, steht `sharp-photo-processor.ts` vorläufig als Produktions-`entry` in `knip.json`. **Seit M6-05** ebenso `src/server/crypto/**` und `src/features/ai-settings/{application,data}/**` (Aufrufer sind die Actions aus M9 und die Route aus M6-06), dazu `anthropic-adapter.ts` (für `@anthropic-ai/sdk`) und `features/ai-settings/application/*.ts` (für `AI_ROLE_DEFAULT_MODELS`) als Produktions-`entry`. Beides fällt mit #113 weg. **Seit M11-04** ebenso `src/server/notify/**` (Aufrufer sind die Jobs aus M11-05), dazu `nodemailer-mail-sender.ts` als Produktions-`entry` (für `nodemailer`). **Seit M4-01** waren ebenso `src/features/inventory/{application,data}/**`, `inventory/schemas.ts` und `src/features/supply/application/**` ausgenommen. Seit den Vorrat-Seiten (M4-02 bis M4-04) gilt das nur noch für `inventory/schemas.ts`, dessen Ausgabe-Schemas nur Tests nutzen. Ein einzelner Export, den nur Tests nutzen, aber bewusst bleibt (das DTO-Schema `overviewSchema` der Übersicht, M7-01), trägt stattdessen `@internal`; knip übergeht ihn dann nur im `--production`-Lauf. Reine Test-Fakes wie der In-Memory-Foto-Speicher liegen dauerhaft in `tests/helpers/` (dürfen dafür `server/storage` importieren) und brauchen keine Ausnahme. `src/instrumentation.ts` prüft beim Serverstart die Umgebung und nutzt den Logger. **Seit #145** steht `scripts/admin/*.ts` (die ausgelieferten Notfall-Befehle) mit `!` im `project`, `scripts/*.ts` und `scripts/admin/*.test.ts` ohne. Muster ohne `!` werden im `--production`-Lauf zu Ausschlüssen: Ein breites `scripts/**/*.ts` versteckte die Befehle dort, und als `entry` würden ihre ungenutzten Exporte nicht mehr gemeldet.

### 9.5 lefthook (`lefthook.yml`)

```yaml
pre-commit:
  piped: true            # nacheinander, weil beide Dateien umschreiben
  jobs:
    - name: prettier
      glob: "*.{ts,tsx,js,mjs,json,md,css,yml}"
      run: npx prettier --write {staged_files}
      stage_fixed: true
    - name: eslint
      glob: "*.{ts,tsx,js,mjs}"
      run: npx eslint --fix --max-warnings=0 {staged_files}
      stage_fixed: true
    - name: typecheck
      run: npx tsc --noEmit
commit-msg:
  jobs:
    - run: npx commitlint --edit {1}
pre-push:
  parallel: true
  jobs:
    - run: npx knip
    - run: npx vitest run
```

Das `jobs`-Format steht so in der lefthook-Doku [14]. `{staged_files}`, `piped` und `stage_fixed` sind in M0-05/M0-06 real ausprobiert: Prettier formatiert eine absichtlich unformatierte, gestagte Datei, der Commit enthält die formatierte Fassung. Maßgeblich ist `lefthook.yml` (ESLint mit `--no-warn-ignored`, Typecheck über `npm run typecheck`).

## 10. Tests

| Ebene | Werkzeug | Was | Anteil |
|---|---|---|---|
| Unit | Vitest | `domain/`, `shared/lib` (Datum, Menge), Schemas, Mapping KI → Domain | viele, schnell |
| Use-Case | Vitest + Fake-Adapter/Repos | `application/` ohne DB und Netz | mittel |
| Integration | Vitest + PGlite lokal, PostgreSQL 18 in der CI (Dienst `postgres:18`) | Repositories, Migrationen laufen durch | wenige |
| E2E | Playwright + `@axe-core/playwright` | Login, manuell erfassen, Foto-Flow mit Fake-KI, Entnahme, mobil | wenige Kernflows |

- Tests prüfen Verhalten, nicht Implementierung. Namen als deutscher Satz („liefert null, wenn kein Datum erkennbar ist“). Abdeckung: `domain/` und `shared/lib` ≥ 90 % Zweige (Vitest-Threshold), sonst kein Prozentziel.
- Jeder Bugfix bringt einen Test mit, der den Fehler vorher zeigt.
- KI-Adapter: wenige Golden-File-Tests mit echten Fotos, manuell bzw. nightly, nie im Pre-Push.

## 11. Commits und Branches

- **Conventional Commits 1.0.0** [15]: `feat(inventory): Entnahme nach FIFO`, Typen `feat|fix|refactor|test|docs|chore|build|ci|perf`. `BREAKING CHANGE:` im Footer. Typ/Scope englisch, Beschreibung deutsch, ≤ 72 Zeichen. Geprüft wird per commitlint mit `@commitlint/config-conventional`.
- Trunk-based: `main` ist immer lauffähig, kurze Branches `feat/…`, `fix/…`, Squash-Merge. Ein Commit soll eine logische Änderung sein.
- Hooks nie mit `--no-verify` umgehen. CI (später) wiederholt lint, typecheck, knip, Tests und `lint:budget`.

## 12. Barrierefreiheit (Ziel: WCAG 2.2 AA)

- Semantisches HTML zuerst (`button`, `label`, `nav`, Überschriften-Hierarchie), `lang="de"`. ARIA nur, wo HTML nicht reicht.
- Jedes Feld hat ein sichtbares Label. Fehler stehen am Feld und werden per `aria-live` angesagt.
- Kontrast ≥ 4,5 : 1 (Text) bzw. 3 : 1 (UI). Die Ampel nie nur über Farbe, immer mit Text oder Icon.
- Touch-Ziele ≥ 44 × 44 px (WCAG fordert mindestens 24 × 24), sichtbarer Fokus, alles per Tastatur bedienbar.
- `prefers-reduced-motion` gilt für alle Animationen. Foto-Flow immer mit manueller Alternative. Erzwungen durch `jsx-a11y` (strict) und axe-Checks in jedem E2E-Test [16].

## 13. Review-Checkliste

- [ ] Datei ≤ 200 Zeilen (sonst begründet), Funktionen klein, keine Duplikate
- [ ] Richtige Schicht, Importrichtung eingehalten, `server-only` gesetzt
- [ ] Action prüft Session **und** Haushalt-Berechtigung, gibt nur DTOs zurück
- [ ] Eingaben an der Grenze mit Zod validiert, KI-Ergebnis nur als Vorschlag
- [ ] Erwartete Fehler als `Result`, Texte ruhig und deutsch
- [ ] Schemaänderung = neue Migration, SQL gelesen
- [ ] Neue Fachlogik hat Tests, ein Bugfix hat einen Regressionstest
- [ ] Keine `console.*`, keine auskommentierten Blöcke, TODO nur als `TODO(#123)`
- [ ] Tastatur, Labels, Kontrast und reduzierte Bewegung geprüft
- [ ] Entscheidung nötig? Dann in `05_STATUS_ENTSCHEIDUNGEN.md` nachtragen

## 14. Vorschläge (Abweichungen bzw. Präzisierungen zu CLAUDE.md)

1. Zeilenzählung ohne Leer- und Kommentarzeilen (Abschnitt 3).
2. „Enums“ als `as const`-Objekte statt TS-`enum` (wegen `erasableSyntaxOnly`).
3. Vor jedem Commit zusätzlich `tsc --noEmit` und vor jedem Push knip + Vitest.
4. Feste Funktionsgrenzen (40/80 Zeilen, Komplexität 10, 3 Parameter) als Ergänzung zu „kleine Funktionen“.
5. Kein `default export` außerhalb von `app/`, keine Barrel-Dateien.

## Quellen

1. Next.js – Data Security (DAL, server-only, Actions): https://nextjs.org/docs/app/guides/data-security
2. Next.js – Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
3. ESLint – max-lines / max-lines-per-function / complexity: https://eslint.org/docs/latest/rules/max-lines · https://eslint.org/docs/latest/rules/max-lines-per-function · https://eslint.org/docs/latest/rules/complexity
4. Next.js – Error Handling: https://nextjs.org/docs/app/getting-started/error-handling
5. Next.js – reactCompiler: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
6. React – eslint-plugin-react-hooks: https://react.dev/reference/eslint-plugin-react-hooks
7. Zod – Error Formatting: https://zod.dev/error-formatting
8. Drizzle – Migrations: https://orm.drizzle.team/docs/migrations
9. typescript-eslint – Shared Configs: https://typescript-eslint.io/users/configs/
10. eslint-plugin-boundaries: https://github.com/javierbrea/eslint-plugin-boundaries · https://www.jsboundaries.dev/docs/quick-start/
11. dependency-cruiser: https://github.com/sverweij/dependency-cruiser
12. Next.js – ESLint (inkl. TS 7, Prettier): https://nextjs.org/docs/app/api-reference/config/eslint
13. knip – Plugins: https://knip.dev/reference/plugins
14. lefthook – Konfiguration: https://lefthook.dev/configuration/
15. Conventional Commits 1.0.0: https://www.conventionalcommits.org/de/v1.0.0/ · commitlint: https://commitlint.js.org
16. WCAG 2.2: https://www.w3.org/TR/WCAG22/ · jsx-a11y: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y · axe Playwright: https://playwright.dev/docs/accessibility-testing
17. TypeScript – TSConfig-Referenz: https://www.typescriptlang.org/tsconfig/
18. Versionen/Peers: npm-Registry, abgefragt 22.11.2026 (typescript-eslint 8.73.0, eslint-plugin-boundaries 7.4.4, knip 6.47.0, lefthook 2.2.2, eslint-plugin-jsx-a11y 6.10.2, TypeScript `latest` 7.0.2)
