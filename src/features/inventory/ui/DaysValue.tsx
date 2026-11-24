import { NamedDays } from '@/shared/ui/NamedDays'
import type { TableCells } from './stock-table'

type DaysValueProps = Readonly<{ days: TableCells['days'] }>

// Zelle der Spalte „Satt für“: der Wert, bei Wasser mit eigenem Namen darüber (#209)
export function DaysValue({ days }: DaysValueProps) {
  return typeof days === 'string' ? days : <NamedDays days={days} />
}
