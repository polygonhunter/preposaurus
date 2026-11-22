// Startet den Standalone-Server so, wie ihn später der Container startet (output: 'standalone').
// next build legt static/ und public/ nicht in den Standalone-Ordner, darum werden sie hier kopiert.
// Aufruf nach npm run build: node scripts/start-standalone.ts (Port über PORT, Host über HOSTNAME)
import { cpSync, existsSync } from 'node:fs'

const STANDALONE_DIR = '.next/standalone'

if (!existsSync(`${STANDALONE_DIR}/server.js`)) {
  throw new Error('Kein Standalone-Build gefunden. Bitte zuerst npm run build ausführen.')
}

cpSync('.next/static', `${STANDALONE_DIR}/.next/static`, { recursive: true })
if (existsSync('public')) cpSync('public', `${STANDALONE_DIR}/public`, { recursive: true })

await import(new URL(`../${STANDALONE_DIR}/server.js`, import.meta.url).href)
