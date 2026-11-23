import Link from 'next/link'
import { Icon } from '@/shared/ui/Icon'
import type { StockFilter } from '../schemas/requests'
import type { StockSearch } from '../schemas/stock'
import { stockHref } from './stock-paths'

type ActiveFiltersProps = Readonly<{ filter: StockFilter; options: StockSearch['options'] }>

const nameOf = (list: StockSearch['options']['containers'], id: string | undefined) =>
  id === undefined ? null : (list.find((entry) => entry.id === id)?.name ?? null)

// Aktive Filter aus dem Blatt als entfernbare Marken unter der Chip-Reihe (UX-Konzept P9).
// Bewusst keine zweite Chip-Reihe: nur Links, die den einen Filter aus der Adresse nehmen.
export function ActiveFilters({ filter, options }: ActiveFiltersProps) {
  const active = [
    {
      label: nameOf(options.containers, filter.containerId),
      href: stockHref({ ...filter, containerId: undefined }),
    },
    {
      label: nameOf(options.storageLocations, filter.storageLocationId),
      href: stockHref({ ...filter, storageLocationId: undefined }),
    },
  ].filter((entry) => entry.label !== null)
  if (active.length === 0) return null
  return (
    <ul aria-label="Aktive Filter" className="flex flex-wrap gap-2 px-4 pt-1 breit:px-6">
      {active.map(({ label, href }) => (
        <li key={href}>
          <Link
            href={href}
            aria-label={`Filter ${String(label)} entfernen`}
            className="touch-target inline-flex items-center gap-1 rounded-full bg-fill px-3 py-1 text-footnote font-semibold text-accent"
          >
            {label}
            <Icon name="close" size={14} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
