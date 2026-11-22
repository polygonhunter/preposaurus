# Preposaurus – Ideenpapier (Stand: 2026-10-06)

> Status: **Ideen- & Recherchephase.** Noch kein Code. Erst Recherche → Ideen sammeln → MVP definieren → dann programmieren.

## 1. Vision in einem Satz
Eine App (oder Web-App/PWA), die Haushalten hilft, einen **Notvorrat nach offiziellen Empfehlungen** aufzubauen und ihn per **Foto/Bilderkennung** mit Ablaufdaten **einfach zu verwalten**: visuell schön, mit Piktogrammen, ohne Prepper-Klischee.

## 2. Kernbausteine

### A) Haushalt anlegen
- Mitglieder erfassen: Erwachsene, Kinder (Alter), Senior:innen, Schwangere, Haustiere (später)
- Besonderheiten: Allergien, Diäten (vegetarisch, vegan, glutenfrei), Medikamente, Babynahrung
- Daraus ergibt sich der **individuelle Bedarf** (Kalorien, Wasser, Hygiene …)

### B) Offizielle Empfehlungen als Grundlage (Quelle auswählbar)
- Nutzer:innen wählen eine Quelle, z. B.:
  - BBK (Bundesamt für Bevölkerungsschutz und Katastrophenhilfe): Checkliste / Vorratskalkulator
  - BMEL / Ernährungsvorsorge.de
  - Österreich (Zivilschutzverband), Schweiz (BABS / BWL „Notvorrat“)
  - EU-Empfehlung (72 Stunden, Preparedness Union Strategy 2025)
  - FEMA / Ready.gov (USA), weitere Länder
- Jede Empfehlung ist **mit Quelle, Datum und Link** hinterlegt. Transparent und nachprüfbar.

### C) Ziel setzen
- Zeitraum: 3 Tage / 10 Tage / 14 Tage / eigener Wert
- Zieldatum („bis 1. Dezember will ich 10 Tage versorgt sein“)
- Fortschrittsanzeige: „Ihr seid aktuell für **6,5 Tage** versorgt“, je Kategorie (Wasser, Kohlenhydrate, Proteine, Hygiene, Medizin, Energie/Licht …)
- Einkaufsliste für die Lücke, ggf. budgetiert über mehrere Wochen

### D) Vorratsverwaltung
- Artikel erfassen per:
  - **Foto + Bilderkennung** (Produkt erkennen)
  - **Barcode-Scan** (z. B. Open Food Facts)
  - **MHD-Erkennung per OCR**
  - Manuell mit schöner Piktogramm-Auswahl
- Felder: Lebensmittelart/Kategorie, Menge, Einheit, Kalorien, MHD, Lagerort, Foto
- Erinnerungen: „läuft in 30 Tagen ab, jetzt verbrauchen und nachkaufen“ (rollierendes System / „Lebendiger Vorrat“)
- Schöne Darstellung: Bilder, Piktogramme, Ampeln

### E) Später erweiterbar
- Nicht-Lebensmittel: Wasser, Medikamente, Hygiene, Batterien, Kocher, Dokumente, Bargeld
- Notfallplan, Treffpunkte, Kontakte, Dokumentenmappe
- Mehrere Geräte / Haushalt teilen (Sync)
- Rezepte aus dem Vorrat („Notfallküche ohne Strom“)
- Warn-App-Anbindung (NINA, KATWARN), Offline-Modus
- Gamification, Haustiere, mehrere Lagerorte

## 3. Offene Fragen (Recherche)
1. Gibt es das schon? Welche Apps gibt es, was können sie, was fehlt?
2. Welche offiziellen Empfehlungen gibt es genau (Zahlen, Mengen, Quellen, Lizenz/Nutzbarkeit)?
3. Welche Technik passt für Bilderkennung, Barcode und MHD-OCR (on-device vs. Cloud vs. LLM-Vision)?
4. Plattform: Native App, PWA, Web, Cross-Platform?
5. Zielgruppe & Positionierung: Familien statt „Prepper-Szene“?
6. Recht/Datenschutz/Haftung (DSGVO, Gesundheits- und Haftungsfragen bei Empfehlungen)
7. Monetarisierung (falls gewünscht)

## 4. Vorgehen
1. ✅ Idee aufschreiben (dieses Dokument)
2. ✅ Recherche mit vielen Agents → `research/`
3. ✅ Gemeinsames Ideen-Sammeln & Bewerten, UI-Prototyp (`prototypes/`, `/d6`)
4. ⏳ MVP definieren (Scope, Plattform, Tech-Stack)
5. ⬜ Proof of Concept (z. B. Foto → Produkt + MHD)
6. ⬜ Programmieren

## 5. Entscheidungen (2026-10-06, nach Recherche)
- Plattform: **Web-App** (PWA), Datenspeicherung **self-hosted per Docker auf dem NAS** (Update 2026-11-22, vorher Mac)
- **Open Source**
- Zweck: **Eigennutzung + Hobby**
- Startmarkt: **Deutschland** (BBK/BLE), weitere Quellen vorbereitet
- Foto-/Bilderkennung: **wichtig**, Anthropic API (siehe 01_FOTO_ERKENNUNG.md)
- Name: **Preposaurus** (Entscheidung 2026-11-22). Der frühere Arbeitstitel war wegen einer Markenkollision nur ein Codename, siehe research/25
- Zugriff: **mobiler Browser (PWA, „Zum Home-Bildschirm“) und PC-Browser**, gleiche Daten. Erreichbar **ausschließlich über Tailscale** (Update 2026-11-22, PLAN W1), zu Hause wie unterwegs, HTTPS über Tailscale Serve. Kein öffentliches Hosting.
