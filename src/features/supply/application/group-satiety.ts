// „Satt für“ je Warengruppe auf der Übersicht (#209): kcal der Warengruppe ÷ kcal-Tagesbedarf des
// Haushalts. Das Erklär-Blatt der Warengruppe zeigt damit beide Rechnungen nebeneinander, die
// zweite mit derselben Rechnung wie der Kopf von Vorrat Ebene 2 (calculateNodeTotals).
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import type { NodeUnit } from '../domain/node-totals'
import type { OverviewGroup } from '../schemas'
import { totalsForNodes } from './stock-figures'

type Satiety = OverviewGroup['satiety']

interface SatietyInput {
  units: readonly NodeUnit[]
  need: { kcalPerDay: number; waterMlPerDay: number }
  today: CalendarDay
  stillGoodCounts: boolean
}

/** Je Warengruppe kcal, Tagesbedarf und Tage; ohne Bedarf null. */
export function satietyByGroup(
  input: SatietyInput,
  groupKeys: readonly string[],
): Map<string, Satiety> {
  const nodes = groupKeys.map((key) => ({ level: 'group' as const, key }))
  return new Map(
    totalsForNodes(input, nodes).map(({ node, totals }) => [
      node.key,
      totals.energyDays === null
        ? null
        : {
            kcal: totals.kcal,
            isApproximate: totals.isApproximate,
            kcalPerDay: input.need.kcalPerDay,
            days: totals.energyDays,
          },
    ]),
  )
}
