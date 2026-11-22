# Haushalt & Ziel – Konzept (Entwurf v0.1, 2026-10-07)

Grundlagen: research/07 (BBK), research/08 (BLE), research/12 (Ernährung & Formeln).

## 1. Haushalt

### Mitglied
| Feld | Pflicht | Zweck |
|---|---|---|
| Name / Spitzname | ja | Anzeige |
| Piktogramm-Typ | ja | Baby · Kind · Jugendliche:r · Erwachsene:r · Senior:in |
| Geburtsjahr (oder Monat bei Babys) | ja | Alter rechnet sich automatisch fort, kein jährliches Pflegen |
| Geschlecht | optional | nur für den Modus „Individuell“ (DGE-Werte) |
| Aktivität | optional | wenig · normal · viel (PAL 1,4 / 1,6 / 1,8), Standard „normal“ |
| Schwanger / stillend | optional | Zuschlag (+250/+500 kcal, mehr Wasser) |
| Ernährungsform | optional | alles · vegetarisch · vegan (tauscht Warengruppen, kcal bleiben gleich) |
| Allergien / Unverträglichkeiten | optional | Hinweise beim Einkaufsplan (z. B. „glutenfrei“) |

- Baby: eigener Sonderbedarf (Säuglingsnahrung, abgekochtes Wasser). Er zählt nicht in die normalen Warengruppen.
- Haustiere kommen später als eigener Mitgliedstyp (Futter in g/Tag, Wasser).
- Gesundheitsangaben bleiben auf dem eigenen Server (Self-Hosting).

### Zwei Rechenmodi
| Modus | Energie | Wasser | Wann |
|---|---|---|---|
| **Offiziell** (Standard) | 2.200 kcal pro Person | 2 l Erwachsene, 1 l Kinder bis 12 (BLE), 2 l ab 65 | quellentreu, einfach |
| **Individuell** | DGE-Wert nach Alter, Geschlecht, Aktivität + Zuschläge | wie offiziell, optional DGE-genau | genauer für Kinder/Teens/Senior:innen |

Daneben steht immer ein ⓘ: „So wird gerechnet + Quelle + Stand“.

## 2. Quelle
- Pro Haushalt wird **eine aktive Quelle** gewählt. MVP: **BBK/BLE (Deutschland)**. AT/CH/EU sind im Datenmodell vorbereitet.
- Die Quelle liefert: Standard-Zeitraum, Wasser pro Person und Tag, kg je Warengruppe pro Person für 10 Tage.
- Werte sind versioniert (Quelle, Stand, Link) und vor dem Import **von Hand gegen das Original geprüft**.

## 3. Ziel
| Feld | Beispiel |
|---|---|
| Zieldauer | 3 · 10 · 14 Tage oder eigener Wert (Standard aus der Quelle: 10) |
| Zieldatum | 31.12.2026 |
| Etappen (optional) | „3 Tage bis 31.10.“ → „10 Tage bis 31.12.“ |

### Fortschritt
- **Kernzahl:** „Ihr seid für **6 Tage** versorgt“. Gemeint ist der *Engpass*, also der kleinste Wert aus Energie und Wasser.
- Darunter Balken je Warengruppe, z. B. Getreide 8/10 Tage, Wasser 4/10 ← Engpass, Fette 10/10 ✓
- Gezählt wird nur, was **am Zieldatum noch haltbar** ist. So zählt nichts mit, was bis dahin abgelaufen ist.
- Die Energie-Tage ergeben sich aus den kcal im Bestand, geteilt durch den Tagesbedarf des Haushalts. Ohne Nährwertfoto zählen die kcal-Durchschnitte der Kategorie (markiert als „geschätzt“).

### Einkaufsplan
- Lücke = Ziel minus Bestand, je Warengruppe in kg/l.
- Aufgeteilt auf die Wochen bis zum Zieldatum: „Diese Woche: 6 l Wasser, 1 kg Reis, 2 Dosen Linsen“.
- Haken setzen → direkt in die Erfassung übernehmen (Foto oder manuell).

