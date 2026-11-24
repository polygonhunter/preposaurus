// Use-Case 1 · Vorrat Ebene 1 (UX-Konzept §8.3, DATENKATALOG `getGroupLevel`): je Warengruppe
// die Summen aus `calculateNodeTotals` und die Abdeckung „X von Y Tagen“. Leere Warengruppen
// bleiben stehen, denn die Lücke ist eine Information. Dazu die Zähler der Zustands-Chips aus
// denselben Packungen (#221).
import 'server-only'
import type { GroupCoverage } from '@/features/supply/application/stock-figures'
import type { CalendarDay } from '@/shared/lib/dates'
import { countByStatusFilter } from '../domain/stock-filter'
import type { StockOverview } from '../schemas/stock'
import { coverageFor, coverageToday } from './group-coverage'
import { loadReadContext, totalsByNode, totalsOf } from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, toFilterableUnit } from './stock-model'

interface OverviewInput {
  householdId: string
  today: CalendarDay
}

type CoverageDto = StockOverview['groups'][number]['coverage']

function withTightest(coverage: GroupCoverage, groupKey: string): CoverageDto {
  const figures = coverageFor(coverage, groupKey)
  return figures === null
    ? null
    : { ...figures, isTightest: coverage.tightestGroupKey === groupKey }
}

export async function getStockOverview(
  reader: StockReader,
  { householdId, today }: OverviewInput,
): Promise<StockOverview> {
  const [context, groups, products, stock] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadGroups(),
    reader.loadProducts(householdId, {}),
    reader.loadUnits(householdId, { statuses: ['stock'] }),
  ])
  const units = joinUnits(stock, products)
  const nodes = groups.map(({ key }) => ({ level: 'group' as const, key }))
  const totals = totalsByNode(context, units, nodes)
  const coverage = coverageToday(context, units)
  return {
    groups: groups.map(({ key, name, shortName }) => ({
      key,
      name,
      shortName,
      totals: totalsOf(totals, { level: 'group', key }),
      coverage: withTightest(coverage, key),
    })),
    goalDays: context.basis.goalDays,
    counts: countByStatusFilter(units.map(toFilterableUnit), context),
  }
}
