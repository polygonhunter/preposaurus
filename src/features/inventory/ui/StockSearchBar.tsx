import Form from 'next/form'
import { SHORTCUT_KEYS } from '@/shared/lib/keyboard-shortcuts'
import { SearchField } from '@/shared/ui/SearchField'
import type { StockFilter } from '../schemas/requests'
import type { StockSearch } from '../schemas/stock'
import { FilterSheet } from './FilterSheet'
import { STOCK_PARAMS, STOCK_PATH, statusSlug } from './stock-paths'

type StockSearchBarProps = Readonly<{
  filter: StockFilter
  // Behälter und Lagerort für das Filter-Blatt
  options: StockSearch['options']
}>

// Suchfeld über der Liste (UX-Konzept §8.3, Muster C). Die Suche steht in der Adresse, aktive
// Filter laufen als versteckte Felder mit. Der Knopf „Filter“ öffnet das Blatt daneben, nicht im
// Formular, weil ein Formular im Formular nicht erlaubt ist.
export function StockSearchBar({ filter, options }: StockSearchBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 pt-2 breit:px-6">
      <Form action={STOCK_PATH} role="search" className="min-w-0 flex-1">
        <SearchField
          label="Vorrat durchsuchen"
          name={STOCK_PARAMS.search}
          defaultValue={filter.search ?? ''}
          placeholder="Lebensmittel suchen"
          enterKeyHint="search"
          shortcut={SHORTCUT_KEYS.search}
        />
        {filter.status === 'in-stock' ? null : (
          <input type="hidden" name={STOCK_PARAMS.status} value={statusSlug(filter.status)} />
        )}
        {filter.containerId ? (
          <input type="hidden" name={STOCK_PARAMS.containerId} value={filter.containerId} />
        ) : null}
        {filter.storageLocationId ? (
          <input
            type="hidden"
            name={STOCK_PARAMS.storageLocationId}
            value={filter.storageLocationId}
          />
        ) : null}
      </Form>
      <FilterSheet filter={filter} options={options} />
    </div>
  )
}
