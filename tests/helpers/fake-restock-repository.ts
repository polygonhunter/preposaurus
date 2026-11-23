// Fake des Ports `RestockRepository` für die Use-Case-Tests der Nachkaufen-Liste (ohne DB). Wie das
// echte Repository antwortet er nur für den eigenen Haushalt. Alle Werte sind frei gewählte Testdaten.
import type { GroupFoodType } from '../../src/features/restock/domain/gap-examples'
import type { GoalEntryStatus } from '../../src/features/restock/domain/goal-entries'
import type { ReplacementUnit } from '../../src/features/restock/domain/replacement-candidates'
import type { RestockItem, RestockSource } from '../../src/features/restock/domain/restock-list'
import type { ContentQuantity } from '../../src/shared/lib/quantities'

interface StoredItem extends RestockItem {
  householdId: string
}

/** Wie `StoredRestockItem` des Ports (Test-Helfer dürfen `application/` nicht importieren) */
type RemovedItem = Pick<RestockItem, 'id' | 'label' | 'source' | 'productId' | 'createdAt'> & {
  isDone: boolean
  doneAt: Date | null
}

interface GapEntry {
  groupKey: string
  label: string
  missing: ContentQuantity
  status: GoalEntryStatus
}

interface ConsumedUnit {
  householdId: string
  unitId: string
  productId: string
  label: string
}

interface OwnedProduct {
  householdId: string
  productId: string
  label: string
}

interface FakeRestockData {
  items?: StoredItem[]
  consumedUnits?: ConsumedUnit[]
  products?: OwnedProduct[]
  /** Packungen des Haushalts `haushalt-a` für „Ersetzen“ */
  replacementUnits?: ReplacementUnit[]
  foodTypes?: GroupFoodType[]
  /** Schlüssel der Warengruppen, die es gibt */
  groupKeys?: string[]
}

const NOW = new Date('2026-11-22T10:00:00Z')
const OWNER = 'haushalt-a'

export function storedItem(
  overrides: Partial<StoredItem> & Pick<StoredItem, 'id' | 'householdId'>,
): StoredItem {
  return {
    label: 'Knäckebrot',
    source: 'manuell',
    status: 'offen',
    doneAt: null,
    productId: null,
    foodTypeId: null,
    groupKey: null,
    amount: null,
    createdAt: NOW,
    ...overrides,
  }
}

const isOpen = (item: StoredItem) => item.status === 'offen'

function productQueries(data: FakeRestockData) {
  return {
    findConsumedProduct: (householdId: string, unitId: string) => {
      const unit = data.consumedUnits?.find(
        (entry) => entry.householdId === householdId && entry.unitId === unitId,
      )
      return Promise.resolve(unit ? { productId: unit.productId, label: unit.label } : null)
    },
    findProduct: (householdId: string, productId: string) => {
      const product = data.products?.find(
        (entry) => entry.householdId === householdId && entry.productId === productId,
      )
      return Promise.resolve(product ? { productId, label: product.label } : null)
    },
    listReplacementUnits: (householdId: string) =>
      Promise.resolve(householdId === OWNER ? (data.replacementUnits ?? []) : []),
    listGroupFoodTypes: () => Promise.resolve(data.foodTypes ?? []),
  }
}

function gapEntries(items: StoredItem[], data: FakeRestockData) {
  return {
    saveGapEntry: (householdId: string, entry: GapEntry) => {
      if (!(data.groupKeys ?? []).includes(entry.groupKey)) return Promise.resolve(null)
      const existing = items.find(
        (item) =>
          item.householdId === householdId &&
          item.source === 'ziel' &&
          item.groupKey === entry.groupKey &&
          item.status === entry.status,
      )
      const values = { label: entry.label, amount: entry.missing, doneAt: NOW }
      if (existing !== undefined) {
        Object.assign(existing, values)
        return Promise.resolve(existing.id)
      }
      const id = `ziel-${String(items.length + 1)}`
      const { groupKey, status } = entry
      items.push(storedItem({ id, householdId, source: 'ziel', groupKey, status, ...values }))
      return Promise.resolve(id)
    },
  }
}

function itemChanges(items: StoredItem[], data: FakeRestockData) {
  const find = (householdId: string, id: string) =>
    items.find((item) => item.householdId === householdId && item.id === id)
  return {
    setDone: (householdId: string, change: { id: string; isDone: boolean }) => {
      const item = find(householdId, change.id)
      if (item?.source === 'ziel') {
        if (change.isDone) return Promise.resolve(false)
        items.splice(items.indexOf(item), 1)
        return Promise.resolve(true)
      }
      if (item) {
        item.status = change.isDone ? 'erledigt' : 'offen'
        item.doneAt = change.isDone ? NOW : null
      }
      return Promise.resolve(item !== undefined)
    },
    removeItem: (householdId: string, id: string) => {
      const item = find(householdId, id)
      if (item === undefined) return Promise.resolve(null)
      items.splice(items.indexOf(item), 1)
      const { label, source, productId, status, doneAt, createdAt } = item
      const isDone = status === 'erledigt'
      return Promise.resolve({ id, label, source, productId, isDone, doneAt, createdAt })
    },
    restoreItem: (householdId: string, item: RemovedItem) => {
      const isOwnProduct = data.products?.some(
        (entry) => entry.householdId === householdId && entry.productId === item.productId,
      )
      const productId = isOwnProduct === true ? item.productId : null
      const isTaken = items.some((entry) => entry.id === item.id)
      const isDuplicate =
        productId !== null &&
        !item.isDone &&
        items.some(
          (entry) =>
            entry.householdId === householdId && entry.productId === productId && isOpen(entry),
        )
      if (isTaken || isDuplicate) return Promise.resolve()
      const { isDone, ...rest } = item
      const status = isDone ? 'erledigt' : 'offen'
      items.push(storedItem({ ...rest, householdId, productId, status }))
      return Promise.resolve()
    },
  }
}

export function createFakeRestockRepository(data: FakeRestockData = {}) {
  const items: StoredItem[] = [...(data.items ?? [])]
  const own = (householdId: string) => items.filter((item) => item.householdId === householdId)
  return {
    items,
    listItems: (householdId: string) => Promise.resolve(own(householdId)),
    countOpenItems: (householdId: string) =>
      Promise.resolve(own(householdId).filter(isOpen).length),
    addItem: (
      householdId: string,
      item: { label: string; source: RestockSource; productId: string | null },
    ) => {
      items.push(storedItem({ id: `neu-${String(items.length + 1)}`, householdId, ...item }))
      return Promise.resolve()
    },
    addProductOnce: (householdId: string, item: { label: string; productId: string }) => {
      const isListed = own(householdId).some(
        (entry) => entry.productId === item.productId && isOpen(entry),
      )
      if (isListed) return Promise.resolve(null)
      const id = `neu-${String(items.length + 1)}`
      items.push(storedItem({ id, householdId, ...item, source: 'nachkauf' }))
      return Promise.resolve(id)
    },
    ...gapEntries(items, data),
    ...itemChanges(items, data),
    ...productQueries(data),
  }
}
