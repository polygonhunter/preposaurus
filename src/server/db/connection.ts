// Gemeinsame Form beider Treiber. Nur client.ts entscheidet, welcher Treiber läuft (UMSETZUNG §2.5).
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'

type Database = PgDatabase<PgQueryResultHKT>

export const DEFAULT_MIGRATIONS_FOLDER = 'db/migrations'

export type DatabaseConnection = Readonly<{
  db: Database
  migrate: (migrationsFolder?: string) => Promise<void>
  close: () => Promise<void>
}>
