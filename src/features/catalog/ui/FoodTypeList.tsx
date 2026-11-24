import { foodTypePath } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { moveFoodTypeAction } from '../actions/move-food-type-action'
import type { FoodTypeEntry } from '../domain/category'
import { foodTypeSummary } from './catalog-labels'
import { MoveButtons } from './MoveButtons'
import { SortableArea } from './SortableArea'

type FoodTypeListProps = Readonly<{
  foodTypes: readonly FoodTypeEntry[]
  labelledBy: string
  /** Nur der Admin öffnet eine Art */
  canEdit: boolean
  /** Pfad „Warengruppe › Kategorie“ in der Zweitzeile, z. B. in Suchtreffern */
  showPath?: boolean
  /** Eigene Arten einer Kategorie mit Knöpfen zum Sortieren (nur mit canEdit) */
  isSortable?: boolean
}>

function moveButtonsFor(foodType: FoodTypeEntry, ownIds: readonly string[]) {
  const index = ownIds.indexOf(foodType.id)
  if (index === -1 || ownIds.length < 2) return undefined
  return (
    <MoveButtons
      id={foodType.id}
      name={foodType.name}
      action={moveFoodTypeAction}
      isFirst={index === 0}
      isLast={index === ownIds.length - 1}
    />
  )
}

// Lebensmittelarten als Liste (#126). Ausgeblendete bleiben sichtbar, aber als solche markiert.
// In einer Kategorie stehen eigene Arten vorn und lassen sich verschieben (#243), Arten der
// Startliste behalten deren Reihenfolge.
export function FoodTypeList(props: FoodTypeListProps) {
  const { foodTypes, labelledBy, canEdit, showPath, isSortable } = props
  const ownIds =
    canEdit && isSortable === true
      ? foodTypes.filter((foodType) => !foodType.isSystem).map((foodType) => foodType.id)
      : []
  const list = (
    <Group labelledBy={labelledBy}>
      {foodTypes.map((foodType) => {
        const summary = foodTypeSummary(foodType)
        const path = `${foodType.productGroupName} › ${foodType.categoryName}`
        const accessory = moveButtonsFor(foodType, ownIds)
        return (
          <Row
            key={foodType.id}
            focusKey={foodType.id}
            title={foodType.name}
            subtitle={showPath === true ? `${path} · ${summary}` : summary}
            {...(canEdit ? { action: { href: foodTypePath(foodType.id) } } : {})}
            {...(accessory === undefined ? {} : { accessory })}
          />
        )
      })}
    </Group>
  )
  return ownIds.length < 2 ? list : <SortableArea>{list}</SortableArea>
}
