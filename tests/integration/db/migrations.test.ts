import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Migrationen', () => {
  let testDb: TestDb

  const countAppliedMigrations = async () => {
    const [row] = await testDb.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`drizzle.__drizzle_migrations`)
    return row?.count
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('laufen auf einer leeren Datenbank durch, danach klappt eine Abfrage', async () => {
    expect(await countAppliedMigrations()).toEqual(expect.any(Number))
  })

  it('lassen sich ein zweites Mal einspielen, ohne etwas zu ändern', async () => {
    const before = await countAppliedMigrations()

    await testDb.migrate()

    expect(await countAppliedMigrations()).toBe(before)
  })
})
