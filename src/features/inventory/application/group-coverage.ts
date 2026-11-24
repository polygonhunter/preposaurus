// Abdeckung „Menge reicht X von Y Tagen“ je Warengruppe für die Lesepfade des Vorrats (#209):
// Ebene 1, Kopf von Ebene 2 und die Liste neben dem Detail nennen dieselbe Zahl wie die Übersicht.
// Gerechnet wird in supply/domain (über `coverageOf`), hier wird nur ins DTO übertragen.
import 'server-only'
import { coverageOf, type GroupCoverage } from '@/features/supply/application/stock-figures'
import type { CoverageDto } from '../schemas/shared'
import type { ReadContext } from './read-context'
import { toGroupUnit, type JoinedUnit } from './stock-model'

/** Abdeckung aller Warengruppen mit Ziel am heutigen Tag. Ohne Ziel oder Quelle leer. */
export function coverageToday(context: ReadContext, units: readonly JoinedUnit[]): GroupCoverage {
  return coverageOf({
    basis: context.basis,
    units: units.map(toGroupUnit),
    today: context.today,
    stillGoodCounts: context.stillGoodCounts,
  })
}

/** Abdeckung einer Warengruppe, null ohne Ziel, ohne Quelle oder ohne Zielmenge für sie. */
export function coverageFor(coverage: GroupCoverage, groupKey: string): CoverageDto | null {
  const progress = coverage.progress.find((entry) => entry.groupKey === groupKey)
  if (progress === undefined) return null
  const { unit, stock, target, days, goalDays, percent } = progress
  return { unit, stock, target, days, goalDays, percent }
}
