import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildUser } from '../../../db/seeds/factories'
import { users } from '../../../src/server/db/schema/account'
import { aiCalls, captureDrafts, photos } from '../../../src/server/db/schema/capture'
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
    mimeType: 'image/jpeg',
  })

  const aiCall = () => ({
    householdId,
    role: 'mhd' as const,
    model: 'claude-haiku-5-5',
    isSuccess: true,
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

  it('merkt sich, wer ein Foto hochgeladen hat, und leert den Verweis ohne den Nutzer', async () => {
    const uploader = buildUser({ householdId, username: 'foto.nutzer' })
    await testDb.db.insert(users).values(uploader)
    await testDb.db.insert(photos).values({ ...photo('fotos/von.jpg'), userId: uploader.id })

    await testDb.db.delete(users).where(eq(users.id, uploader.id))

    const [kept] = await testDb.db.select().from(photos).where(eq(photos.path, 'fotos/von.jpg'))
    expect(kept?.userId).toBeNull()
  })

  it('protokolliert einen KI-Aufruf als ersten Versuch ohne Sicherheit', async () => {
    const [call] = await testDb.db.insert(aiCalls).values(aiCall()).returning()

    expect(call).toMatchObject({ attempt: 1, confidence: null })
  })

  it('lehnt einen dritten Versuch ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(aiCalls).values({ ...aiCall(), attempt: 3 }),
      'ki_aufruf_versuch_check',
    )
  })

  it('lehnt eine unbekannte Sicherheit ab', async () => {
    await expectConstraintViolation(
      // @ts-expect-error -- absichtlich ungültige Sicherheit, die nur die DB abfangen soll
      testDb.db.insert(aiCalls).values({ ...aiCall(), confidence: 'sehr_hoch' }),
      'ki_aufruf_sicherheit_check',
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
