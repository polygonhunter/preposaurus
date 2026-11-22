import { describe, expect, it } from 'vitest'
import type { DueEntry } from '../schemas'
import { dueCounterLabel, dueEntryLine, dueEntryTitle, dueGroupTitle } from './due-labels'

const standard = { soonDays: 90, urgentDays: 28 }

function entry(overrides: Partial<DueEntry> = {}): DueEntry {
  return {
    target: { kind: 'food-type', id: '11111111-1111-4111-8111-111111111111' },
    name: 'Haferdrink',
    pictogram: null,
    bestBefore: { date: '2026-12-04', precision: 'day', isEstimated: false },
    kind: 'best-before',
    daysLeft: 12,
    unitIds: ['a', 'b', 'c', 'd'],
    productNames: ['Haferdrink 1 l'],
    storageLocations: ['Keller'],
    canConfirmStillGood: false,
    ...overrides,
  }
}

describe('Texte auf Bald fällig', () => {
  it('benennt die Gruppen nach den Schwellen', () => {
    expect(dueGroupTitle('expired', standard)).toBe('Abgelaufen')
    expect(dueGroupTitle('this-week', standard)).toBe('Diese Woche')
    expect(dueGroupTitle('this-month', standard)).toBe('Diesen Monat')
    expect(dueGroupTitle('next-three-months', standard)).toBe('In 3 Monaten')
    expect(dueGroupTitle('this-month', { soonDays: 60, urgentDays: 14 })).toBe('In 14 Tagen')
    expect(dueGroupTitle('next-three-months', { soonDays: 60, urgentDays: 14 })).toBe('In 60 Tagen')
  })

  it('schreibt die Zähler klein: „2 abgelaufen“, „3 diese Woche“', () => {
    expect(dueCounterLabel('expired', 2, standard)).toBe('2 abgelaufen')
    expect(dueCounterLabel('this-week', 3, standard)).toBe('3 diese Woche')
    expect(dueCounterLabel('next-three-months', 9, standard)).toBe('9 in 3 Monaten')
  })

  it('nennt Anzahl und Produkt, bei mehreren Produkten die Lebensmittelart', () => {
    expect(dueEntryTitle(entry())).toBe('4 × Haferdrink 1 l')
    expect(dueEntryTitle(entry({ productNames: ['A', 'B'] }))).toBe('4 × Haferdrink')
  })

  it('zeigt Datum, Abstand und Lagerort, beim überschrittenen Verbrauchsdatum den Hinweis', () => {
    expect(dueEntryLine(entry())).toBe('04.12.2026 · in 12 Tagen · Keller')
    expect(dueEntryLine(entry({ kind: 'use-by', daysLeft: -2, storageLocations: [] }))).toBe(
      '04.12.2026 · seit 2 Tagen · Verbrauchsdatum überschritten, bitte nicht mehr essen.',
    )
  })
})
