import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { prefilledCapturePath } from '@/shared/config/stock-paths'
import { EmptyState } from '@/shared/ui/EmptyState'
import { OfflineNotice } from '@/shared/ui/OfflineNotice'
import { PageHeader } from '@/shared/ui/PageHeader'
import type { FoodTypeDetail, HistoryEntry } from '../schemas'
import { DetailFigures } from './DetailFigures'
import { fifoGroupOf, groupLabel, shelfLifeColumns } from './detail-view'
import { HistorySection } from './HistorySection'
import { PathLine } from './PathLine'
import { ProductSection } from './ProductSection'
import { ShelfLifeChart } from './ShelfLifeChart'
import { shelfLifeHint } from './stock-format'
import { groupPath } from './stock-paths'
import { TakeFifoBar } from './TakeFifoBar'

type FoodTypeDetailViewProps = Readonly<{
  detail: FoodTypeDetail
  history: readonly HistoryEntry[]
  // Nur der Admin sieht „Fehlerfassung löschen“ (#50)
  isAdmin: boolean
  // Quelle des Tagesbedarfs für das Erklär-Blatt der Kennwerte (#230)
  source: RecommendationSource | null
}>

// Detail einer Lebensmittelart (UX-Konzept §8.4, #45): Pfadzeile, Large Title, Kennwerte,
// Säulen je MHD, Abschnitte je Produkt mit Zeilen je Datum, Verlauf (#48), unten fest
// „1 entnehmen · MHD“. Ohne Verbindung zeigt der Service Worker den letzten Stand (#216).
// Braucht einen ConsumeProvider darüber (StockDetailSplit), den es mit der Liste daneben teilt.
export function FoodTypeDetailView(props: FoodTypeDetailViewProps) {
  const { detail, history, isAdmin } = props
  const back = groupPath(detail.path.group.key)
  // Verschwindet das einzige Produkt, gibt es die Seite nicht mehr: dann zurück zur Warengruppe
  const leaveHref = detail.products.length > 1 ? null : back
  const fifoGroup = fifoGroupOf(detail.products, detail.fifoUnitId)
  const columns = shelfLifeColumns(detail.products)
  const hint = shelfLifeHint(detail.typicalShelfLifeMonths)
  return (
    <>
      <PageHeader
        title={detail.name}
        back={{ href: back, label: detail.path.group.shortName }}
        eyebrow={<PathLine path={detail.path} />}
      />
      <OfflineNotice loadedAt={new Date().toISOString()} />
      <DetailFigures detail={detail} source={props.source} />
      {columns.length === 0 ? (
        <EmptyState
          text="Aktuell nichts im Vorrat."
          action={{ href: prefilledCapturePath(detail.target), label: 'Packungen hinzufügen' }}
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
          isAdmin={isAdmin}
          leaveHref={leaveHref}
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
    </>
  )
}
