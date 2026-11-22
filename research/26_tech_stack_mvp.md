# Tech-Stack für das MVP (Web-App/PWA, self-hosted per Docker auf dem Mac)

> **Kurzfazit:** Der Prototyp (Next.js 16 + React 19 + Tailwind v4 + GSAP) bleibt die Basis und wird zur **Full-Stack-App** ausgebaut. Ein separates Backend braucht es nicht. Daten liegen in **PostgreSQL 18**, Zugriff und Migrationen laufen über **Drizzle ORM**, Schemas einmalig in **Zod 4**. Diese Zod-Schemas speisen Formulare, Server Actions und die KI-Structured-Outputs (beide offiziellen SDKs haben Zod-Helfer). Für Logins sorgt **Better Auth** (E-Mail + Passwort, später Passkeys), lokal und ohne externe Dienste. Fotos landen über **sharp** verkleinert und ohne EXIF/GPS in einem Docker-Volume. Für die KI gibt es pro Anbieter einen Adapter auf Basis der **offiziellen SDKs** (Anthropic, OpenAI) hinter einem eigenen Interface. Geplante Jobs (Wochen-Digest, Push, E-Mail) laufen über **pg-boss** in einem eigenen **Worker-Container** aus demselben Image. HTTPS fürs Handy am einfachsten über **Tailscale Serve**, die Alternative ist **Caddy mit eigener Domain + DNS-Challenge**. Lizenz-Empfehlung: **AGPL-3.0**.
>
> Stand: 08.10.2026. Versionen wurden am selben Tag gegen die npm-Registry bzw. Docker Hub geprüft.

## Empfohlener Stack

| Baustein | Wahl | Version (verifiziert) | Grund | Alternative |
|---|---|---|---|---|
| Framework | Next.js (App Router), Full-Stack | 16.4.0 | Prototyp existiert. Server Actions + Route Handlers reichen für 1 Haushalt | Next nur als UI + Hono-API |
| UI | React, Tailwind CSS, GSAP | 19.3.0 · 4.3.3 · 3.15 (Prototyp) | bleibt | – |
| Sprache | TypeScript strict | **6.0.3** (nicht 7.x, s. u.) | typescript-eslint 8.71 unterstützt TS `<6.1` | TS 7.0.2, sobald das Tooling nachzieht |
| Runtime | Node.js LTS | 24.x („Krypton“, 24.21.0) | aktive LTS. pg-boss braucht ≥ 22.12 | Node 22 LTS |
| Datenbank | PostgreSQL | 18 (Docker-Tag `18.6`) | Mehrbenutzer, echte Datums-/Dezimaltypen, Job-Queue in derselben DB | SQLite (better-sqlite3 13.0.3) |
| ORM/Migrationen | Drizzle ORM + drizzle-kit | 0.45.4 / 0.31.11 stabil; v1 als `1.0.0-rc.4` | SQL-nah, TS-Schema = Quelle der Wahrheit, generierte SQL-Migrationen, kein Engine-Binary | Prisma 7.10 (8.0 im RC), Kysely 0.29.6 |
| Schemas/Validierung | Zod 4 | 4.6.5 | `z.toJSONSchema()` eingebaut, offizielle Zod-Helfer in Anthropic- und OpenAI-SDK | Valibot 1.5.0 |
| Auth | Better Auth (+ Passkey-Plugin) | 1.7.7 | lokal, Drizzle-Adapter, E-Mail+Passwort, Passkeys, Auth.js wird inzwischen von Better Auth betreut | Auth.js v5 (beta.32) |
| Fotos | Docker-Volume + sharp | sharp 0.35.5 | ein Haushalt, kein S3 nötig. sharp entfernt Metadaten standardmäßig | MinIO/S3-kompatibel über Storage-Adapter |
| KI | offizielle SDKs, ein Adapter pro Anbieter | @anthropic-ai/sdk 0.132.1 · openai 7.30.1 | passt 1:1 zur Adapter-Regel, Zod-Helfer, neueste API-Features sofort | Vercel AI SDK `ai` 7.0.133 |
| Push | web-push (VAPID) | 3.6.7 | Standard, im Next.js-PWA-Guide verwendet | – |
| Mail | Nodemailer (SMTP) | 10.0.16 | Standard, beliebiger SMTP-Anbieter | – |
| Jobs/Scheduling | pg-boss im Worker-Container | 12.37.0 | Cron + Retries + Queue in Postgres, kein Redis | Graphile Worker 0.18.0, node-cron 4.6.0 |
| HTTPS im Heimnetz | Tailscale Serve | – | echtes Let's-Encrypt-Zertifikat, keine Root-CA auf den Handys | Caddy 2.11.7 + eigene Domain (DNS-01), mkcert nur für Dev |
| PWA/Service Worker | `app/manifest.ts` + Serwist (Turbopack-Variante) | @serwist/turbopack 9.5.13 | Next 16 baut standardmäßig mit Turbopack | eigener schlanker `sw.js` |
| Unit-Tests | Vitest | 5.0.3 | schnell, TS-nativ | – |
| E2E | Playwright | 1.64.0 | mobile Viewports, Kamera-Mock | – |
| Lint/Format | ESLint (Flat Config) + Prettier | ESLint 9.x (10.12 verfügbar) · Prettier 3.9.9 | `eslint-config-next`, Regeln `max-lines`/`max-lines-per-function` setzen die Datei-Regel durch | Biome 2.5.15 |
| Git-Hooks | lefthook | 2.2.1 | schnell, eine YAML, parallel | Husky 9.1.7 |
| Lizenz | AGPL-3.0-or-later | – | Self-hosted-Software. Wer einen Hosting-Dienst daraus macht, muss Änderungen offenlegen | MIT |

