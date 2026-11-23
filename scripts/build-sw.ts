// Bündelt den Service Worker (src/shared/sw/service-worker.ts) nach public/sw.js (M10-01, #81).
// Läuft automatisch vor npm run build und npm run dev (prebuild, predev). public/sw.js ist
// erzeugt und nicht eingecheckt.
import { build } from 'esbuild'

await build({
  entryPoints: ['src/shared/sw/service-worker.ts'],
  outfile: 'public/sw.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  // Jeder Build ergibt einen neuen Service Worker. Er löscht beim Aktivieren die alten Caches,
  // deren Seiten auf Dateien verweisen, die es nach dem Update nicht mehr gibt.
  define: { SW_VERSION: JSON.stringify(Date.now().toString(36)) },
  logLevel: 'warning',
})
