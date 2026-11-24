// Die zwei Tage-Zahlen und ihre Namen (#209). An einer Warengruppe stehen zwei richtige, aber
// verschiedene Zahlen: wie weit die Menge die Empfehlung abdeckt und wie lange ihre kcal den ganzen
// Haushalt satt machen. Damit niemand sie verwechselt, trägt jede Zahl überall denselben Namen.
// Liegt in shared/lib, weil Übersicht, Vorrat, Detail und Nachkaufen gleich sprechen sollen.
import { formatGermanNumber } from './quantities'

/** Die Namen, vor der Zahl gelesen: „Menge reicht 6,6 von 10 Tagen“, „Satt für 4,1 Tage“. */
export const DAYS_TERM = {
  /** Abdeckung nach Menge: Bestand ÷ empfohlene Menge je Tag (UX-Konzept A9) */
  amount: 'Menge reicht',
  /** Beitrag nach kcal: kcal ÷ kcal-Tagesbedarf aller Personen (UX-Konzept §3) */
  food: 'Satt für',
  /** Wasser hat keine kcal: Liter ÷ Wasserbedarf aller Personen (#260) */
  water: 'Wasser für',
} as const

/** Eine Tage-Zahl mit ihrem Namen, getrennt, damit Name und Wert verschieden gesetzt werden können. */
export type NamedDays = Readonly<{ label: string; value: string }>

const DAYS_FACTOR = 10

/** „4,1 Tage“, „1 Tag“, auf eine Nachkommastelle. */
export function formatDays(days: number): string {
  const rounded = Math.round(days * DAYS_FACTOR) / DAYS_FACTOR
  return rounded === 1 ? '1 Tag' : `${formatGermanNumber(rounded)} Tage`
}

/** „6,6 von 10 Tagen“, der Wert der Abdeckung ohne Namen */
export function coverageValue(days: number, goalDays: number): string {
  const rounded = Math.round(days * DAYS_FACTOR) / DAYS_FACTOR
  return `${formatGermanNumber(rounded)} von ${String(goalDays)} Tagen`
}

/** Abdeckung nach Menge: „Menge reicht“ · „6,6 von 10 Tagen“ */
export const amountDays = (days: number, goalDays: number): NamedDays => ({
  label: DAYS_TERM.amount,
  value: coverageValue(days, goalDays),
})

/** Beitrag in Tagen: „Satt für“ · „4,1 Tage“, bei Wasser „Wasser für“ · „3,2 Tage“ */
export const supplyDays = (kind: 'food' | 'water', days: number): NamedDays => ({
  label: DAYS_TERM[kind],
  value: formatDays(days),
})

/** Name und Wert in einem Satzteil: „Menge reicht 6,6 von 10 Tagen“ */
export const namedDaysText = ({ label, value }: NamedDays) => `${label} ${value}`
