import { describe, expect, it } from 'vitest'
import { DEFAULT_AMPEL_THRESHOLDS } from '../../../../tests/helpers/ampel-thresholds'
import type { AmpelSettingsStore } from '../data/ampel-settings-repository'
import type { AmpelThresholds } from '../domain/unit-state'
import { getAmpelThresholds, saveAmpelThresholds } from './ampel-thresholds'

function fakeStore() {
  const saved = new Map<string, AmpelThresholds>()
  const ampel: AmpelSettingsStore = {
    read: (householdId) => Promise.resolve(saved.get(householdId) ?? DEFAULT_AMPEL_THRESHOLDS),
    save: (householdId, thresholds) => {
      saved.set(householdId, thresholds)
      return Promise.resolve()
    },
  }
  return { deps: { ampel }, saved }
}

describe('Ampel-Schwellen', () => {
  it('speichert gültige Schwellen und liest sie zurück', async () => {
    const { deps } = fakeStore()

    const result = await saveAmpelThresholds(deps, {
      householdId: 'h1',
      thresholds: { soonDays: 60, urgentDays: 14 },
    })

    expect(result.ok).toBe(true)
    expect(await getAmpelThresholds(deps, 'h1')).toEqual({ soonDays: 60, urgentDays: 14 })
  })

  it('lässt Orange gleich Gelb zu', async () => {
    const { deps } = fakeStore()

    const result = await saveAmpelThresholds(deps, {
      householdId: 'h1',
      thresholds: { soonDays: 7, urgentDays: 7 },
    })

    expect(result.ok).toBe(true)
  })

  it('speichert nichts, wenn Orange größer als Gelb ist', async () => {
    const { deps, saved } = fakeStore()

    const result = await saveAmpelThresholds(deps, {
      householdId: 'h1',
      thresholds: { soonDays: 20, urgentDays: 30 },
    })

    expect(result).toEqual({ ok: false, error: { kind: 'urgent-above-soon' } })
    expect(saved.size).toBe(0)
  })

  it('speichert nichts, wenn Orange unter einer Woche liegt', async () => {
    const { deps, saved } = fakeStore()

    const result = await saveAmpelThresholds(deps, {
      householdId: 'h1',
      thresholds: { soonDays: 90, urgentDays: 6 },
    })

    expect(result).toEqual({ ok: false, error: { kind: 'urgent-below-week' } })
    expect(saved.size).toBe(0)
  })
})
