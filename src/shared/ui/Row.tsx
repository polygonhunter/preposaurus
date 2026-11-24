import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { RowContent, type RowContentProps } from './RowContent'
import { RowHandle, type RowAction } from './RowHandle'

type RowProps = RowContentProps &
  Readonly<{
    action?: RowAction
    // Eigener Knopf rechts neben Link oder Knopf der Zeile, z. B. „−1“. Er liegt außerhalb der
    // Zeilen-Handlung, weil ein Knopf in einem Link nicht erlaubt ist.
    accessory?: ReactNode
    // Knopfreihe unter Link oder Knopf der Zeile, wenn rechts kein Platz für mehrere Knöpfe ist
    footer?: ReactNode
    // Stabiler Schlüssel der Zeile, an dem useFocusRescue sie nach dem Neuladen wiederfindet
    focusKey?: string | undefined
  }>

// Trennlinie oberhalb jeder Zeile außer der ersten, eingerückt wie der Text.
const SEPARATOR =
  'relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:hairline'
const INNER = 'flex min-h-11 w-full items-center gap-3 px-4 py-[11px] text-left'

export function Row({ action, accessory, footer, focusKey, ...content }: RowProps) {
  // Die gewählte Zeile ist samt Knopf daneben getönt (Vorrat neben dem Detail)
  const isCurrent = action !== undefined && 'href' in action && action.isCurrent === true
  const itemClass = cx(
    SEPARATOR,
    content.icon ? 'before:left-[52px]' : 'before:left-4',
    isCurrent && 'bg-accent/7 shadow-[inset_3px_0_0_var(--color-accent)]',
  )
  if (action && footer) {
    return (
      <li className={itemClass} data-focus-row={focusKey}>
        <RowHandle action={action} {...content} />
        <div className={cx('flex flex-wrap gap-2 pr-4 pb-3', content.icon ? 'pl-[52px]' : 'pl-4')}>
          {footer}
        </div>
      </li>
    )
  }
  if (!action) {
    // Inhalt in eigenem Flex-Element: Das ::before der Trennlinie wäre sonst in der ersten Zeile
    // ein Flex-Kind und rückte den Text um den Abstand ein.
    return (
      <li className={itemClass} data-focus-row={focusKey}>
        <div className={INNER}>
          <RowContent {...content} />
          {accessory}
        </div>
      </li>
    )
  }
  if (!accessory) {
    return (
      <li className={itemClass} data-focus-row={focusKey}>
        <RowHandle action={action} {...content} />
      </li>
    )
  }
  return (
    <li className={itemClass} data-focus-row={focusKey}>
      <div className="flex items-center pr-4">
        <div className="min-w-0 flex-1">
          <RowHandle action={action} className="pr-2" {...content} />
        </div>
        <div className="shrink-0">{accessory}</div>
      </div>
    </li>
  )
}
