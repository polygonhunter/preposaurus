// Neue Lebensmittelart aus der Erfassung (#142, #110) gegen PGlite: nur als Admin, nur im Haushalt
// der Sitzung, über denselben Use-Case wie die Einstellungen (`eigen_<slug>`). Ähnliche Namen und
// Suchwörter ergeben die vorhandene Art statt einer Dublette. Danach steht die Art in der
// Erfassen-Auswahl und im KI-Enum, aber nur im eigenen Haushalt.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHousehold } from '../../../db/seeds/factories'
import { createCaptureOptionsRepository } from '../../../src/features/capture/data/capture-options-repository'
import { loadCategoryOptions } from '../../../src/features/capture/data/category-options'
import { loadFoodTypeOptions } from '../../../src/features/capture/data/food-type-options'
import { createCategoryRepository } from '../../../src/features/catalog/data/category-repository'
import { createFoodTypeRepository } from '../../../src/features/catalog/data/food-type-repository'
import type { AccessError } from '../../../src/server/auth/guards'
import type { Database } from '../../../src/server/db/connection'
import { households } from '../../../src/server/db/schema/household'
import type { Result } from '../../../src/shared/lib/result'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

type Access = Result<{ householdId: string }, AccessError>

const state = vi.hoisted(() => ({
  access: null as Access | null,
  db: null as Database | null,
}))

vi.mock('@/server/auth/guards', () => ({
  requireHouseholdAdmin: () => Promise.resolve(state.access),
}))
vi.mock('@/server/db/get-db', () => ({ getDb: () => Promise.resolve(state.db) }))

const { addFoodTypeAction } =
  await import('../../../src/features/capture/actions/add-food-type-action')

const NO_REFERENCE = {
  searchTerms: [],
  kcalPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  typicalShelfLifeMonths: null,
}

describe('Neue Lebensmittelart aus der Erfassung', () => {
  let testDb: TestDb
  let basics: Basics
  let otherId: string

  const actAs = (householdId: string) => {
    state.access = { ok: true, value: { householdId } }
  }

  const captureNames = async (householdId: string) =>
    (await createCaptureOptionsRepository(testDb.db).loadFoodTypes(householdId)).map(
      (choice) => choice.name,
    )

  beforeAll(async () => {
    testDb = await createTestDb()
    state.db = testDb.db
    basics = await insertBasics(testDb.db)
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(other)
    otherId = other.id
  })

  beforeEach(() => {
    actAs(basics.householdId)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt als Admin im eigenen Haushalt an und liefert die Art samt Pfad', async () => {
    const outcome = await addFoodTypeAction({ name: ' Dinkelreis ', categoryId: basics.categoryId })

    expect(outcome).toMatchObject({
      ok: true,
      foodType: { key: 'eigen_dinkelreis', name: 'Dinkelreis', searchTerms: [] },
    })
    expect(await captureNames(basics.householdId)).toContain('Dinkelreis')
    const aiKeys = (await loadFoodTypeOptions(testDb.db, basics.householdId)).map((o) => o.key)
    expect(aiKeys).toContain('eigen_dinkelreis')
    // Nur im eigenen Haushalt
    expect(await captureNames(otherId)).not.toContain('Dinkelreis')
    expect((await loadFoodTypeOptions(testDb.db, otherId)).map((o) => o.key)).not.toContain(
      'eigen_dinkelreis',
    )
  })

  it('bietet statt einer Dublette die vorhandene Art an, auch über Suchwörter', async () => {
    const byTerm = await addFoodTypeAction({ name: 'spaghetti', categoryId: basics.categoryId })
    const byName = await addFoodTypeAction({ name: 'DINKELREIS', categoryId: basics.categoryId })

    expect(byTerm).toMatchObject({ ok: false, similar: { key: 'nudeln' } })
    expect(byName).toMatchObject({ ok: false, similar: { key: 'eigen_dinkelreis' } })
    expect(
      (await captureNames(basics.householdId)).filter((name) => /spaghetti/i.test(name)),
    ).toEqual([])
  })

  it('lehnt einen Namen ab, den eine ausgeblendete Art schon trägt', async () => {
    const repository = createFoodTypeRepository(testDb.db)
    const id = await repository.create(basics.householdId, {
      name: 'Grünkern',
      key: 'eigen_gruenkern',
      categoryId: basics.categoryId,
      ...NO_REFERENCE,
    })
    if (id === null) throw new Error('Grünkern fehlt')
    await repository.setHidden(basics.householdId, id, true)

    const outcome = await addFoodTypeAction({ name: 'grünkern', categoryId: basics.categoryId })

    expect(outcome.ok).toBe(false)
    expect(outcome.ok ? null : outcome.errors.name).toContain('ausgeblendet')
  })

  it('nimmt keine Kategorie eines fremden Haushalts an', async () => {
    const foreignCategory = await createCategoryRepository(testDb.db).create(otherId, {
      name: 'Fremde Vorräte',
      productGroupId: (await createCategoryRepository(testDb.db).listGroups())[0]?.id ?? '',
    })
    if (foreignCategory === null) throw new Error('Kategorie fehlt')

    const outcome = await addFoodTypeAction({ name: 'Kamut', categoryId: foreignCategory })

    expect(outcome).toMatchObject({
      ok: false,
      errors: { categoryId: 'Bitte eine Kategorie wählen.' },
    })
    expect(await captureNames(basics.householdId)).not.toContain('Kamut')
    expect(
      (await loadCategoryOptions(testDb.db, basics.householdId)).map((c) => c.id),
    ).not.toContain(foreignCategory)
    expect((await loadCategoryOptions(testDb.db, otherId)).map((c) => c.id)).toContain(
      foreignCategory,
    )
  })

  it('lässt ein Mitglied nichts anlegen', async () => {
    state.access = { ok: false, error: { kind: 'forbidden' } }

    const outcome = await addFoodTypeAction({ name: 'Emmer', categoryId: basics.categoryId })

    expect(outcome).toEqual({
      ok: false,
      errors: {},
      message: 'Das ändert ein Admin.',
      similar: null,
    })
    expect(await captureNames(basics.householdId)).not.toContain('Emmer')
  })

  it('prüft Name und Kategorie mit dem Schema der Einstellungen', async () => {
    const outcome = await addFoodTypeAction({ name: '  ', categoryId: 'keine-id' })

    expect(outcome).toMatchObject({
      ok: false,
      errors: { name: 'Bitte einen Namen eintragen.', categoryId: 'Bitte eine Kategorie wählen.' },
    })
  })

  it('bietet nur sichtbare Kategorien an, auch ohne vom Haushalt ausgeblendete', async () => {
    const categories = createCategoryRepository(testDb.db)
    await categories.setHidden(basics.householdId, basics.categoryId, true)

    const ids = (await loadCategoryOptions(testDb.db, basics.householdId)).map((c) => c.id)

    expect(ids).not.toContain(basics.categoryId)
    expect((await loadCategoryOptions(testDb.db, otherId)).map((c) => c.id)).toContain(
      basics.categoryId,
    )
    await categories.setHidden(basics.householdId, basics.categoryId, false)
  })
})
