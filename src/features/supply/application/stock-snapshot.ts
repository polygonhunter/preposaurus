// Gemeinsame Lesepfade für Übersicht und Ziel-Lücke: Bestand mit Rechengrundlage und der Stichtag,
// an dem die Ziel-Lücke zählt (A13). So rechnen Übersicht und Nachkaufen-Liste mit denselben Zahlen.
import 'server-only'
import { loadReadContext, type ReadContext } from '@/features/inventory/application/read-context'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import {
  joinUnits,
  toGroupUnit,
  type JoinedUnit,
} from '@/features/inventory/application/stock-model'
import type { CalendarDay } from '@/shared/lib/dates'
import type { GroupProgress } from '../domain/group-progress'
import type { ReferenceDay } from '../domain/supply-rules'
import type { HouseholdGoal } from './household-facts-reader'
import { coverageOf } from './stock-figures'

export interface HouseholdDay {
  householdId: string
  today: CalendarDay
}

/** Das Zieldatum, wenn es heute oder später ist; ein vergangenes gilt wie keines. */
export function validTargetDay(goal: HouseholdGoal | null, today: CalendarDay): CalendarDay | null {
  const targetDay = goal?.targetDay ?? null
  return targetDay !== null && targetDay >= today ? targetDay : null
}

/** Die Ziel-Lücke zählt am Zieldatum (A13), ohne gültiges Zieldatum heute. */
function gapReference(goal: HouseholdGoal | null, today: CalendarDay): ReferenceDay {
  const targetDay = validTargetDay(goal, today)
  return targetDay === null ? { day: today, kind: 'today' } : { day: targetDay, kind: 'target' }
}

/** Rechengrundlage, Warengruppen und die Packungen im Vorrat samt Produkt. */
export async function loadStockSnapshot(reader: StockReader, { householdId, today }: HouseholdDay) {
  const [context, groups, products, stock] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadGroups(),
    reader.loadProducts(householdId, {}),
    reader.loadUnits(householdId, { statuses: ['stock'] }),
  ])
  return { context, groups, units: joinUnits(stock, products) }
}

/** Abdeckung je Warengruppe am Stichtag der Ziel-Lücke, Grundlage für jede Lücken-Zahl. */
export function progressAtTarget(
  context: ReadContext,
  units: readonly JoinedUnit[],
  goal: HouseholdGoal | null,
): GroupProgress[] {
  return coverageOf({
    basis: context.basis,
    units: units.map(toGroupUnit),
    today: context.today,
    stillGoodCounts: context.stillGoodCounts,
    reference: gapReference(goal, context.today),
  }).progress
}
