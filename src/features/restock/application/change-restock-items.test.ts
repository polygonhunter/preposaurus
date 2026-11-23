import { describe, expect, it } from 'vitest'
import {
  createFakeRestockRepository,
  storedItem,
} from '../../../../tests/helpers/fake-restock-repository'
import { addConsumedUnit } from './add-consumed-unit'
import { addSuggestedProduct } from './add-suggested-product'
import {
  addRestockItem,
  removeRestockItem,
  restoreRestockItem,
  setRestockItemDone,
} from './change-restock-items'
import { countOpenRestockItems } from './count-open-items'

// Frei gewählte Testdaten.
const householdId = 'haushalt-a'
const foreignId = 'haushalt-b'

describe('eigene Einträge', () => {
  it('ergänzt einen Eintrag als „manuell“ ohne Produkt', async () => {
    const repository = createFakeRestockRepository()

    await addRestockItem(repository, { householdId, label: 'Knäckebrot' })

    expect(repository.items).toMatchObject([
      { householdId, label: 'Knäckebrot', source: 'manuell', productId: null, status: 'offen' },
    ])
  })

  it('hakt ab und öffnet wieder', async () => {
    const repository = createFakeRestockRepository({
      items: [storedItem({ id: 'e1', householdId })],
    })

    expect(await setRestockItemDone(repository, { householdId, id: 'e1', isDone: true })).toEqual({
      ok: true,
      value: undefined,
    })
    expect(repository.items[0]?.status).toBe('erledigt')

    await setRestockItemDone(repository, { householdId, id: 'e1', isDone: false })
    expect(repository.items[0]?.status).toBe('offen')
  })

  it('ändert und entfernt keinen Eintrag eines fremden Haushalts', async () => {
    const repository = createFakeRestockRepository({
      items: [storedItem({ id: 'e1', householdId: foreignId })],
    })

    const done = await setRestockItemDone(repository, { householdId, id: 'e1', isDone: true })
    const removed = await removeRestockItem(repository, { householdId, id: 'e1' })

    expect(done).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(removed).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(repository.items).toHaveLength(1)
    expect(repository.items[0]?.status).toBe('offen')
  })

  it('entfernt einen eigenen Eintrag und gibt ihn für „Rückgängig“ zurück', async () => {
    const repository = createFakeRestockRepository({
      items: [storedItem({ id: 'e1', householdId })],
    })

    const removed = await removeRestockItem(repository, { householdId, id: 'e1' })

    expect(removed).toMatchObject({ ok: true, value: { id: 'e1', label: 'Knäckebrot' } })
    expect(repository.items).toHaveLength(0)
  })

  it('legt einen entfernten Eintrag mit „Rückgängig“ wieder an, einmal', async () => {
    const repository = createFakeRestockRepository({
      items: [storedItem({ id: 'e1', householdId, status: 'erledigt', doneAt: new Date() })],
    })
    const removed = await removeRestockItem(repository, { householdId, id: 'e1' })
    if (!removed.ok) throw new Error('nicht entfernt')

    await restoreRestockItem(repository, { householdId, item: removed.value })
    await restoreRestockItem(repository, { householdId, item: removed.value })

    expect(repository.items).toMatchObject([{ id: 'e1', householdId, status: 'erledigt' }])
  })

  it('übernimmt beim Wiederanlegen kein Produkt eines fremden Haushalts', async () => {
    const repository = createFakeRestockRepository({
      products: [{ householdId: foreignId, productId: 'p-fremd', label: 'Fremd' }],
    })
    const item = {
      id: 'e9',
      label: 'Fremd',
      source: 'nachkauf' as const,
      productId: 'p-fremd',
      isDone: false,
      doneAt: null,
      createdAt: new Date('2026-11-20T10:00:00Z'),
    }

    await restoreRestockItem(repository, { householdId, item })

    expect(repository.items).toMatchObject([{ id: 'e9', productId: null }])
  })
})

