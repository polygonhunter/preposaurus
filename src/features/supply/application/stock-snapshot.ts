// Gemeinsame Lesepfade für Übersicht und Ziel-Lücke: Bestand mit Rechengrundlage und der Stichtag,
// an dem die Ziel-Lücke zählt (A13). So rechnen Übersicht und Nachkaufen-Liste mit denselben Zahlen.
import 'server-only'
import { loadReadContext } from '@/features/inventory/application/read-context'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import { joinUnits } from '@/features/inventory/application/stock-model'
import type { CalendarDay } from '@/shared/lib/dates'
import type { ReferenceDay } from '../domain/supply-rules'
import type { HouseholdGoal } from './household-facts-reader'

export interface HouseholdDay {
  householdId: string
  today: CalendarDay
}

/** Die Ziel-Lücke zählt am Zieldatum (A13), ohne gültiges Zieldatum heute. */
export function gapReference(goal: HouseholdGoal | null, today: CalendarDay): ReferenceDay {
  const targetDay = goal?.targetDay ?? null
  return targetDay !== null && targetDay >= today
    ? { day: targetDay, kind: 'target' }
    : { day: today, kind: 'today' }
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
