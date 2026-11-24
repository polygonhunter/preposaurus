import { useId } from 'react'
import { toPercent } from '@/shared/lib/scale'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { ShelfLifeColumn } from './detail-view'
import { STATE_BADGE, formatPackages } from './stock-format'

type ShelfLifeChartProps = Readonly<{ columns: readonly ShelfLifeColumn[] }>

// Haltbarkeits-Diagramm (DESIGN_SYSTEM §7 „Detail“): eine Säule je MHD, Höhe nach Packungen.
// Als Liste ausgezeichnet, damit Screenreader Datum, Anzahl und Zustand vorlesen. Die Säule
// selbst ist Schmuck. Viele Daten scrollen waagerecht; dann muss die Fläche per Tastatur erreichbar
// sein (WCAG 2.1.1, axe „scrollable-region-focusable“), sonst ließe sie sich ohne Maus nicht rollen.
export function ShelfLifeChart({ columns }: ShelfLifeChartProps) {
  const headingId = useId()
  const max = Math.max(...columns.map((column) => column.count), 1)
  return (
    <section>
      <GroupHeader id={headingId}>Haltbarkeit</GroupHeader>
      <ol
        aria-labelledby={headingId}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- weil die Liste waagerecht rollt und ohne Fokus per Tastatur nicht erreichbar wäre
        tabIndex={0}
        className="mx-4 flex gap-3 overflow-x-auto rounded-group bg-surface px-4 pt-3 pb-2.5 [scrollbar-width:none] focus-visible:outline-offset-2 breit:mx-6 breit:border breit:border-line"
      >
        {columns.map((column) => (
          <li key={column.key} className="flex min-w-14 flex-1 flex-col items-center gap-1">
            <span className="text-footnote font-semibold">{column.count}×</span>
            <span aria-hidden="true" className="flex h-20 w-6 items-end">
              <span
                className="w-full rounded-t-[4px] bg-bar"
                style={{ height: `${String(Math.max(toPercent(column.count, max), 4))}%` }}
              />
            </span>
            <span className="text-center text-caption whitespace-nowrap text-fg2">
              {column.label}
            </span>
            <span className="sr-only">
              {`${formatPackages(column.count)}, ${STATE_BADGE[column.state].label}`}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
