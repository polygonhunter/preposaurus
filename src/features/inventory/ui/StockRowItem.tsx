import { detailPath } from '@/shared/config/stock-paths'
import { Row } from '@/shared/ui/Row'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { StockRowDto } from '../schemas/shared'
import { STATE_BADGE, formatDate, stockLine } from './stock-format'
import { TakeOneButton } from './TakeOneButton'

type StockRowItemProps = Readonly<{
  row: StockRowDto
  // Zusatz im Treffermodus, z. B. „2 davon bald fällig“
  note?: string | undefined
  // Gewählt, weil ihr Detail daneben steht (ab „mittel“, M12-03)
  isSelected?: boolean
}>

// Zeile einer Lebensmittelart (UX-Konzept §8.3): „8 Packungen · 4 kg“, nächstes MHD mit
// Zustandswort und „−1“. Tipp auf den Text öffnet das Detail.
export function StockRowItem({ row, note, isSelected = false }: StockRowItemProps) {
  const badge = row.state === null ? null : STATE_BADGE[row.state]
  const next = row.totals.nextBestBefore
  const line = stockLine(row.totals)
  // Das Datum gehört zur nächsten gültigen Packung. Ist das Zustandswort „abgelaufen“, gehört es zu
  // einer anderen Packung, deshalb steht das Datum dann als „nächstes MHD“ da (#208).
  const nextLabel =
    next === null ? null : `${row.state === 'expired' ? 'nächstes MHD ' : ''}${formatDate(next)}`
  return (
    <Row
      focusKey={`${row.target.kind}-${row.target.id}`}
      title={row.name}
      subtitle={
        <>
          {note === undefined ? line : `${line} · ${note}`}
          {badge === null ? null : (
            <span className="flex flex-wrap items-center gap-x-1.5">
              <StatusBadge tone={badge.tone} label={badge.label} />
              {nextLabel === null ? null : <span>{nextLabel}</span>}
            </span>
          )}
        </>
      }
      action={{ href: detailPath(row.target), isCurrent: isSelected }}
      accessory={
        row.packagesInStock > 0 ? <TakeOneButton target={row.target} name={row.name} /> : undefined
      }
    />
  )
}
