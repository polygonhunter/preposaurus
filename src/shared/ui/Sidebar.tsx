'use client'

import { usePathname } from 'next/navigation'
import { MAIN_NAV, MAIN_NAV_LABEL, SETTINGS_NAV } from './nav-items'
import { SidebarLink } from './SidebarLink'

// Seitenleiste ab „breit“ (DESIGN_SYSTEM §6): dieselben Ziele wie die Tab-Leiste, darunter Einstellungen.
export function Sidebar() {
  const pathname = usePathname()
  return (
    <nav
      aria-label={MAIN_NAV_LABEL}
      className="sticky top-0 hidden h-dvh w-[216px] shrink-0 flex-col justify-between border-r border-line bg-bg px-2.5 py-3.5 breit:flex"
    >
      <ul className="flex flex-col gap-0.5">
        {MAIN_NAV.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} pathname={pathname} />
          </li>
        ))}
      </ul>
      <SidebarLink item={SETTINGS_NAV} pathname={pathname} />
    </nav>
  )
}
