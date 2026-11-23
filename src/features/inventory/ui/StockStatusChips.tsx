import { formatGermanNumber } from '@/shared/lib/quantities'
import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import type { StockFilter } from '../schemas/requests'
import type { InStockCounts } from '../schemas/shared'
import { stockHref } from './stock-paths'

type StockStatusChipsProps = Readonly<{
  filter: StockFilter
  // Zähler in Packungen, immer, auch bei 0 (#221)
  counts: InStockCounts
}>

type ChipStatus = keyof InStockCounts

// Die eine Chip-Reihe über der Liste (UX-Konzept §8.3, P9). Verbraucht und Entsorgt gehören in
// den Verlauf (#119) und stehen deshalb nicht hier.
const STATUS_CHIPS: readonly Readonly<{ status: ChipStatus; label: string }>[] = [
  { status: 'in-stock', label: 'Im Vorrat' },
  { status: 'due-soon', label: 'Bald fällig' },
  { status: 'expired', label: 'Abgelaufen' },
  { status: 'incomplete', label: 'Unvollständig' },
]

// Der Zähler steht im Text des Links und damit in seinem Namen („Unvollständig 2“). Ziffern gleich
// breit, damit die Chips beim Zählen nicht springen.
export function StockStatusChips({ filter, counts }: StockStatusChipsProps) {
  return (
    <ChipRow label="Zustand">
      {STATUS_CHIPS.map(({ status, label }) => (
        <Chip
          key={status}
          href={stockHref({ ...filter, status })}
          isActive={filter.status === status}
        >
          {label} <span className="tabular-nums">{formatGermanNumber(counts[status])}</span>
        </Chip>
      ))}
    </ChipRow>
  )
}
