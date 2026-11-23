import Link from 'next/link'
import { useId } from 'react'
import { productEditPath } from '@/shared/config/stock-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { FoodTypeDetail } from '../schemas/detail'
import { DeleteEntryButton } from './DeleteEntryButton'
import { nutritionLine, nutritionOrigin, packagingOf } from './detail-view'

type ProductDetailsGroupProps = Readonly<{
  product: FoodTypeDetail['products'][number]
  // Überschrift „Angaben“ bzw. „Angaben · Spaghetti“, wenn das Produkt keine eigene hat
  heading: string
  // Nur der Admin löscht eine Fehlerfassung (#50)
  isAdmin: boolean
  // Wohin es geht, wenn das Produkt gelöscht ist. null: Die Seite bleibt
  leaveHref: string | null
}>

// Angaben zum Produkt (UX-Konzept §8.4 Nr. 4 und 5): Packung, Lagerort, Nährwerte mit Herkunft,
// dazu „Bearbeiten“ im Gruppenkopf (#49) und für den Admin „Fehlerfassung löschen“ (#50).
export function ProductDetailsGroup({
  product,
  heading,
  isAdmin,
  leaveHref,
}: ProductDetailsGroupProps) {
  const headerId = useId()
  const packaging = packagingOf(product)
  return (
    <>
      <GroupHeader
        id={headerId}
        trailing={
          <Link href={productEditPath(product.id)} className="touch-target text-accent">
            Bearbeiten<span className="sr-only"> · Angaben zu {product.name}</span>
          </Link>
        }
      >
        {heading}
      </GroupHeader>
      <Group labelledBy={headerId}>
        <Row title="Inhalt" trailing={packaging} />
        <Row title="Lagerort" trailing={product.storageLocation?.name ?? 'nicht angegeben'} />
        <Row
          title={`Nährwerte je 100 ${product.content.unit}`}
          subtitle={nutritionLine(product.nutrition) ?? 'Noch keine Nährwerte'}
          trailing={nutritionOrigin(product.nutrition) ?? undefined}
        />
      </Group>
      {isAdmin ? (
        <div className="mx-4 px-4 pt-2 breit:mx-6">
          <DeleteEntryButton
            target={{ kind: 'product', productId: product.id }}
            label="Fehlerfassung löschen …"
            question={`${product.name} (${packaging}) mit allen Packungen und dem Verlauf löschen? Es verschwindet auch aus der Statistik.`}
            leaveHref={leaveHref}
          />
        </div>
      ) : null}
    </>
  )
}
