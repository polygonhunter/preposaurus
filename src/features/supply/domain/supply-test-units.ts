import { toCalendarDay } from '@/shared/lib/dates'
import type { SupplyUnit } from './supply-days'

interface TestUnitOptions {
  kcal?: number
  waterMl?: number
  status?: SupplyUnit['status']
  isKcalEstimated?: boolean
  isBestBeforeEstimated?: boolean
  checkedAt?: string
}

/** Baut Einheiten für die Tests der Rechnung. Alle Zahlen sind frei gewählte Testwerte. */
export function supplyUnit(id: string, bestBefore: string, options: TestUnitOptions = {}) {
  return {
    id,
    status: options.status ?? 'stock',
    bestBefore: {
      date: toCalendarDay(bestBefore),
      precision: 'day',
      isEstimated: options.isBestBeforeEstimated ?? false,
    },
    checkedAt: options.checkedAt === undefined ? null : toCalendarDay(options.checkedAt),
    kcal: options.kcal ?? 0,
    isKcalEstimated: options.isKcalEstimated ?? false,
    waterMl: options.waterMl ?? 0,
  } satisfies SupplyUnit
}

/** n gleiche Einheiten mit fortlaufender ID. */
export function supplyUnits(
  count: number,
  prefix: string,
  make: (id: string) => SupplyUnit,
): SupplyUnit[] {
  return Array.from({ length: count }, (_, index) => make(`${prefix}-${String(index + 1)}`))
}
