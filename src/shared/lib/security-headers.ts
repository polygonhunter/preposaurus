// Content-Security-Policy der Seiten (#198). Der Proxy setzt sie je Seitenaufruf mit frischer Nonce,
// die übrigen Sicherheits-Header stehen in next.config.ts und gelten für jede Antwort. Begründungen stehen in
// 05_STATUS_ENTSCHEIDUNGEN.md (Abschnitt „Sicherheits-Header und CSP“).

export type ContentSecurityPolicyOptions = Readonly<{
  nonce: string
  isDevelopment: boolean
}>

// Nur der Dev-Server braucht eval (React baut damit Fehler-Stacks nach), inline Styles (Fehler-
// Overlay) und eine WebSocket-Verbindung für das Neuladen (Next-Doku „Content Security Policy“).
function scriptSource({ nonce, isDevelopment }: ContentSecurityPolicyOptions): string {
  const dev = isDevelopment ? " 'unsafe-eval'" : ''
  return `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev}`
}

function styleSource({ nonce, isDevelopment }: ContentSecurityPolicyOptions): string {
  return isDevelopment ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`
}

/**
 * CSP für alle Seiten. `'strict-dynamic'` lässt `'self'` in script-src wirkungslos werden, deshalb
 * steht der Service Worker ausdrücklich unter `worker-src`. `style-src-attr` erlaubt nur die
 * style-Attribute der Balken (DayBar, ShelfLifeChart), keine Stylesheets. Kein
 * `upgrade-insecure-requests`, weil die App ohne Sidecar unter http://127.0.0.1:3000 läuft.
 */
export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions): string {
  return [
    "default-src 'self'",
    scriptSource(options),
    styleSource(options),
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    options.isDevelopment ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
