import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { DEFAULT_MIGRATIONS_FOLDER, type DatabaseConnection } from './connection'

export function connectPostgres(connectionString: string): DatabaseConnection {
  const pool = new Pool({ connectionString })
  const db = drizzle({ client: pool })
  return {
    db,
    migrate: (migrationsFolder = DEFAULT_MIGRATIONS_FOLDER) => migrate(db, { migrationsFolder }),
    close: () => pool.end(),
  }
}
