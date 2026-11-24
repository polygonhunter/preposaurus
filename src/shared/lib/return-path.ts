// Ziel für „Abbrechen“ im Erfassen (#285): die letzte Seite im App-Rahmen, je Tab im
// sessionStorage. Nur eigene Pfade, nie eine fremde Adresse. Ohne gemerkte Seite die Übersicht.
const RETURN_PATH_KEY = 'preposaurus:ruecksprung'

export const FALLBACK_RETURN_PATH = '/uebersicht'

// Browser streichen Tab und Zeilenumbruch und lesen „\“ als „/“: Aus „/\t/host“ würde „//host“
const UNSAFE_CHARACTER = /[\u0000-\u001f\u007f\\]/

/** Ein Pfad dieser App: beginnt mit genau einem „/“ (kein „//host“, keine volle Adresse). */
function isOwnPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !UNSAFE_CHARACTER.test(path)
}

export function rememberReturnPath(path: string): void {
  if (!isOwnPath(path)) return
  try {
    sessionStorage.setItem(RETURN_PATH_KEY, path)
  } catch {
    // Speicher gesperrt (privates Surfen): „Abbrechen“ führt dann zur Übersicht.
  }
}

export function readReturnPath(): string {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY)
    return path !== null && isOwnPath(path) ? path : FALLBACK_RETURN_PATH
  } catch {
    // Speicher gesperrt: wie ohne gemerkte Seite
    return FALLBACK_RETURN_PATH
  }
}
