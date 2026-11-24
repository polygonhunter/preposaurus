import Link from 'next/link'
import { formatGermanNumber } from '@/shared/lib/quantities'
import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { Icon } from '@/shared/ui/Icon'
import { HISTORY_PERIODS, type HistoryFilter, type HistoryPage } from '../schemas/history'
import { PERIOD_LABEL } from './history-labels'
import { historyHref } from './history-paths'

type HistoryFiltersProps = Readonly<{
  filter: HistoryFilter
  counts: HistoryPage['counts']
  target: HistoryPage['target']
}>

const OUTCOME_CHIPS = [
  { outcome: undefined, label: 'Alle' },
  { outcome: 'consumed', label: 'Verbraucht' },
  { outcome: 'discarded', label: 'Entsorgt' },
] as const

// Filter des Verlaufs (#48): Ausgang mit Zählern in Packungen im gewählten Zeitraum, darunter der
// Zeitraum. Eine gewählte Lebensmittelart steht als entfernbare Marke darunter (wie ActiveFilters).
export function HistoryFilters({ filter, counts, target }: HistoryFiltersProps) {
  const { outcome: selected, period } = filter
  const countOf = (outcome: HistoryFilter['outcome']) =>
    outcome === undefined ? counts.consumed + counts.discarded : counts[outcome]
  return (
    <>
      <ChipRow label="Ausgang">
        {OUTCOME_CHIPS.map(({ outcome, label }) => (
          <Chip
            key={label}
            href={historyHref({ target: filter.target, period, outcome })}
            isActive={selected === outcome}
          >
            {label} <span className="tabular-nums">{formatGermanNumber(countOf(outcome))}</span>
          </Chip>
        ))}
      </ChipRow>
      <ChipRow label="Zeitraum">
        {HISTORY_PERIODS.map((value) => (
          <Chip
            key={value}
            href={historyHref({ ...filter, period: value })}
            isActive={period === value}
          >
            {PERIOD_LABEL[value]}
          </Chip>
        ))}
      </ChipRow>
      {target === null ? null : (
        <div className="px-4 pt-1 breit:px-6">
          <Link
            href={historyHref({ outcome: selected, period })}
            aria-label={`Nur ${target.name}, Filter entfernen`}
            className="touch-target inline-flex items-center gap-1 rounded-full bg-fill px-3 py-1 text-footnote font-semibold text-accent"
          >
            Nur {target.name}
            <Icon name="close" size={14} />
          </Link>
        </div>
      )}
    </>
  )
}
