import { useId } from 'react'
import { formatQuantity } from '@/shared/lib/quantities'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { FoodTypeDetail } from '../schemas'
import { DateGroupRow } from './DateGroupRow'
import { groupLabel, nutritionLine, nutritionOrigin } from './detail-view'

type ProductSectionProps = Readonly<{
  product: FoodTypeDetail['products'][number]
  // Name der Lebensmittelart für Blatt und UndoBar
  name: string
  fifoUnitId: string | null
  // Bei nur einem Produkt entfällt die eigene Überschrift (UX-Konzept §8.4)
  hasOwnHeading: boolean
}>

// Abschnitt je Produkt: Packungen nach Datum, frühestes oben, dazu Inhalt, Lagerort und
// Nährwerte mit Herkunft („ca.“ bei Richtwert oder Schätzung).
export function ProductSection({ product, name, fifoUnitId, hasOwnHeading }: ProductSectionProps) {
  const datesId = useId()
  const detailsId = useId()
  const content = formatQuantity(product.content)
  const packaging = product.container ? `${content} · ${product.container.name}` : content
  return (
    <section>
      <GroupHeader id={datesId} trailing={hasOwnHeading ? packaging : undefined}>
        {hasOwnHeading ? product.name : 'Packungen nach Datum'}
      </GroupHeader>
      <Group labelledBy={datesId}>
        {product.bestBeforeGroups.length === 0 ? (
          <Row title="Aktuell nichts im Vorrat" />
        ) : (
          product.bestBeforeGroups.map((group) => (
            <DateGroupRow
              key={groupLabel(group)}
              name={name}
              group={group}
              isNext={group.units.some((unit) => unit.id === fifoUnitId)}
            />
          ))
        )}
      </Group>
      <GroupHeader id={detailsId}>
        {hasOwnHeading ? 'Angaben' : `Angaben · ${product.name}`}
      </GroupHeader>
      <Group labelledBy={detailsId}>
        <Row title="Inhalt" trailing={packaging} />
        <Row title="Lagerort" trailing={product.storageLocation?.name ?? 'nicht angegeben'} />
        <Row
          title={`Nährwerte je 100 ${product.content.unit}`}
          subtitle={nutritionLine(product.nutrition) ?? 'Noch keine Nährwerte'}
          trailing={nutritionOrigin(product.nutrition) ?? undefined}
        />
      </Group>
    </section>
  )
}
