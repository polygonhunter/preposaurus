// Texte der Vorrat-Seiten aus den DTOs (UX-Konzept §2: überall dieselben Kennwerte in derselben
// Reihenfolge, §11: „Packung“ statt „Einheit“). Rein, damit Liste, Detail und Bald fällig gleich
// sprechen und es Tests gibt.
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { formatGermanNumber, formatQuantity } from '@/shared/lib/quantities'
import { amountDays, namedDaysText, supplyDays, type NamedDays } from '@/shared/lib/supply-terms'
import type { FoodTypeDetail } from '../schemas/detail'
import type { BestBeforeDto, CoverageDto, NodeTotalsDto, UnitStateDto } from '../schemas/shared'

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

/**
 * Zählt der Knoten als Wasser? Nur Packungen der Warengruppe Wasser tragen `waterMl` (stock-model),
 * ein anderes Getränk ohne kcal (z. B. ungesüßter Tee) also nicht (UX-Konzept A10, #260).
 */
export const countsAsWater = (totals: NodeTotalsDto) => totals.waterMl > 0

/** Beitrag in Tagen: Wasser zählt in Wasser-Tagen, alles andere in Essen-Tagen. */
export function supplyDaysOf(totals: NodeTotalsDto): number | null {
  return countsAsWater(totals) ? totals.waterDays : totals.energyDays
}

/** Beitrag in Tagen mit Namen: „Satt für 4,1 Tage“, bei Wasser „Wasser für 3,2 Tage“ (#209). */
export function namedSupplyDays(totals: NodeTotalsDto): NamedDays | null {
  const days = supplyDaysOf(totals)
  if (days === null) return null
  return supplyDays(countsAsWater(totals) ? 'water' : 'food', days)
}

type GroupFigures = Readonly<{
  totals: NodeTotalsDto
  coverage: Pick<CoverageDto, 'days' | 'goalDays'> | null
}>

const namedCoverage = (coverage: GroupFigures['coverage']) =>
  coverage === null ? null : amountDays(coverage.days, coverage.goalDays)

/**
 * Ebene 1: je Warengruppe eine Zahl mit Namen. Mit Mengenempfehlung „Menge reicht 12 von 40 Tagen“,
 * ohne (Sonstiges, Getränke, ohne Ziel) der Beitrag „Satt für 0,2 Tage“ bzw. „Wasser für …“ (#209).
 */
export function groupDays({ totals, coverage }: GroupFigures): NamedDays | null {
  return namedCoverage(coverage) ?? namedSupplyDays(totals)
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

/** MHD wie aufgedruckt („30.09.2027“, „09/2027“, „2027“), eine Schätzung mit „ca.“ (#180). */
export function formatDate({ date, precision, isEstimated }: BestBeforeDto): string {
  const text = formatDayWithPrecision({ date: toCalendarDay(date), precision })
  return isEstimated ? `ca. ${text}` : text
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

/**
 * Kopf einer Warengruppe (Ebene 2): beide Tage-Zahlen mit Namen (#209), z. B. „5 Packungen · 2,5 kg ·
 * Menge reicht 6,6 von 10 Tagen · Satt für 4,1 Tage“. Was fehlt (kein Ziel, kein Bedarf), entfällt.
 */
export function groupSubtitle({ totals, coverage }: GroupFigures): string {
  return [stockLine(totals), namedCoverage(coverage), namedSupplyDays(totals)]
    .filter((part) => part !== null)
    .map((part) => (typeof part === 'string' ? part : namedDaysText(part)))
    .join(' · ')
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

/**
 * Kennwerte im Detail: Packungen · Menge · kcal · „Satt für“ bzw. „Wasser für“ (UX-Konzept §2, P3,
 * #209). Ohne Bedarf keine Tage.
 */
export function detailTiles({ totals }: Pick<FoodTypeDetail, 'totals'>) {
  const days = namedSupplyDays(totals)
  const tiles = [
    { label: 'Packungen', value: formatGermanNumber(totals.packages) },
    { label: 'Menge', value: formatAmounts(totals.amounts) ?? '–' },
    { label: 'kcal', value: formatKcal(totals.kcal, totals.isApproximate).replace(' kcal', '') },
  ]
  return days === null ? tiles : [...tiles, days]
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
