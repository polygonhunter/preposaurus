import { addDays, type CalendarDay } from '@/shared/lib/dates'

// Automatischer Teil von „Ersetzen“ (A14, DATENKATALOG §3 und §4 Nr. 18, #200): Packungen, die vor
// dem Zieldatum ablaufen, und zuletzt verbrauchte Lebensmittelarten ohne Restbestand. Wie die
// Lücken bis zum Ziel live gerechnet und nie gespeichert. Eine Zeile ist die Lebensmittelart, ohne
// Art das Produkt (wie im Vorrat).

/** „Zuletzt verbraucht“ heißt: in den letzten 30 Tagen entnommen (DATENKATALOG §3, A14). */
export const RECENT_CONSUMPTION_DAYS = 30

/** Eine Packung im Vorrat oder eine zuletzt verbrauchte, mit ihrer Zeile. */
export interface ReplacementUnit {
  productId: string
  /** Lebensmittelart, ohne Art das Produkt */
  rowKey: string
  label: string
  status: 'stock' | 'consumed'
  bestBefore: CalendarDay | null
  /** Tag der Entnahme in Berlin, nur bei verbrauchten Packungen */
  takenOn: CalendarDay | null
}

type ReplacementReason =
  | Readonly<{ kind: 'expires'; count: number; firstDay: CalendarDay }>
  | Readonly<{ kind: 'consumed'; lastDay: CalendarDay }>

export interface ReplacementCandidate {
  rowKey: string
  /** Produkte der Zeile, damit ein schon gelisteter Eintrag den Vorschlag ersetzt */
  productIds: string[]
  /** Dieses Produkt kommt mit „Auf die Liste“ auf die Liste */
  productId: string
  label: string
  reason: ReplacementReason
}

interface CandidateDays {
  today: CalendarDay
  /** Gültiges Zieldatum (heute oder später), sonst null: dann nur „zuletzt verbraucht“ */
  targetDay: CalendarDay | null
}

const byDayAscending = (a: CalendarDay, b: CalendarDay) => a.localeCompare(b)

/** Packungen mit dem Tag, nach dem sie sortiert werden, frühester zuerst. */
type DatedUnit = Readonly<{ unit: ReplacementUnit; day: CalendarDay }>

const earliestFirst = (a: DatedUnit, b: DatedUnit) => byDayAscending(a.day, b.day)

function expiringCandidate(stock: readonly ReplacementUnit[], targetDay: CalendarDay | null) {
  if (targetDay === null) return null
  const expiring = stock
    .flatMap((unit) => {
      const day = unit.bestBefore
      return day !== null && day < targetDay ? [{ unit, day }] : []
    })
    .sort(earliestFirst)
  const first = expiring[0]
  if (first === undefined) return null
  const reason = { kind: 'expires', count: expiring.length, firstDay: first.day } as const
  return { unit: first.unit, reason }
}

function consumedCandidate(rowUnits: readonly ReplacementUnit[], since: CalendarDay) {
  const recent = rowUnits
    .flatMap((unit) => {
      const day = unit.takenOn
      return unit.status === 'consumed' && day !== null && day >= since ? [{ unit, day }] : []
    })
    .sort(earliestFirst)
  const last = recent.at(-1)
  if (last === undefined) return null
  return { unit: last.unit, reason: { kind: 'consumed', lastDay: last.day } as const }
}

function candidateOf(rowUnits: readonly ReplacementUnit[], days: CandidateDays) {
  const stock = rowUnits.filter((unit) => unit.status === 'stock')
  const found =
    stock.length > 0
      ? expiringCandidate(stock, days.targetDay)
      : consumedCandidate(rowUnits, addDays(days.today, -RECENT_CONSUMPTION_DAYS))
  if (found === null) return null
  const { unit, reason } = found
  const productIds = [...new Set(rowUnits.map((entry) => entry.productId))]
  return { rowKey: unit.rowKey, productIds, productId: unit.productId, label: unit.label, reason }
}

function groupByRow(units: readonly ReplacementUnit[]) {
  const rows = new Map<string, ReplacementUnit[]>()
  for (const unit of units) rows.set(unit.rowKey, [...(rows.get(unit.rowKey) ?? []), unit])
  return [...rows.values()]
}

const sortDay = ({ reason }: ReplacementCandidate) =>
  reason.kind === 'expires' ? reason.firstDay : reason.lastDay

/** Was laufend ab, steht oben, nach dem ersten MHD; danach das zuletzt Verbrauchte, neuestes zuerst. */
function byUrgency(a: ReplacementCandidate, b: ReplacementCandidate) {
  if (a.reason.kind !== b.reason.kind) return a.reason.kind === 'expires' ? -1 : 1
  const order = byDayAscending(sortDay(a), sortDay(b))
  return a.reason.kind === 'expires' ? order : -order
}

/**
 * Vorschläge für „Ersetzen“. Eine Zeile mit Bestand ist ein Kandidat, wenn Packungen vor dem
 * Zieldatum ablaufen („Datum fehlt“ zählt nicht); eine Zeile ohne Bestand, wenn in den letzten
 * 30 Tagen etwas davon verbraucht wurde. Entsorgtes zählt nicht als verbraucht.
 */
export function replacementCandidates(
  units: readonly ReplacementUnit[],
  days: CandidateDays,
): ReplacementCandidate[] {
  return groupByRow(units)
    .flatMap((rowUnits) => candidateOf(rowUnits, days) ?? [])
    .sort(byUrgency)
}
