// Kennzahlen je Rolle und Variante aus den einzelnen Läufen. Reine Funktionen.
import { estimateCostUsd } from '../../src/server/ai/model-prices'
import type { PhotoRole } from '../../src/shared/config/constants'
import { HIT_OUTCOMES, type FieldOutcome } from './compare-values'
import type { PhotoRun } from './run-recognition'

interface FieldTally {
  hits: number
  total: number
  /** null gemeldet, obwohl lesbar */
  empty: number
}

/** Ein erfundenes MHD: Datum gemeldet, das so nicht aufgedruckt ist. */
interface InventedDate {
  photo: string
  expected: string
  actual: string
}

export interface VariantSummary {
  role: PhotoRole
  variant: string
  photos: number
  fieldsScored: number
  hits: number
  /** Anteil richtiger Felder, null ohne bewertete Felder */
  hitRate: number | null
  photosAllCorrect: number
  emptyFields: number
  failedPhotos: number
  /** Kennzahl Nr. 1: erfundene MHDs, je mit Foto-Name */
  inventedDates: InventedDate[]
  /** Fotos mit Zweitversuch (nur MHD-Standard) */
  secondAttempts: number
  perField: Record<string, FieldTally>
  durationMs: number
  inputTokens: number
  outputTokens: number
  /** null, wenn für ein Modell kein Preis bekannt ist oder Tokens fehlen */
  costUsd: number | null
}

const isHit = (outcome: FieldOutcome) => HIT_OUTCOMES.includes(outcome)

/** Ein Datum, wo keins lesbar ist, ein anderes Datum oder ein Tag, wo nur Monat oder Jahr steht. */
const INVENTED: readonly FieldOutcome[] = ['erfunden', 'falsch']

function inventedDates(runs: readonly PhotoRun[]): InventedDate[] {
  return runs.flatMap((run) =>
    run.fields
      .filter((field) => field.field === 'datum' && INVENTED.includes(field.outcome))
      .map((field) => ({ photo: run.photo, expected: field.expected, actual: field.actual })),
  )
}

function tallyFields(runs: readonly PhotoRun[]): Record<string, FieldTally> {
  const perField: Record<string, FieldTally> = {}
  for (const field of runs.flatMap((run) => run.fields)) {
    const tally = (perField[field.field] ??= { hits: 0, total: 0, empty: 0 })
    tally.total += 1
    if (isHit(field.outcome)) tally.hits += 1
    if (field.outcome === 'leer') tally.empty += 1
  }
  return perField
}

function sumCost(runs: readonly PhotoRun[]): number | null {
  let total = 0
  for (const call of runs.flatMap((run) => run.calls)) {
    const cost = estimateCostUsd(call.model, call)
    if (cost === null) return null
    total += cost
  }
  return total
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)

function usageOf(runs: readonly PhotoRun[]) {
  const calls = runs.flatMap((run) => run.calls)
  return {
    durationMs: sum(calls.map((call) => call.durationMs)),
    inputTokens: sum(calls.map((call) => call.inputTokens ?? 0)),
    outputTokens: sum(calls.map((call) => call.outputTokens ?? 0)),
    costUsd: sumCost(runs),
  }
}

function summarizeVariant(runs: readonly PhotoRun[], first: PhotoRun): VariantSummary {
  const perField = tallyFields(runs)
  const tallies = Object.values(perField)
  const fieldsScored = sum(tallies.map((tally) => tally.total))
  const hits = sum(tallies.map((tally) => tally.hits))
  return {
    role: first.role,
    variant: first.variant,
    photos: runs.length,
    fieldsScored,
    hits,
    hitRate: fieldsScored === 0 ? null : hits / fieldsScored,
    photosAllCorrect: runs.filter((run) => run.fields.every((field) => isHit(field.outcome)))
      .length,
    emptyFields: sum(tallies.map((tally) => tally.empty)),
    failedPhotos: runs.filter((run) => run.failure !== null).length,
    inventedDates: inventedDates(runs),
    secondAttempts: runs.filter((run) => run.calls.length > 1).length,
    perField,
    ...usageOf(runs),
  }
}

/** Reihenfolge wie in den Läufen: Rolle, dann Variante. */
export function summarize(runs: readonly PhotoRun[]): VariantSummary[] {
  const groups = new Map<string, PhotoRun[]>()
  for (const run of runs) {
    const key = `${run.role}\u0000${run.variant}`
    groups.set(key, [...(groups.get(key) ?? []), run])
  }
  return [...groups.values()].flatMap((group) =>
    group[0] === undefined ? [] : [summarizeVariant(group, group[0])],
  )
}
