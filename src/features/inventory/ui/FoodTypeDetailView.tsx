import { EmptyState } from '@/shared/ui/EmptyState'
import { OfflineNotice } from '@/shared/ui/OfflineNotice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatTiles } from '@/shared/ui/StatTiles'
import type { FoodTypeDetail, HistoryEntry } from '../schemas'
import { ConsumeProvider } from './ConsumeProvider'
import { fifoGroupOf, groupLabel, shelfLifeColumns } from './detail-view'
import { HistorySection } from './HistorySection'
import { PathLine } from './PathLine'
import { ProductSection } from './ProductSection'
import { ShelfLifeChart } from './ShelfLifeChart'
import { detailTiles, shelfLifeHint, uncountedNote } from './stock-format'
import { CAPTURE_PATH, groupPath } from './stock-paths'
import { TakeFifoBar } from './TakeFifoBar'

type FoodTypeDetailViewProps = Readonly<{
  detail: FoodTypeDetail
  history: readonly HistoryEntry[]
}>

// Detail einer Lebensmittelart (UX-Konzept §8.4, #45): Pfadzeile, Large Title, Kennwerte,
// Säulen je MHD, Abschnitte je Produkt mit Zeilen je Datum, Verlauf (#48), unten fest
// „1 entnehmen · MHD“. Ohne Verbindung zeigt der Service Worker den letzten Stand (#216).
export function FoodTypeDetailView({ detail, history }: FoodTypeDetailViewProps) {
  const fifoGroup = fifoGroupOf(detail.products, detail.fifoUnitId)
  const columns = shelfLifeColumns(detail.products)
  const hint = shelfLifeHint(detail.typicalShelfLifeMonths)
  const uncounted = uncountedNote(detail.totals)
  return (
    <ConsumeProvider>
      <PageHeader
        title={detail.name}
        back={{ href: groupPath(detail.path.group.key), label: detail.path.group.shortName }}
        eyebrow={<PathLine path={detail.path} />}
      />
      <OfflineNotice loadedAt={new Date().toISOString()} />
      <div className="pt-3">
        <StatTiles tiles={detailTiles(detail)} />
        {uncounted === null ? null : (
          <p className="px-8 pt-1.5 text-footnote text-fg2 breit:px-10">{uncounted}</p>
        )}
      </div>
      {columns.length === 0 ? (
        <EmptyState
          text="Aktuell nichts im Vorrat."
          action={{ href: CAPTURE_PATH, label: 'Packungen hinzufügen' }}
        />
      ) : (
        <ShelfLifeChart columns={columns} />
      )}
      {detail.products.map((product) => (
        <ProductSection
          key={product.id}
          product={product}
          name={detail.name}
          fifoUnitId={detail.fifoUnitId}
          hasOwnHeading={detail.products.length > 1}
        />
      ))}
      {hint === null ? null : (
        <p className="px-8 pt-3 text-footnote text-fg2 breit:px-10">{hint}</p>
      )}
      <HistorySection entries={history} />
      {detail.fifoUnitId === null || fifoGroup === null ? null : (
        <TakeFifoBar
          name={detail.name}
          unitId={detail.fifoUnitId}
          dateLabel={groupLabel(fifoGroup)}
        />
      )}
    </ConsumeProvider>
  )
}
