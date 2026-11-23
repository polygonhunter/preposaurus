import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parsePocArgs } from './cli-options'
import { connectRecognizer, MISSING_KEY } from './connection'
import { parseExpectations, rolesIn } from './expectations'
import { planVariants } from './run-plan'

describe('parsePocArgs', () => {
  it('vergleicht ohne Angaben Haiku und Sonnet für alle Rollen, MHD mit Standard-Strategie', () => {
    const parsed = parsePocArgs([])
    expect(parsed.ok && parsed.value).toMatchObject({
      folder: 'poc',
      roles: null,
      withStandard: true,
      modelsByRole: { mhd: ['claude-haiku-5-5', 'claude-sonnet-5-5'] },
    })
  })

  it('nimmt Modelle je Rolle, Kurznamen und volle IDs', () => {
    const parsed = parsePocArgs(['--modelle', 'haiku', '--modelle-mhd', 'opus,claude-sonnet-5-5'])
    expect(parsed.ok && parsed.value.modelsByRole).toEqual({
      verpackung: ['claude-haiku-5-5'],
      naehrwerte: ['claude-haiku-5-5'],
      mhd: ['claude-opus-5-5', 'claude-sonnet-5-5'],
    })
  })

  it('meldet unbekannte Modelle, Rollen und Optionen', () => {
    expect(parsePocArgs(['--modelle', 'gpt'])).toEqual({
      ok: false,
      error: 'Unbekanntes Modell: gpt',
    })
    expect(parsePocArgs(['--rollen', 'mhd,preis'])).toEqual({
      ok: false,
      error: 'Unbekannte Rolle: preis',
    })
    expect(parsePocArgs(['--modelle', ' , '])).toEqual({
      ok: false,
      error: 'Keine Modelle angegeben.',
    })
    const unknown = parsePocArgs(['--schnell'])
    expect(!unknown.ok && unknown.error).toContain('Aufruf: npm run poc:recognition')
  })
})

describe('planVariants', () => {
  it('misst je Modell einzeln und beim MHD zusätzlich Haiku mit Sonnet-Zweitversuch', () => {
    const variants = planVariants({
      roles: ['verpackung', 'mhd'],
      modelsByRole: { verpackung: ['m1'], naehrwerte: [], mhd: ['m1', 'm2'] },
      withStandard: true,
    })
    expect(variants).toEqual([
      { role: 'verpackung', label: 'm1', models: { verpackung: 'm1' } },
      { role: 'mhd', label: 'm1', models: { mhd: 'm1' } },
      { role: 'mhd', label: 'm2', models: { mhd: 'm2' } },
      {
        role: 'mhd',
        label: 'Standard: claude-haiku-5-5, Zweitversuch claude-sonnet-5-5',
        models: { mhd: 'claude-haiku-5-5', mhd_zweitversuch: 'claude-sonnet-5-5' },
      },
    ])
  })

  it('lässt die Standard-Strategie auf Wunsch weg', () => {
    const variants = planVariants({
      roles: ['mhd'],
      modelsByRole: { verpackung: [], naehrwerte: [], mhd: ['m1'] },
      withStandard: false,
    })
    expect(variants).toHaveLength(1)
  })
})

describe('parseExpectations', () => {
  it('akzeptiert die dokumentierte Beispiel-Datei', () => {
    const example = readFileSync('docs/poc/erwartungen.beispiel.json', 'utf8')
    const parsed = parseExpectations(JSON.parse(example))
    expect(parsed.ok && rolesIn(parsed.value)).toEqual(['verpackung', 'naehrwerte', 'mhd'])
  })

  it('setzt eine Standard-Toleranz und lehnt Pfade außerhalb von poc/fotos ab', () => {
    const photo = { datei: 'a.jpg', rolle: 'mhd', erwartet: { datum: '2027' } }
    const parsed = parseExpectations({ fotos: [photo] })
    expect(parsed.ok && parsed.value.toleranz).toEqual({ relativ: 0.05, absolut: 0.5 })
    const outside = parseExpectations({ fotos: [{ ...photo, datei: '../geheim.jpg' }] })
    expect(!outside.ok && outside.error).toContain('ohne „..“')
  })

  it('lehnt falsche Datumsformate und doppelte Einträge ab', () => {
    const photo = { datei: 'a.jpg', rolle: 'mhd', erwartet: { datum: '14.03.2028' } }
    expect(parseExpectations({ fotos: [photo] }).ok).toBe(false)
    const valid = { ...photo, erwartet: { datum: null } }
    const twice = parseExpectations({ fotos: [valid, valid] })
    expect(!twice.ok && twice.error).toBe('Foto doppelt eingetragen: a.jpg (mhd)')
  })
})

describe('connectRecognizer', () => {
  it('bricht ohne ANTHROPIC_API_KEY mit klarer Meldung ab', () => {
    expect(connectRecognizer({ AI_PROVIDER: undefined, ANTHROPIC_API_KEY: undefined })).toEqual({
      ok: false,
      error: MISSING_KEY,
    })
  })

  it('nutzt mit Schlüssel den Anthropic-Adapter und bei AI_PROVIDER=fake den Fake', () => {
    const real = connectRecognizer({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'sk-test' })
    expect(real.ok && real.value.isDryRun).toBe(false)
    const fake = connectRecognizer({ AI_PROVIDER: 'fake', ANTHROPIC_API_KEY: undefined })
    expect(fake.ok && fake.value.isDryRun).toBe(true)
  })
})
