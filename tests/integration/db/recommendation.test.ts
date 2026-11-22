import { asc, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { households } from '../../../src/server/db/schema/household'
import {
  goals,
  productGroups,
  sourceNeeds,
  sources,
  sourceValues,
  sourceVersions,
} from '../../../src/server/db/schema/recommendation'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

// Testwerte, keine geprüften Empfehlungen (die kommen mit M1-08 und M1-09).
describe('Schema Empfehlung und Ziel', () => {
  let testDb: TestDb
  let sourceId: string
  let groupId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    const [source] = await testDb.db
      .insert(sources)
      .values({ key: 'test-quelle', name: 'Testquelle', country: 'DE' })
      .returning()
    const [group] = await testDb.db
      .insert(productGroups)
      .values({ key: 'getreide', name: 'Getreide' })
      .returning()
    sourceId = source?.id ?? ''
    groupId = group?.id ?? ''
  })

  afterAll(async () => {
    await testDb.close()
  })

  const insertVersion = async (asOf: string, amount: string) => {
    const [version] = await testDb.db
      .insert(sourceVersions)
      .values({ sourceId, asOf, link: 'https://example.org/quelle', defaultDays: 10 })
      .returning()
    if (version === undefined) throw new Error('Version fehlt')
    await testDb.db.insert(sourceValues).values({
      sourceVersionId: version.id,
      productGroupId: groupId,
      amountPerPersonDay: amount,
      unit: 'g',
    })
    return version
  }

  it('hält zwei Versionen einer Quelle nebeneinander, die alte bleibt unverändert', async () => {
    await insertVersion('2020-01', '100.00')
    await insertVersion('2025-01', '120.00')

    const rows = await testDb.db
      .select({ asOf: sourceVersions.asOf, amount: sourceValues.amountPerPersonDay })
      .from(sourceValues)
      .innerJoin(sourceVersions, eq(sourceValues.sourceVersionId, sourceVersions.id))
      .orderBy(asc(sourceVersions.asOf))

    expect(rows).toEqual([
      { asOf: '2020-01', amount: '100.00' },
      { asOf: '2025-01', amount: '120.00' },
    ])
  })

  it('markiert neue Versionen als nicht geprüft', async () => {
    const version = await insertVersion('2026-01', '110.00')

    expect(version.isVerified).toBe(false)
  })

  it('lehnt denselben Stand einer Quelle ein zweites Mal ab', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(sourceVersions)
        .values({ sourceId, asOf: '2020-01', link: 'https://example.org', defaultDays: 10 }),
      'quelle_version_eindeutig',
    )
  })

  it('lässt eine Quelle mit Versionen nicht löschen', async () => {
    await expectConstraintViolation(
      testDb.db.delete(sources).where(eq(sources.id, sourceId)),
      'quelle_version_quelle_id_quelle_id_fk',
    )
  })

  it('speichert den Bedarf je Personentyp mit Wasser in ml', async () => {
    const version = await insertVersion('2027-01', '100.00')
    const [need] = await testDb.db
      .insert(sourceNeeds)
      .values({
        sourceVersionId: version.id,
        personGroup: 'erwachsen',
        kcalPerDay: '2200',
        waterMlPerDay: 2000,
      })
      .returning()

    expect(need).toMatchObject({ personGroup: 'erwachsen', waterMlPerDay: 2000 })
  })

  it('lehnt eine Personengruppe außerhalb der Mitgliedstypen ab', async () => {
    const version = await insertVersion('2028-01', '100.00')

    await expectConstraintViolation(
      testDb.db
        .insert(sourceNeeds)
        // @ts-expect-error -- absichtlich ungültige Gruppe, die nur die DB abfangen soll
        .values({
          sourceVersionId: version.id,
          personGroup: 'haustier',
          kcalPerDay: '500',
          waterMlPerDay: 500,
        }),
      'quelle_bedarf_personengruppe_check',
    )
  })

  it('merkt sich am Haushalt die genutzte Fassung der Empfehlung', async () => {
    const version = await insertVersion('2029-01', '100.00')
    const [household] = await testDb.db
      .insert(households)
      .values({ name: 'Mit Fassung', activeSourceVersionId: version.id })
      .returning()

    expect(household?.activeSourceVersionId).toBe(version.id)
  })

  it('lehnt ein Ziel ohne positive Tage ab', async () => {
    const [household] = await testDb.db.insert(households).values({ name: 'Test' }).returning()

    await expectConstraintViolation(
      testDb.db.insert(goals).values({ householdId: household?.id ?? '', days: 0 }),
      'ziel_tage_check',
    )
  })
})
