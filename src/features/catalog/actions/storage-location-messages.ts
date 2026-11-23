// Sätze der Lagerort-Actions (#77), ruhig und ohne Ausrufezeichen.
import type { NameError } from '../application/storage-locations'

export const LOCATION_GONE = 'Diesen Lagerort gibt es nicht mehr. Bitte lade die Seite neu.'

export const LOCATION_IN_USE =
  'Hier liegen noch Produkte. Blendet den Ort stattdessen aus, dann bleibt er an den Produkten stehen.'

export function locationNameError(error: NameError): string {
  return error.isHidden
    ? 'Diesen Lagerort gibt es schon, er ist ausgeblendet. Ihr könnt ihn unter „Ausgeblendet“ wieder einblenden.'
    : 'Diesen Lagerort gibt es schon.'
}
