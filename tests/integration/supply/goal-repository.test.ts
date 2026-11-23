import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHousehold } from '../../../db/seeds/factories'
import { createGoalRepository } from '../../../src/features/supply/data/goal-repository'
import { households } from '../../../src/server/db/schema/household'
import { goals, sources, sourceVersions } from '../../../src/server/db/schema/recommendation'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Ziel und Quelle in der Datenbank', () => {
  let testDb: TestDb
  let ownId: string
  let otherId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    const own = buildHousehold()
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values([own, other])
    ownId = own.id
    otherId = other.id
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('liefert ohne Ziel und ohne Quelle leere Werte', async () => {
    expect(await createGoalRepository(testDb.db).read(ownId)).toEqual({
      days: null,
      targetDate: null,
      source: null,
    })
  })

  it('legt das Ziel an und ändert es danach, ohne den anderen Haushalt zu berühren', async () => {
    const repository = createGoalRepository(testDb.db)
    await repository.save(otherId, { days: 3, targetDate: null })

    await repository.save(ownId, { days: 14, targetDate: toCalendarDay('2026-12-31') })
    await repository.save(ownId, { days: 21, targetDate: null })

    expect(await repository.read(ownId)).toMatchObject({ days: 21, targetDate: null })
    expect(await repository.read(otherId)).toMatchObject({ days: 3 })
    const rows = await testDb.db.select().from(goals).where(eq(goals.householdId, ownId))
    expect(rows).toHaveLength(1)
  })

  it('nennt Name, Stand und Link der Quelle, die der Haushalt nutzt', async () => {
    const [source] = await testDb.db
      .insert(sources)
      .values({ key: 'beispiel', name: 'Beispielquelle', country: 'DE' })
      .returning({ id: sources.id })
    if (source === undefined) throw new Error('Quelle fehlt')
    const [version] = await testDb.db
      .insert(sourceVersions)
      .values({
        sourceId: source.id,
        asOf: '2025',
        link: 'https://example.org/vorrat',
        defaultDays: 10,
      })
      .returning({ id: sourceVersions.id })
    if (version === undefined) throw new Error('Fassung fehlt')
    await testDb.db
      .update(households)
      .set({ activeSourceVersionId: version.id })
      .where(eq(households.id, ownId))

    const goal = await createGoalRepository(testDb.db).read(ownId)

    expect(goal.source).toEqual({
      name: 'Beispielquelle',
      asOf: '2025',
      link: 'https://example.org/vorrat',
      defaultDays: 10,
      isVerified: false,
    })
    expect((await createGoalRepository(testDb.db).read(otherId)).source).toBeNull()
  })
})