---

## 1. Architektur: Next.js als Full-Stack

**Empfehlung:** Next.js als einziges Backend. Server Actions für Formular-Mutationen aus der UI, Route Handlers für alles, was keine UI-Aktion ist: Foto-Upload (multipart), KI-Analyse, Push-Subscription, Better-Auth-Endpunkt (`/api/auth/[...all]`), Healthcheck. Dazu ein **Worker-Prozess** aus demselben Code (eigener Container), der Jobs abarbeitet.

**Begründung:**
- Ein Haushalt mit wenigen Nutzern: Ein zweiter API-Server bringt nur mehr Deployment, CORS und doppelte Auth.
- Next 16 ist beim Self-Hosting vollwertig: `next start` im Docker-Container, `after()`, Proxy (früher Middleware) und Image Optimization laufen ohne Zusatzkonfiguration. Next empfiehlt einen Reverse Proxy davor [1].
- Die Schichtregel aus CLAUDE.md wird **im Code** durchgesetzt, nicht über Prozessgrenzen. Server Actions und Route Handlers bleiben dünn: validieren (Zod), Session prüfen, Use-Case aufrufen. Die Use-Cases kennen weder Next noch HTTP.

**Wann Hono/Fastify?** Erst wenn eine **native App** (Expo, vgl. `17_plattform.md`) dieselbe API braucht. Weil die Anwendungsschicht framework-frei ist, kann dann ein Hono-Router dieselben Use-Cases aufrufen, ohne die Fachlogik anzufassen.

**Schichten (Abhängigkeiten nur nach unten):**
1. `app/` + `features/*/ui`: Seiten, Komponenten, Client-State
2. `features/*/actions.ts` / Route Handlers: Eingang, Validierung, Auth
3. `features/*/application`: Use-Cases (orchestrieren Repos, Adapter, Domain)
4. `features/*/domain`: **reine Funktionen** (Vorratsrechner, Ampel, FIFO, MHD-Parsing) → Vitest
5. `features/*/data` + `server/*`: Repositories (Drizzle), Adapter (KI, Storage, Push, Mail)

Die Grenzen lassen sich per Lint-Regel erzwingen, z. B. mit `eslint-plugin-boundaries` oder `dependency-cruiser` (Version vor Einsatz prüfen).

## 2. Datenbank und ORM

**PostgreSQL statt SQLite.** SQLite würde für einen Haushalt technisch reichen. Für Postgres spricht hier trotzdem:
- **pg-boss** (Jobs) und Postgres teilen sich eine DB, man braucht also kein Redis [2].
- Mehrere gleichzeitige Nutzer plus Worker-Prozess schreiben parallel. SQLite erlaubt nur einen Schreiber gleichzeitig, und über zwei Container hinweg ist das heikel.
- Echte Typen für `date`, `numeric` (Mengen) und `timestamptz`, dazu Check-Constraints.
- Backups per `pg_dump` sind etabliert.
- Docker Hub führt aktuell `postgres:18.6` (19 ist Beta) [3].

Ein SQLite-Argument bleibt: nur ein Container und Backup = Datei kopieren. Wer das will, kann mit Drizzle wechseln, braucht dann aber node-cron statt pg-boss.

**ORM: Drizzle.**
- Schema in TypeScript. `drizzle-kit generate` erzeugt **SQL-Migrationsdateien**, die ins Repo kommen und per `drizzle-kit migrate` laufen. Das passt zur Regel „Schemaänderungen nur über Migrationen“.
- Better Auth hat einen offiziellen Drizzle-Adapter, und sein CLI erzeugt das Auth-Schema für Drizzle [4].
- **Versionsfrage:** Stabil ist 0.45.4. Drizzle v1 liegt im npm-Tag `rc` (`1.0.0-rc.4`). v1 ändert das Migrationsformat (ein Ordner pro Migration statt Journal-Datei, Upgrade per `drizzle-kit up`), ersetzt Relational Queries v1 durch `defineRelations()` und integriert drizzle-zod als `drizzle-orm/zod` [5]. Better Auth akzeptiert beide (`^0.45.2 || >=1.0.0-rc.1`). **Vorschlag:** Ist 1.0 beim Code-Start final, gleich damit beginnen. Sonst 0.45.x nehmen und später einmal `drizzle-kit up` ausführen.
- Seeds (Kategorien, Einheiten, Empfehlungsquellen mit Version/Stand/Link) als **versionierte TS-Dateien** mit idempotentem Upsert, ausgeführt durch ein eigenes Skript (`db:seed`), nicht durch Migrationen.

