// Regeln des Service Workers (M10-01/M10-02, #81/#82) als reine Funktionen, damit sie ohne
// Browser testbar sind. Grundsatz: Gespeichert werden nur Next-Dateien mit Hash im Namen, Icons
// und die Seiten Übersicht und Vorrat des angemeldeten Nutzers. Nie /api, nie Server Actions
// (POST), nie RSC-Abrufe und nie Anmelden oder Einrichten.

/** Präfix aller Caches der App, damit beim Abmelden nichts Fremdes gelöscht wird. */
const CACHE_PREFIX = 'preposaurus-'
const PAGE_CACHE_PREFIX = `${CACHE_PREFIX}seiten-`
const STATIC_CACHE_PREFIX = `${CACHE_PREFIX}dateien-`

/** Seiten mit Haushaltsdaten, die ohne Verbindung den letzten Stand zeigen (UMSETZUNG M10-02). */
const OFFLINE_PAGE_PREFIXES = ['/uebersicht', '/vorrat'] as const

/** Hier endet jede Sitzung: Abmelden, abgelaufene Sitzung, neue Anmeldung. */
const SESSION_BOUNDARY_PATHS = ['/anmelden', '/einrichten'] as const

const STATIC_PATH_PREFIXES = ['/_next/static/', '/icons/'] as const
const STATIC_PATHS = ['/icon.svg', '/apple-icon.png', '/manifest.webmanifest'] as const

type CacheNames = Readonly<{ pages: string; files: string }>

export function cacheNamesFor(version: string): CacheNames {
  return { pages: `${PAGE_CACHE_PREFIX}${version}`, files: `${STATIC_CACHE_PREFIX}${version}` }
}

function isAppCache(name: string): boolean {
  return name.startsWith(CACHE_PREFIX)
}

/** Seiten-Caches enthalten Haushaltsdaten und werden beim Sitzungsende gelöscht. */
export function isPageCache(name: string): boolean {
  return name.startsWith(PAGE_CACHE_PREFIX)
}

/** Alte Versionen: Ihre Seiten verweisen auf Dateien, die es nach einem Update nicht mehr gibt. */
export function outdatedCaches(names: readonly string[], current: CacheNames): string[] {
  return names.filter(
    (name) => isAppCache(name) && name !== current.pages && name !== current.files,
  )
}

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

function isSessionBoundaryPath(pathname: string): boolean {
  return SESSION_BOUNDARY_PATHS.some((path) => matchesPrefix(pathname, path))
}

function isOfflinePagePath(pathname: string): boolean {
  return OFFLINE_PAGE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
}

type RequestFacts = Readonly<{
  method: string
  url: URL
  origin: string
  mode: string
  isRsc: boolean
}>

/** pages: Netz zuerst, sonst letzter Stand · files: Cache zuerst · network: nicht anfassen */
type CacheStrategy = 'pages' | 'files' | 'network'

function isStaticPath(pathname: string): boolean {
  return (
    STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (STATIC_PATHS as readonly string[]).includes(pathname)
  )
}

export function strategyFor({ method, url, origin, mode, isRsc }: RequestFacts): CacheStrategy {
  if (method !== 'GET' || url.origin !== origin || isRsc) return 'network'
  if (url.searchParams.has('_rsc') || url.pathname.startsWith('/api/')) return 'network'
  if (isStaticPath(url.pathname)) return 'files'
  return mode === 'navigate' ? 'pages' : 'network'
}

type PageResponseFacts = Readonly<{
  ok: boolean
  redirected: boolean
  contentType: string | null
  finalUrl: URL
}>

/** Nur vollständige HTML-Seiten aus Übersicht und Vorrat, keine Weiterleitung zur Anmeldung. */
export function shouldStorePage(facts: PageResponseFacts): boolean {
  if (!facts.ok || facts.redirected) return false
  if (!(facts.contentType ?? '').startsWith('text/html')) return false
  return isOfflinePagePath(facts.finalUrl.pathname)
}

/**
 * Adressen, die die Seite beim ersten Besuch nachreicht (vor der Installation lief alles am
 * Service Worker vorbei). Alles andere verwirft er, auch wenn eine Nachricht es verlangt.
 */
export function warmStrategyFor(url: URL, origin: string): CacheStrategy {
  if (url.origin !== origin || url.searchParams.has('_rsc')) return 'network'
  if (isStaticPath(url.pathname)) return 'files'
  return isOfflinePagePath(url.pathname) ? 'pages' : 'network'
}

/** Die Antwort zeigt Anmelden oder Einrichten: Daten der letzten Sitzung müssen weg. */
export function endsSession(finalUrl: URL): boolean {
  return isSessionBoundaryPath(finalUrl.pathname)
}
