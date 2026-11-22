import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'
import { isActivePath } from '@/shared/lib/paths'
import { Icon } from './Icon'
import type { NavItem } from './nav-items'

const ITEM =
  'flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-body transition-colors duration-150 ease-out'

type SidebarLinkProps = Readonly<{ item: NavItem; pathname: string }>

export function SidebarLink({ item, pathname }: SidebarLinkProps) {
  const isActive = isActivePath(pathname, item.href)
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cx(ITEM, isActive ? 'bg-fill font-semibold' : 'hover:bg-fill')}
    >
      <Icon name={item.icon} size={22} className={item.isAction ? 'text-accent' : 'text-fg2'} />
      {item.label}
    </Link>
  )
}
