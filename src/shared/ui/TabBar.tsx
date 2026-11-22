'use client'

import { usePathname } from 'next/navigation'
import { MAIN_NAV, MAIN_NAV_LABEL } from './nav-items'
import { TabLink } from './TabLink'

// Tab-Leiste unten für die Stufen kompakt und mittel. Ab „breit“ übernimmt die Seitenleiste.
export function TabBar() {
  const pathname = usePathname()
  return (
    <nav
      aria-label={MAIN_NAV_LABEL}
      className="fixed inset-x-0 bottom-0 z-10 bg-surface pb-safe before:absolute before:inset-x-0 before:top-0 before:hairline breit:hidden"
    >
      <ul className="mx-auto flex h-[50px] max-w-[640px] items-start justify-around px-1">
        {MAIN_NAV.map((item) => (
          <li key={item.href}>
            <TabLink item={item} pathname={pathname} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
