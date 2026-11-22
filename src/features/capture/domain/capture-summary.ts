// Kurze Zusammenfassung vor dem Speichern (#54, UX §8.5 Schritt „Prüfen“):
// „6 × Nudeln 500 g“ · „3 kg · ca. 10.770 kcal“ · „09/2027 (4×), Datum fehlt (2×)“.
// „ca.“ heißt: Die kcal stammen aus dem Richtwert der Lebensmittelart (UX §4), nicht vom Etikett.
import { formatGermanNumber, formatQuantity, type ContentQuantity } from '@/shared/lib/quantities'
import { countPackages, dateEntryLabel, type DateEntry } from './date-entries'
import { amountPerUnit } from './nutrition'

export interface KcalBasis {
  per100: number
  /** true: Richtwert der Lebensmittelart statt eigener Angabe */
  isEstimate: boolean
}

interface SummaryInput {
  /** Name der Lebensmittelart bzw. des wiedererkannten Produkts */
  productName: string
  content: ContentQuantity | null
  kcal: KcalBasis | null
  entries: readonly DateEntry[]
}

export interface CaptureSummary {
  packageCount: number
  headline: string
  /** Gesamtmenge und kcal, soweit bekannt */
  totals: string[]
  dates: string
}

function totalKcal(content: ContentQuantity, kcal: KcalBasis, count: number): string {
  const perUnit = amountPerUnit({ content, drainedWeightG: null, per100: kcal.per100 })
  const text = `${formatGermanNumber(Math.round(perUnit * count), 0)} kcal`
  return kcal.isEstimate ? `ca. ${text}` : text
}

function totalsOf({ content, kcal }: SummaryInput, count: number): string[] {
  if (content === null) return []
  const amount = formatQuantity({ value: content.value * count, unit: content.unit })
  return kcal === null ? [amount] : [amount, totalKcal(content, kcal, count)]
}

export function summarizeCapture(input: SummaryInput): CaptureSummary {
  const packageCount = countPackages(input.entries)
  const product =
    input.content === null
      ? input.productName
      : `${input.productName} ${formatQuantity(input.content)}`
  return {
    packageCount,
    headline: `${String(packageCount)} × ${product}`,
    totals: totalsOf(input, packageCount),
    dates: input.entries
      .map((entry) => `${dateEntryLabel(entry)} (${String(entry.count)}×)`)
      .join(', '),
  }
}
