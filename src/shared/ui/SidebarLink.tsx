import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'
import { Icon } from './Icon'
import type { NavItem } from './nav-items'

const ITEM =
  'flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-body transition-colors duration-150 ease-out'

type SidebarLinkProps = Readonly<{
  item: NavItem
  isCurrent: boolean
  // Zähler rechts („Bald fällig 5“), ohne Wert oder bei 0 entfällt er
  count?: number | undefined
  // Unterziel: eingerückt auf die Höhe der Beschriftung, ohne Piktogramm
  isSub?: boolean
}>

export function SidebarLink({ item, isCurrent, count, isSub = false }: SidebarLinkProps) {
  return (
    <Link
      href={item.href}
      aria-current={isCurrent ? 'page' : undefined}
      className={cx(
        ITEM,
        isSub && 'pl-[42px]',
        isCurrent ? 'bg-fill font-semibold' : 'hover:bg-fill',
      )}
    >
      {isSub ? null : <Icon name={item.icon} size={22} className="text-fg2" />}
      <span className="min-w-0 flex-1">{item.label}</span>
      {/* Leerzeichen, damit der Name „Bald fällig 5“ lautet wie bei den Zustands-Chips */}
      {count === undefined || count === 0 ? null : (
        <>
          {' '}
          <span className="text-callout font-normal text-fg2">{count}</span>
        </>
      )}
    </Link>
  )
}
