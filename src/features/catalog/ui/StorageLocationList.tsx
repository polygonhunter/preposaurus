import { storageLocationPath } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { moveStorageLocationAction } from '../actions/move-storage-location-action'
import type { StorageLocation } from '../domain/storage-location'
import { productCountLabel } from './catalog-labels'
import { MoveButtons } from './MoveButtons'

type StorageLocationListProps = Readonly<{
  locations: readonly StorageLocation[]
  labelledBy: string
  /** Nur der Admin öffnet einen Ort und sortiert */
  canEdit: boolean
}>

// Lagerorte des Haushalts (EIN-04) in ihrer Reihenfolge. Mitglieder sehen dieselbe Liste ohne Links
// und ohne Knöpfe (nur lesen).
export function StorageLocationList({ locations, labelledBy, canEdit }: StorageLocationListProps) {
  const lastIndex = locations.length - 1
  return (
    <Group labelledBy={labelledBy}>
      {locations.map((location, index) => (
        <Row
          key={location.id}
          title={location.name}
          subtitle={productCountLabel(location.productCount)}
          {...(canEdit
            ? {
                action: { href: storageLocationPath(location.id) },
                accessory: (
                  <MoveButtons
                    id={location.id}
                    name={location.name}
                    action={moveStorageLocationAction}
                    isFirst={index === 0}
                    isLast={index === lastIndex}
                  />
                ),
              }
            : {})}
        />
      ))}
    </Group>
  )
}
