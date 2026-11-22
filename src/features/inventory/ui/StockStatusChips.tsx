import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import type { StockFilter, StockSearch } from '../schemas'
import { stockHref } from './stock-paths'

type StockStatusChipsProps = Readonly<{
  filter: StockFilter
  // Zähler in Packungen, nur im Treffermodus bekannt
  counts?: StockSearch['counts'] | undefined
}>

type StockStatus = StockFilter['status']

// Die eine Chip-Reihe über der Liste (UX-Konzept §8.3, P9). Verbraucht und Entsorgt gehören in
// den Verlauf (#119) und stehen deshalb nicht hier.
const STATUS_CHIPS: readonly Readonly<{ status: StockStatus; label: string }>[] = [
  { status: 'in-stock', label: 'Im Vorrat' },
  { status: 'due-soon', label: 'Bald fällig' },
  { status: 'expired', label: 'Abgelaufen' },
  { status: 'incomplete', label: 'Unvollständig' },
]

export function StockStatusChips({ filter, counts }: StockStatusChipsProps) {
  return (
    <ChipRow label="Zustand">
      {STATUS_CHIPS.map(({ status, label }) => (
        <Chip
          key={status}
          href={stockHref({ ...filter, status })}
          isActive={filter.status === status}
        >
          {counts === undefined ? label : `${label} ${String(counts[status])}`}
        </Chip>
      ))}
    </ChipRow>
  )
}
