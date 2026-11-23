import { useId } from 'react'
import { prefilledCapturePath } from '@/shared/config/stock-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { FoodTypeDetail } from '../schemas'
import { DateGroupRow } from './DateGroupRow'
import { groupLabel, packagingOf } from './detail-view'
import { ProductDetailsGroup } from './ProductDetailsGroup'

type ProductSectionProps = Readonly<{
  product: FoodTypeDetail['products'][number]
  // Name der Lebensmittelart für Blatt und UndoBar
  name: string
  fifoUnitId: string | null
  // Bei nur einem Produkt entfällt die eigene Überschrift (UX-Konzept §8.4)
  hasOwnHeading: boolean
  // Nur der Admin löscht eine Fehlerfassung (#50)
  isAdmin: boolean
  // Wohin es geht, wenn das Produkt gelöscht ist. null: Die Seite bleibt
  leaveHref: string | null
}>

// Abschnitt je Produkt: Packungen nach Datum, frühestes oben, danach die Angaben. „Packungen
// hinzufügen“ springt in die Erfassung mit diesem Produkt, direkt zu Datum und Anzahl (#195).
export function ProductSection(props: ProductSectionProps) {
  const { product, name, fifoUnitId, hasOwnHeading, isAdmin, leaveHref } = props
  const datesId = useId()
  return (
    <section>
      <GroupHeader id={datesId} trailing={hasOwnHeading ? packagingOf(product) : undefined}>
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
              isAdmin={isAdmin}
              leaveHref={leaveHref}
            />
          ))
        )}
        <Row
          title={<span className="text-accent">Packungen hinzufügen</span>}
          action={{ href: prefilledCapturePath({ kind: 'product', id: product.id }) }}
        />
      </Group>
      <ProductDetailsGroup
        product={product}
        heading={hasOwnHeading ? 'Angaben' : `Angaben · ${product.name}`}
        isAdmin={isAdmin}
        leaveHref={leaveHref}
      />
    </section>
  )
}
