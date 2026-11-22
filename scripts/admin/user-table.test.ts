import { describe, expect, it } from 'vitest'
import { formatUserTable } from './user-table'

describe('Tabelle für nutzer-auflisten', () => {
  it('richtet die Spalten aus und zeigt die letzte Anmeldung in deutscher Zeit', () => {
    const table = formatUserTable([
      {
        username: 'alex',
        name: 'Alex Beispiel',
        role: 'admin',
        isActive: true,
        lastSignInAt: new Date('2026-11-20T08:30:00Z'),
      },
      { username: 'sam.k', name: 'Sam', role: 'mitglied', isActive: false, lastSignInAt: null },
    ])

    expect(table.split('\n')).toEqual([
      'Benutzername  Anzeigename    Rolle     Aktiv  Letzte Anmeldung',
      'alex          Alex Beispiel  admin     ja     20.11.2026, 09:30',
      'sam.k         Sam            mitglied  nein   noch nie',
    ])
  })

  it('sagt freundlich, wenn es noch keine Nutzer gibt', () => {
    expect(formatUserTable([])).toBe('Es gibt noch keine Nutzer.')
  })
})
