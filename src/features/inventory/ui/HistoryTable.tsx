import Link from 'next/link'
import { detailPath } from '@/shared/config/stock-paths'
import type { HistoryPage } from '../schemas/history'
import { historyBestBefore, historyDayLabel, historyTitle } from './history-labels'

type HistoryTableProps = Readonly<{ days: HistoryPage['days'] }>

const HEAD =
  'px-3 py-2 whitespace-nowrap text-left text-footnote font-normal tracking-wide text-fg2 uppercase'
const CELL = 'border-t border-line px-3 py-2.5 align-middle'

// Verlauf als Tabelle ab „weit“ (DESIGN_SYSTEM §6, #48), aufgebaut wie die Vorrat-Tabelle: je Tag
// eine Zwischenzeile, Spalten Lebensmittel · Ausgang · Von · MHD. Der Name führt ins Detail.
export function HistoryTable({ days }: HistoryTableProps) {
  return (
    <table className="w-full border-collapse text-callout">
      <caption className="sr-only">Verlauf</caption>
      <thead className="sticky top-0 z-[1] bg-surface shadow-[inset_0_-1px_0_var(--color-line)]">
        <tr>
          <th scope="col" className={`${HEAD} pl-6`}>
            Lebensmittel
          </th>
          <th scope="col" className={HEAD}>
            Ausgang
          </th>
          <th scope="col" className={HEAD}>
            Von
          </th>
          <th scope="col" className={`${HEAD} pr-6`}>
            MHD
          </th>
        </tr>
      </thead>
      {days.map(({ day, items }) => (
        <tbody key={day}>
          <tr>
            <th
              scope="rowgroup"
              colSpan={4}
              className="bg-bg px-6 pt-4 pb-1.5 text-left text-footnote font-normal tracking-wide text-fg2 uppercase"
            >
              {historyDayLabel(day)}
            </th>
          </tr>
          {items.map((item) => (
            <tr key={item.unitId} className="relative hover:bg-fill/60">
              <th scope="row" className={`${CELL} pl-6 text-left font-normal`}>
                <Link
                  href={detailPath(item.target)}
                  className='after:absolute after:inset-0 after:content-[""] focus-visible:outline-offset-[-2px]'
                >
                  {item.name}
                </Link>
              </th>
              <td className={CELL}>{historyTitle({ kind: item.outcome })}</td>
              <td className={`${CELL} text-fg2`}>{item.person ?? '–'}</td>
              <td className={`${CELL} pr-6 whitespace-nowrap`}>{historyBestBefore(item, '')}</td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  )
}
