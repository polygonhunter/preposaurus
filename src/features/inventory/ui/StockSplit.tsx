import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { FOLD_SPLIT_MARKER, SPLIT_COLUMNS } from '@/shared/ui/split-columns'

type StockSplitProps = Readonly<{
  list: ReactNode
  listLabel: string
  // Das Detail, das kompakt allein steht
  children: ReactNode
}>

// Ab „breit“ nebeneinander, die Liste fest 340 px bzw. mit Falz bis zur Falz (SPLIT_COLUMNS). Ab
// „weit“ (PC) wächst die Tabelle, das Detail bleibt bei 40 % und mindestens 420 px.
const COLUMNS = cx(SPLIT_COLUMNS, 'weit:grid-cols-[minmax(0,1fr)_minmax(420px,40%)] weit:gap-x-0')
// Stufe mittel (Duo hochkant): Liste oben, Detail unten, jede Hälfte rollt für sich, 24 px frei um
// die Mitte. Die Höhe zieht das Polster für das Dock ab, das `main` unten hält, so rollt die Seite
// selbst nicht.
const ROWS =
  'nur-mittel:grid nur-mittel:h-[calc(100dvh-74px-env(safe-area-inset-bottom))] nur-mittel:grid-rows-[calc(50dvh-12px)_minmax(0,1fr)] nur-mittel:gap-y-6'
const LIST_PANE =
  'hidden nur-mittel:row-start-1 nur-mittel:block nur-mittel:overflow-y-auto nur-mittel:border-b nur-mittel:border-line breit:sticky breit:top-0 breit:col-start-1 breit:row-start-1 breit:block breit:h-dvh breit:overflow-y-auto breit:border-r breit:border-line breit:pb-6 weit:border-r-0'
const DETAIL_PANE =
  'min-w-0 nur-mittel:row-start-2 nur-mittel:overflow-y-auto breit:col-start-2 breit:row-start-1 weit:border-l weit:border-line'

// Detail mit der Liste daneben (M12-03) bzw. darüber in der Stufe mittel (M12-05), kompakt nur das
// Detail. Die Auswahl steht in der Adresse, jede Zeile der Liste ist ein Link: Zurück, Neu laden
// und Teilen bleiben wie gewohnt. Im DOM steht das Detail zuerst (Hauptinhalt für Tastatur und
// Screenreader), die Spalten ordnet das Raster.
export function StockSplit({ list, listLabel, children }: StockSplitProps) {
  return (
    <div {...FOLD_SPLIT_MARKER} className={cx(COLUMNS, ROWS)}>
      <div className={DETAIL_PANE}>{children}</div>
      <section aria-label={listLabel} data-stock-list className={LIST_PANE}>
        {list}
      </section>
    </div>
  )
}
