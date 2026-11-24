import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHistory } from '@/features/inventory/application/get-history'
import { stockServices } from '@/features/inventory/application/stock-services'
import { historyFilterSchema } from '@/features/inventory/schemas/history'
import { HistoryDayList } from '@/features/inventory/ui/HistoryDayList'
import { HistoryFilters } from '@/features/inventory/ui/HistoryFilters'
import { historyRangeText, historyTruncatedText } from '@/features/inventory/ui/history-labels'
import { historyHref, readHistoryParams } from '@/features/inventory/ui/history-paths'
import { HistoryTable } from '@/features/inventory/ui/HistoryTable'
import { STOCK_PATH } from '@/features/inventory/ui/stock-paths'
import { requirePageHousehold } from '@/server/auth/household'
import { EmptyState } from '@/shared/ui/EmptyState'
import { OfflineNotice } from '@/shared/ui/OfflineNotice'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Verlauf · Preposaurus' }

// Verlauf als Unterseite des Vorrats (UX-Konzept §8.3 und D7, #48): verbraucht und entsorgt mit
// Tag und Person, nach Zeitraum, auf Wunsch nur für eine Lebensmittelart. Filter in der Adresse.
// Ab „weit“ als Tabelle (DESIGN_SYSTEM §6).
export default async function HistoryPage({ searchParams }: PageProps<'/vorrat/verlauf'>) {
  const { householdId } = await requirePageHousehold()
  const parsed = historyFilterSchema.safeParse(readHistoryParams(await searchParams))
  const filter = parsed.success ? parsed.data : historyFilterSchema.parse({})
  const { reader, history, today } = await stockServices()
  const result = await getHistory({ reader, history }, { householdId, today, filter })
  if (!result.ok) notFound()
  const page = result.value
  return (
    <>
      <PageHeader
        title="Verlauf"
        back={{ href: STOCK_PATH, label: 'Vorrat' }}
        subtitle={historyRangeText(page.from)}
      />
      <OfflineNotice loadedAt={new Date().toISOString()} />
      <HistoryFilters filter={filter} counts={page.counts} target={page.target} />
      {page.days.length === 0 ? (
        <EmptyState
          text="In diesem Zeitraum habt ihr nichts verbraucht oder entsorgt."
          {...(filter.period === 'all'
            ? {}
            : {
                action: { href: historyHref({ ...filter, period: 'all' }), label: 'Alles zeigen' },
              })}
        />
      ) : (
        <>
          <div className="weit:hidden">
            <HistoryDayList days={page.days} />
          </div>
          <div className="hidden pt-4 weit:block">
            <HistoryTable days={page.days} />
          </div>
        </>
      )}
      {page.isTruncated ? (
        <p className="px-8 pt-3 text-footnote text-fg2 breit:px-10">
          {historyTruncatedText(page.target !== null)}
        </p>
      ) : null}
    </>
  )
}
