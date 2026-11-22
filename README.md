# Preposaurus

Selbst gehostete Web-App, mit der ein Haushalt seinen **Notvorrat nach offiziellen Empfehlungen** (BBK, BLE) plant und verwaltet. Ruhig und freundlich, ohne Angstmache.

> **Status: frühe Entwicklung.** Konzept und Umsetzungsplan stehen, das Projektgerüst (Meilenstein M0) ist aufgesetzt, fachliche Funktionen folgen. Die App ist **noch nicht nutzbar**.

*English summary: Preposaurus is a self-hosted web app for managing a household emergency food supply based on official German recommendations (BBK/BLE). It runs via Docker on your own NAS (similar to Paperless-ngx), supports multiple user accounts and is reached on the local network or from your phone via Tailscale. Products can be added manually or from a photo, which an AI model (Anthropic) turns into a suggestion that you confirm. The project is in early development and not usable yet. The UI and documentation are in German. Licensed under AGPL-3.0-or-later.*

## Was Preposaurus kann (geplant für das MVP)

- **Haushalt und Ziel:** Mitglieder mit Alter und Ernährungsform (alles, vegetarisch, vegan), Ziel in Tagen mit Zieldatum. Der Bedarf richtet sich nach den offiziellen Empfehlungen, jeder Wert mit Quelle, Stand und Link.
- **Erfassen per Foto oder manuell:** Das Foto ist nie Pflicht. Bei aktiver KI schlägt die App Produkt, Menge, Nährwerte und Mindesthaltbarkeitsdatum vor. Gespeichert wird erst nach Bestätigung, ein Datum wird nie erfunden.
- **Vorrat und Rotation:** je Packung ein MHD, Ampel, Filter (Im Vorrat, Bald fällig, Abgelaufen, Nachkaufen, Verbraucht, Entsorgt), Historie statt Löschen.
- **Übersicht:** Für wie viele Tage reicht der Vorrat, wo sind Lücken, was läuft bald ab.
- **Nachkaufen:** schlanke gemeinsame Liste für den Haushalt.
- **Erinnerungen:** gebündelt per Web-Push und Mail (Wochenübersicht, Dringendes).
- **Konten und Rollen:** Admin und Mitglieder, Einladungen, keine offene Registrierung.
- **PWA:** auf dem Handy zum Home-Bildschirm hinzufügen, ohne Verbindung den letzten Stand lesen.

## Betrieb

