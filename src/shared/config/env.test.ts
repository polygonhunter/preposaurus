import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadEnv } from './env'

const SECRET = 'x'.repeat(32)
const minimal = { DATABASE_URL: 'pglite://./.data/dev', APP_SECRET: SECRET }

describe('loadEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('setzt Standardwerte, wenn nur die Pflichtvariablen da sind', () => {
    expect(loadEnv(minimal)).toMatchObject({
      CLIENT_IP_HEADER: 'x-forwarded-for',
      AI_PROVIDER: 'fake',
      LOG_LEVEL: 'info',
      AI_MODEL_PACKAGING: 'claude-haiku-5-5',
      AI_MODEL_NUTRITION: 'claude-haiku-5-5',
      AI_MODEL_BEST_BEFORE: 'claude-haiku-5-5',
      PHOTO_STORAGE_DIR: './.data/fotos',
    })
  })

  it('meldet klar, wenn eine Pflichtvariable fehlt', () => {
    expect(() => loadEnv({})).toThrow('DATABASE_URL fehlt. Eine Vorlage steht in .env.example.')
  })

  it('verlangt APP_SECRET', () => {
    expect(() => loadEnv({ DATABASE_URL: minimal.DATABASE_URL })).toThrow('APP_SECRET fehlt')
  })

  it('lehnt ein APP_SECRET unter 32 Zeichen ab', () => {
    expect(() => loadEnv({ ...minimal, APP_SECRET: 'x'.repeat(31) })).toThrow(
      'mindestens 32 Zeichen',
    )
  })

  it('normalisiert den IP-Header auf Kleinbuchstaben', () => {
    expect(loadEnv({ ...minimal, CLIENT_IP_HEADER: ' X-Real-IP ' }).CLIENT_IP_HEADER).toBe(
      'x-real-ip',
    )
  })

  it('lehnt eine Datenbank-URL mit unbekanntem Schema ab', () => {
    expect(() => loadEnv({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      'postgres://, postgresql:// oder pglite://',
    )
  })

  it('verlangt einen API-Schlüssel, wenn Anthropic gewählt ist', () => {
    expect(() => loadEnv({ ...minimal, AI_PROVIDER: 'anthropic' })).toThrow(
      'ANTHROPIC_API_KEY fehlt',
    )
  })

  it('behandelt einen leeren Schlüssel aus der Vorlage als nicht gesetzt', () => {
    const source = { ...minimal, AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: ' ' }

    expect(() => loadEnv(source)).toThrow('ANTHROPIC_API_KEY fehlt')
  })

  it('nimmt Anthropic mit Schlüssel an', () => {
    const source = { ...minimal, AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'test' }

    expect(loadEnv(source).AI_PROVIDER).toBe('anthropic')
  })

  it('liest ohne Argument process.env', () => {
    vi.stubEnv('DATABASE_URL', 'postgres://localhost/preposaurus')
    vi.stubEnv('APP_SECRET', SECRET)

    expect(loadEnv().DATABASE_URL).toBe('postgres://localhost/preposaurus')
  })
})
