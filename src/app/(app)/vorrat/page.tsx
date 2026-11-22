import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function StockPage() {
  return (
    <>
      <PageHeader title="Vorrat" />
      <EmptyState
        text="Hier steht bald alles, was ihr eingelagert habt, nach Warengruppen sortiert."
        action={{ href: '/neu', label: 'Produkt erfassen' }}
      />
    </>
  )
}
