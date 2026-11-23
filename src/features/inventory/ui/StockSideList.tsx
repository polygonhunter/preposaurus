import type { StockTarget } from '../schemas/shared'
import type { StockTree } from '../schemas/stock'
import { SelectedGroupList } from './SelectedGroupList'
import { tableGroupsOf } from './stock-table'
import { StockTable } from './StockTable'

type StockSideListProps = Readonly<{
  tree: StockTree
  selected: StockTarget
  groupKey: string
}>

// Liste neben dem Detail (M12-03, M12-04): bis „weit“ die Warengruppe der Auswahl, ab „weit“ die
// Tabelle über den ganzen Vorrat. Die ausgewählte Zeile ist markiert.
export function StockSideList({ tree, selected, groupKey }: StockSideListProps) {
  const level = tree.groups.find(({ group }) => group.key === groupKey)
  return (
    <>
      {level === undefined ? null : (
        <div className="weit:hidden">
          <SelectedGroupList level={level} selected={selected} />
        </div>
      )}
      <div className="hidden weit:block">
        <StockTable groups={tableGroupsOf(tree.groups)} selected={selected} caption="Vorrat" />
      </div>
    </>
  )
}
