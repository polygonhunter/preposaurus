import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'
import { Icon } from './Icon'
import { RowContent, type RowContentProps } from './RowContent'

type RowAction = Readonly<{ href: string }> | Readonly<{ onClick: () => void }>

type RowProps = RowContentProps & Readonly<{ action?: RowAction }>

// Trennlinie oberhalb jeder Zeile außer der ersten, eingerückt wie der Text.
const SEPARATOR =
  'relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:hairline'
const INNER = 'flex min-h-11 w-full items-center gap-3 px-4 py-[11px] text-left'
const PRESSABLE = cx(INNER, 'transition-colors duration-150 ease-out active:bg-fill')

export function Row({ action, ...content }: RowProps) {
  const itemClass = cx(SEPARATOR, content.icon ? 'before:left-[52px]' : 'before:left-4')
  if (!action) {
    return (
      <li className={cx(itemClass, INNER)}>
        <RowContent {...content} />
      </li>
    )
  }
  return (
    <li className={itemClass}>
      {'href' in action ? (
        <Link href={action.href} className={PRESSABLE}>
          <RowContent {...content} />
          <Icon name="chevron" size={18} className="shrink-0 text-fg2" />
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} className={PRESSABLE}>
          <RowContent {...content} />
        </button>
      )}
    </li>
  )
}
