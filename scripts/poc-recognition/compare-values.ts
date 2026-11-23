// Vergleich eines einzelnen Felds mit der Erwartung. Reine Funktionen ohne KI und Dateien.
import type { BestBefore } from '../../src/features/inventory/domain/unit'
import type { Tolerance } from './expectations'

/**
 * treffer: richtig gelesen · leer-korrekt: nichts drauf, nichts gemeldet · leer: lesbar, aber
 * null gemeldet (harmlos, der Nutzer trägt es ein) · falsch: anderer Wert · erfunden: nichts
 * lesbar, trotzdem ein Wert · fehler: Aufruf gescheitert (Zeitlimit, Schema, Anbieter).
 */
export type FieldOutcome = 'treffer' | 'leer-korrekt' | 'leer' | 'falsch' | 'erfunden' | 'fehler'

export const HIT_OUTCOMES: readonly FieldOutcome[] = ['treffer', 'leer-korrekt']

export interface FieldResult {
  field: string
  outcome: FieldOutcome
  /** Anzeige für den Bericht, „–“ für null */
  expected: string
  actual: string
}

const EMPTY = '–'

interface FieldInput<E, A> {
  field: string
  expected: E | null
  actual: A | null
  equals: (expected: E, actual: A) => boolean
  /** Anzeige für den Bericht, sonst String(wert) */
  showExpected?: (value: E) => string
  showActual?: (value: A) => string
}

function outcomeOf<E, A>({ expected, actual, equals }: FieldInput<E, A>): FieldOutcome {
  if (expected === null) return actual === null ? 'leer-korrekt' : 'erfunden'
  if (actual === null) return 'leer'
  return equals(expected, actual) ? 'treffer' : 'falsch'
}

/** Zahlen und Texte wie sie sind, alles andere (null, fehlend) als „–“. */
export const showValue = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : EMPTY

export function compareField<E, A>(input: FieldInput<E, A>): FieldResult {
  const { expected, actual, showExpected = showValue, showActual = showValue } = input
  return {
    field: input.field,
    outcome: outcomeOf(input),
    expected: expected === null ? EMPTY : showExpected(expected),
    actual: actual === null ? EMPTY : showActual(actual),
  }
}

/** Für gescheiterte Aufrufe: jedes erwartete Feld zählt als Fehler, nie als Treffer. */
export function failedField(field: string, expected: string): FieldResult {
  return { field, outcome: 'fehler', expected, actual: EMPTY }
}

export function isWithinTolerance(tolerance: Tolerance) {
  return (expected: number, actual: number) =>
    Math.abs(actual - expected) <= Math.max(tolerance.absolut, tolerance.relativ * expected)
}

const PRECISION_BY_LENGTH: Readonly<Record<number, BestBefore['precision']>> = {
  4: 'year',
  7: 'month',
  10: 'day',
}

/**
 * Das gelesene MHD passt nur, wenn Zeitraum und Genauigkeit stimmen. Die App legt „nur Monat“ auf
 * das Monatsende, deshalb genügt bei Monat und Jahr der passende Anfang des Datums. Ein Tag, wo nur
 * ein Monat aufgedruckt ist, ist falsch: Der Tag wäre erfunden.
 */
export function matchesPrintedDate(printed: string, read: BestBefore): boolean {
  return PRECISION_BY_LENGTH[printed.length] === read.precision && read.date.startsWith(printed)
}

const PRECISION_LABEL: Readonly<Record<BestBefore['precision'], string>> = {
  day: 'Tag',
  month: 'Monat',
  year: 'Jahr',
}

export const showBestBefore = (read: BestBefore) =>
  `${read.date} (${PRECISION_LABEL[read.precision]})`
