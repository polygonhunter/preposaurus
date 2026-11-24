import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import type { RowContentProps } from './RowContent'
import { RowFooter } from './RowFooter'
import { RowHandle, type RowAction } from './RowHandle'
import { RowStaticBody } from './RowStaticBody'

type RowProps = RowContentProps &
  Readonly<{
    action?: RowAction
    // Eigener Knopf rechts neben Link oder Knopf der Zeile, z. B. „−1“. Er liegt außerhalb der
    // Zeilen-Handlung, weil ein Knopf in einem Link nicht erlaubt ist.
    accessory?: ReactNode
    // Kompakt rückt `accessory` unter den Text, damit Titel und Zweitzeile Platz haben, ab
    // „mittel“ steht er wieder rechts (#284), mit Falz auf dem rechten Bildschirm wieder darunter
    // (#253). Nur für Zeilen ohne eigene Handlung.
    stacksAccessory?: boolean
    // Knopfreihe unter Link oder Knopf der Zeile, wenn rechts kein Platz für mehrere Knöpfe ist.
    // Auch unter einer Zeile ohne Handlung, z. B. eine Auswahl zur Zeile (#294).
    footer?: ReactNode
    // Stabiler Schlüssel der Zeile, an dem useFocusRescue sie nach dem Neuladen wiederfindet
    focusKey?: string | undefined
  }>

// Trennlinie oberhalb jeder Zeile außer der ersten, eingerückt wie der Text.
const SEPARATOR =
  'relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:hairline'
export function Row({
  action,
  accessory,
  stacksAccessory,
  footer,
  focusKey,
  ...content
}: RowProps) {
  // Die gewählte Zeile ist samt Knopf daneben getönt (Vorrat neben dem Detail)
  const isCurrent = action !== undefined && 'href' in action && action.isCurrent === true
  const itemClass = cx(
    SEPARATOR,
    content.icon ? 'before:left-[52px]' : 'before:left-4',
    isCurrent && 'bg-accent/7 shadow-[inset_3px_0_0_var(--color-accent)]',
  )
  const footerRow = footer ? <RowFooter hasIcon={Boolean(content.icon)}>{footer}</RowFooter> : null
  if (!action) {
    return (
      <li className={itemClass} data-focus-row={focusKey}>
        <RowStaticBody accessory={accessory} stacks={stacksAccessory} {...content} />
        {footerRow}
      </li>
    )
  }
  // Mit Knopfreihe darunter braucht es keinen Knopf daneben
  if (footerRow || !accessory) {
    return (
      <li className={itemClass} data-focus-row={focusKey}>
        <RowHandle action={action} {...content} />
        {footerRow}
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
