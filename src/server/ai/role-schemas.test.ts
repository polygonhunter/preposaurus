import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AI_ROLES, type AiRole } from '@/shared/config/ai-roles'
import { parseAnswer, schemaForRole } from './role-schemas'
import type { RoleContexts } from './vision-recognizer'

const FOOD_TYPES = [
  { key: 'spaghetti', name: 'Spaghetti' },
  { key: 'linsen_getrocknet', name: 'Linsen getrocknet' },
]

const CONTEXTS: RoleContexts = {
  verpackung: { foodTypes: FOOD_TYPES },
  naehrwerte: {},
  naehrwerte_schaetzen: { foodType: null, productName: null },
  mhd: {},
  mhd_zweitversuch: {},
  mhd_schaetzen: { foodType: null, productName: null },
}

const packaging = {
  bezeichnung: 'Spaghetti',
  lebensmittelart: 'spaghetti',
  behaelter: 'packung',
  inhalt: { wert: 500, einheit: 'g' },
  abtropfgewicht_g: null,
  sicherheit: 'hoch',
}

const jsonSchemaFor = (role: AiRole) =>
  JSON.stringify(z.toJSONSchema(schemaForRole({ role, context: CONTEXTS[role] })))

describe('KI-Schemas', () => {
  it.each(AI_ROLES)('Rolle %s nutzt nur, was Anthropic als Structured Output kennt', (role) => {
    const json = jsonSchemaFor(role)

    for (const unsupported of ['minimum', 'maximum', 'minLength', 'maxLength', 'oneOf', '"not"']) {
      expect(json).not.toContain(unsupported)
    }
  })

  it.each(AI_ROLES)('Rolle %s: alle Felder Pflicht, keine zusätzlichen Felder', (role) => {
    const schema = z.toJSONSchema(schemaForRole({ role, context: CONTEXTS[role] }))

    expect(schema).toMatchObject({ type: 'object', additionalProperties: false })
    expect(schema.required).toEqual(Object.keys(schema.properties ?? {}))
  })

  it('beschränkt die Lebensmittelart auf die übergebene Liste oder null', () => {
    const request = { role: 'verpackung', context: CONTEXTS.verpackung } as const

    expect(parseAnswer(request, packaging).ok).toBe(true)
    expect(parseAnswer(request, { ...packaging, lebensmittelart: null }).ok).toBe(true)
    expect(parseAnswer(request, { ...packaging, lebensmittelart: 'penne' })).toMatchObject({
      ok: false,
      error: { kind: 'invalid-response' },
    })
  })

  it('nimmt Behälter nur aus den Stammdaten-Schlüsseln, sonst null (kein „sonstiges“)', () => {
    const request = { role: 'verpackung', context: CONTEXTS.verpackung } as const

    expect(parseAnswer(request, { ...packaging, behaelter: null }).ok).toBe(true)
    expect(parseAnswer(request, { ...packaging, behaelter: 'sonstiges' }).ok).toBe(false)
  })

  it('erlaubt ohne Lebensmittelarten im Haushalt nur null', () => {
    const request = { role: 'verpackung', context: { foodTypes: [] } } as const

    expect(parseAnswer(request, { ...packaging, lebensmittelart: null }).ok).toBe(true)
    expect(parseAnswer(request, packaging).ok).toBe(false)
  })

  it('lehnt fehlende und zusätzliche Felder ab', () => {
    const request = { role: 'mhd', context: {} } as const
    const valid = { roh_text: null, datum: null, genauigkeit: 'unbekannt', art: 'unbekannt' }

    expect(parseAnswer(request, { ...valid, sicherheit: 'niedrig' }).ok).toBe(true)
    expect(parseAnswer(request, valid).ok).toBe(false)
    expect(parseAnswer(request, { ...valid, sicherheit: 'hoch', marke: 'X' }).ok).toBe(false)
  })

  it('nimmt bei der MHD-Schätzung kein Datum an, nur Monate', () => {
    const request = { role: 'mhd_schaetzen', context: CONTEXTS.mhd_schaetzen } as const
    const valid = { haltbar_monate: 18, genauigkeit: 'monat', sicherheit: 'mittel' }

    expect(parseAnswer(request, valid).ok).toBe(true)
    expect(parseAnswer(request, { ...valid, datum: '2028-05-31' }).ok).toBe(false)
    expect(parseAnswer(request, { ...valid, genauigkeit: 'tag' }).ok).toBe(false)
  })

  it('beschreibt einen Schema-Verstoß lesbar für das Protokoll', () => {
    const result = parseAnswer(
      { role: 'naehrwerte_schaetzen', context: CONTEXTS.naehrwerte_schaetzen },
      {},
    )

    expect(result.ok).toBe(false)
    if (!result.ok && result.error.kind === 'invalid-response') {
      expect(result.error.issues).toContain('sicherheit')
    }
  })
})