describe('addSuggestedProduct', () => {
  const products = [{ householdId, productId: 'p-milch', label: 'H-Milch' }]

  it('setzt das Produkt eines Vorschlags als „nachkauf“ auf die Liste, nur einmal', async () => {
    const repository = createFakeRestockRepository({ products })

    const first = await addSuggestedProduct(repository, { householdId, productId: 'p-milch' })
    const again = await addSuggestedProduct(repository, { householdId, productId: 'p-milch' })

    expect(first).toEqual({ ok: true, value: { label: 'H-Milch', addedItemId: 'neu-1' } })
    expect(again).toEqual({ ok: true, value: { label: 'H-Milch', addedItemId: null } })
    expect(repository.items).toMatchObject([
      { label: 'H-Milch', source: 'nachkauf', productId: 'p-milch' },
    ])
  })

  it('kennt kein Produkt eines fremden Haushalts', async () => {
    const repository = createFakeRestockRepository({ products })

    const result = await addSuggestedProduct(repository, {
      householdId: foreignId,
      productId: 'p-milch',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(repository.items).toHaveLength(0)
  })
})

describe('addConsumedUnit', () => {
  const consumedUnits = [{ householdId, unitId: 'u1', productId: 'p-linsen', label: 'Linsen' }]

  it('setzt das Produkt der entnommenen Packung als „nachkauf“ auf die Liste', async () => {
    const repository = createFakeRestockRepository({ consumedUnits })

    const result = await addConsumedUnit(repository, { householdId, unitId: 'u1' })

    expect(result).toEqual({ ok: true, value: { label: 'Linsen', addedItemId: 'neu-1' } })
    expect(repository.items).toMatchObject([
      { label: 'Linsen', source: 'nachkauf', productId: 'p-linsen' },
    ])
  })

  it('legt keinen zweiten offenen Eintrag für dasselbe Produkt an', async () => {
    const repository = createFakeRestockRepository({ consumedUnits })
    await addConsumedUnit(repository, { householdId, unitId: 'u1' })

    const again = await addConsumedUnit(repository, { householdId, unitId: 'u1' })

    expect(again).toEqual({ ok: true, value: { label: 'Linsen', addedItemId: null } })
    expect(repository.items).toHaveLength(1)
  })

  it('kennt keine Packung eines fremden Haushalts', async () => {
    const repository = createFakeRestockRepository({ consumedUnits })

    const result = await addConsumedUnit(repository, { householdId: foreignId, unitId: 'u1' })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(repository.items).toHaveLength(0)
  })
})

describe('countOpenRestockItems', () => {
  it('zählt offene Einträge des eigenen Haushalts, keine erledigten und keine fremden', async () => {
    const repository = createFakeRestockRepository({
      items: [
        storedItem({ id: 'e1', householdId }),
        storedItem({ id: 'e2', householdId, status: 'erledigt', doneAt: new Date() }),
        storedItem({ id: 'e3', householdId: foreignId }),
      ],
    })

    expect(await countOpenRestockItems(repository, householdId)).toBe(1)
  })
})

describe('abgehakte und ausgeblendete Lücken (#201)', () => {
  const gapItem = (status: 'erledigt' | 'ausgeblendet') =>
    storedItem({
      id: 'z1',
      householdId,
      label: 'Wasser',
      source: 'ziel',
      status,
      doneAt: new Date('2026-11-21T10:00:00Z'),
      groupKey: 'wasser',
      amount: { value: 20_000, unit: 'ml' },
    })

  it('öffnet eine abgehakte Lücke wieder, indem ihr Eintrag weggeht', async () => {
    const repository = createFakeRestockRepository({ items: [gapItem('erledigt')] })

    const result = await setRestockItemDone(repository, { householdId, id: 'z1', isDone: false })

    expect(result).toEqual({ ok: true, value: undefined })
    expect(repository.items).toHaveLength(0)
  })

  it('zählt Lücken nie als offene Einträge', async () => {
    const repository = createFakeRestockRepository({
      items: [gapItem('erledigt'), { ...gapItem('ausgeblendet'), id: 'z2' }],
    })

    expect(await countOpenRestockItems(repository, householdId)).toBe(0)
  })

  it('legt eine entfernte Lücke mit „Rückgängig“ nicht wieder an', async () => {
    const repository = createFakeRestockRepository({ items: [gapItem('ausgeblendet')] })
    const removed = await removeRestockItem(repository, { householdId, id: 'z1' })
    if (!removed.ok) throw new Error('nicht entfernt')

    await restoreRestockItem(repository, { householdId, item: removed.value })

    expect(repository.items).toHaveLength(0)
  })
})
