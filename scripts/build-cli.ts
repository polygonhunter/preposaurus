// Bündelt die Befehle des Images (UMSETZUNG M13-01) nach dist/cli: Migrationen, Stammdaten und
// die Notfall-Befehle aus EINSTELLUNGEN_NUTZER §3.4. Aufruf: npm run build:cli
// Warum bündeln: Der Standalone-Build von Next enthält nur, was der Webserver braucht. tsx ist
// eine reine Entwicklungsabhängigkeit, und Node löst weder den Pfad-Alias @/ noch Importe ohne
// Dateiendung auf. esbuild macht daraus reines JavaScript, das im Image mit node läuft.
import { build } from 'esbuild'

await build({
  entryPoints: {
    migrate: 'src/server/db/migrate.ts',
    seed: 'db/seeds/index.ts',
    admin: 'scripts/admin.ts',
  },
  outdir: 'dist/cli',
  outExtension: { '.js': '.mjs' },
  chunkNames: 'chunks/[name]-[hash]',
  bundle: true,
  // Hält den PGlite-Treiber in einem eigenen Teil, der nur bei pglite:// geladen wird.
  splitting: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  // server-only liefert unter react-server eine leere Datei, wie in den npm-Skripten.
  conditions: ['react-server'],
  // PGlite lädt WASM-Dateien neben sich und gehört nicht ins Image (dort läuft PostgreSQL).
  external: ['@electric-sql/pglite', 'pg-native'],
  // CommonJS-Pakete wie pg rufen require() auf, das es in ES-Modulen sonst nicht gibt.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
})
