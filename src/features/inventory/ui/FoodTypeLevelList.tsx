import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { FoodTypeLevel, StockTarget } from '../schemas'
import { stockLine } from './stock-format'
import { CAPTURE_PATH, categoryAnchor } from './stock-paths'
import { isSameTarget } from './stock-table'
import { StockRowItem } from './StockRowItem'

type FoodTypeLevelListProps = Readonly<{
  categories: FoodTypeLevel['categories']
  // Zeile, deren Detail daneben steht (M12-03)
  selected?: StockTarget | null
  // Schmal neben dem Detail: ohne Sprungchips und ohne Summe je Kategorie
  isCompact?: boolean
}>

// Ebene 2 (UX-Konzept §8.3): Kategorien als Zwischenüberschrift mit Summe, darunter direkt die
// Lebensmittelarten. Die Sprungchips scrollen nur und blenden nichts aus. Bei einer Kategorie
// entfallen sie.
export function FoodTypeLevelList({
  categories,
  selected = null,
  isCompact = false,
}: FoodTypeLevelListProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        text="In dieser Warengruppe liegt noch nichts."
        action={{ href: CAPTURE_PATH, label: 'Produkt erfassen' }}
      />
    )
  }
  return (
    <>
      {categories.length > 1 && !isCompact ? (
        <ChipRow label="Zu Kategorie springen">
          {categories.map((category) => (
            <Chip key={category.id} href={`#${categoryAnchor(category.id)}`}>
              {category.name}
            </Chip>
          ))}
        </ChipRow>
      ) : null}
      {categories.map((category) => (
        <section key={category.id} className="scroll-mt-4">
          <GroupHeader
            id={categoryAnchor(category.id)}
            trailing={isCompact ? null : stockLine(category.totals)}
          >
            {category.name}
          </GroupHeader>
          <Group labelledBy={categoryAnchor(category.id)}>
            {category.rows.map((row) => (
              <StockRowItem
                key={`${row.target.kind}:${row.target.id}`}
                row={row}
                isSelected={isSameTarget(row.target, selected)}
              />
            ))}
          </Group>
        </section>
      ))}
    </>
  )
}
