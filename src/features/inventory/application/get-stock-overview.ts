// Use-Case 1 · Vorrat Ebene 1 (UX-Konzept §8.3, DATENKATALOG `getGroupLevel`): je Warengruppe
// die Summen aus `calculateNodeTotals` und die Abdeckung „X von Y Tagen“. Leere Warengruppen
// bleiben stehen, denn die Lücke ist eine Information.
import 'server-only'
import { coverageOf, type GroupCoverage } from '@/features/supply/application/stock-figures'
import type { CalendarDay } from '@/shared/lib/dates'
import type { StockOverview } from '../schemas'
import { loadReadContext, totalsByNode, totalsOf } from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, toGroupUnit } from './stock-model'

interface OverviewInput {
  householdId: string
  today: CalendarDay
}

type CoverageDto = StockOverview['groups'][number]['coverage']

function coverageFor(coverage: GroupCoverage, groupKey: string): CoverageDto {
  const progress = coverage.progress.find((entry) => entry.groupKey === groupKey)
  if (progress === undefined) return null
  const { unit, stock, target, days, goalDays, percent } = progress
  const isTightest = coverage.tightestGroupKey === groupKey
  return { unit, stock, target, days, goalDays, percent, isTightest }
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
  const coverage = coverageOf({
    basis: context.basis,
    units: units.map(toGroupUnit),
    today,
    stillGoodCounts: context.stillGoodCounts,
  })
  return {
    groups: groups.map(({ key, name }) => ({
      key,
      name,
      totals: totalsOf(totals, { level: 'group', key }),
      coverage: coverageFor(coverage, key),
    })),
    goalDays: context.basis.goalDays,
  }
}
