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
  }>

// Trennlinie oberhalb jeder Zeile außer der ersten, eingerückt wie der Text.
const SEPARATOR =
  'relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:hairline'
const INNER = 'flex min-h-11 w-full items-center gap-3 px-4 py-[11px] text-left'

export function Row({ action, accessory, ...content }: RowProps) {
  const itemClass = cx(SEPARATOR, content.icon ? 'before:left-[52px]' : 'before:left-4')
  if (!action) {
    // Inhalt in eigenem Flex-Element: Das ::before der Trennlinie wäre sonst in der ersten Zeile
    // ein Flex-Kind und rückte den Text um den Abstand ein.
    return (
      <li className={itemClass}>
        <div className={INNER}>
          <RowContent {...content} />
          {accessory}
        </div>
      </li>
    )
  }
  if (!accessory) {
    return (
      <li className={itemClass}>
        <RowHandle action={action} {...content} />
      </li>
    )
  }
  return (
    <li className={itemClass}>
      <div className="flex items-center pr-4">
        <div className="min-w-0 flex-1">
          <RowHandle action={action} className="pr-2" {...content} />
        </div>
        <div className="shrink-0">{accessory}</div>
      </div>
    </li>
  )
}
