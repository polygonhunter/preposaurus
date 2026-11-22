// Fake des Lese-Ports `StockReader` für die Use-Case-Tests (ohne DB). Er filtert wie das echte
// Repository auf den Haushalt und auf Produkt- und Einheiten-Merkmale. Alle Werte sind frei
// gewählte Testdaten.
import type {
  FilterOptions,
  ProductFilter,
  ReadSettings,
  StockProduct,
  StockProductUnit,
  UnitQuery,
} from '@/features/inventory/domain/stock-entry'
import type { UnitStatus } from '@/features/inventory/domain/unit'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import { toCalendarDay } from '@/shared/lib/dates'

export const GROUPS = [
  { key: 'getreide', name: 'Getreide' },
  { key: 'wasser', name: 'Wasser' },
  { key: 'sonstiges', name: 'Sonstiges' },
]

const NO_BASIS: SupplyBasis = {
  members: [],
  householdDiet: 'omnivore',
  needs: {},
  targetsByDiet: {},
  goalDays: null,
}

export const SETTINGS: ReadSettings = {
  thresholds: { soonDays: 90, urgentDays: 28 },
  stillGoodCounts: false,
}

interface FakeData {
  householdId: string
  products: StockProduct[]
  units: StockProductUnit[]
  settings?: ReadSettings
  basis?: SupplyBasis
  options?: FilterOptions
}

const includesText = (text: string, search: string) =>
  text.toLowerCase().includes(search.toLowerCase())

function matchesSearch(product: StockProduct, search: string | undefined): boolean {
  if (search === undefined || search.trim() === '') return true
  const names = [product.name, product.foodType?.name ?? '']
  return names.some((name) => includesText(name, search.trim()))
}

function matchesProduct(product: StockProduct, filter: ProductFilter): boolean {
  const checks: [string | undefined, string | undefined][] = [
    [filter.groupKey, product.group.key],
    [filter.categoryId, product.category.id],
    [filter.foodTypeId, product.foodType?.id],
    [filter.productId, product.id],
    [filter.containerId, product.container?.id],
    [filter.storageLocationId, product.storageLocation?.id],
  ]
  const fits = checks.every(([wanted, actual]) => wanted === undefined || wanted === actual)
  return fits && matchesSearch(product, filter.search)
}

function matchesUnit(unit: StockProductUnit, query: UnitQuery): boolean {
  if (query.productIds !== undefined && !query.productIds.includes(unit.productId)) return false
  if (!query.statuses.includes(unit.status)) return false
  if (query.dueUntil === undefined || unit.bestBefore === null) return true
  return unit.bestBefore.date <= query.dueUntil
}

export function createFakeStockReader(data: FakeData) {
  const own = (householdId: string) => householdId === data.householdId
  const ownProducts = (householdId: string) => (own(householdId) ? data.products : [])
  const ownUnits = (householdId: string) => {
    const ids = new Set(ownProducts(householdId).map((product) => product.id))
    return data.units.filter((unit) => ids.has(unit.productId))
  }
  return {
    loadSettings: (householdId: string) =>
      Promise.resolve(own(householdId) ? (data.settings ?? SETTINGS) : SETTINGS),
    loadSupplyBasis: (householdId: string) =>
      Promise.resolve(own(householdId) ? (data.basis ?? NO_BASIS) : NO_BASIS),
    loadGroups: () => Promise.resolve(GROUPS),
    loadFilterOptions: () =>
      Promise.resolve(data.options ?? { containers: [], storageLocations: [] }),
    loadProducts: (householdId: string, filter: ProductFilter) =>
      Promise.resolve(
        ownProducts(householdId).filter((product) => matchesProduct(product, filter)),
      ),
    loadUnits: (householdId: string, query: UnitQuery) =>
      Promise.resolve(ownUnits(householdId).filter((unit) => matchesUnit(unit, query))),
    countUnitsByStatus: (householdId: string, productIds: readonly string[]) => {
      const counts: Record<UnitStatus, number> = { stock: 0, consumed: 0, discarded: 0 }
      for (const unit of ownUnits(householdId)) {
        if (productIds.includes(unit.productId)) counts[unit.status] += 1
      }
      return Promise.resolve(counts)
    },
  }
}

// ---------- Testdaten-Bausteine ----------

const getreide = { key: 'getreide', name: 'Getreide' }
const nudelnCategory = { id: 'kat-nudeln', name: 'Nudeln', pictogram: '🍝' }
export const reisCategory = { id: 'kat-reis', name: 'Reis', pictogram: '🍚' }

export const spaghettiType = {
  id: 'art-spaghetti',
  name: 'Spaghetti',
  reference: { kcal: 350, protein: 12, carbs: 70, fat: 1.5 },
  typicalShelfLifeMonths: 24,
}

type ProductOptions = Partial<StockProduct> & { id: string }

/** Nudeln 500 g mit Nährwerttabelle 359 kcal je 100 g, Lebensmittelart Spaghetti. */
export function product(options: ProductOptions): StockProduct {
  return {
    name: 'Spaghetti',
    content: { value: 500, unit: 'g' },
    nutrition: {
      values: { kcal: 359, protein: 13, carbs: 71, fat: 1.5 },
      source: 'label',
      confirmedAt: null,
    },
    foodType: spaghettiType,
    category: nudelnCategory,
    group: getreide,
    container: null,
    storageLocation: null,
    ...options,
  }
}

interface UnitOptions {
  status?: UnitStatus
  checkedAt?: string
  kind?: StockProductUnit['kind']
}

let unitCounter = 0

/** Eine Packung. `bestBefore` null heißt „Datum fehlt“. */
export function unit(
  productId: string,
  bestBefore: string | null,
  options: UnitOptions = {},
): StockProductUnit {
  unitCounter += 1
  return {
    id: `einheit-${String(unitCounter)}`,
    productId,
    status: options.status ?? 'stock',
    bestBefore:
      bestBefore === null
        ? null
        : { date: toCalendarDay(bestBefore), precision: 'day', isEstimated: false },
    kind: options.kind ?? 'best-before',
    checkedAt: options.checkedAt === undefined ? null : toCalendarDay(options.checkedAt),
  }
}
