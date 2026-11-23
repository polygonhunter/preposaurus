// Datenbank für die Warteschlange in Integrationstests: lokal PGlite im Speicher (pg-boss bringt
// einen Adapter mit), in der CI (test-pg) eine Wegwerf-Datenbank auf PostgreSQL 18.
import { PGlite } from '@electric-sql/pglite'
import { Pool } from 'pg'
import { fromPglite } from 'pg-boss'
import type { JobDatabase } from '../../src/server/jobs/job-queue'
import { createScratchDatabase, testPostgresUrl } from './test-db'

interface TestJobDatabase {
  database: JobDatabase
  /** Zeilen per SQL, um den Zustand von pg-boss zu prüfen */
  queryRows: (sql: string) => Promise<Record<string, unknown>[]>
  close: () => Promise<void>
}

async function createPgliteJobDatabase(): Promise<TestJobDatabase> {
  const client = new PGlite()
  await client.waitReady
  return {
    database: { db: fromPglite(client), backend: 'pglite' },
    queryRows: async (sql) => (await client.query<Record<string, unknown>>(sql)).rows,
    close: () => client.close(),
  }
}

async function createPostgresJobDatabase(baseUrl: string): Promise<TestJobDatabase> {
  const scratch = await createScratchDatabase(baseUrl)
  const pool = new Pool({ connectionString: scratch.url, max: 1 })
  return {
    database: { connectionString: scratch.url, max: 3 },
    queryRows: async (sql) => (await pool.query<Record<string, unknown>>(sql)).rows,
    close: async () => {
      await pool.end()
      await scratch.drop()
    },
  }
}

export function createTestJobDatabase(): Promise<TestJobDatabase> {
  const baseUrl = testPostgresUrl()
  return baseUrl === undefined ? createPgliteJobDatabase() : createPostgresJobDatabase(baseUrl)
}
