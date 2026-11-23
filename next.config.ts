import type { NextConfig } from 'next'

// Kamera nur für die eigene Seite (Foto-Erfassung), alles andere aus.
const PERMISSIONS_POLICY = [
  'camera=(self)',
  'microphone=()',
  'geolocation=()',
  'payment=()',
  'usb=()',
].join(', ')

// Ein Jahr, ohne includeSubDomains und preload: Browser beachten HSTS nur über HTTPS (RFC 6797
// § 8.1), über http://127.0.0.1:3000 bleibt der Header also wirkungslos.
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Strict-Transport-Security', value: `max-age=${String(ONE_YEAR_SECONDS)}` },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  // PGlite lädt seine WASM- und Datendateien über import.meta.url. Gebündelt zeigt die URL ins
  // Leere (TypeError „path … Received an instance of URL“), deshalb lädt Node das Paket direkt.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Allgemeine Sicherheits-Header für jede Antwort (#198). Die CSP der Seiten setzt der Proxy mit
  // Nonce, Fotos (/api/photos) und /sw.js bringen ihre eigene mit.
  headers: () =>
    Promise.resolve([
      { source: '/:path*', headers: SECURITY_HEADERS },
      // Service Worker (M10-01): nie aus dem HTTP-Cache, damit ein Update sofort ankommt. Die CSP
      // gilt nur für das Skript des Service Workers selbst (Next-Doku „Progressive Web Apps“).
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]),
}

export default nextConfig
