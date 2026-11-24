import { describe, expect, it } from 'vitest'
import { jobDatabaseFor } from './job-queue'

describe('jobDatabaseFor', () => {
  it('nutzt die Adresse von PostgreSQL mit einer kleinen, benannten Verbindungsgruppe', () => {
    expect(jobDatabaseFor('postgres://app:geheim@db:5432/preposaurus')).toEqual({
      ok: true,
      value: {
        connectionString: 'postgres://app:geheim@db:5432/preposaurus',
        max: 3,
        // pg-boss erkennt seine Verbindungen am Präfix, restore.sh nennt den Worker (#261)
        application_name: 'pgboss:preposaurus-worker',
      },
    })
  })

  it('lehnt PGlite ab, weil der Webserver die Datei allein öffnet', () => {
    expect(jobDatabaseFor('pglite://./.data/dev')).toEqual({ ok: false, error: 'needs-postgres' })
  })
})
