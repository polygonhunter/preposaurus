import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'
import { isActivePath } from '@/shared/lib/paths'
import { Icon } from './Icon'
import type { NavItem } from './nav-items'

const TAB = 'flex min-h-11 w-16 flex-col items-center gap-[3px] rounded-md text-tab'

type TabLinkProps = Readonly<{ item: NavItem; pathname: string }>

export function TabLink({ item, pathname }: TabLinkProps) {
  const isActive = isActivePath(pathname, item.href)
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        TAB,
        item.isAction ? 'pt-0.5' : 'pt-1.5',
        isActive ? 'text-accent' : 'text-fg2',
      )}
    >
      {item.isAction ? (
        <span className="grid size-[46px] place-items-center rounded-full bg-accent text-on-accent">
          <Icon name={item.icon} size={26} />
          <span className="sr-only">{item.label}</span>
        </span>
      ) : (
        <>
          <Icon name={item.icon} size={26} />
          {item.label}
        </>
      )}
    </Link>
  )
}
