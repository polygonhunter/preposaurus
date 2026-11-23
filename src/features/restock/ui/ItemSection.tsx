import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { RestockItemDto, RestockSuggestionDto } from '../schemas'
import { RestockItemRow } from './RestockItemRow'
import { SuggestionRow } from './SuggestionRow'

type ItemSectionProps = Readonly<{
  id: string
  title: string
  items: readonly RestockItemDto[]
  /** Nur „Ersetzen“: live gerechnete Vorschläge unter den gespeicherten Einträgen (A14) */
  suggestions?: readonly RestockSuggestionDto[]
}>

// Ein Abschnitt der Liste („Ersetzen“, „Eigene“, „Erledigt“). Leer entfällt er.
export function ItemSection({ id, title, items, suggestions = [] }: ItemSectionProps) {
  if (items.length === 0 && suggestions.length === 0) return null
  return (
    <section aria-labelledby={id}>
      <GroupHeader id={id}>{title}</GroupHeader>
      <Group labelledBy={id}>
        {items.map((item) => (
          <RestockItemRow key={item.id} item={item} />
        ))}
        {suggestions.map((suggestion) => (
          <SuggestionRow key={suggestion.rowKey} suggestion={suggestion} />
        ))}
      </Group>
    </section>
  )
}
