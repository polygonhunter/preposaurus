import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'
import { Icon } from './Icon'
import { RowContent, type RowContentProps } from './RowContent'

export type RowAction = Readonly<{ href: string }> | Readonly<{ onClick: () => void }>

const PRESSABLE =
  'flex min-h-11 w-full items-center gap-3 px-4 py-[11px] text-left transition-colors duration-150 ease-out active:bg-fill'

type RowHandleProps = RowContentProps & Readonly<{ action: RowAction; className?: string }>

// Die antippbare Fläche einer Row: Link mit Chevron oder Knopf.
export function RowHandle({ action, className, ...content }: RowHandleProps) {
  if ('href' in action) {
    return (
      <Link href={action.href} className={cx(PRESSABLE, className)}>
        <RowContent {...content} />
        <Icon name="chevron" size={18} className="shrink-0 text-fg2" />
      </Link>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className={cx(PRESSABLE, className)}>
      <RowContent {...content} />
    </button>
  )
}
