import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildCapture, buildUnit } from '../../../db/seeds/factories'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { units } from '../../../src/server/db/schema/inventory'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Erfassung', () => {
  let testDb: TestDb
  let basics: Basics

  const newCapture = (method: 'foto' | 'manuell' = 'manuell') =>
    buildCapture({ householdId: basics.householdId, userId: basics.userId, method })

  beforeAll(async () => {
    testDb = await createTestDb()
    basics = await insertBasics(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt dieselbe Erfassung kein zweites Mal an (Idempotenz-Schlüssel)', async () => {
    const capture = newCapture('foto')
    await testDb.db.insert(captures).values(capture)

    await expectConstraintViolation(testDb.db.insert(captures).values(capture), 'erfassung_pkey')
  })

  it('lehnt einen unbekannten Weg ab', async () => {
    await expectConstraintViolation(
      // @ts-expect-error -- absichtlich ungültiger Weg, den nur die DB abfangen soll
      testDb.db.insert(captures).values({ ...newCapture(), method: 'barcode' }),
      'erfassung_weg_check',
    )
  })

  it('hängt Nachschub mit einer neuen Erfassung an ein bestehendes Produkt', async () => {
    const restock = newCapture()
    await testDb.db.insert(captures).values(restock)

    await testDb.db
      .insert(units)
      .values([
        buildUnit({ productId: basics.productId, captureId: basics.captureId }),
        buildUnit({ productId: basics.productId, captureId: restock.id }),
      ])

    const rows = await testDb.db
      .select({ captureId: units.captureId })
      .from(units)
      .where(eq(units.productId, basics.productId))
    expect(rows.map((row) => row.captureId).sort()).toEqual([basics.captureId, restock.id].sort())
  })

  it('verlangt an jeder Einheit eine Erfassung', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(units)
        // @ts-expect-error -- absichtlich ohne Erfassung, was nur die DB abfangen soll
        .values({ productId: basics.productId, captureId: null }),
      'erfassung_id',
    )
  })
})
