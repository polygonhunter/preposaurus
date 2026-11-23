// Ziele des App-Rahmens (UX_KONZEPT §6): gleiche Namen und Reihenfolge auf allen Geräten.
import type { IconName } from './icon-paths'

/** Zähler der Seitenleiste ab „breit“ (DESIGN_SYSTEM §6), null ohne Haushalt */
export type NavCounts = Readonly<{ due: number; restock: number }> | null

export type NavItem = Readonly<{
  href: string
  label: string
  icon: IconName
  // Erfassen ist eine Handlung, kein Bereich: runder Akzent-Knopf in der Mitte der Tab-Leiste
  isAction?: boolean
  // Zähler rechts in der Seitenleiste, z. B. „Bald fällig 5“
  countKey?: keyof NonNullable<NavCounts>
}>

const OVERVIEW_NAV: NavItem = { href: '/uebersicht', label: 'Übersicht', icon: 'overview' }
const STOCK_NAV: NavItem = { href: '/vorrat', label: 'Vorrat', icon: 'stock' }
const RESTOCK_NAV: NavItem = {
  href: '/nachkaufen',
  label: 'Nachkaufen',
  icon: 'cart',
  countKey: 'restock',
}
const STATISTICS_NAV: NavItem = { href: '/statistik', label: 'Statistik', icon: 'chart' }

export const CAPTURE_NAV: NavItem = {
  href: '/neu',
  label: 'Erfassen',
  icon: 'plus',
  isAction: true,
}

// Bald fällig steht in der Seitenleiste eingerückt unter Übersicht (UX_KONZEPT §6, D13)
const DUE_NAV: NavItem = {
  href: '/uebersicht/bald-faellig',
  label: 'Bald fällig',
  icon: 'calendar',
  countKey: 'due',
}

export const MAIN_NAV: readonly NavItem[] = [
  OVERVIEW_NAV,
  STOCK_NAV,
  CAPTURE_NAV,
  RESTOCK_NAV,
  STATISTICS_NAV,
]

/** Seitenleiste ab „breit“: Erfassen steht als Knopf darüber, Bald fällig eingerückt dazwischen */
export const SIDEBAR_NAV: readonly NavItem[] = [
  OVERVIEW_NAV,
  DUE_NAV,
  STOCK_NAV,
  RESTOCK_NAV,
  STATISTICS_NAV,
]

/** Unterziel der Seitenleiste, eingerückt ohne Piktogramm */
export const isSubItem = (item: NavItem) => item === DUE_NAV

/** Ziel des Tastenkürzels „/“: die Suche im Vorrat */
export const SEARCH_HREF = STOCK_NAV.href

export const SETTINGS_NAV: NavItem = {
  href: '/einstellungen',
  label: 'Einstellungen',
  icon: 'gear',
}

export const MAIN_NAV_LABEL = 'Hauptnavigation'
