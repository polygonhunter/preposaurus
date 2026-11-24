import { getStockOverview } from '@/features/inventory/application/get-stock-overview'
import { getStockTree } from '@/features/inventory/application/get-stock-tree'
import { searchStock } from '@/features/inventory/application/search-stock'
import { stockServices } from '@/features/inventory/application/stock-services'
import { stockFilterSchema } from '@/features/inventory/schemas/requests'
import { ActiveFilters } from '@/features/inventory/ui/ActiveFilters'
import { ConsumeProvider } from '@/features/inventory/ui/ConsumeProvider'
import { GroupList } from '@/features/inventory/ui/GroupList'
import { HistoryLink } from '@/features/inventory/ui/HistoryLink'
import { SearchResults } from '@/features/inventory/ui/SearchResults'
import { StockSearchBar } from '@/features/inventory/ui/StockSearchBar'
import { StockStatusChips } from '@/features/inventory/ui/StockStatusChips'
import { isEmptyStock } from '@/features/inventory/ui/stock-format'
import { tableGroupsOf } from '@/features/inventory/ui/stock-table'
import { StockTable } from '@/features/inventory/ui/StockTable'
import { CAPTURE_PATH, isHitMode, readStockParams } from '@/features/inventory/ui/stock-paths'
import { requirePageHousehold } from '@/server/auth/household'
import { EmptyState } from '@/shared/ui/EmptyState'
import { OfflineNotice } from '@/shared/ui/OfflineNotice'
import { PageHeader } from '@/shared/ui/PageHeader'

// Vorrat Ebene 1 bzw. Treffermodus (UX-Konzept §8.3, #44). Suche und Filter stehen in der Adresse.
// Ab „weit“ steht statt der Warengruppen die Tabelle über den ganzen Vorrat (M12-04). Oben rechts
// führt „Verlauf“ zu Verbraucht und Entsorgt (#48).
// Ohne Verbindung zeigt der Service Worker den zuletzt geladenen Stand (M10-02).
export default async function StockPage({ searchParams }: PageProps<'/vorrat'>) {
  const offlineNotice = <OfflineNotice loadedAt={new Date().toISOString()} />
  const { householdId } = await requirePageHousehold()
  const parsed = stockFilterSchema.safeParse(readStockParams(await searchParams))
  const filter = parsed.success ? parsed.data : stockFilterSchema.parse({})
  const { reader, today } = await stockServices()
  if (isHitMode(filter)) {
    const search = await searchStock(reader, { householdId, today, filter })
    return (
      <ConsumeProvider>
        <PageHeader title="Vorrat" action={<HistoryLink />} />
        {offlineNotice}
        <StockSearchBar filter={filter} options={search.options} />
        <StockStatusChips filter={filter} counts={search.counts} />
        <ActiveFilters filter={filter} options={search.options} />
        <SearchResults filter={filter} groups={search.groups} />
      </ConsumeProvider>
    )
  }
  const [overview, options, tree] = await Promise.all([
    getStockOverview(reader, { householdId, today }),
    reader.loadFilterOptions(householdId),
    getStockTree(reader, { householdId, today }),
  ])
  if (isEmptyStock(overview.groups)) {
    return (
      <>
        <PageHeader title="Vorrat" action={<HistoryLink />} />
        {offlineNotice}
        <EmptyState
          text="Noch ist nichts eingelagert. Mit dem ersten Produkt füllt sich die Liste."
          action={{ href: CAPTURE_PATH, label: 'Produkt erfassen' }}
        />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Vorrat" action={<HistoryLink />} />
      {offlineNotice}
      <StockSearchBar filter={filter} options={options} />
      <StockStatusChips filter={filter} counts={overview.counts} />
      <div className="weit:hidden">
        <GroupList groups={overview.groups} />
      </div>
      <div className="hidden pt-4 weit:block">
        <StockTable groups={tableGroupsOf(tree.groups)} caption="Vorrat" />
      </div>
    </>
  )
}
