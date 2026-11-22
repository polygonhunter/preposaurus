import { err, ok, type Result } from './result'

// Mengen werden intern in Gramm, Milliliter oder Stück geführt. Eingaben kommen deutsch
// („1,5 l“, „1.000 g“), Ausgaben ebenso.

export type QuantityUnit = 'g' | 'ml' | 'piece'

export interface Quantity {
  value: number
  unit: QuantityUnit
}

export type QuantityParseError =
  | { kind: 'empty' }
  | { kind: 'invalid-number' }
  | { kind: 'unknown-unit' }
  | { kind: 'not-positive' }
  | { kind: 'fractional-pieces' }

const UNITS: Readonly<Record<string, { unit: QuantityUnit; factor: number }>> = {
  g: { unit: 'g', factor: 1 },
  gr: { unit: 'g', factor: 1 },
  gramm: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  ml: { unit: 'ml', factor: 1 },
  cl: { unit: 'ml', factor: 10 },
  l: { unit: 'ml', factor: 1000 },
  liter: { unit: 'ml', factor: 1000 },
  stück: { unit: 'piece', factor: 1 },
  stk: { unit: 'piece', factor: 1 },
  st: { unit: 'piece', factor: 1 },
}

const QUANTITY = /^(-?[\d.,]+)\s*([a-zäöü]*)\.?$/
const GERMAN_THOUSANDS = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/
const PLAIN_NUMBER = /^-?\d+([.,]\d+)?$/
// Gleitkomma-Rauschen wie 0,33 × 1000 = 330,00000000000006 entfernen
const PRECISION = 1e6

const BASE_UNIT_LABEL: Record<QuantityUnit, string> = { g: 'g', ml: 'ml', piece: 'Stück' }
const LARGE_UNIT_LABEL: Record<QuantityUnit, string | null> = { g: 'kg', ml: 'l', piece: null }
const LARGE_UNIT_FACTOR = 1000

/** Liest eine Zahl im deutschen Format: Komma als Dezimalzeichen, Punkt als Tausendertrenner. */
export function parseGermanNumber(text: string): number | null {
  const trimmed = text.trim()
  if (GERMAN_THOUSANDS.test(trimmed)) return Number(trimmed.replaceAll('.', '').replace(',', '.'))
  if (PLAIN_NUMBER.test(trimmed)) return Number(trimmed.replace(',', '.'))
  return null
}

const roundNoise = (value: number) => Math.round(value * PRECISION) / PRECISION

function toQuantity(value: number, unitText: string): Result<Quantity, QuantityParseError> {
  const unit = UNITS[unitText]
  if (unit === undefined) return err({ kind: 'unknown-unit' })
  if (value <= 0) return err({ kind: 'not-positive' })
  if (unit.unit === 'piece' && !Number.isInteger(value)) return err({ kind: 'fractional-pieces' })
  return ok({ value: roundNoise(value * unit.factor), unit: unit.unit })
}

/** Liest Mengen wie `500 g`, `1,5 l`, `1 kg` oder `6 Stück` und rechnet in g, ml oder Stück. */
export function parseQuantity(text: string): Result<Quantity, QuantityParseError> {
  const cleaned = text.trim().toLowerCase()
  if (cleaned === '') return err({ kind: 'empty' })
  const match = QUANTITY.exec(cleaned)
  if (!match) return err({ kind: 'invalid-number' })
  const value = parseGermanNumber(match[1] ?? '')
  if (value === null) return err({ kind: 'invalid-number' })
  return toQuantity(value, match[2] ?? '')
}

/** Zahl im deutschen Format, z. B. 17.950 oder 1,5. */
export function formatGermanNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits }).format(value)
}

/** Menge lesbar: ab 1000 g bzw. ml in kg bzw. l, z. B. „1,5 kg“, „500 g“, „6 Stück“. */
export function formatQuantity({ value, unit }: Quantity): string {
  const large = LARGE_UNIT_LABEL[unit]
  if (large !== null && Math.abs(value) >= LARGE_UNIT_FACTOR) {
    return `${formatGermanNumber(value / LARGE_UNIT_FACTOR, 2)} ${large}`
  }
  return `${formatGermanNumber(value)} ${BASE_UNIT_LABEL[unit]}`
}
