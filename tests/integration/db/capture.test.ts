import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { notificationSettings } from '../../../src/server/db/schema/reminders'
import { restockItems } from '../../../src/server/db/schema/restock'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Erfassung, Nachkaufen, Erinnerungen', () => {
  let testDb: TestDb
  let householdId: string
  let userId: string
  let productId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ householdId, userId, productId } = await insertBasics(testDb.db))
  })

  afterAll(async () => {
    await testDb.close()
  })

  const photo = (path: string) => ({
    householdId,
    role: 'verpackung' as const,
    path,
    hash: 'sha256-test',
    sizeBytes: 1024,
    mimeType: 'image/jpeg',
  })

  it('lässt beim Löschen eines Entwurfs ein festes Foto stehen und entfernt nur den Verweis', async () => {
    const [draft] = await testDb.db
      .insert(captureDrafts)
      .values({ householdId, userId, data: { schritt: 'verpackung' } })
      .returning()
    const draftId = draft?.id ?? ''
    await testDb.db
      .insert(photos)
      .values({ ...photo('fotos/fest.jpg'), status: 'fest', draftId, productId })

    await testDb.db.delete(captureDrafts).where(eq(captureDrafts.id, draftId))

    const [kept] = await testDb.db.select().from(photos).where(eq(photos.path, 'fotos/fest.jpg'))
    expect(kept).toMatchObject({ status: 'fest', draftId: null, productId })
  })

  it('lehnt ein festes Foto ohne Produkt ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(photos).values({ ...photo('fotos/ohne-produkt.jpg'), status: 'fest' }),
      'foto_fest_check',
    )
  })

  it('lehnt eine unbekannte Foto-Rolle ab', async () => {
    await expectConstraintViolation(
      // @ts-expect-error -- absichtlich ungültige Rolle, die nur die DB abfangen soll
      testDb.db.insert(photos).values({ ...photo('fotos/rolle.jpg'), role: 'kassenbon' }),
      'foto_rolle_check',
    )
  })

  it('legt einen manuellen Nachkauf-Eintrag offen an und verlangt Menge mit Einheit', async () => {
    const [item] = await testDb.db
      .insert(restockItems)
      .values({ householdId, label: 'Mineralwasser', source: 'manuell' })
      .returning()
    expect(item).toMatchObject({ isDone: false, amount: null })

    await expectConstraintViolation(
      testDb.db
        .insert(restockItems)
        .values({ householdId, label: 'Reis', source: 'nachkauf', amount: '2' }),
      'nachkauf_eintrag_menge_check',
    )
  })

  it('erlaubt je Nutzer und Art nur eine Benachrichtigungs-Einstellung', async () => {
    await testDb.db.insert(notificationSettings).values({ userId, kind: 'dringend' })

    await expectConstraintViolation(
      testDb.db.insert(notificationSettings).values({ userId, kind: 'dringend' }),
      'benachrichtigung_einstellung_eindeutig',
    )
  })
})
