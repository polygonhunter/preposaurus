# Foto-Erkennung – Konzept (Entwurf v0.2, 2026-10-07)

## Grundsatz
- **Kein Barcode, keine Marken.** Es zählt nur: *Was ist es? Wie viel? Bis wann haltbar? (optional: wie viele kcal?)*
  Beispiel: „Nudeln · 10 × 500 g · MHDs 09/2027 (6×), 11/2027 (4×)“
- Erkennung über **Cloud-API** (Anthropic oder OpenAI), je nachdem, welches Modell im Test besser abschneidet. Der Anbieter bleibt austauschbar, der API-Key liegt nur auf dem Mac-Server.
- Antworten als **strukturierte Daten (JSON-Schema)**, technisch erzwungen per Structured Outputs.
- KI-Ergebnisse sind immer **Vorschläge**. Gespeichert wird erst nach Bestätigung.

## Erfassungs-Maske „Produkt hinzufügen“
Mehrere Fotos pro Produkt, jedes mit eigener Rolle:

| Schritt | Foto | Pflicht? | Liefert |
|---|---|---|---|
| 1 | **Verpackung** (Vorderseite) | ja | Bezeichnung, Kategorie, Behälter, Inhalt pro Stück (g/ml) |
| 2 | **Nährwerttabelle** | optional | kcal pro 100 g/ml → kcal pro Stück; ggf. Eiweiß/KH/Fett |
| 3 | **MHD-Fotos**, eines pro Packung | ja (mind. 1) | je Foto ein Datum; **Anzahl Fotos = Anzahl Stück** |

**Ablauf in der Maske:**
1. Verpackung fotografieren. Ergebnis: Karte „Nudeln · 500 g · Packung“ (sofort editierbar)
2. Optional die Nährwerttabelle fotografieren. Ergebnis: „359 kcal/100 g → 1.795 kcal pro Packung“
3. MHD-Serie: Packung für Packung das Datum fotografieren. Ein Zähler läuft mit: „Packung 7 · 23.09.2027 ✓“
   - Jedes Datum wird sofort im Hintergrund erkannt und als Chip angezeigt. Antippen öffnet die Korrektur.
   - Nicht lesbar → Chip in Gelb, „bitte nochmal oder manuell“.
4. Zusammenfassung: „10 × Nudeln 500 g = 5 kg · 17.950 kcal · MHDs: 09/2027 (6×), 11/2027 (4×)“. Danach **Speichern**.

**Abkürzungen** (damit 10 Fotos nicht zur Pflicht werden):
- „Alle gleiches Datum“: 1 MHD-Foto plus Anzahl-Stepper (−/+)
- „Datum manuell“: Monat/Jahr-Picker mit Schnellknöpfen (+6 Mon., +1 J., +2 J.)
- „Ohne Datum“: Schätzung nach Kategorie, markiert als „geschätzt“
- Ohne Nährwertfoto: kcal-Durchschnitt der Kategorie (markiert als „geschätzt“)

**Später möglich:** „Gleiches Produkt nochmal kaufen“, also Verpackung und Nährwerte aus früherer Erfassung übernehmen und nur noch MHDs fotografieren.

## Datenmodell (Kern)
```
Produkt     (Nudeln, getreide, packung, 500 g, 359 kcal/100 g, Fotos)
 └─ Einheit (je Packung: MHD 2027-09-30, genauigkeit monat, status: im Vorrat / verbraucht)
```
Jede Packung ist eine eigene Einheit mit eigenem MHD. So kann die App sagen, *welche* Packung zuerst weg muss (FIFO/„lebendiger Vorrat“). Die Anzeige gruppiert gleiche Daten.

## Drei Erkennungs-Aufrufe (je Foto-Rolle ein eigener Prompt + Schema)
Separate Aufrufe statt einem großen: kürzere Prompts, schnellere Antworten (MHD-Chips erscheinen live), und für MHD-Fotos reicht evtl. ein günstigeres Modell.

### A) Verpackung
```json
{
  "bezeichnung": "Nudeln",            // generisch, deutsch, ohne Marke
  "kategorie": "getreide",            // enum, siehe Kategorien
  "behaelter": "packung",             // dose | glas | packung | flasche | tetrapak | beutel | sonstiges
  "inhalt": { "wert": 500, "einheit": "g" },   // g | ml | null wenn nicht lesbar
  "abtropfgewicht_g": null,           // Dosen/Gläser, falls aufgedruckt
  "sicherheit": "hoch"
}
```

