import { describe, expect, it } from 'vitest'
import { category, fakeCatalog, foodType, GROUP } from '../../../../tests/helpers/fake-catalog'
import { saveCategory, setCategoryHidden } from './categories'
import { removeFoodType, saveFoodType, setFoodTypeHidden } from './food-types'

const HOUSEHOLD = 'h1'

const categoryInput = (name: string, productGroupId = GROUP.id) => ({ name, productGroupId })

const foodTypeInput = (name: string, categoryId = 'nudeln') => ({
  name,
  categoryId,
  searchTerms: ['Pasta'],
  kcalPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  typicalShelfLifeMonths: null,
})

describe('Kategorien verwalten', () => {
  it('legt eine eigene Kategorie unter einer Warengruppe an', async () => {
    const { deps, calls } = fakeCatalog([])

    const result = await saveCategory(deps, {
      householdId: HOUSEHOLD,
      id: null,
      input: categoryInput('Vorratsdosen'),
    })

    expect(result).toEqual({ ok: true, value: { id: 'neu' } })
    expect(calls).toEqual(['create-category:Vorratsdosen'])
  })

  it('verlangt eine bekannte Warengruppe', async () => {
    const { deps } = fakeCatalog([])

    const result = await saveCategory(deps, {
      householdId: HOUSEHOLD,
      id: null,
      input: categoryInput('Vorratsdosen', 'fremd'),
    })

    expect(result).toEqual({ ok: false, error: { kind: 'unknown-group' } })
  })

  it('ändert keine System-Kategorie', async () => {
    const { deps } = fakeCatalog([category('nudeln', { isSystem: true })])

    const result = await saveCategory(deps, {
      householdId: HOUSEHOLD,
      id: 'nudeln',
      input: categoryInput('Pasta'),
    })

    expect(result).toEqual({ ok: false, error: { kind: 'system-not-editable' } })
  })

  it('lehnt einen Namen ab, den es schon gibt, auch als System-Kategorie', async () => {
    const { deps } = fakeCatalog([category('Nudeln', { isSystem: true })])

    const result = await saveCategory(deps, {
      householdId: HOUSEHOLD,
      id: null,
      input: categoryInput('nudeln'),
    })

    expect(result).toEqual({ ok: false, error: { kind: 'duplicate', isHidden: false } })
  })

  it('blendet System-Kategorien je Haushalt aus, vom Seed entfernte nicht wieder ein', async () => {
    const { deps, calls } = fakeCatalog([
      category('nudeln', { isSystem: true }),
      category('alt', { isSystem: true, isRetired: true, isHidden: true }),
    ])

    const hidden = await setCategoryHidden(deps, {
      householdId: HOUSEHOLD,
      id: 'nudeln',
      isHidden: true,
    })
    const retired = await setCategoryHidden(deps, {
      householdId: HOUSEHOLD,
      id: 'alt',
      isHidden: false,
    })

    expect(hidden.ok).toBe(true)
    expect(retired).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(calls).toEqual(['hide-category:nudeln:true'])
  })
})

describe('Lebensmittelarten verwalten', () => {
  it('legt eine eigene Art mit eindeutigem Schlüssel und Suchwörtern an', async () => {
    const { deps, calls } = fakeCatalog(
      [category('nudeln')],
      [foodType('dinkel', { key: 'eigen_dinkelnudeln', name: 'Alt' })],
    )

    const result = await saveFoodType(deps, {
      householdId: HOUSEHOLD,
      id: null,
      input: foodTypeInput('Dinkelnudeln'),
    })

    expect(result.ok).toBe(true)
    expect(calls).toEqual(['create-food-type:eigen_dinkelnudeln_2:Pasta'])
  })

  it('verlangt eine Kategorie, die der Haushalt wählen kann', async () => {
    const { deps } = fakeCatalog([category('nudeln', { isHidden: true })])

    const result = await saveFoodType(deps, {
      householdId: HOUSEHOLD,
      id: null,
      input: foodTypeInput('Dinkelnudeln'),
    })

    expect(result).toEqual({ ok: false, error: { kind: 'unknown-category' } })
  })

  it('behält beim Ändern die bisherige, inzwischen ausgeblendete Kategorie', async () => {
    const { deps } = fakeCatalog([category('nudeln', { isHidden: true })], [foodType('dinkel')])

    const result = await saveFoodType(deps, {
      householdId: HOUSEHOLD,
      id: 'dinkel',
      input: foodTypeInput('Dinkel'),
    })

    expect(result).toEqual({ ok: true, value: { id: 'dinkel' } })
  })

  it('ändert keine System-Art und doppelt keine System-Art', async () => {
    const { deps } = fakeCatalog(
      [category('nudeln')],
      [foodType('spaghetti', { isSystem: true, name: 'Nudeln' })],
    )

    const edit = await saveFoodType(deps, {
      householdId: HOUSEHOLD,
      id: 'spaghetti',
      input: foodTypeInput('Pasta'),
    })
    const twin = await saveFoodType(deps, {
      householdId: HOUSEHOLD,
      id: null,
      input: foodTypeInput('nudeln'),
    })

    expect(edit).toEqual({ ok: false, error: { kind: 'system-not-editable' } })
    expect(twin).toEqual({ ok: false, error: { kind: 'duplicate', isHidden: false } })
  })

  it('meldet eine unbekannte Art beim Ändern', async () => {
    const { deps } = fakeCatalog([category('nudeln')])

    const result = await saveFoodType(deps, {
      householdId: HOUSEHOLD,
      id: 'fremd',
      input: foodTypeInput('Dinkel'),
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })

  it('blendet aus und meldet eine benutzte Art beim Löschen', async () => {
    const { deps, calls } = fakeCatalog([category('nudeln')], [foodType('dinkel')])

    await setFoodTypeHidden(deps, { householdId: HOUSEHOLD, id: 'dinkel', isHidden: true })
    const removed = await removeFoodType(deps, { householdId: HOUSEHOLD, id: 'dinkel' })

    expect(calls).toEqual(['hide-food-type:dinkel:true'])
    expect(removed).toEqual({ ok: false, error: { kind: 'in-use' } })
  })
})