**Alternativen:**
- **Prisma 7:** Rust-frei, TS-Query-Compiler, Driver Adapters, `prisma.config.ts` [6]. Stabil ist 7.10.0, `latest` auf npm ist bereits `8.0.0-rc.21`, also gerade im Major-Wechsel. Eigene Schema-Sprache plus Codegen-Schritt, das ist mehr Magie.
- **Kysely:** hervorragender typsicherer Query-Builder, aber ohne Schema-Definition und Migrations-Generator (Migrationen von Hand).

## 3. Validierung und Schemas: Zod 4

**Empfehlung: Zod 4 (4.6.5).** Ein Schema pro Fachobjekt in `features/*/schemas.ts`, wiederverwendet für:
- **Formulare** (Client- und Server-Validierung der Server Actions)
- **Route Handlers / API**
- **KI-Structured-Output:**
  - Anthropic: `zodOutputFormat()` aus `@anthropic-ai/sdk/helpers/zod` mit `client.messages.parse()` und `output_config.format`. Structured Outputs sind GA [7].
  - OpenAI: `zodTextFormat()` aus `openai/helpers/zod` mit `responses.parse()` → `output_parsed` [8].
  - Beide SDKs haben `zod: ^3.25 || ^4` als Peer-Dependency (npm geprüft).
- **JSON Schema** bei Bedarf über das eingebaute `z.toJSONSchema()` (Draft 2020-12, Draft 7, OpenAPI 3.0) [9].

**Wichtig: Die Anbieter unterstützen nur Teilmengen von JSON Schema.** Deshalb ein eigenes, schlankes **KI-Antwort-Schema** definieren und daraus per Mapping das Domain-Schema befüllen:

| Regel | Anthropic [7] | OpenAI [10] |
|---|---|---|
| `additionalProperties: false` | Pflicht | Pflicht |
| Alle Felder in `required` | nein | **ja**, Optionales nur als `T \| null` |
| `minimum`/`maximum`, `minLength` | **nicht unterstützt** (Zod-Helfer verschiebt sie in die Beschreibung und prüft danach lokal) | unterstützt |
| Root | Objekt | Objekt, **kein `anyOf` an der Wurzel** (kein `discriminatedUnion` als Root) |
| Rekursion | nicht unterstützt | unterstützt |

**Daraus folgt für Preposaurus:** Alle Felder sind Pflicht und nullable (`mhd: z.string().nullable()` im Format `YYYY-MM-DD`), keine Zahlengrenzen im KI-Schema, Root ist ein Objekt mit `items: [...]`. Das passt zur Regel „ein Datum wird nie erfunden“: Fehlt es, liefert die KI `null`. Die Grenzen (Menge > 0, Datum plausibel) prüft danach das Domain-Schema.

**Valibot (1.5.0)** wäre kleiner im Client-Bundle. JSON Schema gibt es dort nur über das Zusatzpaket `@valibot/to-json-schema`, ohne Transforms [11], und die SDK-Helfer gibt es nur für Zod. Für dieses Projekt überwiegt der Zod-Vorteil.

## 4. Auth: Better Auth

**Empfehlung: Better Auth 1.7.7**, selbst gehostet in der eigenen Postgres-DB.
- E-Mail + Passwort für den Start. **Passkeys** über `@better-auth/passkey` (basiert auf SimpleWebAuthn) [12].
- Drizzle-Adapter. `npx auth@latest generate` erzeugt das Schema, die Migration läuft dann ganz normal über drizzle-kit [4].
- **Haushalt-Modell:** Öffentliche Registrierung nach dem ersten Nutzer abschalten. Weitere Mitglieder per Einladung oder durch den Admin anlegen. Rollen (Admin/Mitglied) und Haushaltszuordnung in eigenen Tabellen. Welche Better-Auth-Plugins dafür (Admin/Organization) genau passen, beim Bau prüfen.
- **Status der Alternativen:**
  - **Auth.js** (früher NextAuth) wird seit 22.09.2025 vom Better-Auth-Team betreut. Für neue Projekte empfiehlt es Better Auth [13]. v5 ist weiterhin nur `5.0.0-beta.32` auf npm.
  - **Lucia** ist auf npm als deprecated markiert (3.2.2) und nur noch ein Lernleitfaden.
  - Better Auth gehört seit Juli 2026 zu Vercel [13]. Die Lizenz bleibt MIT, das Projekt also unkritisch, aber im Blick behalten.
- **Passkey-Falle:** Passkeys hängen am Hostnamen (rpID). Wechselt man später von `preposaurus.tailXXXX.ts.net` auf eine eigene Domain, sind die registrierten Passkeys ungültig. Deshalb den Hostnamen **vor** dem Passkey-Rollout festlegen.

## 5. Fotos: Docker-Volume + sharp

