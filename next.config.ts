import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  // PGlite lädt seine WASM- und Datendateien über import.meta.url. Gebündelt zeigt die URL ins
  // Leere (TypeError „path … Received an instance of URL“), deshalb lädt Node das Paket direkt.
  serverExternalPackages: ['@electric-sql/pglite'],
}

export default nextConfig
