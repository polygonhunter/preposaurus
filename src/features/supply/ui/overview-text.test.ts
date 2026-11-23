import { describe, expect, it } from 'vitest'
import type { OverviewDueEntry, OverviewGoal, OverviewSupply } from '../schemas'
import {
  formatDays,
  goalLine,
  headline,
  limitingSentence,
  nextStepSentence,
  scaleFor,
} from './head-text'
import {
  dueSubtitle,
  dueTiles,
  dueTitle,
  householdTitle,
  restockText,
  sourceText,
} from './list-text'
import { noNeedState } from './source-text'

// TESTDATEN: frei gewählte Werte
const supply: OverviewSupply = {
  days: 6,
  energyDays: 9.4,
  waterDays: 6,
  bottleneck: 'water',
  isApproximate: false,
  explanation: {
    kcal: 18800,
    waterMl: 12000,
    kcalPerDay: 2000,
    waterMlPerDay: 2000,
    needLines: [{ type: 'adult', count: 1, kcalPerDay: 2000, waterMlPerDay: 2000 }],
    uncountedMembers: 0,
    estimatedShare: 0,
    packages: { expired: 0, stillGood: 0, missingDate: 0 },
    stillGoodCounts: false,
  },
}

const goal = (outlook: OverviewGoal['outlook'], date: string | null = '2027-03-01') => ({
  days: 10,
  date,
  outlook,
})

describe('Kopf der Übersicht', () => {
  it('zeigt ganze Tage, abgerundet, mit „ca.“ bei Richtwerten', () => {
    expect(headline({ ...supply, days: 6.9 })).toEqual({ prefix: '', value: '6', unit: 'Tage' })
    expect(headline({ ...supply, days: 1.2, isApproximate: true })).toEqual({
      prefix: 'ca.',
      value: '1',
      unit: 'Tag',
    })
    expect(formatDays(9.4)).toBe('9,4 Tage')
  })

  it('wählt die Skala der Balken: mindestens das Ziel, höchstens das Doppelte', () => {
    expect(scaleFor([6, 9.4], 10)).toBe(10)
    expect(scaleFor([6, 14], 10)).toBe(14)
    expect(scaleFor([6, 40], 10)).toBe(20)
    expect(scaleFor([0, 0], null)).toBe(1)
    expect(scaleFor([3, 7], null)).toBe(7)
  })

  it('nennt, was begrenzt', () => {
    expect(limitingSentence(supply)).toBe('Wasser begrenzt euren Vorrat, Essen reicht länger.')
    expect(limitingSentence({ ...supply, energyDays: 2 })).toMatch(/^Essen begrenzt/)
    expect(limitingSentence({ ...supply, energyDays: 6 })).toBe(
      'Essen und Wasser reichen gleich lang.',
    )
  })

  it('formuliert die Zielzeile für jeden Fall', () => {
    const valid = { kind: 'valid', days: 5.8, isReached: false, expiringPackages: 6 } as const
    expect(goalLine(goal(valid))).toEqual({
      title: 'Am 01.03.2027 wären es 5 von 10 Tagen.',
      subtitle: '6 Packungen laufen vorher ab.',
    })
    expect(goalLine(goal({ ...valid, expiringPackages: 1 })).subtitle).toBe(
      '1 Packung läuft vorher ab.',
    )
    expect(goalLine(goal({ ...valid, days: 12, isReached: true })).title).toBe(
      'Ziel erreicht: am 01.03.2027 sind es 12 von 10 Tagen.',
    )
    expect(goalLine(goal({ kind: 'in-past' })).title).toBe('Das Zieldatum 01.03.2027 ist vorbei.')
    expect(goalLine(goal(null, null)).title).toBe('Euer Ziel: 10 Tage')
    expect(goalLine(goal(null)).title).toBe('Ziel: 10 Tage bis 01.03.2027')
  })

  it('formuliert den nächsten Schritt in Litern bzw. kcal', () => {
    const water = { resource: 'water', missing: 19_200, alsoMissing: null } as const
    expect(nextStepSentence(water)).toBe('20 l Wasser bringen euch ans Ziel.')
    const food = { resource: 'energy', missing: 3360 } as const
    expect(nextStepSentence({ ...water, missing: 46_800, alsoMissing: food })).toBe(
      'Bis zum Ziel fehlen noch 47 l Wasser und etwa 3.400 kcal Essen.',
    )
    const energy = { resource: 'energy', missing: 22_340, alsoMissing: null } as const
    expect(nextStepSentence(energy)).toBe('Etwa 22.400 kcal Essen bringen euch ans Ziel.')
  })

  it('rundet erst in der Anzeige: genau 37 l bleiben 37 l (#214)', () => {
    const step = {
      resource: 'water',
      missing: 37_000,
      alsoMissing: { resource: 'energy', missing: 28_035 },
    } as const
    expect(nextStepSentence(step)).toBe(
      'Bis zum Ziel fehlen noch 37 l Wasser und etwa 28.100 kcal Essen.',
    )
  })
})

