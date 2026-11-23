import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDemoSource } from '../../../db/seeds/demo-source'
import { setRestockItemDone } from '../../../src/features/restock/application/change-restock-items'
import { countOpenRestockItems } from '../../../src/features/restock/application/count-open-items'
import { getRestockList } from '../../../src/features/restock/application/get-restock-list'
import { setGapStatus } from '../../../src/features/restock/application/set-gap-status'
import { createRestockRepository } from '../../../src/features/restock/data/restock-repository'
import { restockListSchema } from '../../../src/features/restock/schemas'
import { getGoalGaps } from '../../../src/features/supply/application/get-goal-gaps'
import { createHouseholdFactsRepository } from '../../../src/features/supply/data/household-facts-repository'
import { restockItems } from '../../../src/server/db/schema/restock'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from '../inventory/stock-read-fixtures'

type Repository = ReturnType<typeof createRestockRepository>

// Lücken abhaken und ausblenden (#201) gegen PGlite bzw. PostgreSQL (CI-Job test-pg), mit dem
// Beispielhaushalt (Ziel am 01.01.2027, mehrere Warengruppen unter dem Ziel). Gespeichert wird ein
// Eintrag „ziel“ mit der Fehlmenge; der fremde Haushalt sieht und ändert nichts davon (#133).
describe('Lücken abhaken und ausblenden gegen die Datenbank', () => {
  let testDb: TestDb
  let repository: Repository
  let householdId: string
  let foreignId: string
  let ports: Parameters<typeof setGapStatus>[0]

  beforeAll(async () => {
    testDb = await createTestDb()
    const setup = await setupStockRead(testDb.db)
    ;({ householdId, foreignId } = setup)
    await seedDemoSource(testDb.db, householdId)
    repository = createRestockRepository(testDb.db)
    const facts = createHouseholdFactsRepository(testDb.db)
    ports = {
      repository,
      loadGoalGaps: (input) => getGoalGaps({ stock: setup.reader, facts }, input),
    }
  })

  afterAll(async () => {
    await testDb.close()
  })

  const load = async (household = householdId) =>
    restockListSchema.parse(
      await getRestockList({ ...ports, repository }, { householdId: household, today }),
    )

  async function firstGap() {
    const [gap] = (await load()).gaps
    if (gap === undefined) throw new Error('Der Beispielhaushalt hat keine Lücke')
    return gap
  }

  const goalRows = (household: string) =>
    testDb.db
      .select()
      .from(restockItems)
      .where(and(eq(restockItems.householdId, household), eq(restockItems.source, 'ziel')))

  it('blendet eine Lücke aus, sie steht unter „Ausgeblendet“ und zählt weiter unter dem Ziel', async () => {
    const before = await load()
    const gap = await firstGap()

    const saved = await setGapStatus(ports, {
      householdId,
      today,
      groupKey: gap.groupKey,
      status: 'ausgeblendet',
    })
    if (!saved.ok) throw new Error('nicht gespeichert')
    const after = await load()

    expect(after.gaps.map(({ groupKey }) => groupKey)).not.toContain(gap.groupKey)
    expect(after.hiddenGaps).toEqual([
      {
        entryId: saved.value.entryId,
        groupKey: gap.groupKey,
        name: gap.name,
        missing: gap.missing,
      },
    ])
    expect(after.belowGoalCount).toBe(before.belowGoalCount)
    expect(after.openItemCount).toBe(before.openItemCount)
    expect(await countOpenRestockItems(repository, householdId)).toBe(before.openItemCount)
    const [row] = await goalRows(householdId)
    expect(row).toMatchObject({ status: 'ausgeblendet', label: gap.name, unit: gap.missing.unit })
    expect(Number(row?.amount)).toBeCloseTo(gap.missing.value, 2)
    expect(row?.doneAt).toBeInstanceOf(Date)
  })

  it('holt die ausgeblendete Lücke mit „Wieder zeigen“ zurück', async () => {
    const [hidden] = (await load()).hiddenGaps
    if (hidden === undefined) throw new Error('keine ausgeblendete Lücke')

    await repository.removeItem(householdId, hidden.entryId)

    expect((await load()).gaps.map(({ groupKey }) => groupKey)).toContain(hidden.groupKey)
    expect(await goalRows(householdId)).toEqual([])
  })

  it('hakt eine Lücke ab, ein zweiter Tipp ersetzt den Eintrag, wieder öffnen löscht ihn', async () => {
    const gap = await firstGap()
    const input = { householdId, today, groupKey: gap.groupKey, status: 'erledigt' as const }

    const [first, second] = await Promise.all([
      setGapStatus(ports, input),
      setGapStatus(ports, input),
    ])
    if (!first.ok || !second.ok) throw new Error('nicht gespeichert')
    const list = await load()

    expect(second.value.entryId).toBe(first.value.entryId)
    expect(await goalRows(householdId)).toHaveLength(1)
    expect(list.done).toMatchObject([
      {
        id: first.value.entryId,
        label: gap.name,
        source: 'ziel',
        isDone: true,
        amount: gap.missing,
      },
    ])
    expect(list.gaps.map(({ groupKey }) => groupKey)).not.toContain(gap.groupKey)

    await setRestockItemDone(repository, { householdId, id: first.value.entryId, isDone: false })

    expect(await goalRows(householdId)).toEqual([])
    expect((await load()).gaps.map(({ groupKey }) => groupKey)).toContain(gap.groupKey)
  })

  it('lässt den fremden Haushalt nichts sehen, abhaken oder wieder öffnen', async () => {
    const gap = await firstGap()
    const saved = await setGapStatus(ports, {
      householdId,
      today,
      groupKey: gap.groupKey,
      status: 'erledigt',
    })
    if (!saved.ok) throw new Error('nicht gespeichert')

    const reopened = await setRestockItemDone(repository, {
      householdId: foreignId,
      id: saved.value.entryId,
      isDone: false,
    })

    expect(reopened).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect((await load(foreignId)).done).toEqual([])
    expect(await goalRows(householdId)).toHaveLength(1)
    await repository.removeItem(householdId, saved.value.entryId)
  })

  it('erlaubt keine offene Lücke, kein ausgeblendetes eigenes und kein Erledigt ohne Zeitpunkt', async () => {
    await expectConstraintViolation(
      testDb.db.insert(restockItems).values({ householdId, label: 'Wasser', source: 'ziel' }),
      'nachkauf_eintrag_ziel_status_check',
    )
    await expectConstraintViolation(
      testDb.db.insert(restockItems).values({
        householdId,
        label: 'Knäckebrot',
        source: 'manuell',
        status: 'ausgeblendet',
        doneAt: new Date(),
      }),
      'nachkauf_eintrag_ziel_status_check',
    )
    await expectConstraintViolation(
      testDb.db
        .insert(restockItems)
        .values({ householdId, label: 'Knäckebrot', source: 'manuell', status: 'erledigt' }),
      'nachkauf_eintrag_erledigt_am_check',
    )
  })
})
