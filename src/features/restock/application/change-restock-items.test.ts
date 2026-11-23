import { describe, expect, it } from 'vitest'
import {
  createFakeRestockRepository,
  storedItem,
} from '../../../../tests/helpers/fake-restock-repository'
import { addConsumedUnit } from './add-consumed-unit'
import { addRestockItem, removeRestockItem, setRestockItemDone } from './change-restock-items'
import { countOpenRestockItems } from './count-open-items'

// Frei gewählte Testdaten.
const householdId = 'haushalt-a'
const foreignId = 'haushalt-b'

describe('eigene Einträge', () => {
  it('ergänzt einen Eintrag als „manuell“ ohne Produkt', async () => {
    const repository = createFakeRestockRepository()

    await addRestockItem(repository, { householdId, label: 'Knäckebrot' })

    expect(repository.items).toMatchObject([
      { householdId, label: 'Knäckebrot', source: 'manuell', productId: null, isDone: false },
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
    expect(repository.items[0]?.isDone).toBe(true)

    await setRestockItemDone(repository, { householdId, id: 'e1', isDone: false })
    expect(repository.items[0]?.isDone).toBe(false)
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
    expect(repository.items[0]?.isDone).toBe(false)
  })

  it('entfernt einen eigenen Eintrag', async () => {
    const repository = createFakeRestockRepository({
      items: [storedItem({ id: 'e1', householdId })],
    })

    expect((await removeRestockItem(repository, { householdId, id: 'e1' })).ok).toBe(true)
    expect(repository.items).toHaveLength(0)
  })
})

describe('addConsumedUnit', () => {
  const consumedUnits = [{ householdId, unitId: 'u1', productId: 'p-linsen', label: 'Linsen' }]

  it('setzt das Produkt der entnommenen Packung als „nachkauf“ auf die Liste', async () => {
    const repository = createFakeRestockRepository({ consumedUnits })

    const result = await addConsumedUnit(repository, { householdId, unitId: 'u1' })

    expect(result).toEqual({ ok: true, value: { label: 'Linsen', wasListed: false } })
    expect(repository.items).toMatchObject([
      { label: 'Linsen', source: 'nachkauf', productId: 'p-linsen' },
    ])
  })

  it('legt keinen zweiten offenen Eintrag für dasselbe Produkt an', async () => {
    const repository = createFakeRestockRepository({ consumedUnits })
    await addConsumedUnit(repository, { householdId, unitId: 'u1' })

    const again = await addConsumedUnit(repository, { householdId, unitId: 'u1' })

    expect(again).toEqual({ ok: true, value: { label: 'Linsen', wasListed: true } })
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
        storedItem({ id: 'e2', householdId, isDone: true }),
        storedItem({ id: 'e3', householdId: foreignId }),
      ],
    })

    expect(await countOpenRestockItems(repository, householdId)).toBe(1)
  })
})
