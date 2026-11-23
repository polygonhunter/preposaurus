import { dateEntryKey, dateEntryLabel } from '../domain/date-entries'
import { MAX_COUNT_PER_DATE } from '../schemas/stock'
import type { PhotoDateEntry } from './photo-capture-state'

type QuickCountsProps = Readonly<{
  units: readonly PhotoDateEntry[]
  onChange: (units: PhotoDateEntry[]) => void
}>

const QUICK_COUNTS = [2, 3, 4, 6, 12] as const

// Schnellzahlen für ein Datum (UX §8.5, F1): Wer zehn gleiche Packungen hat,
// fotografiert eine und tippt „12“, statt jede einzeln aufzunehmen.
export function QuickCounts({ units, onChange }: QuickCountsProps) {
  // Das späteste Datum, sonst „Datum fehlt“: Meist sind alle Packungen gleich alt.
  const target = units.findLast((entry) => entry.bestBefore !== null) ?? units.at(-1)
  if (target === undefined) return null
  const label = dateEntryLabel(target)
  const key = dateEntryKey(target)
  return (
    <div className="mx-4 flex flex-wrap items-center gap-2 pt-3 breit:mx-6">
      <span className="text-footnote text-fg2">Anzahl für {label}:</span>
      {QUICK_COUNTS.filter((count) => count <= MAX_COUNT_PER_DATE).map((count) => (
        <button
          key={count}
          type="button"
          aria-label={`${String(count)} Packungen mit ${label}`}
          aria-pressed={target.count === count}
          onClick={() => {
            onChange(
              units.map((entry) => (dateEntryKey(entry) === key ? { ...entry, count } : entry)),
            )
          }}
          className="touch-target min-w-11 rounded-full bg-fill px-3 py-1.5 text-callout font-semibold text-accent aria-pressed:bg-fg aria-pressed:text-bg"
        >
          {count}
        </button>
      ))}
    </div>
  )
}