**Empfehlung:** Ein Named Volume `photos` (bzw. ein Bind-Mount, s. Backups), in der DB nur Pfad/Key, Größe, Hash und MIME-Typ.
- **Storage-Adapter** (`server/storage/`) mit Interface `put/get/delete/url`. MVP: `LocalFileStorage`. Ein S3-kompatibler Adapter lässt sich später ergänzen, ohne Fachcode zu ändern.
- **MinIO lohnt nicht:** ein zusätzlicher Dienst ohne Nutzen für einen Haushalt. Falls doch S3, Lizenz und Projektstatus des gewählten Servers vorher prüfen.
- **Verarbeitung mit sharp 0.35.5:**
  - sharp entfernt **standardmäßig alle Metadaten**, also EXIF inkl. GPS [14]. `keepMetadata()`/`withMetadata()` daher **nicht** verwenden.
  - Weil damit auch das Orientierungs-Tag verschwindet, **vorher `rotate()`** (Auto-Orient anhand EXIF) aufrufen, sonst stehen Hochkant-Fotos quer.
  - Pipeline: Upload → Typ/Größe prüfen → `rotate()` → auf ca. 1600 px lange Kante verkleinern → WebP/JPEG speichern, plus Thumbnail (ca. 400 px).
  - Fürs KI-Bild reicht dieselbe Fassung. Claude rechnet `⌈B/28⌉×⌈H/28⌉` Bild-Tokens und skaliert ab 2576 px (neuere Modelle) bzw. 1568 px ohnehin herunter [15].
- Originale **nicht** aufbewahren (Datensparsamkeit, Speicher).

## 6. KI-SDKs und Modelle

**Empfehlung: offizielle SDKs, je ein Adapter.**
- `server/ai/vision-recognizer.ts` definiert den Port: `recognize(image, hints) → AiRecognitionResult`, typisiert über das Zod-KI-Schema.
- `server/ai/anthropic-adapter.ts` nutzt `messages.parse` + `zodOutputFormat`.
- `server/ai/openai-adapter.ts` nutzt `responses.parse` + `zodTextFormat`.
- Die Auswahl läuft über ENV (`AI_PROVIDER`, `AI_MODEL`). Keys liegen nur im Server-Container und haben nie ein `NEXT_PUBLIC_`-Präfix.

**Warum nicht Vercel AI SDK (ai 7.0.133)?** Es abstrahiert die Anbieter bereits (`generateText` + `Output.object({ schema })`, Zod/Valibot/JSON Schema) [16]. Es wäre aber eine **zweite** Abstraktionsschicht über dem eigenen Port. Anbieter-Features wie Structured-Output-Parameter, Bild-Auflösung oder Caching kommen dort mit Verzögerung an, und Fehler sind schwerer zuzuordnen. Die Regel „Wechsel betrifft eine Datei“ erfüllt der eigene Port mit zwei kleinen Adaptern direkter. Das AI SDK bleibt eine valide Alternative, falls später mehr als zwei Anbieter dazukommen.

**Aktuelle Vision-Modelle (Preise pro 1 Mio. Tokens, Standard):**

| Anbieter | Modell (API-ID) | Input | Output | Einsatz |
|---|---|---|---|---|
| Anthropic | Claude Haiku 5.5 (`claude-haiku-5-5`) | 0,10 $ (≤ 100k Prompt) | 0,50 $ | Standard für Foto-Erkennung |
| Anthropic | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | 2 $ | 10 $ | schwierige Etiketten/MHD |
| Anthropic | Claude Opus 5.5 (`claude-opus-5-5`) | 4 $ | 20 $ | nicht nötig |
| OpenAI | GPT-6 Luna (`gpt-6-luna`) | 0,10 $ | 0,50 $ | Standard |
| OpenAI | GPT-6.1 Sol (`gpt-6.1-sol`) | 2 $ | 10 $ | schwierige Fälle |
| OpenAI | GPT-6 Astra (`gpt-6-astra`) | 10 $ | 50 $ | nicht nötig |

Quellen: [17], [18], [19]. Alle Claude-Modelle oben unterstützen Structured Outputs [7]. OpenAI schreibt, dass alle aktuellen Modelle Text- und Bild-Input unterstützen [19].

**Kostenbeispiel (Claude, verifizierte Formel):** Ein Foto mit 1000×1000 px kostet 1.296 Bild-Tokens [15]. Mit ca. 500 Prompt-Tokens und 300 Output-Tokens:
- Haiku 5.5: ≈ 0,00018 $ + 0,00015 $ ≈ **0,03 Cent pro Foto**
- Sonnet 5.5: ≈ **0,7 Cent pro Foto**

Für OpenAI war die Bild-Token-Rechnung auf der geprüften Preisseite nicht aufgeführt. Vor dem Bau messen (die API meldet `usage`).

## 7. Push, Mail, Jobs

