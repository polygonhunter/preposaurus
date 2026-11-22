// Laufzeit der Lesepfade ohne Datenbank (#141): 5000 Produkte in 2000 Lebensmittelarten, 30.000
// Packungen. Vorher lief jede Zeile und jede Kategorie über alle Packungen (Zeilen × Packungen),
// das kostete mehrere Sekunden. Vorgruppiert bleibt es weit unter der Grenze, auch mit Coverage
// und parallelen Testdateien. Gemessen wird der schnellste von drei Läufen.
import { describe, expect, it } from 'vitest'
import { addDays, toCalendarDay } from '@/shared/lib/dates'
import { createFakeStockReader, product, unit } from '../../../../tests/helpers/fake-stock-reader'
import { getDueUnits } from './get-due-units'
import { getFoodTypeDetail } from './get-food-type-detail'
import { getFoodTypeLevel } from './get-food-type-level'
import { getStockOverview } from './get-stock-overview'
import { searchStock } from './search-stock'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-gross'
const PRODUCTS = 5000
const FOOD_TYPES = 2000
const CATEGORIES = 100
const UNITS_PER_PRODUCT = 6
const LIMIT_MS = 500
const RUNS = 3

function largeProduct(index: number) {
  const type = index % FOOD_TYPES
  return product({
    id: `produkt-${String(index)}`,
    name: `Produkt ${String(index)}`,
    foodType: {
      id: `art-${String(type)}`,
      name: `Art ${String(type)}`,
      reference: { kcal: 350, protein: 12, carbs: 70, fat: 1.5 },
      typicalShelfLifeMonths: 24,
    },
    category: { id: `kat-${String(type % CATEGORIES)}`, name: 'Kategorie', pictogram: null },
  })
}

// Rund jede siebte Packung ohne Datum, die übrigen über drei Jahre um den Stichtag gestreut
function largeUnit(productIndex: number, packageIndex: number) {
  const spread = (productIndex * 7919 + packageIndex * 104_729) % 1100
  const date = spread % 7 === 0 ? null : addDays(toCalendarDay('2026-01-01'), spread)
  return unit(`produkt-${String(productIndex)}`, date)
}

const indices = (count: number) => Array.from({ length: count }, (_, index) => index)
const reader = createFakeStockReader({
  householdId,
  products: indices(PRODUCTS).map(largeProduct),
  units: indices(PRODUCTS).flatMap((productIndex) =>
    indices(UNITS_PER_PRODUCT).map((packageIndex) => largeUnit(productIndex, packageIndex)),
  ),
})

async function fastestRun(run: () => Promise<unknown>): Promise<number> {
  await run() // Aufwärmen: JIT
  let fastest = Number.POSITIVE_INFINITY
  for (let attempt = 0; attempt < RUNS; attempt += 1) {
    const start = performance.now()
    await run()
    fastest = Math.min(fastest, performance.now() - start)
  }
  return fastest
}

const detailTarget = { kind: 'food-type', id: 'art-1' } as const

describe('Lesepfade mit großem Haushalt (ohne Datenbank)', () => {
  it.each([
    ['Ebene 1', () => getStockOverview(reader, { householdId, today })],
    ['Ebene 2', () => getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' })],
    ['Detail', () => getFoodTypeDetail(reader, { householdId, today, target: detailTarget })],
    ['Suche', () => searchStock(reader, { householdId, today, filter: { status: 'in-stock' } })],
    ['Bald fällig', () => getDueUnits(reader, { householdId, today, sort: 'date' })],
  ])('%s bleibt unter der Grenze', async (_name, run) => {
    expect(await fastestRun(run)).toBeLessThan(LIMIT_MS)
  })
})
