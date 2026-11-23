import Link from 'next/link'
import { detailPath } from '@/shared/config/stock-paths'
import { cx } from '@/shared/lib/class-names'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { StockRowDto } from '../schemas/shared'
import { STATE_BADGE } from './stock-format'
import { tableCells } from './stock-table'

type StockTableRowProps = Readonly<{ row: StockRowDto; isSelected: boolean }>

const CELL = 'border-t border-line px-3 py-2.5 align-middle'
const NUMBER = `${CELL} text-right whitespace-nowrap`

// Zeile der Vorrat-Tabelle: Der Name ist der Link ins Detail, seine Trefferfläche deckt die ganze
// Zeile ab. Die ausgewählte Zeile trägt einen Akzentstreifen und eine getönte Fläche, der Link
// `aria-current="page"` (DESIGN_SYSTEM §6: ausgewählte Zeile in Akzent).
export function StockTableRow({ row, isSelected }: StockTableRowProps) {
  const cells = tableCells(row)
  const badge = row.state === null ? null : STATE_BADGE[row.state]
  return (
    <tr
      data-selected-row={isSelected ? '' : undefined}
      className={cx(
        'relative transition-colors duration-150 ease-out',
        isSelected ? 'bg-accent/7' : 'hover:bg-fill/60',
      )}
    >
      <th
        scope="row"
        className={cx(
          CELL,
          'pl-6 text-left font-normal',
          isSelected && 'shadow-[inset_3px_0_0_var(--color-accent)]',
        )}
      >
        <Link
          href={detailPath(row.target)}
          aria-current={isSelected ? 'page' : undefined}
          className={cx(
            'after:absolute after:inset-0 after:content-[""] focus-visible:outline-offset-[-2px]',
            isSelected && 'font-semibold',
          )}
        >
          {row.name}
        </Link>
      </th>
      <td className={NUMBER}>
        {cells.packages}
        {cells.expiredNote === null ? null : (
          <span className="block text-footnote text-fg2">{cells.expiredNote}</span>
        )}
      </td>
      <td className={NUMBER}>{cells.amount}</td>
      <td className={NUMBER}>{cells.kcal}</td>
      <td className={NUMBER}>{cells.days}</td>
      <td className={cx(CELL, 'pr-6')}>
        <span className="flex flex-wrap items-center gap-x-1.5 whitespace-nowrap">
          {badge === null ? null : <StatusBadge tone={badge.tone} label={badge.label} />}
          {cells.nextDate === null ? null : <span>{cells.nextDate}</span>}
        </span>
      </td>
    </tr>
  )
}