### B) Nährwerttabelle
```json
{
  "bezug": "100g",                    // 100g | 100ml | portion
  "kcal": 359,
  "eiweiss_g": 12.5, "kohlenhydrate_g": 71, "fett_g": 2,   // optional, null wenn nicht lesbar
  "sicherheit": "hoch"
}
```
Bei Angabe in kJ und kcal gilt kcal. Gibt es nur kJ, wird umgerechnet (÷ 4,184).

### C) MHD
```json
{
  "roh_text": "23.09.2027",           // exakt wie aufgedruckt, oder null
  "datum": "2027-09-23",              // ISO; nur Monat/Jahr → Monatsende; nur Jahr → 31.12.
  "genauigkeit": "tag",               // tag | monat | jahr | unbekannt
  "art": "mhd",                       // mhd | verbrauchen_bis | unbekannt
  "sicherheit": "hoch"
}
```
Zusätzlich prüft die App die Plausibilität (Datum in der Vergangenheit? Weit weg vom Kategorie-Default?) und markiert Auffälliges mit „bitte prüfen“.

## System-Prompts (Entwurf)

**Gemeinsamer Kopf:**
```
Du hilfst beim Erfassen von Haushaltsvorräten. Antworte ausschließlich im
vorgegebenen Schema. Wenn ein Wert nicht sicher lesbar ist, setze null –
schätze und erfinde nichts. Bewerte deine Sicherheit ehrlich.
```
**A) Verpackung:**
```
Das Foto zeigt die Verpackung EINES Lebensmittels. Bestimme eine generische
deutsche Bezeichnung ohne Markennamen ("Nudeln", "Thunfisch in Öl", "Mais"),
genau eine Kategorie aus der Liste, den Behältertyp und die aufgedruckte
Füllmenge pro Stück (kg→g, l→ml umrechnen). Bei Konserven zusätzlich das
Abtropfgewicht, falls angegeben.
```
**B) Nährwerttabelle:**
```
Das Foto zeigt eine Nährwerttabelle. Lies den Energiewert in kcal sowie Eiweiß,
Kohlenhydrate und Fett aus der Spalte pro 100 g bzw. 100 ml. Gibt es nur eine
Portionsspalte, nutze diese und setze bezug="portion".
```
**C) MHD:**
```
Das Foto zeigt einen Datumsaufdruck (Mindesthaltbarkeits- oder Verbrauchsdatum),
evtl. als Prägung, Punktmatrix oder auf glänzender Folie. Gib den Aufdruck exakt
in roh_text wieder. EU-Format: Tag.Monat.Jahr. Nur Monat/Jahr → letzter Tag des
Monats, genauigkeit "monat". Nur Jahr → 31.12., genauigkeit "jahr".
"zu verbrauchen bis" → art "verbrauchen_bis". Chargen-/Losnummern (z. B. "L2345")
und Uhrzeiten sind KEIN Datum. ERFINDE NIEMALS EIN DATUM.
```

## Kategorien (angelehnt an BBK/BLE-Warengruppen)
| Schlüssel | Anzeige | Beispiele |
|---|---|---|
| `getreide` | Getreide, Brot, Nudeln, Reis, Kartoffeln | Nudeln, Reis, Knäckebrot, Haferflocken, Mehl |
| `gemuese_huelsenfruechte` | Gemüse & Hülsenfrüchte | Dosenmais, Erbsen, Linsen, Bohnen, passierte Tomaten |
| `obst_nuesse` | Obst & Nüsse | Dosenpfirsiche, Apfelmus, Trockenobst, Nüsse |
| `milch` | Milch & Milchprodukte | H-Milch, Milchpulver, Hartkäse |
| `fleisch_fisch_eier` | Fisch, Fleisch, Eier | Thunfisch, Würstchen im Glas, Corned Beef |
| `fette_oele` | Fette & Öle | Speiseöl, Butterschmalz |
| `getraenke` | Getränke & Wasser | Mineralwasser, Saft |
| `fertiggerichte` | Fertiggerichte | Ravioli, Eintopf, Suppen |
| `sonstiges` | Sonstiges | Zucker, Honig, Salz, Kaffee, Schokolade, Babynahrung |
| `non_food` | Nicht-Lebensmittel | Batterien, Kerzen, Medikamente (später) |

## Modellwahl: im Test entscheiden
Gemessen wird an **echten Fotos**, nicht nach Bauchgefühl:
- **Kandidaten:** Claude Sonnet 5.5 und Claude Haiku 5.5 (Opus 5.5 optional als Referenz).
- **Testset** (Fotos aus dem echten Vorrat):
  - ~15 Verpackungsfotos
  - ~10 Nährwerttabellen
  - ~30 MHD-Fotos, davon viele schwierige: Prägung auf dem Dosendeckel, Punktmatrix, Folie
