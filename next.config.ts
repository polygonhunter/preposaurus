import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  // PGlite lädt seine WASM- und Datendateien über import.meta.url. Gebündelt zeigt die URL ins
  // Leere (TypeError „path … Received an instance of URL“), deshalb lädt Node das Paket direkt.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Service Worker (M10-01): nie aus dem HTTP-Cache, damit ein Update sofort ankommt. Die CSP
  // gilt nur für das Skript des Service Workers selbst (Next-Doku „Progressive Web Apps“).
  headers: () =>
    Promise.resolve([
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
