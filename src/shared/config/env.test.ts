import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadEnv } from './env'

const minimal = { DATABASE_URL: 'pglite://./.data/dev' }

describe('loadEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('setzt Standardwerte, wenn nur die Pflichtvariable da ist', () => {
    expect(loadEnv(minimal)).toMatchObject({
      AI_PROVIDER: 'fake',
      LOG_LEVEL: 'info',
      AI_MODEL_PACKAGING: 'claude-sonnet-5-5',
      AI_MODEL_NUTRITION: 'claude-sonnet-5-5',
      AI_MODEL_BEST_BEFORE: 'claude-sonnet-5-5',
    })
  })

  it('meldet klar, wenn eine Pflichtvariable fehlt', () => {
    expect(() => loadEnv({})).toThrow('DATABASE_URL fehlt. Eine Vorlage steht in .env.example.')
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

    expect(loadEnv().DATABASE_URL).toBe('postgres://localhost/preposaurus')
  })
})
