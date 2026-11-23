// Rechenweg für das Erklär-Blatt der Übersicht (#219): Bedarf je Personengruppe und die Packungen,
// die heute nicht sicher mitzählen. Gezählt wird in supply/domain, hier nur zusammengesetzt.
import 'server-only'
import type { ReadContext } from '@/features/inventory/application/read-context'
import { calculateDailyNeed } from '../domain/daily-need'
import { breakDownNeed, countPackageCaveats } from '../domain/supply-explanation'
import type { CountableUnit } from '../domain/supply-rules'
import type { ExplanationBasis } from './overview-figures'

export function explanationBasisOf(
  context: ReadContext,
  units: readonly CountableUnit[],
): ExplanationBasis {
  const { members, needs } = context.basis
  const need = calculateDailyNeed(members, needs)
  return {
    kcalPerDay: need.kcalPerDay,
    waterMlPerDay: need.waterMlPerDay,
    needLines: breakDownNeed(members, needs),
    uncountedMembers: need.uncounted.reduce((sum, group) => sum + group.count, 0),
    packages: countPackageCaveats(units, context.today),
    stillGoodCounts: context.stillGoodCounts,
  }
}
