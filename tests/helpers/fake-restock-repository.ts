// Fake des Ports `RestockRepository` für die Use-Case-Tests der Nachkaufen-Liste (ohne DB). Wie das
// echte Repository antwortet er nur für den eigenen Haushalt. Alle Werte sind frei gewählte Testdaten.
import type { RestockItem, RestockSource } from '../../src/features/restock/domain/restock-list'

interface StoredItem extends RestockItem {
  householdId: string
  productId: string | null
}

interface ConsumedUnit {
  householdId: string
  unitId: string
  productId: string
  label: string
}

interface FakeRestockData {
  items?: StoredItem[]
  consumedUnits?: ConsumedUnit[]
}

const NOW = new Date('2026-11-22T10:00:00Z')

export function storedItem(
  overrides: Partial<StoredItem> & Pick<StoredItem, 'id' | 'householdId'>,
) {
  return {
    label: 'Knäckebrot',
    source: 'manuell' as RestockSource,
    isDone: false,
    productId: null,
    createdAt: NOW,
    changedAt: NOW,
    ...overrides,
  }
}

export function createFakeRestockRepository(data: FakeRestockData = {}) {
  const items: StoredItem[] = [...(data.items ?? [])]
  const find = (householdId: string, id: string) =>
    items.find((item) => item.householdId === householdId && item.id === id)
  return {
    items,
    listItems: (householdId: string) =>
      Promise.resolve(items.filter((item) => item.householdId === householdId)),
    addItem: (
      householdId: string,
      item: { label: string; source: RestockSource; productId: string | null },
    ) => {
      items.push(storedItem({ id: `neu-${String(items.length + 1)}`, householdId, ...item }))
      return Promise.resolve()
    },
    setDone: (householdId: string, change: { id: string; isDone: boolean }) => {
      const item = find(householdId, change.id)
      if (item) item.isDone = change.isDone
      return Promise.resolve(item !== undefined)
    },
    removeItem: (householdId: string, id: string) => {
      const item = find(householdId, id)
      if (item) items.splice(items.indexOf(item), 1)
      return Promise.resolve(item !== undefined)
    },
    addProductOnce: (householdId: string, item: { label: string; productId: string }) => {
      const isListed = items.some(
        (entry) =>
          entry.householdId === householdId && entry.productId === item.productId && !entry.isDone,
      )
      if (isListed) return Promise.resolve(null)
      const id = `neu-${String(items.length + 1)}`
      items.push(storedItem({ id, householdId, ...item, source: 'nachkauf' }))
      return Promise.resolve(id)
    },
    findConsumedProduct: (householdId: string, unitId: string) => {
      const unit = data.consumedUnits?.find(
        (entry) => entry.householdId === householdId && entry.unitId === unitId,
      )
      return Promise.resolve(unit ? { productId: unit.productId, label: unit.label } : null)
    },
  }
}
