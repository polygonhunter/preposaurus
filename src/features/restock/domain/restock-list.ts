import type { CalendarDay } from '@/shared/lib/dates'
import type { ContentQuantity } from '@/shared/lib/quantities'
import { pickGapExamples, type GroupFoodType } from './gap-examples'
import { DONE_VISIBLE_DAYS, isWithinDays, splitGaps, type HiddenGap } from './goal-entries'
import type { ReplacementCandidate } from './replacement-candidates'

// Nachkaufen-Liste (UX-Konzept §8.6, DATENKATALOG §2.10): Die Lücken bis zum Ziel und die
// Vorschläge unter „Ersetzen“ werden live gerechnet und nie gespeichert, sie verschwinden von
// selbst (#72, #200). Gespeichert sind Einträge nach einer Entnahme oder aus einem Vorschlag
// („nachkauf“), eigene Einträge („manuell“) und abgehakte oder ausgeblendete Lücken („ziel“, #201).

export type RestockSource = 'ziel' | 'nachkauf' | 'manuell'
type RestockStatus = 'offen' | 'erledigt' | 'ausgeblendet'

/** Ein gespeicherter Eintrag der Liste. */
export interface RestockItem {
  id: string
  label: string
  source: RestockSource
  status: RestockStatus
  createdAt: Date
  /** Seit wann erledigt bzw. ausgeblendet, null, solange offen */
  doneAt: Date | null
  /** Nur bei „nachkauf“: das Produkt, samt Lebensmittelart für das vorbelegte Erfassen (#195) */
  productId: string | null
  foodTypeId: string | null
  /** Nur bei „ziel“: die Warengruppe und die Fehlmenge beim Abhaken bzw. Ausblenden */
  groupKey: string | null
  amount: ContentQuantity | null
}

/** Womit „Erfassen“ vorbelegt (#195): die Lebensmittelart, ohne Art das Produkt, sonst nichts. */
export function captureTargetOf(item: Pick<RestockItem, 'productId' | 'foodTypeId'>) {
  if (item.foodTypeId !== null) return { kind: 'food-type', id: item.foodTypeId } as const
  return item.productId === null ? null : ({ kind: 'product', id: item.productId } as const)
}

/** Lücke einer Warengruppe bis zum Ziel (A13), in Menge und Tagen. */
export interface RestockGap {
  groupKey: string
  name: string
  missing: ContentQuantity
  days: number
  goalDays: number
}

type GapWithExamples = RestockGap & { examples: string[] }

export interface RestockList {
  /** Fehlt bis zum Ziel, Wasser zuerst, mit Beispielen; ohne abgehakte und ausgeblendete (#201) */
  gaps: GapWithExamples[]
  /** Ausgeblendete Lücken, die gerade verdeckt sind, zum Zurückholen */
  hiddenGaps: HiddenGap<RestockGap>[]
  /** Alle Warengruppen unter dem Ziel, auch verdeckte: dieselbe Zahl wie auf der Übersicht */
  belowGoalCount: number
  /** Ersetzen: nach einer Entnahme oder aus einem Vorschlag auf die Liste gesetzt */
  replace: RestockItem[]
  /** Ersetzen, live vorgeschlagen (A14); was schon offen auf der Liste steht, fehlt hier */
  suggestions: ReplacementCandidate[]
  /** Eigene Einträge */
  own: RestockItem[]
  /** Erledigt in den letzten 14 Tagen, zuletzt abgehakt zuerst, auch abgehakte Lücken */
  done: RestockItem[]
  /**
   * Offene, gespeicherte Einträge: dieselbe Zahl wie auf der Übersicht und in der Wochenübersicht
   * (`countOpenItems`). Lücken und Vorschläge nennt die Seite eigens.
   */
  openItemCount: number
}

interface RestockListInput {
  items: readonly RestockItem[]
  gaps: readonly RestockGap[]
  foodTypes: readonly GroupFoodType[]
  candidates: readonly ReplacementCandidate[]
  today: CalendarDay
}

const byCreation = (a: RestockItem, b: RestockItem) => a.createdAt.getTime() - b.createdAt.getTime()
const doneTime = (item: RestockItem) => item.doneAt?.getTime() ?? 0
const byLatestDone = (a: RestockItem, b: RestockItem) => doneTime(b) - doneTime(a)

const sameLabel = (a: string, b: string) => a.localeCompare(b, 'de', { sensitivity: 'base' }) === 0

/** Steht die Zeile schon offen auf der Liste, als Produkt oder unter demselben Namen? */
function isListed(candidate: ReplacementCandidate, open: readonly RestockItem[]) {
  return open.some(
    (item) =>
      (item.productId !== null && candidate.productIds.includes(item.productId)) ||
      sameLabel(item.label, candidate.label),
  )
}

function recentlyDone(items: readonly RestockItem[], today: CalendarDay) {
  return items
    .filter((item) => item.status === 'erledigt')
    .filter((item) => isWithinDays(item.doneAt, today, DONE_VISIBLE_DAYS))
    .sort(byLatestDone)
}

/** Teilt die Einträge in die Abschnitte der Seite; Erledigte rutschen nach unten. */
export function buildRestockList(input: RestockListInput): RestockList {
  const { items, gaps, foodTypes, candidates, today } = input
  const open = items.filter((item) => item.status === 'offen').sort(byCreation)
  const { visible, hidden } = splitGaps(gaps, items, today)
  return {
    gaps: visible.map((gap) => ({ ...gap, examples: pickGapExamples(foodTypes, gap.groupKey) })),
    hiddenGaps: hidden,
    belowGoalCount: gaps.length,
    replace: open.filter((item) => item.source === 'nachkauf'),
    suggestions: candidates.filter((candidate) => !isListed(candidate, open)),
    own: open.filter((item) => item.source === 'manuell'),
    done: recentlyDone(items, today),
    openItemCount: open.length,
  }
}
