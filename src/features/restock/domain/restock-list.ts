import type { ContentQuantity } from '@/shared/lib/quantities'
import { pickGapExamples, type GroupFoodType } from './gap-examples'
import type { ReplacementCandidate } from './replacement-candidates'

// Nachkaufen-Liste (UX-Konzept §8.6, DATENKATALOG §2.10): Die Lücken bis zum Ziel und die
// Vorschläge unter „Ersetzen“ werden live gerechnet und nie gespeichert, sie verschwinden von
// selbst (#72, #200). Gespeichert sind nur Einträge nach einer Entnahme oder aus einem Vorschlag
// („nachkauf“) und eigene Einträge („manuell“).

export type RestockSource = 'nachkauf' | 'manuell'

/** Ein gespeicherter Eintrag der Liste. */
export interface RestockItem {
  id: string
  label: string
  source: RestockSource
  isDone: boolean
  /** Nur bei „nachkauf“: das Produkt, das nachgekauft werden soll */
  productId: string | null
  createdAt: Date
  /** Letzte Änderung, beim Abhaken also der Zeitpunkt des Abhakens */
  changedAt: Date
}

/** Lücke einer Warengruppe bis zum Ziel (A13), in Menge und Tagen. */
export interface RestockGap {
  groupKey: string
  name: string
  missing: ContentQuantity
  days: number
  goalDays: number
}

export interface RestockList {
  /** Fehlt bis zum Ziel, Wasser zuerst, mit Beispielen aus den Lebensmittelarten */
  gaps: (RestockGap & { examples: string[] })[]
  /** Ersetzen: nach einer Entnahme oder aus einem Vorschlag auf die Liste gesetzt */
  replace: RestockItem[]
  /** Ersetzen, live vorgeschlagen (A14); was schon offen auf der Liste steht, fehlt hier */
  suggestions: ReplacementCandidate[]
  /** Eigene Einträge */
  own: RestockItem[]
  /** Erledigt, zuletzt abgehakt zuerst */
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
}

const byCreation = (a: RestockItem, b: RestockItem) => a.createdAt.getTime() - b.createdAt.getTime()
const byLatestChange = (a: RestockItem, b: RestockItem) =>
  b.changedAt.getTime() - a.changedAt.getTime()

const sameLabel = (a: string, b: string) => a.localeCompare(b, 'de', { sensitivity: 'base' }) === 0

/** Steht die Zeile schon offen auf der Liste, als Produkt oder unter demselben Namen? */
function isListed(candidate: ReplacementCandidate, open: readonly RestockItem[]) {
  return open.some(
    (item) =>
      (item.productId !== null && candidate.productIds.includes(item.productId)) ||
      sameLabel(item.label, candidate.label),
  )
}

/** Teilt die Einträge in die Abschnitte der Seite; Erledigte rutschen nach unten. */
export function buildRestockList({
  items,
  gaps,
  foodTypes,
  candidates,
}: RestockListInput): RestockList {
  const open = items.filter((item) => !item.isDone).sort(byCreation)
  const suggestions = candidates.filter((candidate) => !isListed(candidate, open))
  return {
    gaps: gaps.map((gap) => ({ ...gap, examples: pickGapExamples(foodTypes, gap.groupKey) })),
    replace: open.filter((item) => item.source === 'nachkauf'),
    suggestions,
    own: open.filter((item) => item.source === 'manuell'),
    done: items.filter((item) => item.isDone).sort(byLatestChange),
    openItemCount: open.length,
  }
}
