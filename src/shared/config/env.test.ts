import { afterEach, describe, expect, it, vi } from 'vitest'
import { isPatternPageEnabled, loadEnv, isCookieSecure } from './env'

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

  it('nimmt Anthropic ohne Schlüssel in der Umgebung an, weil er in der App liegen kann', () => {
    expect(loadEnv({ ...minimal, AI_PROVIDER: 'anthropic' }).ANTHROPIC_API_KEY).toBeUndefined()
  })

  it('behandelt einen leeren Schlüssel aus der Vorlage als nicht gesetzt', () => {
    const source = { ...minimal, AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: ' ' }

    expect(loadEnv(source).ANTHROPIC_API_KEY).toBeUndefined()
  })

  it('kennt keine Modelle je Rolle mehr, die kommen aus der Zuweisung in der App', () => {
    expect(Object.keys(loadEnv(minimal)).filter((key) => key.startsWith('AI_MODEL'))).toEqual([])
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

  it('liest SHOW_PATTERN_PAGE als Wahrheitswert, Standard aus', () => {
    expect(loadEnv(minimal).SHOW_PATTERN_PAGE).toBe(false)
    expect(loadEnv({ ...minimal, SHOW_PATTERN_PAGE: 'true' }).SHOW_PATTERN_PAGE).toBe(true)
  })
})

describe('isPatternPageEnabled', () => {
  it('zeigt die Musterseite im Dev-Modus immer', () => {
    expect(isPatternPageEnabled({ NODE_ENV: 'development', SHOW_PATTERN_PAGE: false })).toBe(true)
  })

  it('setzt Secure-Cookies nur im Produktionsbuild und dort ohne E2E-Schalter der CI', () => {
    const production = { NODE_ENV: 'production', CI: true } as const
    expect(loadEnv(minimal).E2E_INSECURE_COOKIES).toBe(false)
    expect(isCookieSecure({ ...production, E2E_INSECURE_COOKIES: false })).toBe(true)
    expect(isCookieSecure({ ...production, E2E_INSECURE_COOKIES: true })).toBe(false)
    expect(isCookieSecure({ ...production, E2E_INSECURE_COOKIES: true, CI: false })).toBe(true)
    expect(
      isCookieSecure({ NODE_ENV: 'development', E2E_INSECURE_COOKIES: false, CI: false }),
    ).toBe(false)
  })

  it('lässt E2E_INSECURE_COOKIES im Produktionsbuild nur in der CI zu', () => {
    const insecure = { ...minimal, NODE_ENV: 'production', E2E_INSECURE_COOKIES: 'true' }
    expect(() => loadEnv(insecure)).toThrow(/E2E_INSECURE_COOKIES gilt nur/)
    expect(() => loadEnv({ ...insecure, CI: 'false' })).toThrow(/E2E_INSECURE_COOKIES gilt nur/)
    expect(loadEnv({ ...insecure, CI: 'true' }).CI).toBe(true)
  })

  it('lässt E2E_DEMO_STOCK im Produktionsbuild nur in der CI zu', () => {
    const demo = { ...minimal, NODE_ENV: 'production', E2E_DEMO_STOCK: 'true' }
    expect(loadEnv(minimal).E2E_DEMO_STOCK).toBe(false)
    expect(() => loadEnv(demo)).toThrow(/E2E_DEMO_STOCK gilt nur/)
    expect(loadEnv({ ...demo, CI: 'true' }).E2E_DEMO_STOCK).toBe(true)
    expect(loadEnv({ ...minimal, E2E_DEMO_STOCK: 'true' }).E2E_DEMO_STOCK).toBe(true)
  })

  it('zeigt sie im Produktionsbuild nur mit SHOW_PATTERN_PAGE', () => {
    expect(isPatternPageEnabled({ NODE_ENV: 'production', SHOW_PATTERN_PAGE: false })).toBe(false)
    expect(isPatternPageEnabled({ NODE_ENV: 'production', SHOW_PATTERN_PAGE: true })).toBe(true)
  })
})

describe('loadEnv: SMTP', () => {
  const smtp = { ...minimal, SMTP_HOST: 'smtp.example.org', SMTP_FROM: 'vorrat@example.org' }

  it('lässt Mail ohne SMTP_HOST aus, auch mit leeren Zeilen aus der Vorlage', () => {
    const env = loadEnv({
      ...minimal,
      SMTP_HOST: '',
      SMTP_PORT: '',
      SMTP_SECURE: '',
      SMTP_FROM: '',
    })
    expect(env).toMatchObject({ SMTP_HOST: undefined, SMTP_PORT: 587, SMTP_SECURE: undefined })
  })

  it('liest Port und TLS-Schalter', () => {
    const env = loadEnv({ ...smtp, SMTP_PORT: '465', SMTP_SECURE: 'false' })
    expect(env).toMatchObject({ SMTP_PORT: 465, SMTP_SECURE: false })
  })

  it('verlangt mit SMTP_HOST einen Absender', () => {
    expect(() => loadEnv({ ...minimal, SMTP_HOST: 'smtp.example.org' })).toThrow('SMTP_FROM fehlt')
  })

  it('verlangt Nutzer und Passwort nur zusammen', () => {
    expect(() => loadEnv({ ...smtp, SMTP_USER: 'vorrat' })).toThrow('gehören zusammen')
    expect(loadEnv({ ...smtp, SMTP_USER: 'vorrat', SMTP_PASSWORD: 'geheim' }).SMTP_USER).toBe(
      'vorrat',
    )
  })

  it('lehnt einen ungültigen Port ab', () => {
    expect(() => loadEnv({ ...smtp, SMTP_PORT: '70000' })).toThrow('SMTP_PORT')
  })
})
