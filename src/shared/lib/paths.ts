// Ein Navigationsziel gilt auch auf seinen Unterseiten als aktiv (/vorrat/reis → Vorrat).
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
