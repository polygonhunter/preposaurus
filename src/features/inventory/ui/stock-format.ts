// Texte der Vorrat-Seiten aus den DTOs (UX-Konzept §2: überall dieselben Kennwerte in derselben
// Reihenfolge, §11: „Packung“ statt „Einheit“). Rein, damit Liste, Detail und Bald fällig gleich
// sprechen und es Tests gibt.
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { formatGermanNumber, formatQuantity } from '@/shared/lib/quantities'
import type {
  BestBeforeDto,
  FoodTypeDetail,
  NodeTotalsDto,
  StockOverview,
  UnitStateDto,
} from '../schemas'

type StatusTone = 'red' | 'orange' | 'yellow' | 'green' | 'neutral'

/** Zustand nie nur über Farbe: Ton plus Wort (DESIGN_SYSTEM §3, P10). */
export const STATE_BADGE: Record<UnitStateDto, Readonly<{ tone: StatusTone; label: string }>> = {
  good: { tone: 'green', label: 'gut' },
  soon: { tone: 'yellow', label: 'bald fällig' },
  urgent: { tone: 'orange', label: 'dringend' },
  expired: { tone: 'red', label: 'abgelaufen' },
  'no-date': { tone: 'neutral', label: 'Datum fehlt' },
}

export function formatPackages(count: number): string {
  return count === 1 ? '1 Packung' : `${formatGermanNumber(count)} Packungen`
}

/** Menge in kg bzw. l, beides nebeneinander, wenn es beides gibt. Ohne Menge null. */
function formatAmounts({ g, ml }: NodeTotalsDto['amounts']): string | null {
  const parts = [
    g > 0 ? formatQuantity({ value: g, unit: 'g' }) : null,
    ml > 0 ? formatQuantity({ value: ml, unit: 'ml' }) : null,
  ].filter((part) => part !== null)
  return parts.length === 0 ? null : parts.join(' · ')
}

function formatKcal(kcal: number, isApproximate: boolean): string {
  const value = `${formatGermanNumber(Math.round(kcal))} kcal`
  return isApproximate ? `ca. ${value}` : value
}

function formatDays(days: number): string {
  const rounded = Math.round(days * 10) / 10
  return rounded === 1 ? '1 Tag' : `${formatGermanNumber(rounded)} Tage`
}

/** Beitrag in Tagen: Wasser zählt in Wasser-Tagen, alles andere in Essen-Tagen. */
function supplyDaysOf(totals: NodeTotalsDto): number | null {
  if (totals.amounts.ml > 0 && totals.kcal === 0) return totals.waterDays
  return totals.energyDays
}

type GroupFigures = Pick<StockOverview['groups'][number], 'totals' | 'coverage'>

/** Ebene 1: „12 von 40 Tagen“ mit Ziel und Quelle, sonst der Beitrag in Tagen. */
export function groupCoverageText({ totals, coverage }: GroupFigures): string | null {
  if (coverage !== null) {
    const days = Math.round(coverage.days * 10) / 10
    return `${formatGermanNumber(days)} von ${String(coverage.goalDays)} Tagen`
  }
  const days = supplyDaysOf(totals)
  return days === null ? null : formatDays(days)
}

/** „8 Packungen · 4 kg“, die Packungszahl zählt alle im Vorrat (auch abgelaufene). */
export function stockLine(packagesInStock: number, totals: NodeTotalsDto): string {
  const amounts = formatAmounts(totals.amounts)
  const packages = formatPackages(packagesInStock)
  return amounts === null ? packages : `${packages} · ${amounts}`
}

/** Tage bis zum Datum: „heute“, „morgen“, „in 12 Tagen“, „seit gestern“, „seit 3 Tagen“. */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return 'heute'
  if (daysLeft === 1) return 'morgen'
  if (daysLeft === -1) return 'seit gestern'
  if (daysLeft < 0) return `seit ${String(-daysLeft)} Tagen`
  return `in ${String(daysLeft)} Tagen`
}

/** Meldung in der UndoBar: „Nudeln: 1 Packung verbraucht (11/2027)“. */
export function formatTakenMessage(name: string, dateLabel: string | null): string {
  const date = dateLabel === null ? '' : ` (${dateLabel})`
  return `${name}: 1 Packung verbraucht${date}`
}

/** MHD wie aufgedruckt („30.09.2027“, „09/2027“, „2027“), geschätzt mit Vermerk. */
export function formatDate({ date, precision, isEstimated }: BestBeforeDto): string {
  const text = formatDayWithPrecision({ date: toCalendarDay(date), precision })
  return isEstimated ? `${text}, geschätzt` : text
}

/** Kein Vorrat: in keiner Warengruppe liegt eine Packung (auch keine abgelaufene). */
export function isEmptyStock(groups: readonly Pick<GroupFigures, 'totals'>[]): boolean {
  return groups.every(({ totals }) => totals.packages + totals.uncountedPackages === 0)
}

/** Untertitel einer Warengruppe bzw. Lebensmittelart: „5 Packungen · 2,5 kg · 3,2 Tage“. */
export function groupSubtitle(totals: NodeTotalsDto): string {
  const packages = totals.packages + totals.uncountedPackages
  const days = supplyDaysOf(totals)
  const line = stockLine(packages, totals)
  return days === null ? line : `${line} · ${formatDays(days)}`
}

export const BEST_BEFORE_HINT = 'MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.'
const USE_BY_HINT = 'Verbrauchsdatum überschritten, bitte nicht mehr essen.'

/** Hinweis nur bei Abgelaufenem: beim MHD beruhigend, beim Verbrauchsdatum klar (UX §8.2). */
export function expiryHint(state: UnitStateDto, kind: 'best-before' | 'use-by'): string | null {
  if (state !== 'expired') return null
  return kind === 'use-by' ? USE_BY_HINT : BEST_BEFORE_HINT
}

/** Kennwerte im Detail: Packungen · Menge · kcal · Tage (UX-Konzept §2, P3). Ohne Bedarf keine Tage. */
export function detailTiles({ totals }: Pick<FoodTypeDetail, 'totals'>) {
  const days = supplyDaysOf(totals)
  const tiles = [
    { label: 'Packungen', value: formatGermanNumber(totals.packages + totals.uncountedPackages) },
    { label: 'Menge', value: formatAmounts(totals.amounts) ?? '–' },
    { label: 'kcal', value: formatKcal(totals.kcal, totals.isApproximate).replace(' kcal', '') },
  ]
  if (days === null) return tiles
  return [...tiles, { label: 'Tage', value: formatGermanNumber(Math.round(days * 10) / 10) }]
}

/** Übliche Haltbarkeit nur als Hinweis, nie als MHD (#110). */
export function shelfLifeHint(months: number | null): string | null {
  if (months === null) return null
  const span = months === 1 ? '1 Monat' : `${String(months)} Monate`
  return `Richtwert: ungeöffnet meist etwa ${span} haltbar. Es zählt das Datum auf der Packung.`
}
