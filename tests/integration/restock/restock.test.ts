import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDemoSource } from '../../../db/seeds/demo-source'
import { addConsumedUnit } from '../../../src/features/restock/application/add-consumed-unit'
import {
  addRestockItem,
  removeRestockItem,
  setRestockItemDone,
} from '../../../src/features/restock/application/change-restock-items'
import { getRestockList } from '../../../src/features/restock/application/get-restock-list'
import { createRestockRepository } from '../../../src/features/restock/data/restock-repository'
import { restockListSchema } from '../../../src/features/restock/schemas'
import { getGoalGaps } from '../../../src/features/supply/application/get-goal-gaps'
import { createHouseholdFactsRepository } from '../../../src/features/supply/data/household-facts-repository'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from '../inventory/stock-read-fixtures'

type Repository = ReturnType<typeof createRestockRepository>

// Nachkaufen-Liste gegen PGlite mit dem Beispielhaushalt (db/seeds/demo.ts, ein Eintrag
// „Mineralwasser“) und der erfundenen Beispielquelle. Der fremde Haushalt darf nichts sehen und
// nichts ändern (#133).
describe('Nachkaufen-Liste gegen die Datenbank', () => {
  let testDb: TestDb
  let repository: Repository
  let householdId: string
  let foreignId: string
  let loadGoalGaps: Parameters<typeof getRestockList>[0]['loadGoalGaps']

  beforeAll(async () => {
    testDb = await createTestDb()
    const setup = await setupStockRead(testDb.db)
    ;({ householdId, foreignId } = setup)
    await seedDemoSource(testDb.db, householdId)
    repository = createRestockRepository(testDb.db)
    const facts = createHouseholdFactsRepository(testDb.db)
    loadGoalGaps = (input) => getGoalGaps({ stock: setup.reader, facts }, input)
  })

  afterAll(async () => {
    await testDb.close()
  })

  const load = async (household = householdId) =>
    restockListSchema.parse(
      await getRestockList({ repository, loadGoalGaps }, { householdId: household, today }),
    )

  async function unitOf(household: string, productName: string) {
    const [row] = await testDb.db
      .select({ id: units.id })
      .from(units)
      .innerJoin(products, eq(products.id, units.productId))
      .where(and(eq(products.householdId, household), eq(products.name, productName)))
      .limit(1)
    if (row === undefined) throw new Error(`${productName} fehlt`)
    return row.id
  }

  const foodTypeName = async (key: string) => {
    const [row] = await testDb.db
      .select({ name: foodTypes.name })
      .from(foodTypes)
      .where(eq(foodTypes.key, key))
    return row?.name
  }

  it('zeigt gespeicherte Einträge und die Lücken bis zum Ziel', async () => {
    const list = await load()

    expect(list.isGoalCalculable).toBe(true)
    expect(list.own.map(({ label }) => label)).toEqual(['Mineralwasser'])
    expect(list.gaps.length).toBeGreaterThan(0)
    expect(list.openItemCount).toBe(1)
  })

  it('zeigt dem fremden Haushalt keinen Eintrag des Beispielhaushalts', async () => {
    const list = await load(foreignId)

    expect([...list.replace, ...list.own, ...list.done]).toEqual([])
  })

  it('ergänzt, hakt ab und entfernt; Erledigte stehen unten', async () => {
    await addRestockItem(repository, { householdId, label: 'Knäckebrot' })
    const added = (await load()).own.find(({ label }) => label === 'Knäckebrot')
    if (added === undefined) throw new Error('Knäckebrot fehlt')

    await setRestockItemDone(repository, { householdId, id: added.id, isDone: true })
    expect((await load()).done.map(({ label }) => label)).toEqual(['Knäckebrot'])

    expect((await removeRestockItem(repository, { householdId, id: added.id })).ok).toBe(true)
    expect((await load()).done).toEqual([])
  })

  it('lässt einen fremden Haushalt nichts abhaken oder entfernen', async () => {
    const [item] = (await load()).own
    if (item === undefined) throw new Error('Eintrag fehlt')

    const done = await setRestockItemDone(repository, {
      householdId: foreignId,
      id: item.id,
      isDone: true,
    })
    const removed = await removeRestockItem(repository, { householdId: foreignId, id: item.id })

    expect(done.ok).toBe(false)
    expect(removed.ok).toBe(false)
    expect((await load()).own.map(({ id }) => id)).toContain(item.id)
  })

  it('setzt nach einer Entnahme die Lebensmittelart auf die Liste, nur einmal', async () => {
    const unitId = await unitOf(householdId, 'Thunfisch in Öl')
    const label = await foodTypeName('thunfisch_konserve')

    const first = await addConsumedUnit(repository, { householdId, unitId })
    const second = await addConsumedUnit(repository, { householdId, unitId })

    expect(first.ok && first.value.label).toBe(label)
    expect(first.ok && first.value.addedItemId).toBeTypeOf('string')
    expect(second).toEqual({ ok: true, value: { label, addedItemId: null } })
    expect((await load()).replace.map((item) => item.label)).toEqual([label])
  })

  it('legt bei zwei gleichzeitigen Tipps auf „Nachkaufen“ nur einen Eintrag an', async () => {
    const unitId = await unitOf(householdId, 'Ravioli')
    const before = (await load()).replace.length

    const results = await Promise.all([
      addConsumedUnit(repository, { householdId, unitId }),
      addConsumedUnit(repository, { householdId, unitId }),
    ])

    const added = results.filter((result) => result.ok && result.value.addedItemId !== null)
    expect(added).toHaveLength(1)
    expect((await load()).replace).toHaveLength(before + 1)
  })

  it('nimmt ohne Lebensmittelart den Produktnamen', async () => {
    const unitId = await unitOf(householdId, 'Linsen')

    const result = await addConsumedUnit(repository, { householdId, unitId })

    expect(result.ok && result.value.label).toBe('Linsen')
  })

  it('kennt keine Packung eines fremden Haushalts', async () => {
    const foreignUnit = await unitOf(foreignId, 'Fremde Spaghetti')

    expect(await addConsumedUnit(repository, { householdId, unitId: foreignUnit })).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    })
  })
})
