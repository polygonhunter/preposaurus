// Gemeinsames für die Foto-Routen: Testbilder (erzeugt, nie echte Fotos), Anfragen und Nutzer.
import sharp from 'sharp'
import { buildHousehold, buildUser } from '../../../db/seeds/factories'
import type { Database } from '../../../src/server/db/connection'
import { users } from '../../../src/server/db/schema/account'
import { households } from '../../../src/server/db/schema/household'
import type { AccessError } from '../../../src/server/auth/guards'
import type { SessionUser } from '../../../src/server/auth/session'
import type { Result } from '../../../src/shared/lib/result'

const ORIGIN = 'https://preposaurus.test'

/** KI in Tests immer als Fake (UMSETZUNG Grundentscheidung 12). */
export const FAKE_AI_ENV = {
  APP_SECRET: 'test-nur-zum-testen-kein-geheimnis-0000',
  AI_PROVIDER: 'fake',
  ANTHROPIC_API_KEY: undefined,
} as const

type Session = Result<SessionUser, AccessError> | null

/** Ersatz für server/auth/guards: Sitzung aus dem Test, Haushaltsprüfung wie im Original. */
export function fakeGuards(session: () => Session) {
  return {
    requireUser: () => Promise.resolve(session()),
    requireHouseholdUser: () => {
      const current = session()
      if (current?.ok !== true || current.value.householdId !== null)
        return Promise.resolve(current)
      return Promise.resolve({ ok: false, error: { kind: 'forbidden' } })
    },
  }
}

/** Einfarbiges JPEG mit GPS im EXIF, wie ein Handyfoto. */
export async function testJpeg(width = 800, height = 600): Promise<Uint8Array> {
  const data = await sharp({ create: { width, height, channels: 3, background: '#7a9' } })
    .withExif({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '52/1 31/1 0/1' } })
    .jpeg()
    .toBuffer()
  return new Uint8Array(data)
}

type Query = Record<string, string>

export function uploadRequest(body: Uint8Array, query: Query, headers: HeadersInit = {}) {
  const url = new URL('/api/photos', ORIGIN)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  return new Request(url, { method: 'POST', body: new Uint8Array(body), headers })
}

export function photoRequest(id: string, variante?: string) {
  const url = new URL(`/api/photos/${id}`, ORIGIN)
  if (variante !== undefined) url.searchParams.set('variante', variante)
  return [new Request(url), { params: Promise.resolve({ id }) }] as const
}

export function sessionUser(id: string, householdId: string | null): SessionUser {
  return { id, name: 'Alex', username: `nutzer_${id.slice(0, 8)}`, role: 'admin', householdId }
}

/** Weiterer Nutzer im selben oder in einem neuen Haushalt. */
export async function insertUser(db: Database, householdId?: string): Promise<SessionUser> {
  let home = householdId
  if (home === undefined) {
    const household = buildHousehold()
    await db.insert(households).values(household)
    home = household.id
  }
  const user = buildUser({ householdId: home })
  await db.insert(users).values(user)
  return sessionUser(user.id, home)
}
