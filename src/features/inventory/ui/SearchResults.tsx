import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import type { StockFilter, StockSearch } from '../schemas'
import { formatPackages } from './stock-format'
import { STOCK_PATH } from './stock-paths'
import { StockRowItem } from './StockRowItem'

type SearchResultsProps = Readonly<{ filter: StockFilter; groups: StockSearch['groups'] }>

const MATCH_WORD: Record<StockFilter['status'], string | null> = {
  'in-stock': null,
  'due-soon': 'bald fällig',
  expired: 'abgelaufen',
  incomplete: 'unvollständig',
  consumed: 'verbraucht',
  discarded: 'entsorgt',
}

function noteFor(status: StockFilter['status'], matching: number): string | undefined {
  const word = MATCH_WORD[status]
  return word === null ? undefined : `${formatPackages(matching)} ${word}`
}

// Treffermodus (UX-Konzept §8.3, Muster B): flache Liste der Lebensmittelarten, gegliedert nach
// Warengruppe, mit derselben Zeile wie auf Ebene 2.
export function SearchResults({ filter, groups }: SearchResultsProps) {
  if (groups.length === 0) {
    const text = filter.search
      ? `Nichts gefunden für „${filter.search}“.`
      : 'Dazu passt gerade nichts im Vorrat.'
    return <EmptyState text={text} action={{ href: STOCK_PATH, label: 'Filter zurücksetzen' }} />
  }
  return groups.map((group) => {
    const headingId = `treffer-${group.key}`
    return (
      <section key={group.key}>
        <GroupHeader id={headingId}>{group.shortName}</GroupHeader>
        <Group labelledBy={headingId}>
          {group.rows.map((row) => (
            <StockRowItem
              key={`${row.target.kind}:${row.target.id}`}
              row={row}
              note={noteFor(filter.status, row.matchingPackages)}
            />
          ))}
        </Group>
      </section>
    )
  })
}
