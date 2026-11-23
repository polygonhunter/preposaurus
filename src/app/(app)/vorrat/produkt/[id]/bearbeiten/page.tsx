import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadProductForEdit } from '@/features/capture/application/product-edit-services'
import { getCaptureOptionsForUser } from '@/features/capture/application/stock-request'
import { ProductEditForm } from '@/features/capture/ui/ProductEditForm'
import { requirePageHousehold } from '@/server/auth/household'
import { detailPath } from '@/shared/config/stock-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Angaben bearbeiten · Preposaurus' }

// Angaben eines Produkts bearbeiten (#49): Admin und Mitglied. Ein fremdes oder unbekanntes
// Produkt ergibt „nicht gefunden“. Die Auswahllisten sind dieselben wie beim Erfassen.
export default async function ProductEditPage({
  params,
}: PageProps<'/vorrat/produkt/[id]/bearbeiten'>) {
  const { householdId, userId } = await requirePageHousehold()
  const { id } = await params
  const [product, options] = await Promise.all([
    loadProductForEdit(householdId, id),
    getCaptureOptionsForUser({ householdId, userId }),
  ])
  if (product === null) notFound()
  const back = detailPath(
    product.foodTypeId === null
      ? { kind: 'product', id: product.id }
      : { kind: 'food-type', id: product.foodTypeId },
  )
  return (
    <>
      <PageHeader
        title="Angaben bearbeiten"
        subtitle={product.name}
        back={{ href: back, label: 'Zurück' }}
      />
      <ProductEditForm product={product} options={options} />
    </>
  )
}
