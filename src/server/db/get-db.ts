// Eine Verbindung je Serverprozess. Sie liegt auf globalThis, weil Next beim Hot Reload die Module
// neu lädt: Ein Modul-Singleton würde dann eine zweite PGlite-Instanz auf denselben Ordner öffnen.
import 'server-only'
import { loadEnv } from '../../shared/config/env'
import { connectDatabase } from './client'
import type { Database, DatabaseConnection } from './connection'

const DB_KEY = Symbol.for('preposaurus.db')

interface DbHolder {
  [DB_KEY]?: Promise<DatabaseConnection> | undefined
}

export async function getDb(): Promise<Database> {
  const holder = globalThis as DbHolder
  // Scheitert der Aufbau, versucht es die nächste Anfrage neu, statt den Fehler zu behalten.
  holder[DB_KEY] ??= connectDatabase(loadEnv().DATABASE_URL).catch((error: unknown) => {
    holder[DB_KEY] = undefined
    throw error
  })
  const connection = await holder[DB_KEY]
  return connection.db
}
