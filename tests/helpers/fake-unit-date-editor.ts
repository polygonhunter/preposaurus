// Fake des Ports `UnitDateEditor` für die Use-Case-Tests von „Datum ändern“ (#49, ohne DB). Wie
// das echte Repository antwortet er nur für den eigenen Haushalt und nur für Packungen im Vorrat.
// Alle Werte sind frei gewählte Testdaten.
import type { StockProductUnit } from '../../src/features/inventory/domain/stock-entry'
import type { StockUnit } from '../../src/features/inventory/domain/unit'

interface FakeProduct {
  id: string
  name: string
  foodType: { id: string; name: string } | null
}

interface FakeData {
  householdId: string
  products: FakeProduct[]
  units: StockProductUnit[]
}

export function createFakeUnitDateEditor(data: FakeData) {
  const units = data.units.map((unit) => ({ ...unit }))
  const own = (householdId: string) => householdId === data.householdId
  const inStock = (householdId: string) =>
    own(householdId) ? units.filter((unit) => unit.status === 'stock') : []
  return {
    units,
    loadSource: (householdId: string, unitId: string) => {
      const found = own(householdId) ? units.find((unit) => unit.id === unitId) : undefined
      const product = data.products.find((candidate) => candidate.id === found?.productId)
      if (product === undefined) return Promise.resolve(null)
      const stockUnits = inStock(householdId).filter((unit) => unit.productId === product.id)
      return Promise.resolve({ product, stockUnits })
    },
    loadStockUnits: (householdId: string, unitIds: readonly string[]) =>
      Promise.resolve(inStock(householdId).filter((unit) => unitIds.includes(unit.id))),
    saveDates: (householdId: string, changed: readonly StockUnit[]) => {
      let count = 0
      for (const next of changed) {
        const stored = inStock(householdId).find((unit) => unit.id === next.id)
        if (stored === undefined) continue
        Object.assign(stored, { bestBefore: next.bestBefore, checkedAt: next.checkedAt })
        count += 1
      }
      return Promise.resolve(count)
    },
  }
}
