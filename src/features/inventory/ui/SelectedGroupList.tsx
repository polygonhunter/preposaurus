import Link from 'next/link'
import type { FoodTypeLevel, StockTarget } from '../schemas'
import { ConsumeProvider } from './ConsumeProvider'
import { FoodTypeLevelList } from './FoodTypeLevelList'
import { groupSubtitle } from './stock-format'
import { groupPath } from './stock-paths'

type GroupListProps = Readonly<{ level: FoodTypeLevel; selected: StockTarget }>

// Bis „weit“: die Warengruppe der Auswahl wie auf Ebene 2, mit „−1“ in der Zeile.
export function SelectedGroupList({ level, selected }: GroupListProps) {
  return (
    <ConsumeProvider>
      <div className="px-6 pt-4">
        <Link href={groupPath(level.group.key)} className="text-headline text-accent">
          {level.group.shortName}
        </Link>
        <p className="text-footnote text-fg2">{groupSubtitle(level.group.totals)}</p>
      </div>
      <FoodTypeLevelList categories={level.categories} selected={selected} isCompact />
    </ConsumeProvider>
  )
}