**Web-Push:**
- Bibliothek `web-push` 3.6.7 (MPL-2.0, letzte Version Jan. 2024, stabil, aber wenig aktiv). VAPID-Schlüssel per `web-push generate-vapid-keys`, Subscriptions pro Gerät in der DB [20].
- Next.js listet als Voraussetzung: **iOS 16.4+ nur für zum Home-Bildschirm hinzugefügte Apps**, Safari 16 auf macOS 13+, Chromium, Firefox [20].
- Ab iOS/iPadOS 18.4 gibt es zusätzlich **Declarative Web Push**: Benachrichtigungen funktionieren dann auch ohne Service-Worker-Code, weiterhin nur für Home-Screen-Web-Apps [21].
- Praxis: Die Push-Berechtigung nur auf Tipp anfragen. Abgelaufene Subscriptions (HTTP 404/410) löschen. Push braucht ausgehendes Internet vom Mac zu Apple/Google/Mozilla. Das Handy muss den Server dafür nicht erreichen, erst beim Öffnen der Benachrichtigung.

**Mail:** Nodemailer 10.0.16 per SMTP (eigener Mail-Anbieter, Zugangsdaten in `.env`). Mail-Templates als kleine Funktionen, die Text und HTML liefern. Der Mail-Adapter steckt hinter einem `Notifier`-Interface, das auch Push bedient (später ntfy).

**Jobs/Scheduling: pg-boss 12.37.0 in einem eigenen Worker-Container.**
- Cron/RRULE-Schedules, Retries mit Backoff, Dead-Letter-Queues, Rate-Limit/Debounce. Voraussetzung Node ≥ 22.12 und Postgres ≥ 13 [2].
- Der Worker nutzt **dasselbe Image** mit anderem Startbefehl (`node worker.js`) und dieselben Use-Cases und Adapter.
- Jobs: `weekly-digest` (pro Nutzer zur gewählten Zeit, Standard Sa 10:00 Europe/Berlin), `urgent-check` (täglich), `inventory-reminder` (vierteljährlich), `cleanup-push-subscriptions`.
- **Warum nicht node-cron im Next-Prozess?** Das ginge über `instrumentation.ts` (`register`) [1]. Jobs liefen dann aber im Web-Prozess, ohne Persistenz, Retries und Schutz vor Doppelausführung, und Neustarts verschlucken Läufe. Für einen Wochen-Digest wäre es verkraftbar, sauberer ist der Worker.
- **Alternative:** Graphile Worker 0.18.0, ebenfalls Postgres-basiert mit Crontab.

## 8. HTTPS im Heimnetz

Kamera (`getUserMedia`), Service Worker, Push und Passkeys brauchen einen **Secure Context**, also HTTPS (außer `localhost`).

**Empfehlung: Tailscale Serve auf dem Mac.**
- `tailscale serve` leitet `https://<mac>.<tailnet>.ts.net` auf `localhost:3000` weiter. Das Zertifikat kommt automatisch von **Let's Encrypt** [22][23].
- Kein Root-Zertifikat auf den Handys und kein Portforwarding. Das funktioniert auch unterwegs, aber nur im eigenen Tailnet.
- Tailscale-ACLs gelten auch für Serve [22].
- **Nachteile:**
  - Jedes Haushaltsmitglied braucht die Tailscale-App.
  - Gerätenamen landen in öffentlichen Certificate-Transparency-Logs, also keinen sprechenden Namen wählen [23].
  - **Funnel** (öffentlich ins Internet) ist **nicht** nötig und sollte aus bleiben [22].

**Alternative für ein Netz ohne VPN-App: Caddy 2.11.7 im Compose-Stack + eigene Domain + DNS-01-Challenge.**
- Der DNS-Eintrag zeigt auf die private IP. Das Zertifikat kommt über die DNS-Challenge (braucht API-Zugang beim DNS-Anbieter und ein Caddy-Plugin, kein offener Port) [24].
- Ergebnis: ein echtes Zertifikat, auf jedem Gerät ohne Zusatz-App. Nachteile: Domain-Kosten, eigenes Caddy-Build und Zugriff nur im WLAN.

**Nicht empfohlen fürs Handy:** **Caddy `tls internal`** bzw. **mkcert**. Beide erzeugen eine lokale CA, deren Root auf **jedem** Gerät installiert und auf iOS manuell als vertrauenswürdig markiert werden muss [24]. Das ist fehleranfällig, und ob iOS-Home-Screen-Apps und Push damit zuverlässig laufen, ist nicht verifiziert. Für die Entwicklung reicht `next dev --experimental-https` [20].

## 9. PWA in Next.js 16

- **Manifest:** `app/manifest.ts` (eingebaut, typisiert) mit Name, Icons 192/512, `display: "standalone"`, `start_url`, Theme-Farbe. iOS-Hinweis „Zum Home-Bildschirm“ im Onboarding, weil `beforeinstallprompt` auf iOS nicht funktioniert [20].
- **Service Worker: Serwist**, die von Next empfohlene Option für Offline-Caching [20].
  - Seit Next 16 baut Turbopack standardmäßig, und das klassische `@serwist/next` ist für webpack gedacht [25][26].
  - Deshalb **`@serwist/turbopack` (9.5.13)** nutzen: Der SW wird per Route Handler (`app/serwist/[path]/route.ts`) gebaut und über `SerwistProvider` registriert [27].
  - Version 10 ist als Preview unterwegs (`10.0.0-preview.14`).
  - Push- und `notificationclick`-Handler in denselben SW.
