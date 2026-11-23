// Frische Datenbank mit allen Migrationen für Integrationstests (UMSETZUNG M1-01).
// Lokal: PGlite im Speicher. Mit DATABASE_URL=postgres://… (CI-Job test-pg): eine eigene,
// danach gelöschte Datenbank auf diesem Server, damit parallele Testdateien sich nicht stören.
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { connectDatabase } from '../../src/server/db/client'
import type { DatabaseConnection } from '../../src/server/db/connection'

export type TestDb = DatabaseConnection

const POSTGRES_URL = /^postgres(ql)?:\/\//

async function withAdminPool(url: string, statement: string): Promise<void> {
  const pool = new Pool({ connectionString: url, max: 1 })
  try {
    await pool.query(statement)
  } finally {
    await pool.end()
  }
}

/** Server der CI (Job test-pg), sonst undefined: Dann laufen die Tests gegen PGlite. */
export function testPostgresUrl(): string | undefined {
  // Werkzeug, nicht App: Welcher Server getestet wird, entscheidet allein die CI.
  // eslint-disable-next-line no-restricted-properties -- Testumgebung wählt den Treiber, die App liest weiter nur env.ts
  const baseUrl = process.env['DATABASE_URL']
  return baseUrl !== undefined && POSTGRES_URL.test(baseUrl) ? baseUrl : undefined
}

interface ScratchDatabase {
  url: string
  drop: () => Promise<void>
}

/** Leere Wegwerf-Datenbank auf dem PostgreSQL-Server der CI. */
export async function createScratchDatabase(baseUrl: string): Promise<ScratchDatabase> {
  const name = `test_${randomUUID().replaceAll('-', '')}`
  await withAdminPool(baseUrl, `CREATE DATABASE ${name}`)
  const url = new URL(baseUrl)
  url.pathname = `/${name}`
  return {
    url: url.toString(),
    drop: () => withAdminPool(baseUrl, `DROP DATABASE ${name} WITH (FORCE)`),
  }
}

async function createPostgresTestDb(baseUrl: string): Promise<TestDb> {
  const scratch = await createScratchDatabase(baseUrl)
  const connection = await connectDatabase(scratch.url)
  return {
    ...connection,
    close: async () => {
      await connection.close()
      await scratch.drop()
    },
  }
}

/** Leere Datenbank ohne Migrationen, z. B. um eine einzelne Migration auf alten Daten zu prüfen. */
export async function createEmptyTestDb(): Promise<TestDb> {
  const baseUrl = testPostgresUrl()
  if (baseUrl !== undefined) return createPostgresTestDb(baseUrl)
  return connectDatabase('pglite://memory')
}

export async function createTestDb(): Promise<TestDb> {
  const connection = await createEmptyTestDb()
  await connection.migrate()
  return connection
}
