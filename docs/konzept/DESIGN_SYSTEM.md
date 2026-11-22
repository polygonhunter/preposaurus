# Preposaurus – Design-System „Systemnah“

> Stand 2026-11-22 · verbindlich für alle UI-Pakete (M3–M12) · ersetzt die Bildsprache d6 „Glas-Cockpit“.
> Entschieden aus Runde 2 (#118): Richtung 1 „Systemnah“, ergänzt um die PC-Ansicht und das Verlaufsdiagramm aus Richtung 2 „Werkbank“.
> Inhalte und Abläufe stehen in `UX_KONZEPT.md`. Dieses Dokument legt nur fest, **wie** es aussieht.

## 1. Leitidee

Preposaurus sieht aus wie eine App, die das Betriebssystem mitgeliefert hätte: ruhig, aufgeräumt, ohne Effekte.
Hierarchie entsteht über Größe, Gewicht und Abstand, nicht über Farbe oder Schmuck.

**Verboten**, weil es nach generierter App aussieht: Glas und `backdrop-filter`, Farbverläufe, Schlagschatten über `0 1px 2px`, Pastellkarten, Ring- und Tacho-Anzeigen, Emoji als Piktogramme, Serifen-Überschriften, Illustrationen, mehr als ein Akzent.

**Farbe trägt nur Bedeutung:** ein Akzent (Blau) für Handlungen, die Ampel für Zustände. Alles andere ist Grau.

## 2. Schrift

- **Systemschrift**, keine Webfonts: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`. Lädt nichts nach, passt zu Dynamic Type, keine Lizenzfrage.
- Ziffern immer tabellarisch (`font-variant-numeric: tabular-nums`).
- Skala (px / Zeilenhöhe / Gewicht):

| Token | Größe | Einsatz |
|---|---|---|
| `text-hero` | 64 / 1 / 700 | Kernzahl der Übersicht |
| `text-title` | 34 / 41 / 700 | Large Title je Seite |
| `text-title2` | 22 / 28 / 700 | Kennzahl in Kachelzeilen |
| `text-headline` | 17 / 22 / 600 | betonte Zeile, Knopf |
| `text-body` | 17 / 22 / 400 | Zeilentitel, Fließtext |
| `text-callout` | 15 / 20 / 400 | Zweitzeile mit Gewicht, Knopf klein |
| `text-footnote` | 13 / 18 / 400 | Untertitel, Gruppenkopf (VERSALIEN, `tracking-wide`) |
| `text-caption` | 11 / 13 / 500 | Achsen, Tab-Beschriftung (10) |

Am PC (ab „breit“) eine Stufe kleiner: Body 15, Footnote 12, Title 28.

## 3. Farben

Als CSS-Variablen in `src/app/globals.css`, in Tailwind über `@theme` als `bg-surface`, `text-fg2` usw. Dunkel folgt automatisch `prefers-color-scheme` (kein Schalter im MVP).

| Token | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `bg` | `#F2F2F7` | `#000000` | Seitenhintergrund |
| `surface` | `#FFFFFF` | `#1C1C1E` | Gruppen, Blätter, Tab-Leiste |
| `fill` | `#E3E3E8` | `#2C2C2E` | Suchfeld, Segment, getönter Knopf, Balkenspur |
| `fg` | `#000000` | `#FFFFFF` | Text |
| `fg2` | `#6C6C70` | `#A1A1A6` | Zweittext, Piktogramme |
| `line` | `#C6C6C8` | `#38383A` | Trennlinien (0,5 px auf Retina) |
| `line-strong` | `#85858A` | `#6E6E73` | Rand interaktiver Elemente: Feld, ausgeschalteter Schalter (≥ 3 : 1 auf `surface` und `bg`, WCAG 1.4.11) |
| `bar` | `#3A3A3C` | `#E5E5EA` | Balken, Diagramm |
| `accent` | `#0060CC` | `#4DA3FF` | Links, Knöpfe, aktiver Tab, Fokus |
| `on-accent` | `#FFFFFF` | `#000000` | Text auf Akzent |
| `red` | `#D70015` | `#FF6961` | abgelaufen, Löschen |
| `orange` | `#B04E00` | `#FFB340` | dringend |
| `yellow` | `#7E5F00` | `#FFD60A` | bald fällig |
| `green` | `#1C7A32` | `#32D74B` | gut, verbraucht |
| `bar-warn` | `#E07A00` | `#FF9F0A` | Balken, der begrenzt |

Alle Text-Kombinationen erfüllen WCAG AA (4,5 : 1). Der helle Akzent ist dafür seit M3-04 `#0060CC` statt `#0066D6`, weil Akzent-Text auf `fill` (getönter Knopf) sonst nur 4,24 : 1 erreicht (jetzt 4,6 : 1). **Zustand nie nur über Farbe:** Immer Punkt oder Farbe **plus Wort** („abgelaufen“, „dringend“, „bald fällig“, „gut“, „Datum fehlt“).

## 4. Raster, Abstände, Radien

- 4-px-Raster. Seitenrand 16 px (kompakt), 24 px (breit). Abstand zwischen Gruppen 22 px oben (inkl. Gruppenkopf).
- Radien: Gruppe 10 px, Knopf groß 12 px, Feld 10 px, Segment 9/7 px, Pill 999 px, Blatt oben 12 px.
- Touch-Ziele mindestens 44 × 44 px. Zeilen mindestens 44 px hoch.
- Schatten nur am Segment-Daumen und an Blättern (`0 1px 2px rgb(0 0 0 / .12)`).

## 5. Bausteine (`src/shared/ui`, jeder genau einmal)

| Baustein | Beschreibung |
|---|---|
| `PageHeader` | Navigationszeile 44 px (Zurück-Link mit Chevron links, Aktion rechts, beides in Akzent) und Large Title, optional Untertitel |
| `Group` / `Row` | Gruppierte Liste auf `surface`, Radius 10, Trennlinie eingerückt ab 16 px (mit Piktogramm ab 52 px). `Row` mit Titel, Zweitzeile, rechts Wert, Chevron oder Knopf. Als Link oder Knopf nutzbar |
| `GroupHeader` | 13 px VERSALIEN `fg2`, rechts optional Link in Akzent („Alle 18“) oder Summe |
| `Button` | `primary` (Akzent gefüllt, 50 px, Radius 12, volle Breite), `tinted` (Pill auf `fill`, Text Akzent, 15/600), `plain` (nur Text Akzent), `destructive` (Text Rot). Zustand lädt mit Text, nicht nur Spinner |
| `Segmented` | Segment-Steuerung für 2–4 Werte, Daumen auf `surface` |
| `SearchField` | 36 px auf `fill`, Lupe, Platzhalter `fg2` |
| `Chip` | Pill auf `surface`; aktiv invertiert (`fg` auf `bg`). Eine Reihe, waagerecht scrollbar |
| `StatusBadge` | Ampel-Punkt 8 px plus Wort in Ampelfarbe, 13/600 |
| `DayBar` | Balken auf Tages-Skala: Spur `fill`, Füllung `bar` oder `bar-warn`, Zielmarke 2 px `fg`, Wert rechts |
| `StatTiles` | 2–4 Kennzahlen nebeneinander in einer Gruppe, durch Linien getrennt (Zahl `title2`, Wort `footnote`) |
| `Field` | Label über dem Feld, Feld auf `surface` mit Rand `line-strong`, Hinweis und Fehler darunter (`red`, mit `aria-describedby`) |
| `Toggle` | Schalter wie iOS, Grün für „an“, „aus“ als Spur `fill` mit 1-px-Innenrand `line-strong` |
| `Sheet` | Blatt von unten (`<dialog>`), Griff, Titel, Inhalt, Aktionen unten. Am PC als zentrierter Dialog |
| `UndoBar` | Rückgängig-Zeile unten über der Tab-Leiste, 5 s, optional zweite Aktion („Auf Einkaufsliste“) |
| `EmptyState` | Ein Satz, eine Handlung. Kein Bild |
| `Sparkline` | Verlaufsdiagramm aus „Werkbank“: 1,5-px-Linie `bar`, letzte Marke als Punkt, keine Füllung, Achse nur Anfang/Ende |
| `Icon` | Eigene Linien-Piktogramme als Inline-SVG, 24er-Raster, Strich 1,5 px, `currentColor`. Satz siehe Prototyp Runde 2 (Übersicht, Vorrat, Plus, Wagen, Diagramm, Kalender, Tropfen, Zahnrad, Lupe, Filter, Chevron, Zurück, Haken, X, Mehr, Blitz, Ort) |

## 6. Rahmen und Navigation

- **Kompakt (< 640 px):** Tab-Leiste unten auf `surface` mit Haarlinie, Höhe 50 px plus Safe Area. Fünf Ziele: Übersicht · Vorrat · **Erfassen** (runder Akzent-Knopf 46 px in der Mitte, Beschriftung nur für Screenreader) · Nachkaufen · Statistik. Zahnrad oben rechts auf der Übersicht führt zu den Einstellungen.
- **Mittel (≥ 640 px, ≥ 700 px hoch):** wie kompakt, Inhalt max. 640 px breit zentriert.
- **Breit (≥ 900 px):** Seitenleiste 216 px links auf `bg` mit denselben Zielen, Zähler rechts (z. B. „Bald fällig 5“), darunter Einstellungen. Inhalt auf `surface`. Vorrat als Liste und Detail nebeneinander.
- **Weit (≥ 1280 px):** Vorrat als Tabelle mit Gruppenzeilen (Warengruppe als Zwischenzeile), Spalten Packungen · Menge · kcal · Tage · nächstes MHD, ausgewählte Zeile in Akzent, Detail rechts. Tastenkürzel als `kbd` sichtbar (`/` Suche, `n` Erfassen).

## 7. Seitenmuster

- **Übersicht:** Satz „Euer Vorrat reicht für“ + Kernzahl (hero) + „Tage“, darunter `DayBar` Essen und Wasser mit Ziel. Ein Satz, was begrenzt. Dann eine Gruppe mit Zielzeile und dem einen nächsten Schritt. **Bald fällig direkt sichtbar:** `StatTiles` (abgelaufen · diese Woche · diesen Monat · in 3 Monaten) und die ersten 3 Zeilen, Link „Alle N“. Danach Warengruppen-Abdeckung als `DayBar`-Liste, dann Nährwerte.
- **Vorrat:** Ebene 1 Warengruppen als Gruppe mit Tagen und Menge, Ebene 2 mit Kategorie als Gruppenkopf und einer Chip-Reihe zum Springen. „−1“ als getönter Knopf in der Zeile. Filter als Blatt, keine Dropdowns.
- **Detail:** Pfadzeile, Large Title, `StatTiles`, Haltbarkeits-Diagramm (Säulen je MHD), Abschnitte je Produkt mit Zeilen je Datum, unten fest „1 entnehmen · MHD“.
- **Formulare:** gruppierte Felder, ein `primary`-Knopf unten. Fehler am Feld, nie nur oben.
- **Kamera:** immer dunkel, Vollbild, Schrittbalken oben, Auslöser 72 px.

## 8. Bewegung

Nur CSS: Übergänge 150–250 ms `ease-out`, Blatt 250 ms, View Transitions für Seitenwechsel. `prefers-reduced-motion` schaltet alles ab. Keine Animationsbibliothek.

## 9. Ton

Ruhig und freundlich, duzen im Plural („euer Vorrat“), keine Angstmache, keine Ausrufezeichen. „MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.“
