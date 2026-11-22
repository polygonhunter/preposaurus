// Rücksprung nach der Anmeldung (#33). Der Pfad kommt aus der Adresse und ist damit eine
// Nutzereingabe: Erlaubt sind nur Pfade innerhalb der App. „//host“ und „/\host“ deuten Browser
// als fremde Adresse (offene Weiterleitung), Steuerzeichen könnten Header verfälschen. Anmelden
// und Einrichten selbst wären eine Schleife.

export const DEFAULT_RETURN_PATH = '/uebersicht'

const MAX_LENGTH = 2048
const PUBLIC_PAGES = ['/anmelden', '/einrichten']
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/
const PATH_END = /^(?:$|[/?#])/

const isPublicPage = (path: string) =>
  PUBLIC_PAGES.some((page) => path.startsWith(page) && PATH_END.test(path.slice(page.length)))

function isInternalPath(path: string): boolean {
  if (!path.startsWith('/') || path.length > MAX_LENGTH) return false
  if (path.startsWith('//') || path.startsWith('/\\')) return false
  return !CONTROL_CHARACTERS.test(path)
}

export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !isInternalPath(value)) return DEFAULT_RETURN_PATH
  return isPublicPage(value) ? DEFAULT_RETURN_PATH : value
}