- **Header:** `sw.js` mit `Cache-Control: no-cache`, dazu Basis-Security-Header (nosniff, frame-deny, Referrer-Policy) wie im Next-PWA-Guide [20].
- **Offline-Strategie MVP:**
  - App-Shell und statische Assets: precache bzw. CacheFirst.
  - Seiten und Daten: NetworkFirst mit Fallback auf die zuletzt geladene Vorratsliste (**lesend**). „Im Keller ohne Netz nachschauen“ funktioniert damit.
  - Schreiben (Erfassen/Entnehmen) braucht im MVP eine Verbindung. Die UI zeigt das freundlich an. Next 16 bietet dazu experimentell `useOffline` (verbindungsbewusste UI, Retries für Navigation/Server Actions) [20].
  - Echte Offline-Writes mit Sync (vgl. `18_daten_sync.md`) wären ein späteres Thema.

## 10. Qualität und Tooling

- **Vitest 5.0.3** für Domain (Vorratsrechner, Ampel, FIFO, MHD-/Mengen-Parsing), Schemas und Use-Cases mit Fake-Adaptern. **Playwright 1.64.0** für Kernflows (Login, manuell erfassen, Foto-Flow mit gemocktem KI-Adapter, Entnahme) in mobilen Viewports.
- **TypeScript 6.0.3 strict** (+ `noUncheckedIndexedAccess`). TS 7.0.2 (nativer Compiler) ist zwar `latest`, aber typescript-eslint 8.71.1 verlangt `typescript <6.1` (npm-Peer geprüft).
- **ESLint 9 Flat Config** + `eslint-config-next` 16.4.0 + typescript-eslint.
  - Next 16 hat `next lint` entfernt, `next build` lintet nicht mehr. Next nennt Biome oder ESLint direkt als Weg [26].
  - **Clean-Code-Regeln maschinell:** `max-lines` (300, Warnung ab 200), `max-lines-per-function`, `complexity`, `no-console`, unbenutzte Exporte z. B. mit `knip`.
  - **Prettier 3.9.9** formatiert.
  - Alternative **Biome 2.5.15** (Lint + Format in einem, sehr schnell). Dann fehlen aber die Next-spezifischen ESLint-Regeln.
- **lefthook 2.2.1:** pre-commit mit lint + format + typecheck auf gestagten Dateien, pre-push mit Vitest. Husky 9.1.7 hat seit Nov. 2024 kein Release.
- **Lizenz:**
  - **AGPL-3.0-or-later** empfohlen. Typisch für self-hosted Apps: Wer Preposaurus als Hosting-Dienst anbietet, muss Änderungen offenlegen. Für Eigennutzer ändert sich nichts.
  - **MIT** wäre maximal offen, erlaubt aber geschlossene SaaS-Forks. Falls später ein eigenes Hosting-Angebot denkbar ist (vgl. `23_business_monetarisierung.md`): Als alleiniger Rechteinhaber kann man weiter frei lizenzieren, Fremdbeiträge brauchen dann aber ein CLA/DCO.
- **Docker Multi-Stage (Next standalone):**
  - `output: "standalone"` in `next.config.ts`.
  - Stages `deps` (npm ci) → `build` (next build + Worker-Bundle) → `runner` (node:24-slim, Nutzer ohne Root, nur `.next/standalone`, `.next/static`, `public`, Worker-Bundle, Migrationen).
  - Läuft auf Apple Silicon als `linux/arm64`. sharp bringt Prebuilds mit, auf glibc ggf. Speicher-Allocator beachten [1].
- **Backups:**
  - Ein `backup`-Dienst führt täglich `pg_dump -Fc` mit Rotation (z. B. 7 täglich, 4 wöchentlich) in einen **Bind-Mount im Benutzerordner** aus, ebenso die Fotos.
  - Grund: Docker-Volumes liegen auf dem Mac in der VM-Disk von Docker Desktop/OrbStack, und Time Machine erfasst sie nicht sinnvoll.
  - Die Postgres-Daten selbst bleiben aus Performance- und Rechtegründen in einem Named Volume.
  - Restore-Test einmal dokumentieren.

---

## Vorschlag Ordnerstruktur

