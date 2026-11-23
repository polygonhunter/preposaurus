import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDemo, seedDemoIntoHousehold } from '../../../db/seeds/demo'
import { buildHousehold, buildUser } from '../../../db/seeds/factories'
import { seedMasterData } from '../../../db/seeds/master-data'
import { exportHousehold } from '../../../src/features/system/application/export-household'
import { accounts, sessions, users } from '../../../src/server/db/schema/account'
import { aiConnections } from '../../../src/server/db/schema/ai-connections'
import { households } from '../../../src/server/db/schema/household'
import { products } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const TODAY = new Date('2026-11-23T12:00:00Z')
// Erfundene Geheimnisse, die nie im Export stehen dürfen
const SESSION_TOKEN = 'sitzungs-token-darf-nie-raus-0001'
const PASSWORD_HASH = 'scrypt-hash-darf-nie-raus-0002'
const KEY_CIPHERTEXT = 'chiffrat-darf-nie-raus-0003'

describe('Export eines Haushalts', () => {
  let testDb: TestDb
  let ownHouseholdId: string
  let otherHouseholdId: string

  async function insertSecrets(householdId: string) {
    const [admin] = await testDb.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.householdId, householdId))
    if (admin === undefined) throw new Error('Nutzer fehlt')
    await testDb.db.insert(sessions).values({
      token: SESSION_TOKEN,
      userId: admin.id,
      expiresAt: new Date('2027-01-01T00:00:00Z'),
    })
    await testDb.db.insert(accounts).values({
      accountId: admin.id,
      providerId: 'credential',
      userId: admin.id,
      password: PASSWORD_HASH,
    })
    await testDb.db.insert(aiConnections).values({
      householdId,
      provider: 'anthropic',
      name: 'Anthropic',
      apiKeyCiphertext: KEY_CIPHERTEXT,
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      apiKeyHint: 'abcd',
      apiKeyVersion: 1,
    })
  }

  async function insertOtherHousehold() {
    const household = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(household)
    const user = buildUser({ householdId: household.id, role: 'admin', username: 'fremd' })
    await testDb.db.insert(users).values(user)
    await seedDemoIntoHousehold(testDb.db, {
      householdId: household.id,
      userId: user.id,
      today: TODAY,
    })
    return household.id
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    await seedMasterData(testDb.db)
    await seedDemo(testDb.db, TODAY)
    const [own] = await testDb.db.select({ id: households.id }).from(households)
    if (own === undefined) throw new Error('Demo-Haushalt fehlt')
    ownHouseholdId = own.id
    await insertSecrets(ownHouseholdId)
    otherHouseholdId = await insertOtherHousehold()
  })

  afterAll(async () => {
    await testDb.close()
  })

  const exportOwn = async () => {
    const result = await exportHousehold(testDb.db, ownHouseholdId, TODAY)
    if (!result.ok) throw new Error('Export fehlgeschlagen')
    return result.value
  }

  it('enthält Version, Lizenz, Quelle und den Dateinamen mit Datum', async () => {
    const { fileName, content } = await exportOwn()

    expect(fileName).toBe('preposaurus-export-2026-11-23.json')
    expect(content).toMatchObject({
      format: 'preposaurus-haushalt',
      formatVersion: 1,
      license: 'AGPL-3.0-or-later',
      exportedAt: '2026-11-23T12:00:00.000Z',
    })
    expect(content.appVersion).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('enthält Vorrat mit Packungen, Mitglieder mit Allergien, Nutzer und Nachkaufen', async () => {
    const { content } = await exportOwn()
    const ownProducts = await testDb.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.householdId, ownHouseholdId))

    expect(content.products.map((product) => product.id).sort()).toEqual(
      ownProducts.map((product) => product.id).sort(),
    )
    expect(content.products.flatMap((product) => product.units).length).toBeGreaterThan(0)
    expect(content.members.length).toBeGreaterThan(0)
    expect(content.users.map((user) => user.username).sort()).toEqual(['alex', 'sam'])
    expect(content.restock.length).toBeGreaterThan(0)
    expect(content.household.name).toBeTruthy()
  })

  it('enthält keine Passwort-Hashes, Sitzungen, E-Mails oder KI-Schlüssel', async () => {
    const json = JSON.stringify((await exportOwn()).content)

    expect(json).not.toContain(SESSION_TOKEN)
    expect(json).not.toContain(PASSWORD_HASH)
    expect(json).not.toContain(KEY_CIPHERTEXT)
    expect(json).not.toContain('@nutzer.invalid')
    expect(json).not.toMatch(/"(password|token|email|apiKey\w*)"/)
  })

  it('enthält nichts aus einem fremden Haushalt', async () => {
    const json = JSON.stringify((await exportOwn()).content)
    const foreignProducts = await testDb.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.householdId, otherHouseholdId))

    expect(foreignProducts.length).toBeGreaterThan(0)
    for (const { id } of foreignProducts) expect(json).not.toContain(id)
    expect(json).not.toContain('fremd')
    expect(json).not.toContain(otherHouseholdId)
  })

  it('meldet einen unbekannten Haushalt als nicht gefunden', async () => {
    const result = await exportHousehold(testDb.db, '00000000-0000-4000-8000-000000000000', TODAY)

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
