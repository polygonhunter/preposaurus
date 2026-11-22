// Es gibt keine Route /api/auth/[...all]. Kommt sie doch, darf auth.handler nur erlaubte Pfade
// bedienen (Sicherheits-Review #138). Der Test sichert diesen Fall schon jetzt ab.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuth, type Auth } from '../../../src/server/auth/auth'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createTestAuth } from './auth-fixtures'

const BASE = 'http://localhost:3000/api/auth'

const endpointPaths = (auth: Auth) =>
  Object.values(auth.api).map((endpoint) => (endpoint as { path: string }).path)

async function statusOf(auth: Auth, path: string, method: 'GET' | 'POST'): Promise<number> {
  const response = await auth.handler(
    new Request(`${BASE}${path}`, {
      method,
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      ...(method === 'POST' ? { body: JSON.stringify({ username: 'alex', password: 'x' }) } : {}),
    }),
  )
  return response.status
}

describe('Erlaubt-Liste für HTTP-Routen', () => {
  let testDb: TestDb

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('lehnt ohne erlaubte Pfade jede Route von Better Auth mit 404 ab', async () => {
    const auth = createTestAuth(testDb.db)
    const paths = endpointPaths(auth)

    expect(paths).toEqual(expect.arrayContaining(['/sign-in/username', '/change-password']))
    for (const path of paths) {
      expect(await statusOf(auth, path, 'POST'), path).toBe(404)
      expect(await statusOf(auth, path, 'GET'), path).toBe(404)
    }
  })

  it('lehnt auch unbekannte Pfade und Varianten mit Schrägstrich ab', async () => {
    const auth = createTestAuth(testDb.db)

    expect(await statusOf(auth, '/sign-in/username/', 'POST')).toBe(404)
    expect(await statusOf(auth, '/gibt-es-nicht', 'GET')).toBe(404)
  })

  it('bedient nur einen ausdrücklich erlaubten Pfad', async () => {
    const auth = createAuth({
      db: testDb.db,
      secret: 'test-nur-zum-testen-kein-geheimnis-0000',
      clientIpHeader: 'x-forwarded-for',
      secureCookies: true,
      log: () => undefined,
      allowedHttpPaths: ['/ok'],
    })

    expect(await statusOf(auth, '/ok', 'GET')).toBe(200)
    expect(await statusOf(auth, '/sign-in/username', 'POST')).toBe(404)
  })
})
