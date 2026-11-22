# Preposaurus – Projektregeln

Preposaurus ist eine selbst gehostete Web-App (Web-App für Handy und PC, Daten per Docker auf dem NAS, Open Source) zur Verwaltung eines Notvorrats nach offiziellen Empfehlungen.
**Zuerst lesen: `05_STATUS_ENTSCHEIDUNGEN.md`** (aktueller Stand, alle Entscheidungen, offene Fragen).
Konzept: `00_IDEE.md` … `04_EINSTELLUNGEN.md`. Recherche: `research/`. UI-Prototyp: `prototypes/` (gewählt: `/d6`).

Neue Entscheidungen immer in `05_STATUS_ENTSCHEIDUNGEN.md` (und ggf. im passenden Konzeptdokument) nachtragen.

## Phase
**Umsetzungsphase.** Der Maintainer hat am 2026-11-22 die Konzept-Dokumente und das Programmieren des MVP freigegeben. Gearbeitet wird nach `docs/UMSETZUNG.md` und den GitHub-Issues. Neue Ideen kommen als GitHub-Issue.

## Code-Qualität (verbindlich)
**Vollständige, verbindliche Referenz: `docs/CODE_PRINZIPIEN.md`** (Schichten, harte Linter-Grenzen, Werkzeuge, Review-Checkliste). Vor jedem Code-Schritt lesen. Die Grenzen werden per ESLint/knip/lefthook erzwungen, nicht nur dokumentiert.
- **Kleine Dateien:** Richtwert ≤ 200 Zeilen pro Datei, harte Grenze 300. Wird es größer, wird aufgeteilt.
- **Kleine Funktionen** mit genau einer Aufgabe. Sprechende Namen statt Kommentare, die erklären, *was* passiert.
- **Wiederverwendbar:**
  - UI-Bausteine, Hooks, Services und Validierung zentral ablegen
  - keine Copy-Paste-Logik
  - Konstanten und Enums an einer Stelle (z. B. Kategorien, Einheiten)
- **Klare Schichten:**
  - UI → Anwendungslogik → Datenzugriff
  - Fachlogik (z. B. Vorratsrechner) als reine, testbare Funktionen ohne UI- und DB-Abhängigkeit
- **Typsicherheit** durchgehend (TypeScript strict). Schemas einmal definieren und für Validierung, API und KI-Structured-Output wiederverwenden.
- **Kein toter Code:**
  - keine auskommentierten Blöcke
  - keine ungenutzten Exporte
  - keine `console.log`-Reste
  - keine TODOs ohne Issue
- **Austauschbare Adapter** für externe Dienste (KI-Anbieter Anthropic/OpenAI, Speicher), damit ein Wechsel nur eine Datei betrifft.
- **Tests** für Fachlogik und Datums-/Mengen-Parsing.
- Linter und Formatter verpflichtend. Sie laufen vor jedem Commit.

## Datenbank
- **Sauber normalisiert:** Produkt → Einheiten (je Packung ein MHD). Stammdaten wie Kategorien, Einheiten und Empfehlungsquellen kommen in eigene Tabellen bzw. versionierte Seed-Daten.
- **Schemaänderungen nur über Migrationen**, nie von Hand.
- Offizielle Empfehlungswerte versioniert, mit Quelle, Stand und Link.
- Fotos im Dateispeicher bzw. Volume, in der DB nur die Referenz.

## Fachliche Grundregeln
- **Jede Erfassung geht per Foto ODER manuell**, das Foto ist nie Pflicht.
- **KI-Ergebnisse sind Vorschläge**, gespeichert wird erst nach Bestätigung. Ein Datum wird nie erfunden.
- **Ruhiger, freundlicher Ton**, keine Angstmache.
- **Sprache der UI:** Deutsch.
