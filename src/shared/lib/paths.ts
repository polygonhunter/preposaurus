// Ein Navigationsziel gilt auch auf seinen Unterseiten als aktiv (/vorrat/reis → Vorrat).
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Das genaueste aktive Ziel, wenn Ziele ineinanderliegen (Übersicht und darunter Bald fällig in
 * der Seitenleiste). So trägt nur ein Link `aria-current="page"`.
 */
export function mostSpecificActivePath(pathname: string, hrefs: readonly string[]): string | null {
  return hrefs
    .filter((href) => isActivePath(pathname, href))
    .reduce<string | null>(
      (best, href) => (best === null || href.length > best.length ? href : best),
      null,
    )
}
