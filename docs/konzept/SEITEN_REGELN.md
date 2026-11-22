# Regeln für die Konzept-Seiten (HTML, werden als Claude-Artifact veröffentlicht)

Die Seiten werden auf dem iPhone in der Claude-App gelesen. Deshalb:

## Format
- Eine `.html`-Datei pro Dokument, **ohne** `<!doctype>`, `<html>`, `<head>`, `<body>` (das Gerüst wird beim Veröffentlichen ergänzt). Oben in der Datei: `<title>` (kurzer Name, 2–4 Wörter, keine Erklärung nach Doppelpunkt), `<meta name="claude:viewport-fit-sides" content="cover">`, dann `<style>`.
- Seitenränder: `padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));` auf einem äußeren Wrapper, vertikal nur `padding-block`.
- Muss bei 375–400 px Breite funktionieren, die Seite scrollt nie horizontal. Breite Diagramme/Tabellen in eigenem `overflow-x: auto`-Container. Textspalten max. ~65 Zeichen.
- Größe < 1 MB, alles inline (CSS, SVG). Externe Skripte nur von cdnjs.cloudflare.com mit exakter Version, Schriften nur Google Fonts mit Fallback. Möglichst ohne JavaScript-Bibliotheken.
- **Diagramme:** Mermaid wird nativ gerendert über `<pre class="mermaid">…</pre>` (keine Bibliothek laden). Alternativ inline-SVG mit Farben aus den Tokens. Mermaid-Diagramme schmal halten (Richtung `TD`, kurze Beschriftungen), damit sie auf dem Handy lesbar sind.
- Kein `window.print()`, kein `alert/confirm/prompt`, keine iframes, keine Download-Links.

## Theme (Pflicht)
Alle Farben als Tokens. Muster:
```css
:root { --bg: …; --fg: …; --muted: …; --line: …; --accent: …; --ok: …; --warn: …; --bad: … }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* alle Tokens dunkel */ color-scheme: dark } }
:root[data-theme="dark"] { /* gleiche dunkle Werte */ color-scheme: dark }
body { background: var(--bg); color: var(--fg) }
```
Keine Farbe, die nur in einem Theme lesbar ist.

## Gestaltung
- Gemeinsame Bildsprache für alle drei Dokumente, angelehnt an den gewählten Prototyp d6 „Glas-Cockpit“ (`prototypes/components/d6/theme/`): hell, ruhige Glasflächen, Ampelfarben grün/gelb/orange/rot für MHD.
- Schriften: Space Grotesk (Überschriften) + Inter (Text) über Google Fonts, `font-variant-numeric: tabular-nums` bei Zahlen.
- Kein Emoji als Abschnittsmarker, keine Nummerierung, wo keine Reihenfolge ist. Inhaltsverzeichnis mit Sprunglinks (`#abschnitt`, nur Buchstaben/Ziffern/Bindestriche).
- Sprache: Deutsch, ruhig und sachlich, kurze Sätze, keine Angstmache. Fachbegriffe beim ersten Auftreten kurz erklären (Leser ist technisch interessiert, aber kein Entwickler).
- Jede Seite endet mit „Offene Punkte / zur Freigabe“ als Checkliste.
