// Eine Verbindung je Serverprozess. Sie liegt auf globalThis, weil Next beim Hot Reload die Module
// neu lädt: Ein Modul-Singleton würde dann eine zweite PGlite-Instanz auf denselben Ordner öffnen.
import 'server-only'
import { loadEnv } from '../../shared/config/env'
import { connectDatabase } from './client'
import type { Database, DatabaseConnection } from './connection'
import { CONNECTION_NAMES, type ProcessRole } from './connection-names'

const DB_KEY = Symbol.for('preposaurus.db')

interface DbHolder {
  [DB_KEY]?: Promise<DatabaseConnection> | undefined
}

/**
 * Die Verbindung des Prozesses, benannt nach seiner Rolle (#261). Der erste Aufruf legt den Namen
 * fest: Der Worker ruft `openDb('worker')` beim Start, alles andere nutzt getDb() als Webserver.
 */
export async function openDb(role: ProcessRole): Promise<Database> {
  const holder = globalThis as DbHolder
  // Scheitert der Aufbau, versucht es die nächste Anfrage neu, statt den Fehler zu behalten.
  holder[DB_KEY] ??= connectDatabase(loadEnv().DATABASE_URL, CONNECTION_NAMES[role]).catch(
    (error: unknown) => {
      holder[DB_KEY] = undefined
      throw error
    },
  )
  const connection = await holder[DB_KEY]
  return connection.db
}

export const getDb = (): Promise<Database> => openDb('web')

/** Schließt die Verbindung, z. B. beim Beenden des Workers. Danach baut getDb() neu auf. */
export async function closeDb(): Promise<void> {
  const holder = globalThis as DbHolder
  const pending = holder[DB_KEY]
  holder[DB_KEY] = undefined
  if (pending !== undefined) await (await pending).close()
}
