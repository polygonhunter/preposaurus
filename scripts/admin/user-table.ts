// Tabelle für nutzer-auflisten: feste Spalten, mit Leerzeichen ausgerichtet, damit sie in jedem
// Terminal lesbar ist. Zeiten in deutscher Zeit wie in der App.
import type { UserOverview } from '../../src/features/auth/data/emergency-user-repository'

const HEADER = ['Benutzername', 'Anzeigename', 'Rolle', 'Aktiv', 'Letzte Anmeldung'] as const
const COLUMN_GAP = '  '

const berlinTime = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  dateStyle: 'medium',
  timeStyle: 'short',
})

function toCells(user: UserOverview): string[] {
  return [
    user.username,
    user.name,
    user.role,
    user.isActive ? 'ja' : 'nein',
    user.lastSignInAt === null ? 'noch nie' : berlinTime.format(user.lastSignInAt),
  ]
}

function columnWidths(rows: readonly (readonly string[])[]): number[] {
  return HEADER.map((_, column) => Math.max(...rows.map((row) => row[column]?.length ?? 0)))
}

export function formatUserTable(users: readonly UserOverview[]): string {
  if (users.length === 0) return 'Es gibt noch keine Nutzer.'
  const rows = [[...HEADER], ...users.map(toCells)]
  const widths = columnWidths(rows)
  return rows
    .map((row) =>
      row
        .map((cell, column) => cell.padEnd(widths[column] ?? 0))
        .join(COLUMN_GAP)
        .trimEnd(),
    )
    .join('\n')
}