## 4. DB-Skizze
`haushalt` (aktive Quelle, Rechenmodus) ← `mitglied` (Typ, Geburtsdatum, Geschlecht, Aktivität, Zustand, Ernährungsform) ← `mitglied_allergie` (m:n)
`quelle` → `quelle_version` → `quelle_wert` (Warengruppe, Menge pro Person und Tag)
`ziel` (Haushalt, Tage, Zieldatum) ← `ziel_etappe`

## Entscheidungen (2026-10-07)
- **Ein Haushalt pro Installation** im MVP. Mehrere Haushalte später; die DB behält trotzdem `haushalt_id`, damit das ohne Umbau nachrüstbar ist.
- **Mehrere Nutzer mit eigenem Login**, alle gleichberechtigt im selben Haushalt (Tabelle `nutzer`, FK haushalt).
- **MHD-Zählweise: beides anzeigen.** „Heute versorgt: X Tage“ (alles heute Haltbare) + „Ziel <Datum>: X von Y Tagen“ (nur am Zieldatum noch Haltbares) + Hinweis auf Artikel, die vor dem Zieldatum ablaufen.

## Ernährungsform & Makronährstoffe (2026-10-07)

### Vegetarisch / vegan
- Einstellung **pro Mitglied** (alles · vegetarisch · vegan), dazu ein Haushalts-Standard, damit man sie nicht für jede Person einzeln setzen muss.
- Wirkung auf die Empfehlung (kcal-Summe bleibt gleich, nur die Verteilung ändert sich):
  - **vegetarisch:** Warengruppe „Fisch, Fleisch, Eier“ → Eier/Eipulver + Hülsenfrüchte, Nüsse, Soja/Tofu (haltbar)
  - **vegan:** zusätzlich „Milch & Milchprodukte“ → angereicherte Pflanzendrinks (H-Ware), Soja; Eier entfallen
- Gemischter Haushalt: Zielmengen werden pro Person berechnet und summiert (z. B. 2 × alles + 1 × vegan).
- Hinweise im Einkaufsplan (z. B. vegan → „Vitamin B12 mitdenken“). Die genauen Werte müssen gegen Primärquellen geprüft werden.
- Der Vorrat warnt freundlich, wenn Artikel nicht zur Ernährungsform passen („Thunfisch zählt bei vegan nicht zum Ziel“).

### Makronährstoffe
- Getrackt pro Produkt (je 100 g/ml): **kcal, Eiweiß, Kohlenhydrate, Fett**. Optional (sofern auf dem Foto lesbar): Ballaststoffe, Zucker, Salz.
- Quelle: das Nährwerttabellen-Foto (schon im KI-Schema vorgesehen) oder manuelle Eingabe; sonst **Durchschnitt der Kategorie**, markiert als „geschätzt“.
- **Tagesbedarf je Mitglied:**
  - **Energie:** wie bisher (offiziell 2.200 kcal oder individuell nach DGE)
  - **Eiweiß:** nach DGE-Referenzwert (g/kg Körpergewicht, ab 65 höher). Dafür optionales Feld „Gewicht“ beim Mitglied, sonst ein Referenzgewicht je Alter und Geschlecht.
  - **Fett / Kohlenhydrate:** als Energie-Anteil (Richtwerte DGE)
  - Alle Werte müssen vor der Umsetzung an der DGE-Primärquelle geprüft werden.
- **Anzeige:**
  - Makro-Kachel mit „Eiweiß reicht für X Tage“ usw.
  - Ein Makro-Engpass fließt als Hinweis in die Übersicht ein („Energie reicht 6 Tage, Eiweiß nur 3“). Die Kernzahl „versorgt“ bleibt Energie und Wasser, wie bei BBK.
- DB: `produkt.kcal_100`, `eiweiss_100`, `kh_100`, `fett_100`, `ballaststoffe_100?`, `zucker_100?`, `salz_100?`, `naehrwerte_geschaetzt` (bool); `mitglied.ernaehrungsform`, `mitglied.gewicht_kg?`; `haushalt.standard_ernaehrungsform`.
