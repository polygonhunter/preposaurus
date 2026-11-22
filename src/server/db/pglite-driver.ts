import 'server-only'
import { mkdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { DEFAULT_MIGRATIONS_FOLDER, type DatabaseConnection } from './connection'

// Ohne Ordner läuft PGlite nur im Speicher, das nutzen die Integrationstests.
export async function connectPglite(dataDir?: string): Promise<DatabaseConnection> {
  // PGlite legt nur den letzten Ordner an, nicht die übergeordneten (z. B. .data/).
  if (dataDir !== undefined) await mkdir(dataDir, { recursive: true })
  const client = new PGlite(dataDir)
  await client.waitReady
  const db = drizzle({ client })
  return {
    db,
    migrate: (migrationsFolder = DEFAULT_MIGRATIONS_FOLDER) => migrate(db, { migrationsFolder }),
    close: () => client.close(),
  }
}
