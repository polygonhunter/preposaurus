import { foodTypePath } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import type { FoodTypeEntry } from '../domain/category'
import { foodTypeSummary } from './catalog-labels'

type FoodTypeListProps = Readonly<{
  foodTypes: readonly FoodTypeEntry[]
  labelledBy: string
  /** Nur der Admin öffnet eine Art */
  canEdit: boolean
  /** Pfad „Warengruppe › Kategorie“ in der Zweitzeile, z. B. in Suchtreffern */
  showPath?: boolean
}>

// Lebensmittelarten als Liste (#126). Ausgeblendete bleiben sichtbar, aber als solche markiert.
export function FoodTypeList({ foodTypes, labelledBy, canEdit, showPath }: FoodTypeListProps) {
  return (
    <Group labelledBy={labelledBy}>
      {foodTypes.map((foodType) => {
        const summary = foodTypeSummary(foodType)
        const path = `${foodType.productGroupName} › ${foodType.categoryName}`
        return (
          <Row
            key={foodType.id}
            title={foodType.name}
            subtitle={showPath === true ? `${path} · ${summary}` : summary}
            {...(canEdit ? { action: { href: foodTypePath(foodType.id) } } : {})}
          />
        )
      })}
    </Group>
  )
}
