import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDemoSource } from '../../../db/seeds/demo-source'
import { addSuggestedProduct } from '../../../src/features/restock/application/add-suggested-product'
import {
  removeRestockItem,
  restoreRestockItem,
} from '../../../src/features/restock/application/change-restock-items'
import { countOpenRestockItems } from '../../../src/features/restock/application/count-open-items'
import { getRestockList } from '../../../src/features/restock/application/get-restock-list'
import { createRestockRepository } from '../../../src/features/restock/data/restock-repository'
import { restockListSchema } from '../../../src/features/restock/schemas'
import { getGoalGaps } from '../../../src/features/supply/application/get-goal-gaps'
import { createHouseholdFactsRepository } from '../../../src/features/supply/data/household-facts-repository'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from '../inventory/stock-read-fixtures'

type Repository = ReturnType<typeof createRestockRepository>

// Vorschläge unter „Ersetzen“ (A14, #200), Beispiele an den Lücken und „Rückgängig“ nach dem
// Entfernen (#202) gegen PGlite. Beispielhaushalt (db/seeds/demo.ts): Stichtag 22.11.2026, Ziel am
// 01.01.2027; Haferflocken und H-Milch laufen vorher ab (orange), Walnüsse und Thunfisch sind schon
// abgelaufen (rot). Der fremde Haushalt darf nichts davon sehen oder nutzen (#133).
describe('Ersetzen und Rückgängig gegen die Datenbank', () => {
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

  async function productIdOf(household: string, name: string) {
    const [row] = await testDb.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.householdId, household), eq(products.name, name)))
    if (row === undefined) throw new Error(`${name} fehlt`)
    return row.id
  }

  it('schlägt vor, was vor dem Ziel abläuft, Abgelaufenes zuerst', async () => {
    const { suggestions } = await load()

    expect(suggestions.map(({ label }) => label)).toEqual([
      'Walnüsse',
      'Thunfisch (Konserve)',
      'Haferflocken',
      'H-Milch',
    ])
    expect(suggestions[2]?.reason).toEqual({ kind: 'expires', count: 1, firstDay: '2026-12-02' })
  })

  it('nennt an den Lücken Beispiele, Bekanntes aus dem Vorrat zuerst', async () => {
    const { gaps } = await load()

    expect(gaps.find(({ groupKey }) => groupKey === 'wasser')?.examples[0]).toBe('Sprudelwasser')
    expect(gaps.every(({ examples }) => examples.length <= 2)).toBe(true)
  })

  it('zeigt dem fremden Haushalt keinen Vorschlag des Beispielhaushalts', async () => {
    const { suggestions } = await load(foreignId)

    expect(suggestions.map(({ label }) => label)).not.toContain('Haferflocken')
  })

  it('macht aus einem Vorschlag einen Eintrag, der Vorschlag verschwindet', async () => {
    const productId = await productIdOf(householdId, 'Haferflocken')

    const result = await addSuggestedProduct(repository, { householdId, productId })

    const list = await load()
    expect(result).toMatchObject({ ok: true, value: { label: 'Haferflocken' } })
    expect(list.replace.map(({ label }) => label)).toContain('Haferflocken')
    expect(list.suggestions.map(({ label }) => label)).not.toContain('Haferflocken')
  })

  it('setzt kein Produkt eines fremden Haushalts auf die Liste', async () => {
    const productId = await productIdOf(foreignId, 'Fremde Spaghetti')

    const result = await addSuggestedProduct(repository, { householdId, productId })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })

  it('schlägt Aufgebrauchtes der letzten 30 Tage vor', async () => {
    const productId = await productIdOf(householdId, 'Ravioli')
    await testDb.db
      .update(units)
      .set({ status: 'verbraucht', takenAt: new Date('2026-11-20T10:00:00Z') })
      .where(inArray(units.productId, [productId]))

    const { suggestions } = await load()

    expect(suggestions.find(({ productId: id }) => id === productId)?.reason).toEqual({
      kind: 'consumed',
      lastDay: '2026-11-20',
    })
  })

  it('legt einen entfernten Eintrag mit „Rückgängig“ wieder an, mit Produkt', async () => {
    const before = await load()
    const item = before.replace.find(({ label }) => label === 'Haferflocken')
    if (item === undefined) throw new Error('Haferflocken fehlt auf der Liste')

    const removed = await removeRestockItem(repository, { householdId, id: item.id })
    if (!removed.ok) throw new Error('nicht entfernt')
    expect((await load()).suggestions.map(({ label }) => label)).toContain('Haferflocken')

    await restoreRestockItem(repository, { householdId, item: removed.value })
    const after = await load()
    expect(after.replace.find(({ id }) => id === item.id)).toEqual(item)
    expect(removed.value.productId).toBe(await productIdOf(householdId, 'Haferflocken'))
  })

  it('übernimmt beim Wiederanlegen kein fremdes Produkt', async () => {
    const foreignProduct = await productIdOf(foreignId, 'Fremde Spaghetti')
    const item = {
      id: crypto.randomUUID(),
      label: 'Spaghetti',
      source: 'nachkauf' as const,
      productId: foreignProduct,
      isDone: false,
      createdAt: new Date('2026-11-21T10:00:00Z'),
    }

    await restoreRestockItem(repository, { householdId, item })
    const removed = await removeRestockItem(repository, { householdId, id: item.id })

    expect(removed).toMatchObject({ ok: true, value: { productId: null } })
  })

  it('zählt offene Einträge je Haushalt mit der einen Zählung', async () => {
    const list = await load()

    expect(await countOpenRestockItems(repository, householdId)).toBe(
      list.replace.length + list.own.length,
    )
    expect(await countOpenRestockItems(repository, foreignId)).toBe(0)
  })
})