```
preposaurus/
├─ src/
│  ├─ app/                          # nur Routing, Layouts, dünne Pages
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (app)/vorrat/…  (app)/erfassen/…  (app)/statistik/…  (app)/einstellungen/…
│  │  ├─ api/auth/[...all]/route.ts         # Better Auth
│  │  ├─ api/photos/route.ts                # Upload (multipart)
│  │  ├─ api/recognize/route.ts             # KI-Analyse
│  │  ├─ api/push/subscribe/route.ts
│  │  ├─ api/health/route.ts
│  │  ├─ serwist/[path]/route.ts            # Service Worker Build
│  │  ├─ sw.ts
│  │  └─ manifest.ts
│  ├─ features/                     # fachlich geschnitten
│  │  ├─ inventory/                 # Produkt → Einheiten (MHD), Entnahme FIFO
│  │  │  ├─ ui/                     # Komponenten nur dieses Features
│  │  │  ├─ actions.ts              # Server Actions (validieren → Use-Case)
│  │  │  ├─ application/            # Use-Cases: addUnits.ts, consumeUnit.ts …
│  │  │  ├─ domain/                 # rein: traffic-light.ts, pick-fifo.ts (+ *.test.ts)
│  │  │  ├─ data/                   # inventory-repository.ts (Drizzle)
│  │  │  └─ schemas.ts              # Zod: Formular/API
│  │  ├─ recognition/               # Foto-Flow, KI-Schema, Mapping KI → Domain
│  │  ├─ household-goal/            # Versorgungstage, Vorratsrechner
│  │  ├─ reminders/                 # Digest-Logik, Benachrichtigungs-Einstellungen
│  │  ├─ shopping-list/
│  │  └─ statistics/
│  ├─ server/                       # Infrastruktur-Adapter (austauschbar)
│  │  ├─ db/client.ts  db/schema/*.ts       # Drizzle-Tabellen je Bereich
│  │  ├─ auth/auth.ts                       # Better-Auth-Konfiguration
│  │  ├─ ai/vision-recognizer.ts            # Port
│  │  ├─ ai/anthropic-adapter.ts  ai/openai-adapter.ts
│  │  ├─ storage/file-storage.ts  storage/local-file-storage.ts
│  │  ├─ images/process-photo.ts            # sharp-Pipeline
│  │  ├─ notify/notifier.ts  notify/web-push-channel.ts  notify/mail-channel.ts
│  │  └─ jobs/queue.ts                      # pg-boss-Setup
│  ├─ worker/                       # Einstieg Worker-Container
│  │  ├─ main.ts
│  │  └─ jobs/weekly-digest.ts  urgent-check.ts …
│  ├─ shared/                       # wiederverwendbar, featurefrei
│  │  ├─ ui/                        # Button, Card, Sheet, Ampel-Badge …
│  │  ├─ hooks/
│  │  ├─ lib/dates.ts  lib/quantities.ts    # Parsing (+ Tests)
│  │  └─ config/env.ts  config/constants.ts # Zod-validierte ENV, Enums
│  └─ proxy.ts                      # Session-Gate (Next-16-Nachfolger von middleware)
├─ db/
│  ├─ migrations/                   # generiert von drizzle-kit, eingecheckt
│  └─ seeds/                        # categories.ts, units.ts, recommendation-sources.ts (versioniert)
├─ tests/e2e/                       # Playwright
├─ docker/
│  ├─ Dockerfile                    # Multi-Stage, ein Image für web/worker/migrate
│  └─ backup/                       # pg_dump-Skript
├─ docker-compose.yml
├─ drizzle.config.ts  next.config.ts  eslint.config.mjs  lefthook.yml  vitest.config.ts
├─ .env.example
└─ LICENSE
```

## docker-compose Skizze

| Dienst | Image/Quelle | Aufgabe | Volumes | Hinweise |
|---|---|---|---|---|
| `db` | `postgres:18` | Datenbank inkl. pg-boss-Tabellen | `pgdata` (Named Volume) | Healthcheck `pg_isready`, nicht nach außen veröffentlicht |
| `migrate` | App-Image, Befehl `migrate` | `drizzle-kit migrate` + Seeds, dann Ende | – | `depends_on: db (healthy)`. `web`/`worker` warten auf `service_completed_successfully` |
| `web` | App-Image (Next standalone) | UI, Server Actions, Route Handlers | `photos` | Port 3000 nur an `127.0.0.1` binden. KI-/SMTP-/VAPID-Keys per `.env` |
| `worker` | App-Image, Befehl `node worker.js` | pg-boss-Jobs: Digest, Dringend, Inventur, Aufräumen | `photos` (lesend) | gleiche ENV wie `web` |
| `backup` | schlankes Postgres-Client-Image + Cron | tägl. `pg_dump -Fc` + Foto-Sync mit Rotation | Bind-Mount `~/Preposaurus-Backups` | Time-Machine-freundlich |
| (`caddy`) | `caddy:2.11` (nur Alternative) | TLS-Terminierung mit eigener Domain/DNS-01 | `caddy_data`, `caddy_config` | entfällt bei Tailscale Serve auf dem Host |

Tailscale läuft als normale Mac-App auf dem Host: `tailscale serve --bg 3000`.

## Risiken/Offene Fragen

