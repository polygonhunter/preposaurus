import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { RestockItemDto } from '../schemas'
import { RestockItemRow } from './RestockItemRow'

type ItemSectionProps = Readonly<{ id: string; title: string; items: readonly RestockItemDto[] }>

// Ein Abschnitt gespeicherter Einträge („Ersetzen“, „Eigene“, „Erledigt“). Leer entfällt er.
export function ItemSection({ id, title, items }: ItemSectionProps) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby={id}>
      <GroupHeader id={id}>{title}</GroupHeader>
      <Group labelledBy={id}>
        {items.map((item) => (
          <RestockItemRow key={item.id} item={item} />
        ))}
      </Group>
    </section>
  )
}
