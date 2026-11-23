import Link from 'next/link'
import type { StockTarget } from '../schemas'
import { groupPath } from './stock-paths'
import { isSameTarget, type TableGroup } from './stock-table'
import { StockTableRow } from './StockTableRow'

type StockTableProps = Readonly<{
  groups: readonly TableGroup[]
  // Ausgewählte Zeile, deren Detail rechts daneben steht
  selected?: StockTarget | null
  caption: string
}>

const HEAD =
  'px-3 py-2 whitespace-nowrap text-left text-footnote font-normal tracking-wide text-fg2 uppercase'
const HEAD_NUMBER = `${HEAD} text-right`

// Vorrat als Tabelle ab „weit“ (DESIGN_SYSTEM §6, M12-04): echte Tabelle mit Spaltenköpfen, je
// Warengruppe eine Zwischenzeile (Link auf Ebene 2), Spalten Packungen · Menge · kcal · Tage · nächstes MHD. Die
// Reihenfolge ist die des Baums (Warengruppe, Kategorie, Name) wie in der Liste.
export function StockTable({ groups, selected = null, caption }: StockTableProps) {
  return (
    <table className="w-full border-collapse text-callout">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 z-[1] bg-surface shadow-[inset_0_-1px_0_var(--color-line)]">
        <tr>
          <th scope="col" className={`${HEAD} pl-6`}>
            Lebensmittel
          </th>
          <th scope="col" className={HEAD_NUMBER}>
            Packungen
          </th>
          <th scope="col" className={HEAD_NUMBER}>
            Menge
          </th>
          <th scope="col" className={HEAD_NUMBER}>
            kcal
          </th>
          <th scope="col" className={HEAD_NUMBER}>
            Tage
          </th>
          <th scope="col" className={`${HEAD} pr-6`}>
            Nächstes MHD
          </th>
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.key}>
          <tr>
            <th
              scope="rowgroup"
              colSpan={6}
              className="bg-bg px-6 pt-4 pb-1.5 text-left text-footnote font-normal tracking-wide text-fg2 uppercase"
            >
              <Link href={groupPath(group.key)} className="hover:underline">
                {group.shortName}
              </Link>
            </th>
          </tr>
          {group.rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="border-t border-line px-6 py-2.5 text-fg2">
                noch nichts
              </td>
            </tr>
          ) : null}
          {group.rows.map((row) => (
            <StockTableRow
              key={`${row.target.kind}:${row.target.id}`}
              row={row}
              isSelected={isSameTarget(row.target, selected)}
            />
          ))}
        </tbody>
      ))}
    </table>
  )
}
