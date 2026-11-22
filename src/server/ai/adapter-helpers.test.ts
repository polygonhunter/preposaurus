import { describe, expect, it } from 'vitest'
import { AI_ROLES, type AiRole } from '@/shared/config/ai-roles'
import { createConcurrencyLimit } from './concurrency-limit'
import { estimateCostUsd } from './model-prices'
import { outputJsonSchema } from './output-schema'
import { promptForRole } from './prompts'
import type { RoleContexts } from './vision-recognizer'

const CONTEXTS: RoleContexts = {
  verpackung: { foodTypes: [{ key: 'linsen', name: 'Linsen' }] },
  naehrwerte: {},
  naehrwerte_schaetzen: {
    foodType: { key: 'linsen', name: 'Linsen' },
    productName: 'Tellerlinsen',
  },
  mhd: {},
  mhd_zweitversuch: {},
}

const requestFor = <R extends AiRole>(role: R) => ({ role, context: CONTEXTS[role] })

describe('outputJsonSchema', () => {
  it.each(AI_ROLES)('Rolle %s: ohne $schema, sonst unverändert', (role) => {
    const schema = outputJsonSchema(requestFor(role))

    expect(schema).not.toHaveProperty('$schema')
    expect(schema).toMatchObject({ type: 'object', additionalProperties: false })
  })
})

describe('promptForRole', () => {
  it.each(['verpackung', 'naehrwerte', 'mhd', 'mhd_zweitversuch'] as const)(
    'Rolle %s verbietet Schätzen und Erfinden',
    (role) => {
      expect(promptForRole(requestFor(role)).system).toContain('schätze und erfinde nichts')
    },
  )

  it('verbietet beim MHD ausdrücklich erfundene Daten, auch im Zweitversuch', () => {
    for (const role of ['mhd', 'mhd_zweitversuch'] as const) {
      expect(promptForRole(requestFor(role)).system).toContain('ERFINDE NIEMALS EIN DATUM')
    }
  })

  it('nennt die Schätzung ausdrücklich Schätzung, mit Lebensmittelart und Bezeichnung', () => {
    const prompt = promptForRole(requestFor('naehrwerte_schaetzen'))

    expect(prompt.system).not.toContain('erfinde nichts')
    expect(prompt.instruction).toContain('ausdrücklich eine Schätzung')
    expect(prompt.instruction).toContain('Linsen, Tellerlinsen')
  })

  it('sagt ohne Lebensmittelarten, dass nur null bleibt', () => {
    const prompt = promptForRole({ role: 'verpackung', context: { foodTypes: [] } })

    expect(prompt.instruction).toContain('setze lebensmittelart auf null')
  })
})

describe('estimateCostUsd', () => {
  it('rechnet mit den Grundpreisen je Million Tokens', () => {
    const usage = { inputTokens: 1_000_000, outputTokens: 100_000 }

    expect(estimateCostUsd('claude-haiku-5-5', usage)).toBeCloseTo(0.15)
    expect(estimateCostUsd('claude-sonnet-5-5', usage)).toBeCloseTo(3)
  })

  it('liefert null für ein unbekanntes Modell oder ohne Tokens', () => {
    expect(estimateCostUsd('unbekannt', { inputTokens: 1, outputTokens: 1 })).toBeNull()
    expect(estimateCostUsd('claude-haiku-5-5', { inputTokens: null, outputTokens: 1 })).toBeNull()
  })
})

describe('createConcurrencyLimit', () => {
  it('lässt höchstens die erlaubte Zahl gleichzeitig laufen, in Reihenfolge', async () => {
    const limit = createConcurrencyLimit(2)
    let running = 0
    let maxRunning = 0
    const order: number[] = []
    const task = (id: number) => async () => {
      running += 1
      maxRunning = Math.max(maxRunning, running)
      await new Promise((resolve) => setTimeout(resolve, 5))
      order.push(id)
      running -= 1
      return id
    }

    const results = await Promise.all([1, 2, 3, 4, 5].map((id) => limit(task(id))))

    expect(results).toEqual([1, 2, 3, 4, 5])
    expect(maxRunning).toBe(2)
    expect(order).toEqual([1, 2, 3, 4, 5])
  })

  it('gibt den Platz auch nach einem Fehler frei', async () => {
    const limit = createConcurrencyLimit(1)

    await expect(limit(() => Promise.reject(new Error('kaputt')))).rejects.toThrow('kaputt')
    expect(await limit(() => Promise.resolve('weiter'))).toBe('weiter')
  })
})
