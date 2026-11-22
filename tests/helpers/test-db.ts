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

async function createPostgresTestDb(baseUrl: string): Promise<TestDb> {
  const name = `test_${randomUUID().replaceAll('-', '')}`
  await withAdminPool(baseUrl, `CREATE DATABASE ${name}`)
  const url = new URL(baseUrl)
  url.pathname = `/${name}`
  const connection = await connectDatabase(url.toString())
  await connection.migrate()
  return {
    ...connection,
    close: async () => {
      await connection.close()
      await withAdminPool(baseUrl, `DROP DATABASE ${name} WITH (FORCE)`)
    },
  }
}

export async function createTestDb(): Promise<TestDb> {
  // Werkzeug, nicht App: Welcher Server getestet wird, entscheidet allein die CI.
  // eslint-disable-next-line no-restricted-properties -- Testumgebung wählt den Treiber, die App liest weiter nur env.ts
  const baseUrl = process.env['DATABASE_URL']
  if (baseUrl !== undefined && POSTGRES_URL.test(baseUrl)) return createPostgresTestDb(baseUrl)
  const connection = await connectDatabase('pglite://memory')
  await connection.migrate()
  return connection
}