- **Wahrheit:** die richtigen Werte von Hand in einer Tabelle
- **Kennzahlen je Foto-Rolle:**
  1. **erfundene MHDs** (Ziel ≈ 0)
  2. MHD exakt richtig
  3. Kategorie und Füllmenge richtig
  4. kcal richtig
  5. Dauer pro Foto
  6. Kosten pro Foto
- **Möglich:** pro Rolle ein anderes Modell, z. B. ein günstiges für MHD und ein starkes für die Verpackung.

## Hinweis Datenschutz
Anthropic bietet keine EU-Datenresidenz („global“/„us“), OpenAI nur gegen Aufpreis. Beide nutzen API-Daten standardmäßig nicht fürs Training. EXIF/GPS wird vor dem Upload entfernt und das Bild verkleinert.

## Entscheidungen (2026-10-07)
- **Jeder Schritt geht wahlweise per Foto oder manuell.** Das Foto ist eine Abkürzung, nie Pflicht.
- **Live-Kamera** für die Fotos (Auslöser → nächste Packung).
- **Fotos werden gespeichert** (Produktbild in der Liste; Datei-Volume, DB nur Referenz).

## Ordnungssystem: Kategorien, Behälter, eigene Gruppen (v0.1, 2026-10-07)
Drei unabhängige Ebenen statt einer überladenen Kategorie-Liste:

| Ebene | Frage | Wer pflegt? | Wofür |
|---|---|---|---|
| **Warengruppe** | Was zählt es im Vorratsrechner? | System (aus der gewählten Quelle, z. B. BBK) | Berechnung „X Tage versorgt“ |
| **Kategorie** | Was ist es? | System-Kategorien + **eigene Kategorien** | Anzeige, Piktogramm, Filter |
| **Merkmale** | Wie/wo ist es gelagert? | Behälter (Dose, Glas …), Lagerort (Keller, Küche …), freie Tags | Filter & Ansichten |

- Jede eigene Kategorie muss **einer Warengruppe zugeordnet** werden (Standard: per kcal zählen). So rechnet der Vorratsrechner immer korrekt, egal wie individuell sortiert wird.
- **„Dosen“ ist ein Behälter, keine Kategorie.** Die Ansicht „Alle Dosen“ ist ein Filter. Thunfischdosen bleiben damit in der Warengruppe Fisch, Fleisch, Eier und tauchen trotzdem in der Dosenübersicht auf.
- **Verwaltung:** Einstellungen → „Kategorien & Lagerorte“. Dort kann man anlegen, umbenennen, Piktogramm wählen, ausblenden (System-Kategorien nur ausblenden, nicht löschen) und sortieren. Eine neue Kategorie lässt sich auch direkt in der Erfassungsmaske anlegen („+ Neue Kategorie“).
- **Vorgeschlagene Ergänzungen:** Wasser getrennt von Getränken (wichtigster Einzelwert, eigenes Ziel in Litern); Baby & Kleinkind (Sonderbedarf je Haushaltsmitglied); Tierfutter (später, gekoppelt an Haustiere im Haushalt). Non-Food später aufteilen in Hygiene, Hausapotheke, Energie & Licht.

DB-Skizze: `warengruppe` (Seed, je Quelle versioniert) ← `kategorie` (system/eigene, FK warengruppe) ← `produkt` (FK kategorie, FK behaelter) → `einheit` (MHD, Status); `lagerort`, `tag` + `produkt_tag` (m:n).

## Entscheidung KI-Anbieter (2026-10-08)
- **Anthropic** (Claude API). OpenAI entfällt; der Adapter bleibt trotzdem austauschbar.
- Start: **Claude Sonnet 5.5** für alle Foto-Rollen. Im PoC wird pro Rolle gegen **Haiku 5.5** (`claude-haiku-5-5`) getestet. Wenn Haiku bei Verpackung/Nährwerten gleich gut ist, wird es dort genutzt; MHD bleibt bei Sonnet, außer der Test zeigt Gleichstand.
- Modell pro Rolle per Konfiguration (Env), nicht im Code fest verdrahtet.
- Preise lt. Anthropic-Referenz (Stand 2026-10): Sonnet 5.5 2 $/10 $, **Haiku 5.5 0,10 $/0,50 $** pro 1 Mio. Tokens (bis 100k Prompt). Haiku 4.5 (1 $/5 $) ist Vorgänger und wird nicht genutzt. Haiku 5.5 kostet also nur rund ein Zwanzigstel von Sonnet. Daher Haiku überall dort einsetzen, wo es im Test gleich gut ist.
