// Texte der Vorrat-Seiten aus den DTOs (UX-Konzept §2: überall dieselben Kennwerte in derselben
// Reihenfolge, §11: „Packung“ statt „Einheit“). Rein, damit Liste, Detail und Bald fällig gleich
// sprechen und es Tests gibt.
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { formatGermanNumber, formatQuantity } from '@/shared/lib/quantities'
import type { FoodTypeDetail } from '../schemas/detail'
import type { BestBeforeDto, NodeTotalsDto, UnitStateDto } from '../schemas/shared'
import type { StockOverview } from '../schemas/stock'

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
export function formatAmounts({ g, ml }: NodeTotalsDto['amounts']): string | null {
  const parts = [
    g > 0 ? formatQuantity({ value: g, unit: 'g' }) : null,
    ml > 0 ? formatQuantity({ value: ml, unit: 'ml' }) : null,
  ].filter((part) => part !== null)
  return parts.length === 0 ? null : parts.join(' · ')
}

export function formatKcal(kcal: number, isApproximate: boolean): string {
  const value = `${formatGermanNumber(Math.round(kcal))} kcal`
  return isApproximate ? `ca. ${value}` : value
}

export function formatDays(days: number): string {
  const rounded = Math.round(days * 10) / 10
  return rounded === 1 ? '1 Tag' : `${formatGermanNumber(rounded)} Tage`
}

/**
 * Zählt der Knoten als Wasser? Nur Packungen der Warengruppe Wasser tragen `waterMl` (stock-model),
 * ein anderes Getränk ohne kcal (z. B. ungesüßter Tee) also nicht (UX-Konzept A10, #260).
 */
export const countsAsWater = (totals: NodeTotalsDto) => totals.waterMl > 0

/** Beitrag in Tagen: Wasser zählt in Wasser-Tagen, alles andere in Essen-Tagen. */
export function supplyDaysOf(totals: NodeTotalsDto): number | null {
  return countsAsWater(totals) ? totals.waterDays : totals.energyDays
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

/**
 * „8 Packungen · 4 kg“: Anzahl und Menge zählen dieselben Packungen, die heute zählen (#208).
 * Abgelaufene stehen als Zusatz da („dazu 1 abgelaufen“), nur Abgelaufenes als „1 Packung abgelaufen“.
 */
export function stockLine(totals: NodeTotalsDto): string {
  const { packages, uncountedPackages } = totals
  if (packages === 0 && uncountedPackages > 0)
    return `${formatPackages(uncountedPackages)} abgelaufen`
  const amounts = formatAmounts(totals.amounts)
  const counted =
    amounts === null ? formatPackages(packages) : `${formatPackages(packages)} · ${amounts}`
  return uncountedPackages > 0
    ? `${counted} · dazu ${formatGermanNumber(uncountedPackages)} abgelaufen`
    : counted
}

/** Im Vorrat liegt etwas, auch wenn es heute nicht mehr zählt. */
export const hasStock = (totals: NodeTotalsDto) => totals.packages + totals.uncountedPackages > 0

const OUTCOME_WORD = { consumed: 'verbraucht', discarded: 'entsorgt' } as const

/** Meldung in der UndoBar: „Nudeln: 1 Packung verbraucht (11/2027)“ bzw. „… entsorgt …“. */
export function formatTakenMessage(
  name: string,
  dateLabel: string | null,
  outcome: keyof typeof OUTCOME_WORD = 'consumed',
): string {
  const date = dateLabel === null ? '' : ` (${dateLabel})`
  return `${name}: 1 Packung ${OUTCOME_WORD[outcome]}${date}`
}

/** „noch gut (geprüft am 23.11.2026)“ für eine „Noch gut“ geprüfte Packung (#47). */
export function stillGoodLabel(checkedAt: string): string {
  const day = formatDayWithPrecision({ date: toCalendarDay(checkedAt), precision: 'day' })
  return `noch gut (geprüft am ${day})`
}

/** Meldung in der UndoBar nach „Noch gut“: „Walnüsse: 1 Packung noch gut (geprüft am …)“. */
export function formatStillGoodMessage(name: string, count: number, checkedAt: string): string {
  return `${name}: ${formatPackages(count)} ${stillGoodLabel(checkedAt)}`
}

/** MHD wie aufgedruckt („30.09.2027“, „09/2027“, „2027“), geschätzt mit Vermerk. */
export function formatDate({ date, precision, isEstimated }: BestBeforeDto): string {
  const text = formatDayWithPrecision({ date: toCalendarDay(date), precision })
  return isEstimated ? `${text}, geschätzt` : text
}

/**
 * Datum hinter dem Zustandswort einer Zeile. Es gehört zur nächsten gültigen Packung. Lautet das
 * Wort „abgelaufen“, gehört es zu einer anderen Packung, deshalb dann „nächstes MHD …“ (#208).
 */
export function nextDateLabel(
  state: UnitStateDto | null,
  next: BestBeforeDto | null,
): string | null {
  if (next === null) return null
  return `${state === 'expired' ? 'nächstes MHD ' : ''}${formatDate(next)}`
}

/** Kein Vorrat: in keiner Warengruppe liegt eine Packung (auch keine abgelaufene). */
export function isEmptyStock(groups: readonly Pick<GroupFigures, 'totals'>[]): boolean {
  return groups.every(({ totals }) => !hasStock(totals))
}

/** Untertitel einer Warengruppe bzw. Lebensmittelart: „5 Packungen · 2,5 kg · 3,2 Tage“. */
export function groupSubtitle(totals: NodeTotalsDto): string {
  const days = supplyDaysOf(totals)
  const line = stockLine(totals)
  return days === null ? line : `${line} · ${formatDays(days)}`
}

export const BEST_BEFORE_HINT = 'MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.'
/** Datumsart neben dem Datum, wenn es kein MHD ist (#294) */
export const USE_BY_LABEL = 'Verbrauchsdatum'
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
    { label: 'Packungen', value: formatGermanNumber(totals.packages) },
    { label: 'Menge', value: formatAmounts(totals.amounts) ?? '–' },
    { label: 'kcal', value: formatKcal(totals.kcal, totals.isApproximate).replace(' kcal', '') },
  ]
  if (days === null) return tiles
  return [...tiles, { label: 'Tage', value: formatGermanNumber(Math.round(days * 10) / 10) }]
}

/** Unter den Kennwerten: Abgelaufenes zählt nicht in Packungen, Menge, kcal und Tage (#208). */
export function uncountedNote({ uncountedPackages }: NodeTotalsDto): string | null {
  if (uncountedPackages === 0) return null
  const subject =
    uncountedPackages === 1
      ? '1 abgelaufene Packung'
      : `${formatGermanNumber(uncountedPackages)} abgelaufene Packungen`
  return `Dazu ${subject}, nicht in diesen Zahlen.`
}

/** Übliche Haltbarkeit nur als Hinweis, nie als MHD (#110). */
export function shelfLifeHint(months: number | null): string | null {
  if (months === null) return null
  const span = months === 1 ? '1 Monat' : `${String(months)} Monate`
  return `Richtwert: ungeöffnet meist etwa ${span} haltbar. Es zählt das Datum auf der Packung.`
}

/**
 * Der amtliche Name einer Warengruppe über dem Kurznamen im Titel (#177). Sind beide gleich,
 * steht nichts darüber.
 */
export function officialNameEyebrow(group: { name: string; shortName: string }) {
  return group.name === group.shortName ? {} : { eyebrow: group.name }
}