describe('Listen der Übersicht', () => {
  const entry: OverviewDueEntry = {
    name: 'Haferdrink',
    packages: 4,
    date: '2026-12-04',
    precision: 'day',
    daysLeft: 12,
    group: 'this-month',
  }

  it('beschriftet Bald fällig mit Anzahl, Datum und Abstand', () => {
    expect(dueTitle(entry)).toBe('4 × Haferdrink')
    expect(dueTitle({ ...entry, packages: 1 })).toBe('Haferdrink')
    expect(dueSubtitle(entry)).toBe('04.12.2026 · in 12 Tagen')
    expect(dueSubtitle({ ...entry, precision: 'month', daysLeft: -2 })).toBe(
      '12/2026 · seit 2 Tagen',
    )
  })

  it('zeigt vier Kennzahlen in fester Reihenfolge', () => {
    const tiles = dueTiles({ expired: 2, 'this-week': 3, 'this-month': 4, 'next-three-months': 9 })
    expect(tiles).toEqual([
      { value: '2', label: 'abgelaufen' },
      { value: '3', label: 'diese Woche' },
      { value: '4', label: 'diesen Monat' },
      { value: '9', label: 'in 3 Monaten' },
    ])
  })

  it('zeigt Nachkaufen nur mit Daten', () => {
    expect(restockText({ openItems: 0, gapGroups: 0 })).toBeNull()
    expect(restockText({ openItems: 1, gapGroups: 3 })).toBe(
      '3 Warengruppen unter dem Ziel · 1 Eintrag auf der Liste',
    )
  })

  it('fasst den Haushalt knapp zusammen', () => {
    const household = {
      members: 3,
      source: { name: 'Quelle', asOf: '2026', link: 'x', isVerified: true },
    }
    expect(householdTitle(household, goal(null))).toBe('3 Personen · Ziel 10 Tage bis 01.03.2027')
    expect(householdTitle({ members: 0, source: null }, null)).toBe('Noch niemand eingetragen')
    expect(sourceText(household)).toBe('Quelle, Stand 2026')
    expect(sourceText({ members: 1, source: null })).toBe('Noch keine Empfehlung hinterlegt')
    const unverified = { members: 3, source: { ...household.source, isVerified: false } }
    expect(sourceText(unverified)).toBe('Quelle, Stand 2026 · Werte noch nicht geprüft')
  })

  it('nennt den Grund, warum die Übersicht keine Tage zeigt (#206)', () => {
    const source = { name: 'Quelle', asOf: '2026', link: 'x', isVerified: false }
    expect(noNeedState({ members: 3, source: null })).toEqual({
      text: 'Es fehlt noch eine Empfehlung für Essen und Wasser. Bis sie hinterlegt ist, zeigt Preposaurus keine Tage.',
      action: { href: '/einstellungen/ziel', label: 'Ziel und Empfehlung' },
    })
    expect(noNeedState({ members: 0, source }).action.label).toBe('Mitglieder eintragen')
    expect(noNeedState({ members: 0, source }).text).toMatch(/^Tragt ein, wer/)
    expect(noNeedState({ members: 1, source }).text).toMatch(/^Babys zählen/)
  })
})
