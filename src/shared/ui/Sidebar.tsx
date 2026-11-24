'use client'

import { usePathname } from 'next/navigation'
import { mostSpecificActivePath } from '@/shared/lib/paths'
import {
  CAPTURE_NAV,
  MAIN_NAV_LABEL,
  SETTINGS_NAV,
  SIDEBAR_NAV,
  isSubItem,
  type NavCounts,
} from './nav-items'
import { SidebarCaptureLink } from './SidebarCaptureLink'
import { SidebarLink } from './SidebarLink'

type SidebarProps = Readonly<{ counts: NavCounts }>

const SIDEBAR_HREFS = [CAPTURE_NAV, ...SIDEBAR_NAV, SETTINGS_NAV].map((item) => item.href)

// Seitenleiste ab „breit“ (DESIGN_SYSTEM §6, UX_KONZEPT §6): oben „Erfassen“ als Knopf, dann
// dieselben Ziele wie die Tab-Leiste mit Zählern, Bald fällig eingerückt unter Übersicht, unten
// Einstellungen. Nur das genaueste Ziel gilt als aktuelle Seite.
export function Sidebar({ counts }: SidebarProps) {
  const current = mostSpecificActivePath(usePathname(), SIDEBAR_HREFS)
  return (
    <nav
      aria-label={MAIN_NAV_LABEL}
      className="sticky top-0 hidden h-dvh w-(--seitenleiste) shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-bg px-2.5 py-3.5 breit:flex"
    >
      <div className="flex flex-col gap-3">
        <SidebarCaptureLink isCurrent={current === CAPTURE_NAV.href} />
        <ul className="flex flex-col gap-0.5">
          {SIDEBAR_NAV.map((item) => (
            <li key={item.href}>
              <SidebarLink
                item={item}
                isCurrent={current === item.href}
                count={item.countKey === undefined ? undefined : counts?.[item.countKey]}
                isSub={isSubItem(item)}
              />
            </li>
          ))}
        </ul>
      </div>
      <SidebarLink item={SETTINGS_NAV} isCurrent={current === SETTINGS_NAV.href} />
    </nav>
  )
}
