import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { createLogger } from '../../shared/lib/logger'
import { DEFAULT_MIGRATIONS_FOLDER, type DatabaseConnection } from './connection'

const logger = createLogger({ level: 'warn' })

/**
 * Verliert ein ruhender Client seine Verbindung (Neustart von PostgreSQL, `DROP DATABASE … WITH
 * (FORCE)` nach einem Test), verwirft der Pool ihn und baut beim nächsten Bedarf neu auf. Ohne
 * Listener würde pg den Fehler als `error`-Ereignis werfen und den Prozess beenden.
 */
function logIdleClientError(error: Error): void {
  logger.warn('Ruhende Datenbankverbindung getrennt, der Pool verbindet neu', { error })
}

export function connectPostgres(connectionString: string): DatabaseConnection {
  const pool = new Pool({ connectionString })
  pool.on('error', logIdleClientError)
  const db = drizzle({ client: pool })
  return {
    db,
    migrate: (migrationsFolder = DEFAULT_MIGRATIONS_FOLDER) => migrate(db, { migrationsFolder }),
    close: () => pool.end(),
  }
}