- **Selbst gehostet** per Docker Compose auf dem eigenen NAS, ähnlich wie Paperless-ngx. Images für amd64 und arm64.
- **Zugriff** im Heimnetz oder von unterwegs über [Tailscale](https://tailscale.com) (Tailscale Serve für HTTPS). Die App ist nicht für den Betrieb im offenen Internet gedacht.
- **Backups** täglich (Datenbank und Fotos).

Eine Einrichtungsanleitung folgt, sobald das MVP steht.

## Datenschutz

- Alle Daten bleiben auf dem eigenen Server.
- **Ausnahme KI-Erkennung:** Ist die KI aktiv, gehen die Fotos zur Auswertung an den KI-Anbieter (derzeit Anthropic). Die KI lässt sich im Haushalt abschalten, die manuelle Erfassung funktioniert immer.
- Beim Hochladen entfernt die App Metadaten wie EXIF und GPS aus den Fotos.

## Tech-Stack

Next.js 16 (Full-Stack, TypeScript strict) · PostgreSQL 18 mit Drizzle · Zod 4 · Better Auth · Anthropic SDK hinter einem austauschbaren Adapter · sharp · web-push und Nodemailer · pg-boss (Worker) · Serwist (PWA) · Vitest, Playwright, ESLint, Prettier · Docker Compose. Details: [`research/26_tech_stack_mvp.md`](research/26_tech_stack_mvp.md).

## Entwickeln

Voraussetzung: Node.js 24 oder neuer, npm.

```bash
cp .env.example .env   # Werte prüfen, die .env nie committen
npm install            # installiert auch die Git-Hooks (lefthook)
npm run dev            # http://localhost:3000
npm run check          # Format, Lint, Budget, Typecheck, knip und Tests
```

**Lokale Dev-DB nach dem Schema-Nachtrag (#120) neu aufsetzen:** Die Migrationen sind zu einem Basisstand `0000_basis.sql` zusammengefasst. Wer schon eine lokale Datenbank aus der Zeit davor hat, löscht den Ordner `.data/` einmal und spielt danach `npm run db:migrate`, `npm run db:seed` und bei Bedarf `npm run db:seed:demo` neu ein.

| Befehl | Zweck |
|---|---|
| `npm run build` / `npm start` | Produktions-Build bauen bzw. starten |
| `npm run lint` | ESLint mit harten Grenzen und Schichtregeln, ohne Warnungen |
| `npm run lint:budget` | warnt bei Dateien über 200 Zeilen (Richtwert) |
| `npm run typecheck` | TypeScript strict |
| `npm run test` | Vitest mit Abdeckung |
| `npm run e2e` | Playwright in fünf Viewports, einmalig vorher `npx playwright install chromium webkit` |
| `npm run knip` | ungenutzte Dateien, Exporte und Abhängigkeiten |
| `npm run licenses` | Lizenzen der Produktionsabhängigkeiten prüfen |

## Hinweis zu den Empfehlungswerten

Preposaurus ist **kein offizielles Angebot** des Bundesamts für Bevölkerungsschutz und Katastrophenhilfe (BBK), der Bundesanstalt für Landwirtschaft und Ernährung (BLE) oder einer anderen Behörde. Die Empfehlungswerte werden mit Quelle und Stand hinterlegt, aber **ohne Gewähr** für Richtigkeit, Vollständigkeit oder Aktualität. Maßgeblich sind die Veröffentlichungen der Herausgeber.

## Projektstruktur

| Pfad | Inhalt |
|---|---|
| [`05_STATUS_ENTSCHEIDUNGEN.md`](05_STATUS_ENTSCHEIDUNGEN.md) | aktueller Stand und alle Entscheidungen |
| `00_IDEE.md` … `04_EINSTELLUNGEN.md` | Konzept (Idee, Foto-Erkennung, Haushalt und Ziel, Erinnerungen und Rotation, Einstellungen) |
| [`docs/konzept/`](docs/konzept/) | Konzept-Dokumente als HTML: Technik, Funktionen, Design |
| [`docs/UMSETZUNG.md`](docs/UMSETZUNG.md) | Umsetzungsplan des MVP (Meilensteine M0 bis M14) |
| [`docs/CODE_PRINZIPIEN.md`](docs/CODE_PRINZIPIEN.md) | verbindliche Code-Regeln |
| `src/`, `tests/` | App (Next.js 16) und Tests |
| [`research/`](research/) | Recherche-Berichte (Markt, Empfehlungen, Technik, Recht) |
| [`prototypes/`](prototypes/) | klickbarer Design-Prototyp, gewählt `/d6` „Glas-Cockpit“. Nicht Teil der App, eigener Lizenzhinweis |
| `CLAUDE.md`, `AGENTS.md` | Projektregeln für KI-gestützte Entwicklung |

Ein Teil der Planung und Umsetzung geschieht mit KI-Agenten (Claude). Ein Agent plant, ein anderer setzt die Arbeitspakete um, Reviews prüfen die Ergebnisse. Der Maintainer prüft und mergt die Pull Requests.

## Mitmachen

Siehe [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) und für Sicherheitslücken [`SECURITY.md`](SECURITY.md).

## Lizenz

- **Code und eigene Dokumentation:** [GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later).
- **`prototypes/`** ist davon ausgenommen, siehe [`prototypes/README.md`](prototypes/README.md).
- **`research/` und `docs/konzept/`** sind eigene Zusammenfassungen. Die Rechte an den zitierten Quellen (BBK, BLE, DGE und andere) liegen bei den jeweiligen Herausgebern, siehe [`research/README.md`](research/README.md).
- Lizenzen von Drittanbietern: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
