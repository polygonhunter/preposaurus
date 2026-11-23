import { err, ok, type Result } from './result'

// Mengen werden intern in Gramm, Milliliter oder Stück geführt. Eingaben kommen deutsch
// („1,5 l“, „1.000 g“), Ausgaben ebenso.

type QuantityUnit = 'g' | 'ml' | 'piece'

export interface Quantity {
  value: number
  unit: QuantityUnit
}

/**
 * Inhalt eines Lebensmittels und alle Lebensmittel-Summen: nur g und ml. Stück gibt es nur fürs
 * Nachkaufen (DATENKATALOG §5 Nr. 20), sonst stünden 6 Stück unbemerkt neben 500 g.
 */
export type ContentUnit = Exclude<QuantityUnit, 'piece'>

export interface ContentQuantity extends Quantity {
  unit: ContentUnit
}

/** @internal Nur für Tests exportiert, im Code nur in dieser Datei genutzt. */
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

/**
 * Liest Mengen wie `500 g`, `1,5 l`, `1 kg` oder `6 Stück` und rechnet in g, ml oder Stück.
 * Für den Inhalt einer Packung gilt `parseContentQuantity`, Stück nur beim Nachkaufen.
 * @internal Nur für Tests exportiert, im Code nur in dieser Datei genutzt.
 */
export function parseQuantity(text: string): Result<Quantity, QuantityParseError> {
  const cleaned = text.trim().toLowerCase()
  if (cleaned === '') return err({ kind: 'empty' })
  const match = QUANTITY.exec(cleaned)
  if (!match) return err({ kind: 'invalid-number' })
  const value = parseGermanNumber(match[1] ?? '')
  if (value === null) return err({ kind: 'invalid-number' })
  return toQuantity(value, match[2] ?? '')
}

/** Packungsinhalt bei der Erfassung: Stück ist kein Inhalt, sondern die Anzahl der Packungen. */
export type ContentParseError = QuantityParseError | { kind: 'piece-not-content' }

const isContentQuantity = (quantity: Quantity): quantity is ContentQuantity =>
  quantity.unit !== 'piece'

/** Ist als Einheit Stück angegeben, egal ob die Zahl davor gültig ist („1,5 Stück“, „0 Stück“)? */
function namesPieces(text: string): boolean {
  const unitText = QUANTITY.exec(text.trim().toLowerCase())?.[2]
  return unitText !== undefined && UNITS[unitText]?.unit === 'piece'
}

/**
 * Liest den Inhalt einer Packung wie `parseQuantity`, lehnt Stück aber ab. Die DB kennt als Inhalt
 * nur g und ml (`produkt_inhalt_einheit_check`). „6 Stück“ meint bei der Erfassung sechs Packungen,
 * die UI soll deshalb auf die Anzahl umleiten. Stück wird zuerst abgelehnt, auch mit ungültiger
 * Zahl, damit die UI immer diesen Hinweis zeigt. Stück bleibt dem Nachkaufen vorbehalten.
 */
export function parseContentQuantity(text: string): Result<ContentQuantity, ContentParseError> {
  if (namesPieces(text)) return err({ kind: 'piece-not-content' })
  const parsed = parseQuantity(text)
  if (!parsed.ok) return parsed
  return isContentQuantity(parsed.value) ? ok(parsed.value) : err({ kind: 'piece-not-content' })
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
