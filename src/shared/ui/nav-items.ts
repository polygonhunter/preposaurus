// Ziele des App-Rahmens (UX_KONZEPT §6): gleiche Namen und Reihenfolge auf allen Geräten.
import type { IconName } from './icon-paths'

export type NavItem = Readonly<{
  href: string
  label: string
  icon: IconName
  // Erfassen ist eine Handlung, kein Bereich: runder Akzent-Knopf in der Mitte der Tab-Leiste
  isAction?: boolean
}>

export const MAIN_NAV: readonly NavItem[] = [
  { href: '/uebersicht', label: 'Übersicht', icon: 'overview' },
  { href: '/vorrat', label: 'Vorrat', icon: 'stock' },
  { href: '/neu', label: 'Erfassen', icon: 'plus', isAction: true },
  { href: '/nachkaufen', label: 'Nachkaufen', icon: 'cart' },
  { href: '/statistik', label: 'Statistik', icon: 'chart' },
]

export const SETTINGS_NAV: NavItem = {
  href: '/einstellungen',
  label: 'Einstellungen',
  icon: 'gear',
}

export const MAIN_NAV_LABEL = 'Hauptnavigation'
