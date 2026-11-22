import { getStockOverview } from '@/features/inventory/application/get-stock-overview'
import { searchStock } from '@/features/inventory/application/search-stock'
import { stockServices } from '@/features/inventory/application/stock-services'
import { stockFilterSchema } from '@/features/inventory/schemas'
import { ActiveFilters } from '@/features/inventory/ui/ActiveFilters'
import { ConsumeProvider } from '@/features/inventory/ui/ConsumeProvider'
import { GroupList } from '@/features/inventory/ui/GroupList'
import { SearchResults } from '@/features/inventory/ui/SearchResults'
import { StockSearchBar } from '@/features/inventory/ui/StockSearchBar'
import { StockStatusChips } from '@/features/inventory/ui/StockStatusChips'
import { isEmptyStock } from '@/features/inventory/ui/stock-format'
import { CAPTURE_PATH, isHitMode, readStockParams } from '@/features/inventory/ui/stock-paths'
import { requirePageHousehold } from '@/server/auth/household'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

// Vorrat Ebene 1 bzw. Treffermodus (UX-Konzept §8.3, #44). Suche und Filter stehen in der Adresse.
export default async function StockPage({ searchParams }: PageProps<'/vorrat'>) {
  const { householdId } = await requirePageHousehold()
  const parsed = stockFilterSchema.safeParse(readStockParams(await searchParams))
  const filter = parsed.success ? parsed.data : stockFilterSchema.parse({})
  const { reader, today } = await stockServices()
  if (isHitMode(filter)) {
    const search = await searchStock(reader, { householdId, today, filter })
    return (
      <ConsumeProvider>
        <PageHeader title="Vorrat" />
        <StockSearchBar filter={filter} options={search.options} />
        <StockStatusChips filter={filter} counts={search.counts} />
        <ActiveFilters filter={filter} options={search.options} />
        <SearchResults filter={filter} groups={search.groups} />
      </ConsumeProvider>
    )
  }
  const [overview, options] = await Promise.all([
    getStockOverview(reader, { householdId, today }),
    reader.loadFilterOptions(householdId),
  ])
  if (isEmptyStock(overview.groups)) {
    return (
      <>
        <PageHeader title="Vorrat" />
        <EmptyState
          text="Noch ist nichts eingelagert. Mit dem ersten Produkt füllt sich die Liste."
          action={{ href: CAPTURE_PATH, label: 'Produkt erfassen' }}
        />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Vorrat" />
      <StockSearchBar filter={filter} options={options} />
      <StockStatusChips filter={filter} />
      <GroupList groups={overview.groups} />
    </>
  )
}
