// Use-Case 4 · Bald fällig (UX-Konzept §8.2, #125, DATENKATALOG `getDueUnits`): Zeitgruppen
// über `timeGroupFor`, gebündelt je Lebensmittelart und Datum. „Datum fehlt“ gehört nicht hierher,
// sondern in den Filter „Unvollständig“ (DATENKATALOG A11). Geladen wird nur bis zur
// Gelb-Schwelle (Teilindex einheit_mhd_vorrat_idx).
import 'server-only'
import { addDays, daysBetween, type CalendarDay } from '@/shared/lib/dates'
import {
  DUE_GROUP_ORDER,
  bundleDueUnits,
  type DueBundle,
  type DueGroup,
} from '../domain/due-bundles'
import { canConfirmStillGood, unitStateFor } from '../domain/unit-state'
import type { DueEntry, DueSort, DueUnits } from '../schemas/due'
import { loadReadContext, type ReadContext } from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, rowKeyOf, rowNameOf, rowTargetOf, type JoinedUnit } from './stock-model'

interface DueInput {
  householdId: string
  today: CalendarDay
  sort: DueSort
}

type DueJoined = JoinedUnit['unit'] & { bundleKey: string; joined: JoinedUnit }

const distinct = (values: readonly (string | null)[]) => [
  ...new Set(values.filter((value) => value !== null)),
]

function toEntry(bundle: DueBundle<DueJoined>, context: ReadContext): DueEntry {
  const joined = bundle.units.map((unit) => unit.joined)
  const product = joined[0]?.product
  if (product === undefined) throw new Error('Ein Bündel hat mindestens eine Packung')
  const date = bundle.bestBefore?.date ?? null
  const state = unitStateFor({ ...context, bestBefore: date })
  return {
    target: rowTargetOf(product),
    name: rowNameOf(product),
    pictogram: product.category.pictogram,
    bestBefore: bundle.bestBefore,
    kind: bundle.kind,
    daysLeft: date === null ? null : daysBetween(context.today, date),
    unitIds: bundle.units.map((unit) => unit.id),
    productNames: distinct(joined.map((entry) => entry.product.name)),
    storageLocations: distinct(joined.map((entry) => entry.product.storageLocation?.name ?? null)),
    canConfirmStillGood: canConfirmStillGood(state, bundle.kind),
  }
}

// Für den Gang durch den Keller: nach Lagerort, ohne Lagerort zuletzt. Sonst bleibt das Datum.
function byLocation(a: DueEntry, b: DueEntry): number {
  const [locationA] = a.storageLocations
  const [locationB] = b.storageLocations
  if (locationA === locationB) return 0
  if (locationA === undefined) return 1
  if (locationB === undefined) return -1
  return locationA.localeCompare(locationB, 'de')
}

function groupEntries(
  bundles: readonly DueBundle<DueJoined>[],
  context: ReadContext,
  sort: DueSort,
) {
  return DUE_GROUP_ORDER.map((group) => {
    const entries = bundles
      .filter((bundle) => bundle.group === group)
      .map((bundle) => toEntry(bundle, context))
    return { group, entries: sort === 'location' ? entries.sort(byLocation) : entries }
  }).filter(({ entries }) => entries.length > 0)
}

function countPackages(bundles: readonly DueBundle<DueJoined>[]): Record<DueGroup, number> {
  const counts = Object.fromEntries(DUE_GROUP_ORDER.map((group) => [group, 0])) as Record<
    DueGroup,
    number
  >
  for (const bundle of bundles) counts[bundle.group] += bundle.units.length
  return counts
}

export async function getDueUnits(
  reader: StockReader,
  { householdId, today, sort }: DueInput,
): Promise<DueUnits> {
  const context = await loadReadContext(reader, householdId, today)
  const dueUntil = addDays(today, context.thresholds.soonDays)
  // Erst die fälligen Packungen, dann nur deren Produkte (#141), nicht den ganzen Vorrat
  const stock = await reader.loadUnits(householdId, { statuses: ['stock'], dueUntil })
  const productIds = [...new Set(stock.map((unit) => unit.productId))]
  const products = await reader.loadProducts(householdId, { productIds })
  const units = joinUnits(stock, products).map((joined) => ({
    ...joined.unit,
    bundleKey: rowKeyOf(joined.product),
    joined,
  }))
  const bundles = bundleDueUnits(units, context)
  return {
    thresholds: context.thresholds,
    counts: countPackages(bundles),
    groups: groupEntries(bundles, context, sort),
  }
}
