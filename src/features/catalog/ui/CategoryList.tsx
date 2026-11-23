import { categoryPath } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { CategoryEntry, ProductGroup } from '../domain/category'
import { categorySummary } from './catalog-labels'

type CategoryListProps = Readonly<{
  groups: readonly ProductGroup[]
  categories: readonly CategoryEntry[]
}>

// Kategorien je Warengruppe (#76), System und eigene gemischt in ihrer Reihenfolge. Jede Zeile führt
// zur Kategorie mit ihren Lebensmittelarten; ob dort etwas geändert werden kann, regelt die Seite.
export function CategoryList({ groups, categories }: CategoryListProps) {
  return groups.map((group) => {
    const inGroup = categories.filter((category) => category.productGroupId === group.id)
    if (inGroup.length === 0) return null
    const headerId = `warengruppe-${group.id}`
    return (
      <section key={group.id} aria-labelledby={headerId}>
        <GroupHeader id={headerId}>{group.name}</GroupHeader>
        <Group labelledBy={headerId}>
          {inGroup.map((category) => (
            <Row
              key={category.id}
              title={category.name}
              subtitle={categorySummary(category)}
              action={{ href: categoryPath(category.id) }}
            />
          ))}
        </Group>
      </section>
    )
  })
}
