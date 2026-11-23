// Seite, die der Service Worker zeigt, wenn eine Adresse ohne Verbindung nicht im Cache liegt
// (z. B. Erfassen oder Einstellungen). Eigenständig ohne Skripte und Stylesheets, weil ohne Netz
// nichts nachgeladen werden kann. Farben und Schrift wie DESIGN_SYSTEM §2–3.
const OFFLINE_HTML = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Ohne Verbindung · Preposaurus</title>
<style>
:root { color-scheme: light dark; --bg: #f2f2f7; --fg: #000; --fg2: #6c6c70; --accent: #0060cc; }
@media (prefers-color-scheme: dark) { :root { --bg: #000; --fg: #fff; --fg2: #a1a1a6; --accent: #4da3ff; } }
body { margin: 0; padding: 48px 16px; background: var(--bg); color: var(--fg);
  font: 17px/22px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; }
main { max-width: 480px; margin: 0 auto; }
h1 { font-size: 34px; line-height: 41px; margin: 0 0 12px; }
p { color: var(--fg2); margin: 0 0 24px; }
a { display: inline-flex; align-items: center; min-height: 44px; color: var(--accent);
  font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<main>
<h1>Ohne Verbindung</h1>
<p>Preposaurus erreicht das NAS gerade nicht. Übersicht und Vorrat zeigen den zuletzt geladenen Stand, wenn ihr sie vorher geöffnet habt. Erfassen und Ändern gehen wieder, sobald die Verbindung steht.</p>
<a href="/uebersicht">Zur Übersicht</a>
</main>
</body>
</html>`

const SERVICE_UNAVAILABLE = 503

export function offlineFallbackResponse(): Response {
  return new Response(OFFLINE_HTML, {
    status: SERVICE_UNAVAILABLE,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      // Eigene CSP wie die übrigen Seiten (#198): nichts laden, nur das eingebettete Stylesheet.
      'content-security-policy':
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    },
  })
}
