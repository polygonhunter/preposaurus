import type { FoodTypeDetail, HistoryEntry, StockTree } from '../schemas'
import { ConsumeProvider } from './ConsumeProvider'
import { FoodTypeDetailView } from './FoodTypeDetailView'
import { ScrollToSelected } from './ScrollToSelected'
import { StockSideList } from './StockSideList'
import { StockSplit } from './StockSplit'

type StockDetailSplitProps = Readonly<{
  detail: FoodTypeDetail
  history: readonly HistoryEntry[]
  tree: StockTree
  isAdmin: boolean
}>

// Detailseite mit der Liste daneben (M12-03 bis M12-05): kompakt nur das Detail, mittel die Liste
// darüber, ab „breit“ links daneben, ab „weit“ als Tabelle. Die Auswahl ist die Adresse der Seite.
// Ein gemeinsamer ConsumeProvider: „−1“ in der Liste und „1 entnehmen“ sperren sich gegenseitig und
// zeigen dieselbe Rückgängig-Zeile statt zwei übereinander.
export function StockDetailSplit({ detail, history, tree, isAdmin }: StockDetailSplitProps) {
  return (
    <ConsumeProvider>
      <StockSplit
        listLabel="Vorrat"
        list={
          <StockSideList tree={tree} selected={detail.target} groupKey={detail.path.group.key} />
        }
      >
        <FoodTypeDetailView detail={detail} history={history} isAdmin={isAdmin} />
      </StockSplit>
      <ScrollToSelected />
    </ConsumeProvider>
  )
}
