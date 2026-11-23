// Zeitpunkte in deutscher Zeit, z. B. „23.11.2026, 08:30“. Eine Stelle für alle Anzeigen.
const GERMAN_DATE_TIME = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatGermanDateTime = (time: Date): string => GERMAN_DATE_TIME.format(time)
