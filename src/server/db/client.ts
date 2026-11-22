import 'server-only'
import type { DatabaseConnection } from './connection'

const PGLITE_PREFIX = 'pglite://'
const IN_MEMORY = 'memory'

// pglite://./.data/dev → Ordner ./.data/dev, pglite://memory → nur im Speicher.
function toPgliteDataDir(url: string): string | undefined {
  const path = url.slice(PGLITE_PREFIX.length)
  return path === '' || path === IN_MEMORY ? undefined : path
}

// Die Treiber werden erst bei Bedarf geladen, damit der Container kein WASM von PGlite lädt.
export async function connectDatabase(url: string): Promise<DatabaseConnection> {
  if (url.startsWith(PGLITE_PREFIX)) {
    const { connectPglite } = await import('./pglite-driver')
    return connectPglite(toPgliteDataDir(url))
  }
  const { connectPostgres } = await import('./postgres-driver')
  return connectPostgres(url)
}