1. **Offline-first vs. Server-Wahrheit:** `18_daten_sync.md` nennt Offline-Schreiben als Pflicht. Dieser Stack liefert im MVP nur **Offline-Lesen**. Ist das für den Start okay?
2. **iOS-Push** nur als installierte PWA (iOS 16.4+). Bei Tailscale muss das VPN beim Öffnen aktiv sein. Mail-Check-ins bleiben deshalb als Fallback wichtig.
3. **HTTPS-Entscheidung** (Tailscale vs. eigene Domain) **vor** dem Passkey-Rollout treffen, weil Passkeys am Hostnamen hängen.
4. **Drizzle v1** ist RC: Bei Projektstart prüfen, ob 1.0 final ist. Ebenso **Prisma 8** und **Serwist 10** (beide Pre-Release), nur relevant, falls Alternativen gewählt werden.
5. **TypeScript 7** ist `latest`, wird aber noch nicht vom ESLint-Tooling unterstützt. Deshalb vorerst TS 6.0.x.
6. **web-push** wird kaum gepflegt (letztes Release 2024). Funktioniert, aber Alternativen beobachten.
7. **KI-Schema-Teilmengen** unterscheiden sich je Anbieter (s. Abschnitt 3). Zwei Adapter-Tests mit echten Fotos (Golden Files) einplanen.
8. **Better Auth gehört zu Vercel** (seit Juli 2026), Lizenz MIT. Roadmap beobachten. Welche Plugins Haushalt und Rollen sauber abbilden, beim Bau verifizieren.
9. **Kosten/Datenschutz KI:** Fotos gehen an einen US-Anbieter. Hinweis im UI, Einwilligung pro Nutzer, Foto-Flow optional (manuell geht immer).
10. **Docker auf macOS:** Docker Desktop vs. OrbStack (Lizenz/Performance). Dazu Autostart nach Neustart/Stromausfall und Ruhezustand des Macs klären.
11. **Lizenzwahl** (AGPL vs. MIT) hängt davon ab, ob ein eigenes Hosting-Angebot je denkbar ist.

## Quellen

Versionen: npm-Registry (`registry.npmjs.org/<paket>`, abgefragt 08.10.2026), Node-Releases (`nodejs.org/dist/index.json`), Docker Hub (`hub.docker.com/_/postgres`, `hub.docker.com/_/caddy`).

1. Next.js – Self-Hosting: https://nextjs.org/docs/app/guides/self-hosting
2. pg-boss (GitHub): https://github.com/timgit/pg-boss
3. Docker Hub – postgres: https://hub.docker.com/_/postgres
4. Better Auth – Drizzle-Adapter: https://www.better-auth.com/docs/adapters/drizzle
5. Drizzle – Upgrade auf v1: https://orm.drizzle.team/docs/upgrade-v1 · https://orm.drizzle.team/docs/latest-releases
6. Prisma 7 AMA / Changelog: https://www.prisma.io/blog/prisma-7-ama-clearing-up-the-why-behind-the-changes · https://www.prisma.io/changelog.md
7. Anthropic – Structured Outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
8. OpenAI – Structured Outputs (Guide): https://developers.openai.com/api/docs/guides/structured-outputs
9. Zod – JSON Schema: https://zod.dev/json-schema
10. OpenAI – Supported Schemas (gleiche Seite wie 8, Abschnitt „Supported schemas“)
11. Valibot – JSON Schema: https://valibot.dev/guides/json-schema/
12. Better Auth – Passkey-Plugin: https://www.better-auth.com/docs/plugins/passkey · Einführung: https://www.better-auth.com/docs/introduction
13. Auth.js joins Better Auth: https://www.better-auth.com/blog/authjs-joins-better-auth · https://github.com/nextauthjs/next-auth/discussions/13252 · Better Auth joins Vercel: https://better-auth.com/blog/better-auth-joins-vercel
14. sharp – Output/Metadaten: https://sharp.pixelplumbing.com/api-output
15. Anthropic – Vision (Bild-Tokens, Limits): https://platform.claude.com/docs/en/build-with-claude/vision
16. Vercel AI SDK – Structured Data: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
17. Anthropic – Pricing: https://platform.claude.com/docs/en/about-claude/pricing
18. OpenAI – Pricing: https://developers.openai.com/api/docs/pricing
19. OpenAI – Models: https://developers.openai.com/api/docs/models
20. Next.js – PWA-Guide: https://nextjs.org/docs/app/guides/progressive-web-apps
21. WebKit – Meet Declarative Web Push / Safari 18.4: https://webkit.org/?p=16535 · https://webkit.org/blog/16574/digital-credentials-api/
22. Tailscale Serve: https://tailscale.com/kb/1312/serve
23. Tailscale – HTTPS-Zertifikate: https://tailscale.com/kb/1153/enabling-https
24. Caddy – Automatic HTTPS: https://caddyserver.com/docs/automatic-https
25. Serwist – Next.js Getting Started: https://serwist.pages.dev/docs/next/getting-started
26. Next.js – Upgrade auf v16 (Turbopack default, `next lint` entfernt, proxy): https://nextjs.org/docs/app/guides/upgrading/version-16
27. Serwist – Turbopack: https://serwist.pages.dev/docs/next/turbo
