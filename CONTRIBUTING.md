# Mitmachen bei Preposaurus

Danke für dein Interesse! Preposaurus ist ein Hobbyprojekt in früher Entwicklung. Beiträge sind willkommen, der Plan steht aber fest (siehe [`docs/UMSETZUNG.md`](docs/UMSETZUNG.md)). Deshalb gilt:

## Issues zuerst

- Bitte **vor jedem Pull Request ein Issue** öffnen oder ein bestehendes kommentieren. So klären wir, ob die Änderung passt, bevor Arbeit hineinfließt.
- Fehler bitte mit Schritten zum Nachstellen melden. Sicherheitslücken **nicht** als Issue, sondern wie in [`SECURITY.md`](SECURITY.md) beschrieben.
- Sprache für Issues, Code-Kommentare und Oberfläche: Deutsch.

## Code

- Verbindlich sind die [Code-Prinzipien](docs/CODE_PRINZIPIEN.md): kleine Dateien (Richtwert 200, hart 300 Zeilen), kleine Funktionen, klare Schichten (UI → Anwendungslogik → Datenzugriff), Fachlogik als reine Funktionen mit Tests, TypeScript strict, kein toter Code.
- Schemaänderungen nur über Migrationen.
- Vor dem Pull Request muss `npm run check` grün sein (Lint, Typprüfung, knip, Tests).
- Neue Abhängigkeiten nur mit AGPL-kompatibler Lizenz (`npm run licenses`), exakt gepinnt und im Pull Request begründet.
- Keine Geheimnisse, echten Fotos oder personenbezogenen Daten in Code, Tests oder Logs.

## Commits und Pull Requests

- [Conventional Commits](https://www.conventionalcommits.org/de/v1.0.0/): `feat(inventory): Entnahme nach FIFO`. Typ und Scope englisch, Beschreibung deutsch, höchstens 72 Zeichen.
- Kurze Branches (`feat/…`, `fix/…`), ein Pull Request je Thema, Issue verlinken. Gemergt wird per Squash.
- Bei Änderungen an der Oberfläche bitte Bildschirmfotos anhängen.

## Release (Maintainer)

1. Version in `package.json` anheben (`npm version 0.2.0 --no-git-tag-version`, das passt auch `package-lock.json` an) und per Pull Request mergen.
2. Die Läufe CI und Docker auf `main` abwarten.
3. Den Merge-Commit auf `main` mit `v` plus genau dieser Version taggen und pushen, z. B. `git tag v0.2.0 && git push origin v0.2.0` (Vorab-Versionen wie `0.2.0-rc.1` gehen genauso).

Der Release-Workflow bricht ab, wenn der Tag nicht auf `main` liegt, nicht zur Version in `package.json` passt oder CI und Docker für den Commit nicht grün sind.

## Lizenz deiner Beiträge (DCO)

Es gibt **kein CLA**. Beiträge stehen unter derselben Lizenz wie das Projekt, **AGPL-3.0-or-later** („inbound = outbound“). Ein späterer Lizenzwechsel bräuchte deshalb die Zustimmung aller Beitragenden.

Mit jedem Commit bestätigst du das [Developer Certificate of Origin 1.1](https://developercertificate.org): Du hast das Recht, den Beitrag unter dieser Lizenz einzureichen. Dazu den Commit mit `git commit -s` signieren, das fügt eine Zeile `Signed-off-by: Name <E-Mail>` an. Ein Pseudonym und die noreply-Adresse von GitHub sind in Ordnung.

## Verhalten

Es gilt der [Verhaltenskodex](CODE_OF_CONDUCT.md).
