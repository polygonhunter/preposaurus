// Vergleicht den Vorschlag der Erkennung (so, wie die App ihn zeigt) mit den Erwartungswerten
// eines Fotos. Bewertet werden nur Felder, die in der Erwartung stehen.
import type { RecognitionSuggestion } from '../../src/features/capture/application/photo-recognition-roles'
import type { BestBeforeReading } from '../../src/features/capture/domain/map-best-before-recognition'
import type {
  NutritionSuggestion,
  PackagingSuggestion,
} from '../../src/features/capture/domain/map-recognition'
import type { AiFailure } from '../../src/server/ai/vision-recognizer'
import type { ContentQuantity } from '../../src/shared/lib/quantities'
import type { Result } from '../../src/shared/lib/result'
import {
  compareField,
  failedField,
  isWithinTolerance,
  matchesPrintedDate,
  showBestBefore,
  showValue,
  type FieldResult,
} from './compare-values'
import type {
  BestBeforeExpectation,
  NutritionExpectation,
  PackagingExpectation,
  PhotoExpectation,
  Tolerance,
} from './expectations'

type Expected = PhotoExpectation['erwartet']

const same = <T>(expected: T, actual: T) => expected === actual

interface ExpectedContent {
  wert: number
  einheit: string
}

function showContent(content: ExpectedContent) {
  return `${String(content.wert)} ${content.einheit}`
}

const isContent = (value: unknown): value is ExpectedContent =>
  typeof value === 'object' && value !== null && 'wert' in value && 'einheit' in value

const showExpected = (value: unknown) => (isContent(value) ? showContent(value) : showValue(value))

/** Nur gesetzte Felder der Erwartung. */
function expectedEntries(expected: Expected): [string, unknown][] {
  return Object.entries(expected).filter(([, value]) => value !== undefined)
}

function comparePackaging(
  expected: PackagingExpectation,
  actual: PackagingSuggestion,
  tolerance: Tolerance,
): FieldResult[] {
  const withinTolerance = isWithinTolerance(tolerance)
  const toContent = (content: ContentQuantity | null) =>
    content === null ? null : { wert: content.value, einheit: content.unit }
  const fields: FieldResult[] = []
  if (expected.lebensmittelart !== undefined) {
    const input = { expected: expected.lebensmittelart, actual: actual.foodTypeKey, equals: same }
    fields.push(compareField({ field: 'lebensmittelart', ...input }))
  }
  if (expected.behaelter !== undefined) {
    const input = { expected: expected.behaelter, actual: actual.container, equals: same }
    fields.push(compareField({ field: 'behaelter', ...input }))
  }
  if (expected.inhalt !== undefined) {
    fields.push(
      compareField({
        field: 'inhalt',
        expected: expected.inhalt,
        actual: toContent(actual.content),
        equals: (e, a) => e.einheit === a.einheit && withinTolerance(e.wert, a.wert),
        showExpected: showContent,
        showActual: showContent,
      }),
    )
  }
  return fields
}

const NUTRIENTS = {
  kcal: 'kcal',
  eiweiss_g: 'protein',
  kohlenhydrate_g: 'carbs',
  fett_g: 'fat',
} as const

function compareNutrition(
  expected: NutritionExpectation,
  actual: NutritionSuggestion,
  tolerance: Tolerance,
): FieldResult[] {
  const equals = isWithinTolerance(tolerance)
  // Je Portion ohne Portionsgröße lässt sich nichts auf 100 g beziehen: zählt wie nicht gelesen.
  const valueOf = (key: keyof typeof NUTRIENTS) =>
    actual.isPerPortion ? null : actual.values[NUTRIENTS[key]]
  return (Object.keys(NUTRIENTS) as (keyof typeof NUTRIENTS)[])
    .filter((key) => expected[key] !== undefined)
    .map((key) =>
      compareField({ field: key, expected: expected[key] ?? null, actual: valueOf(key), equals }),
    )
}

const KIND_KEYS = { 'best-before': 'mhd', 'use-by': 'verbrauchen_bis' } as const

function compareBestBefore(
  expected: BestBeforeExpectation,
  actual: BestBeforeReading,
): FieldResult[] {
  const date = compareField({
    field: 'datum',
    expected: expected.datum,
    actual: actual.bestBefore,
    equals: matchesPrintedDate,
    showActual: showBestBefore,
  })
  if (expected.art === undefined) return [date]
  const kind = actual.kind === null ? null : KIND_KEYS[actual.kind]
  return [date, compareField({ field: 'art', expected: expected.art, actual: kind, equals: same })]
}

function compareSuggestion(
  photo: PhotoExpectation,
  suggestion: RecognitionSuggestion,
  tolerance: Tolerance,
): FieldResult[] {
  if (photo.rolle === 'verpackung' && suggestion.role === 'verpackung') {
    return comparePackaging(photo.erwartet, suggestion.packaging, tolerance)
  }
  if (photo.rolle === 'naehrwerte' && suggestion.role === 'naehrwerte') {
    return compareNutrition(photo.erwartet, suggestion.nutrition, tolerance)
  }
  if (photo.rolle === 'mhd' && suggestion.role === 'mhd') {
    return compareBestBefore(photo.erwartet, suggestion.bestBefore)
  }
  throw new Error(`Rolle passt nicht: erwartet ${photo.rolle}, erkannt ${suggestion.role}`)
}

export function comparePhoto(
  photo: PhotoExpectation,
  outcome: Result<RecognitionSuggestion, AiFailure>,
  tolerance: Tolerance,
): FieldResult[] {
  if (outcome.ok) return compareSuggestion(photo, outcome.value, tolerance)
  return expectedEntries(photo.erwartet).map(([field, value]) =>
    failedField(field, showExpected(value)),
  )
}
