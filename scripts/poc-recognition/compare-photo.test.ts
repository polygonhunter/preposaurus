import { describe, expect, it } from 'vitest'
import type { RecognitionSuggestion } from '../../src/features/capture/application/photo-recognition-roles'
import { toCalendarDay } from '../../src/shared/lib/dates'
import { err, ok } from '../../src/shared/lib/result'
import { comparePhoto } from './compare-photo'
import type { PhotoExpectation } from './expectations'

const TOLERANCE = { relativ: 0.05, absolut: 0.5 }

function bestBefore(
  date: string | null,
  precision: 'day' | 'month' | 'year' = 'day',
): RecognitionSuggestion {
  return {
    role: 'mhd',
    bestBefore: {
      bestBefore:
        date === null ? null : { date: toCalendarDay(date), precision, isEstimated: false },
      kind: 'best-before',
      rawText: null,
      confidence: 'high',
    },
    conflictingDate: null,
  }
}

const mhdPhoto = (datum: string | null, art?: 'mhd' | 'verbrauchen_bis'): PhotoExpectation => ({
  datei: 'mhd/a.jpg',
  rolle: 'mhd',
  erwartet: art === undefined ? { datum } : { datum, art },
})

const outcomesOf = (photo: PhotoExpectation, suggestion: RecognitionSuggestion) =>
  comparePhoto(photo, ok(suggestion), TOLERANCE).map((field) => field.outcome)

describe('comparePhoto · MHD', () => {
  it('wertet ein exakt gelesenes Tagesdatum als Treffer', () => {
    expect(outcomesOf(mhdPhoto('2028-03-14'), bestBefore('2028-03-14'))).toEqual(['treffer'])
  })

  it('wertet „nur Monat“ als Treffer, wenn die App das Monatsende mit Genauigkeit Monat zeigt', () => {
    expect(outcomesOf(mhdPhoto('2029-11'), bestBefore('2029-11-30', 'month'))).toEqual(['treffer'])
  })

  it('wertet einen Tag, wo nur der Monat aufgedruckt ist, als falsch (der Tag wäre erfunden)', () => {
    expect(outcomesOf(mhdPhoto('2029-11'), bestBefore('2029-11-30'))).toEqual(['falsch'])
  })

  it('wertet ein Datum bei unlesbarem Aufdruck als erfunden', () => {
    expect(outcomesOf(mhdPhoto(null), bestBefore('2027-05-01'))).toEqual(['erfunden'])
  })

  it('wertet „unlesbar“ richtig erkannt als Treffer', () => {
    expect(outcomesOf(mhdPhoto(null), bestBefore(null))).toEqual(['leer-korrekt'])
  })

  it('wertet kein Datum bei lesbarem Aufdruck als leer', () => {
    expect(outcomesOf(mhdPhoto('2028-03-14'), bestBefore(null))).toEqual(['leer'])
  })

  it('vergleicht die Art nur, wenn sie erwartet ist', () => {
    const fields = comparePhoto(
      mhdPhoto('2028-03-14', 'verbrauchen_bis'),
      ok(bestBefore('2028-03-14')),
      TOLERANCE,
    )
    expect(fields).toEqual([
      { field: 'datum', outcome: 'treffer', expected: '2028-03-14', actual: '2028-03-14 (Tag)' },
      { field: 'art', outcome: 'falsch', expected: 'verbrauchen_bis', actual: 'mhd' },
    ])
  })
})

describe('comparePhoto · Verpackung', () => {
  const photo: PhotoExpectation = {
    datei: 'v.jpg',
    rolle: 'verpackung',
    erwartet: {
      lebensmittelart: 'nudeln',
      behaelter: 'packung',
      inhalt: { wert: 500, einheit: 'g' },
    },
  }
  const suggestion = (value: number, unit: 'g' | 'ml'): RecognitionSuggestion => ({
    role: 'verpackung',
    packaging: {
      name: 'Spaghetti',
      foodTypeKey: 'nudeln',
      container: 'dose',
      content: { value, unit },
      drainedWeightG: null,
      confidence: 'high',
    },
  })

  it('bewertet Art, Behälter und Inhalt mit Toleranz', () => {
    expect(outcomesOf(photo, suggestion(510, 'g'))).toEqual(['treffer', 'falsch', 'treffer'])
  })

  it('wertet eine andere Einheit oder eine Menge außerhalb der Toleranz als falsch', () => {
    expect(outcomesOf(photo, suggestion(500, 'ml'))[2]).toBe('falsch')
    expect(outcomesOf(photo, suggestion(530, 'g'))[2]).toBe('falsch')
  })

  it('bewertet nur Felder, die in der Erwartung stehen', () => {
    const onlyContainer: PhotoExpectation = { ...photo, erwartet: { behaelter: 'dose' } }
    expect(comparePhoto(onlyContainer, ok(suggestion(1, 'g')), TOLERANCE)).toHaveLength(1)
  })
})

describe('comparePhoto · Nährwerte', () => {
  const photo: PhotoExpectation = {
    datei: 'n.jpg',
    rolle: 'naehrwerte',
    erwartet: { kcal: 372, eiweiss_g: 13.5, fett_g: null },
  }
  const suggestion = (isPerPortion: boolean): RecognitionSuggestion => ({
    role: 'naehrwerte',
    nutrition: {
      values: { kcal: 380, protein: 13.9, carbs: 58, fat: 7 },
      isPerPortion,
      source: 'label',
      confidence: 'high',
    },
  })

  it('vergleicht je 100 g mit Toleranz und meldet erfundene Werte', () => {
    expect(outcomesOf(photo, suggestion(false))).toEqual(['treffer', 'treffer', 'erfunden'])
  })

  it('zählt Werte je Portion ohne Portionsgröße als nicht gelesen', () => {
    expect(outcomesOf(photo, suggestion(true))).toEqual(['leer', 'leer', 'leer-korrekt'])
  })
})

describe('comparePhoto · Fehler', () => {
  it('zählt bei gescheitertem Aufruf jedes erwartete Feld als Fehler', () => {
    const photo: PhotoExpectation = {
      datei: 'v.jpg',
      rolle: 'verpackung',
      erwartet: { behaelter: 'dose', inhalt: { wert: 400, einheit: 'g' } },
    }
    expect(comparePhoto(photo, err({ kind: 'timeout' }), TOLERANCE)).toEqual([
      { field: 'behaelter', outcome: 'fehler', expected: 'dose', actual: '–' },
      { field: 'inhalt', outcome: 'fehler', expected: '400 g', actual: '–' },
    ])
  })

  it('bricht ab, wenn Vorschlag und Rolle nicht zusammenpassen', () => {
    expect(() => comparePhoto(mhdPhoto(null), ok(suggestionOfOtherRole()), TOLERANCE)).toThrow(
      'Rolle passt nicht',
    )
  })
})

function suggestionOfOtherRole(): RecognitionSuggestion {
  return {
    role: 'naehrwerte',
    nutrition: {
      values: { kcal: null, protein: null, carbs: null, fat: null },
      isPerPortion: false,
      source: 'label',
      confidence: 'low',
    },
  }
}
