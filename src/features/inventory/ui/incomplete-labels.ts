// Grund je Zeile im Filter „Unvollständig“ (#221, UX-Konzept §4): sagt ruhig, was fehlt, statt nur
// „2 Packungen unvollständig“. Die Gründe und ihre Reihenfolge kommen aus der Fachlogik.
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { IncompleteReasonDto } from '../schemas/shared'
import type { StockSearchRow } from '../schemas/stock'

const REASON_LABELS: Record<IncompleteReasonDto, string> = {
  'nutrition-missing': 'Nährwerte fehlen',
  'date-missing': 'Datum fehlt',
  'estimate-unconfirmed': 'Schätzung bestätigen',
}

/**
 * „Datum fehlt“, wenn es alle Packungen der Zeile betrifft, sonst „Datum fehlt (1 von 3)“. Mehrere
 * Gründe stehen mit „·“ hintereinander. Ohne Grund null.
 */
export function incompleteNote({
  incomplete,
  packagesInStock,
}: Pick<StockSearchRow, 'incomplete' | 'packagesInStock'>): string | null {
  if (incomplete.length === 0) return null
  return incomplete
    .map(({ reason, packages }) => {
      const label = REASON_LABELS[reason]
      if (packages >= packagesInStock) return label
      return `${label} (${formatGermanNumber(packages)} von ${formatGermanNumber(packagesInStock)})`
    })
    .join(' · ')
}
