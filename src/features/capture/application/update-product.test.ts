import { describe, expect, it } from 'vitest'
import type { EditableProduct, ProductChange } from '../domain/product-edit-records'
import type { UpdateProductInput } from '../schemas/product-edit'
import type { ProductEditor } from './product-editor'
import { updateProduct } from './update-product'

// Frei gewählte Testdaten. Der Fake antwortet wie das Repository nur für den eigenen Haushalt.
const householdId = 'haushalt-a'
const NOW = new Date('2026-11-23T10:00:00Z')

const stored: EditableProduct = {
  id: 'p-nudeln',
  name: 'Nudeln',
  foodTypeId: 'art-nudeln',
  content: { value: 500, unit: 'g' },
  containerId: null,
  storageLocationId: null,
  nutrition: {
    values: { kcal: 359, protein: 12, carbs: 70, fat: 1.5 },
    source: 'ai-estimate',
    confirmedAt: null,
  },
}

const FOOD_TYPES = [
  { id: 'art-nudeln', name: 'Nudeln', categoryId: 'kat-teigwaren' },
  { id: 'art-reis', name: 'Reis', categoryId: 'kat-reis' },
]

function createFakeEditor() {
  const saved: ProductChange[] = []
  const editor: ProductEditor = {
    findProduct: (household, productId) =>
      Promise.resolve(household === householdId && productId === stored.id ? stored : null),
    findFoodType: (_household, foodTypeId) =>
      Promise.resolve(FOOD_TYPES.find((foodType) => foodType.id === foodTypeId) ?? null),
    hasContainer: (containerId) => Promise.resolve(containerId === 'dose'),
    hasStorageLocation: (household, locationId) =>
      Promise.resolve(household === householdId && locationId === 'keller'),
    updateProduct: (household, change) => {
      if (household !== householdId) return Promise.resolve(false)
      saved.push(change)
      return Promise.resolve(true)
    },
  }
  return { editor, saved }
}

const input = (overrides: Partial<UpdateProductInput> = {}): UpdateProductInput => ({
  productId: stored.id,
  foodTypeId: 'art-nudeln',
  name: null,
  content: { value: 500, unit: 'g' },
  containerId: null,
  storageLocationId: null,
  nutrition: stored.nutrition.values,
  confirmEstimate: false,
  ...overrides,
})

const run = (editor: ProductEditor, overrides: Partial<UpdateProductInput> = {}) =>
  updateProduct({ editor, now: () => NOW }, { householdId, input: input(overrides) })

describe('updateProduct („Angaben bearbeiten“, #49)', () => {
  it('übernimmt die Kategorie aus der neuen Art, ohne Bezeichnung gilt deren Name', async () => {
    const { editor, saved } = createFakeEditor()

    const result = await run(editor, {
      foodTypeId: 'art-reis',
      content: { value: 1000, unit: 'g' },
      containerId: 'dose',
      storageLocationId: 'keller',
    })

    expect(result).toEqual({ ok: true, value: { foodTypeId: 'art-reis' } })
    expect(saved[0]).toMatchObject({
      categoryId: 'kat-reis',
      foodTypeId: 'art-reis',
      name: 'Reis',
      content: { value: 1000, unit: 'g' },
      containerId: 'dose',
      storageLocationId: 'keller',
    })
  })

  it('behält eine eigene Bezeichnung', async () => {
    const { editor, saved } = createFakeEditor()

    await run(editor, { name: 'Spaghetti No. 5' })

    expect(saved[0]?.name).toBe('Spaghetti No. 5')
  })

  it('macht aus echten Werten eine eigene Angabe und bestätigt Schätzungen auf Wunsch', async () => {
    const changed = createFakeEditor()
    await run(changed.editor, { nutrition: { ...stored.nutrition.values, kcal: 350 } })
    expect(changed.saved[0]?.nutrition).toMatchObject({ source: 'manual', confirmedAt: null })

    const confirmed = createFakeEditor()
    await run(confirmed.editor, { confirmEstimate: true })
    expect(confirmed.saved[0]?.nutrition).toMatchObject({ source: 'ai-estimate', confirmedAt: NOW })
  })

  it.each([
    ['product', { productId: 'fremd' }],
    ['food-type', { foodTypeId: 'art-fremd' }],
    ['container', { containerId: 'glas' }],
    ['storage-location', { storageLocationId: 'fremder-keller' }],
  ] as const)('lehnt unbekannte Bezüge ab (%s)', async (reference, overrides) => {
    const { editor, saved } = createFakeEditor()

    expect(await run(editor, overrides)).toEqual({
      ok: false,
      error: { kind: 'not-found', reference },
    })
    expect(saved).toEqual([])
  })
})
