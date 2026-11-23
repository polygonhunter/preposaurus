// „Heute versorgt“ als zwei Zahlen, Essen und Wasser, gerechnet wie der Kopf der Übersicht
// (calculateSupplyDays am heutigen Tag). Die Erfassung ruft das vor und nach dem Speichern auf und
// sagt dann „Euer Essen reicht jetzt X statt Y Tage“ (#231).
import 'server-only'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import { stockServices } from '@/features/inventory/application/stock-services'
import { toNodeUnit } from '@/features/inventory/application/stock-model'
import { calculateSupplyDays } from '../domain/supply-days'
import { dailyNeedOf } from './stock-figures'
import { loadStockSnapshot, type HouseholdDay } from './stock-snapshot'

/** Tage, eine Nachkommastelle abgerundet, wie an den Balken der Übersicht. */
export interface SupplyDaysNow {
  energyDays: number
  waterDays: number
}

/**
 * Ohne Bedarf (keine Mitglieder oder keine Quelle) gibt es keine Tage: null.
 * @internal Die App ruft loadSupplyDaysNow, Tests rufen diese Funktion mit eigenem Reader auf.
 */
export async function getSupplyDaysNow(
  reader: StockReader,
  input: HouseholdDay,
): Promise<SupplyDaysNow | null> {
  const { context, units } = await loadStockSnapshot(reader, input)
  const result = calculateSupplyDays({
    units: units.map(toNodeUnit),
    need: dailyNeedOf(context.basis),
    reference: { day: input.today, kind: 'today' },
    stillGoodCounts: context.stillGoodCounts,
  })
  if (!result.ok) return null
  return { energyDays: result.value.energyDays, waterDays: result.value.waterDays }
}

/** Mit echten Repositories und dem Stichtag in Berlin. */
export async function loadSupplyDaysNow(householdId: string): Promise<SupplyDaysNow | null> {
  const { reader, today } = await stockServices()
  return getSupplyDaysNow(reader, { householdId, today })
}
