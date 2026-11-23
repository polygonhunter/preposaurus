// Fake des Speicher-Ports `StockWriter` (#51) im Speicher. Die Transaktion arbeitet auf einer Kopie
// und übernimmt sie erst am Ende: Wirft die Arbeit, bleibt der alte Stand stehen, wie bei der DB.
// Test-Helfer dürfen application/ nicht importieren, deshalb passt der Fake nur der Form nach.
import { randomUUID } from 'node:crypto'
import type { PlannedUnit } from '../../src/features/capture/domain/stock-draft'
import type {
  CaptureLookup,
  DraftAdoption,
  FoodTypeRef,
  NewCapture,
  NewProductRow,
  NewUnitRows,
  ProductCandidate,
} from '../../src/features/capture/domain/stock-records'

interface StoredUnit extends PlannedUnit {
  productId: string
  captureId: string
}

interface FakeState {
  captures: NewCapture[]
  products: (NewProductRow & { id: string })[]
  units: StoredUnit[]
  adoptedDrafts: DraftAdoption[]
}

type ByHousehold<T> = Readonly<Record<string, readonly T[]>>

interface FakeMasterData {
  /** Je Haushalt sichtbare Arten (System-Arten bei jedem Haushalt eintragen) */
  foodTypes?: ByHousehold<FoodTypeRef>
  storageLocations?: ByHousehold<string>
  containers?: readonly string[]
  candidates?: ByHousehold<ProductCandidate>
}

const emptyState = (): FakeState => ({ captures: [], products: [], units: [], adoptedDrafts: [] })

const copy = (state: FakeState): FakeState => ({
  captures: [...state.captures],
  products: [...state.products],
  units: [...state.units],
  adoptedDrafts: [...state.adoptedDrafts],
})

function lookup(state: FakeState, householdId: string, captureId: string): CaptureLookup {
  const capture = state.captures.find((entry) => entry.id === captureId)
  if (capture === undefined) return { kind: 'none' }
  if (capture.householdId !== householdId) return { kind: 'foreign' }
  const saved = state.units.filter((unit) => unit.captureId === captureId)
  return { kind: 'saved', productId: saved[0]?.productId ?? '', unitCount: saved.length }
}

function claim(state: FakeState, capture: NewCapture): boolean {
  if (state.captures.some((entry) => entry.id === capture.id)) return false
  state.captures.push(capture)
  return true
}

function addProduct(state: FakeState, product: NewProductRow): string {
  const id = randomUUID()
  state.products.push({ ...product, id })
  return id
}

function masterDataReads(master: FakeMasterData) {
  return {
    findFoodType: (householdId: string, id: string) =>
      Promise.resolve(master.foodTypes?.[householdId]?.find((type) => type.id === id) ?? null),
    hasStorageLocation: (householdId: string, id: string) =>
      Promise.resolve(master.storageLocations?.[householdId]?.includes(id) ?? false),
    hasContainer: (id: string) => Promise.resolve(master.containers?.includes(id) ?? false),
  }
}

export function createFakeStockWriter(master: FakeMasterData = {}) {
  const fake = { state: emptyState(), failUnits: false }
  const insertUnits = (state: FakeState, { productId, captureId, units }: NewUnitRows) => {
    if (fake.failUnits) {
      fake.failUnits = false
      return Promise.reject(new Error('Einheiten konnten nicht gespeichert werden'))
    }
    state.units.push(...units.map((unit) => ({ ...unit, productId, captureId })))
    return Promise.resolve()
  }
  const transactionOn = (draft: FakeState) => ({
    ...masterDataReads(master),
    findCapture: (householdId: string, id: string) =>
      Promise.resolve(lookup(draft, householdId, id)),
    hasProduct: (householdId: string, id: string) =>
      Promise.resolve(draft.products.some((p) => p.id === id && p.householdId === householdId)),
    claimCapture: (capture: NewCapture) => Promise.resolve(claim(draft, capture)),
    insertProduct: (product: NewProductRow) => Promise.resolve(addProduct(draft, product)),
    insertUnits: (rows: NewUnitRows) => insertUnits(draft, rows),
    adoptDraft: (adoption: DraftAdoption) => {
      draft.adoptedDrafts.push(adoption)
      return Promise.resolve()
    },
  })
  return {
    get state(): FakeState {
      return fake.state
    },
    /** Lässt den nächsten insertUnits-Aufruf scheitern, um den Abbruch zu prüfen */
    failNextUnitInsert: () => {
      fake.failUnits = true
    },
    async transaction<T>(work: (tx: ReturnType<typeof transactionOn>) => Promise<T>) {
      const draft = copy(fake.state)
      const result = await work(transactionOn(draft))
      fake.state = draft
      return result
    },
    findProductsByFoodType: (householdId: string, foodTypeId: string) =>
      Promise.resolve(
        (master.candidates?.[householdId] ?? []).filter(
          (candidate) => candidate.foodTypeId === foodTypeId,
        ),
      ),
  }
}
