import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHousehold } from '../../../db/seeds/factories'
import { aiConnections, aiRoleAssignments } from '../../../src/server/db/schema/ai-connections'
import { households } from '../../../src/server/db/schema/household'
import { AI_ROLE_DEFAULT_MODELS } from '../../../src/shared/config/ai-roles'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

// Erfundene, Base64-artige Testwerte. Kein echter Schlüssel.
const ENCRYPTED_KEY = {
  apiKeyCiphertext: 'Y2hpZmZyYXQ=',
  apiKeyIv: 'aXY=',
  apiKeyAuthTag: 'dGFn',
  apiKeyHint: '4f2a',
  apiKeyVersion: 1,
}

describe('Schema KI-Verbindungen und Rollen (Issue #108)', () => {
  let testDb: TestDb

  const insertHousehold = async () => {
    const household = buildHousehold()
    await testDb.db.insert(households).values(household)
    return household.id
  }

  const insertConnection = async (householdId: string, name = 'Anthropic') => {
    const [connection] = await testDb.db
      .insert(aiConnections)
      .values({ householdId, provider: 'anthropic', name, ...ENCRYPTED_KEY })
      .returning()
    if (connection === undefined) throw new Error('Verbindung fehlt')
    return connection
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('speichert den Schlüssel nur verschlüsselt, ohne Spalte für Klartext', async () => {
    const columns = await testDb.db
      .select({ name: sql<string>`column_name` })
      .from(sql`information_schema.columns`)
      .where(sql`table_name = 'ki_verbindung' and column_name like 'schluessel%'`)

    expect(columns.map((column) => column.name).sort()).toEqual([
      'schluessel_chiffrat',
      'schluessel_hinweis',
      'schluessel_iv',
      'schluessel_tag',
      'schluessel_version',
    ])
  })

  it('lehnt ein Chiffrat ohne IV, Tag, Hinweis und Version ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(aiConnections).values({
        householdId: await insertHousehold(),
        provider: 'anthropic',
        name: 'Unvollständig',
        apiKeyCiphertext: 'Y2hpZmZyYXQ=',
      }),
      'ki_verbindung_schluessel_check',
    )
  })

  it('lehnt einen Hinweis mit mehr als 4 Zeichen ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(aiConnections).values({
        householdId: await insertHousehold(),
        provider: 'anthropic',
        name: 'Langer Hinweis',
        ...ENCRYPTED_KEY,
        apiKeyHint: 'sk-ant-4f2a',
      }),
      'ki_verbindung_hinweis_check',
    )
  })

  it('erlaubt je Haushalt jede Rolle nur einmal', async () => {
    const householdId = await insertHousehold()
    const connection = await insertConnection(householdId)
    const assignment = {
      householdId,
      role: 'mhd' as const,
      connectionId: connection.id,
      model: AI_ROLE_DEFAULT_MODELS.mhd,
    }
    await testDb.db.insert(aiRoleAssignments).values(assignment)

    await expectConstraintViolation(
      testDb.db.insert(aiRoleAssignments).values(assignment),
      'ki_rollen_zuweisung_eindeutig',
    )
  })

  it('schützt eine zugewiesene Verbindung vor dem Löschen', async () => {
    const householdId = await insertHousehold()
    const connection = await insertConnection(householdId)
    await testDb.db.insert(aiRoleAssignments).values({
      householdId,
      role: 'verpackung',
      connectionId: connection.id,
      model: AI_ROLE_DEFAULT_MODELS.verpackung,
    })

    await expectConstraintViolation(
      testDb.db.delete(aiConnections).where(eq(aiConnections.id, connection.id)),
      'ki_rollen_zuweisung_verbindung_fk',
    )
  })

  it('lehnt eine Verbindung aus einem anderen Haushalt ab', async () => {
    const foreign = await insertConnection(await insertHousehold(), 'Fremd')

    await expectConstraintViolation(
      testDb.db.insert(aiRoleAssignments).values({
        householdId: await insertHousehold(),
        role: 'naehrwerte',
        connectionId: foreign.id,
        model: AI_ROLE_DEFAULT_MODELS.naehrwerte,
      }),
      'ki_rollen_zuweisung_verbindung_fk',
    )
  })

  it('löscht Verbindungen und Zuweisungen mit dem Haushalt', async () => {
    const householdId = await insertHousehold()
    const connection = await insertConnection(householdId)
    await testDb.db.insert(aiRoleAssignments).values({
      householdId,
      role: 'mhd_zweitversuch',
      connectionId: connection.id,
      model: AI_ROLE_DEFAULT_MODELS.mhd_zweitversuch,
    })

    await testDb.db.delete(households).where(eq(households.id, householdId))

    expect(
      await testDb.db
        .select()
        .from(aiConnections)
        .where(eq(aiConnections.householdId, householdId)),
    ).toEqual([])
  })
})
