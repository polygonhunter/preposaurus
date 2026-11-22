import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

// Unbekannte oder fremde Warengruppe, Lebensmittelart oder Produkt (#45, DATENKATALOG §8 Nr. 3).
export default function StockNotFound() {
  return (
    <>
      <PageHeader title="Nicht gefunden" back={{ href: '/vorrat', label: 'Vorrat' }} />
      <EmptyState
        text="Das gibt es in eurem Vorrat nicht, oder es wurde inzwischen geändert."
        action={{ href: '/vorrat', label: 'Zum Vorrat' }}
      />
    </>
  )
}
