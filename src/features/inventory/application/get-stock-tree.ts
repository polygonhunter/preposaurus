// Vorrat als Baum für die breiten Ansichten (M12-03, M12-04): alle Warengruppen mit ihren
// Kategorien und Zeilen, wie Ebene 2 sie je Gruppe zeigt. Ab „breit“ steht daraus die Liste der
// Warengruppe neben dem Detail, ab „weit“ die Tabelle über alle Warengruppen. Gerechnet wird wie
// auf Ebene 2, nur in einem Durchgang über den ganzen Vorrat.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import type { StockTree } from '../schemas/stock'
import { coverageFor, coverageToday } from './group-coverage'
import { loadReadContext, totalsByNode, totalsOf } from './read-context'
import { categoriesOf } from './stock-categories'
import type { StockReader } from './stock-reader'
import { joinUnits } from './stock-model'
import { buildRows, groupByKey } from './stock-rows'

interface TreeInput {
  householdId: string
  today: CalendarDay
}

export async function getStockTree(
  reader: StockReader,
  { householdId, today }: TreeInput,
): Promise<StockTree> {
  const [context, groups, products, stock] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadGroups(),
    reader.loadProducts(householdId, {}),
    reader.loadUnits(householdId, { statuses: ['stock'] }),
  ])
  const units = joinUnits(stock, products)
  const rows = buildRows({ context, products, stockUnits: units })
  const rowsByGroup = groupByKey(rows, ({ product }) => product.group.key)
  const unitsByGroup = groupByKey(units, ({ product }) => product.group.key)
  const nodes = groups.map(({ key }) => ({ level: 'group' as const, key }))
  const groupTotals = totalsByNode(context, units, nodes)
  const coverage = coverageToday(context, units)
  return {
    groups: groups.map((group) => ({
      group: {
        ...group,
        totals: totalsOf(groupTotals, { level: 'group', key: group.key }),
        coverage: coverageFor(coverage, group.key),
      },
      categories: categoriesOf(
        context,
        rowsByGroup.get(group.key) ?? [],
        unitsByGroup.get(group.key) ?? [],
      ),
    })),
  }
}
