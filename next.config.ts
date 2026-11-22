import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  // PGlite lädt WASM und Daten über new URL(…, import.meta.url). Gebündelt findet es die Dateien
  // nicht mehr (seit die Vorrat-Seiten in Next aus der DB lesen), deshalb normales Node-require.
  serverExternalPackages: ['@electric-sql/pglite'],
}

export default nextConfig
