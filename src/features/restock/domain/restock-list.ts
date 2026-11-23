import type { ContentQuantity } from '@/shared/lib/quantities'

// Nachkaufen-Liste (UX-Konzept §8.6, DATENKATALOG §2.10): Die Lücken bis zum Ziel werden live
// gerechnet und nie gespeichert, sie verschwinden, sobald die Lücke zu ist (#72). Gespeichert sind
// nur Einträge nach einer Entnahme („nachkauf“) und eigene Einträge („manuell“).

export type RestockSource = 'nachkauf' | 'manuell'

/** Ein gespeicherter Eintrag der Liste. */
export interface RestockItem {
  id: string
  label: string
  source: RestockSource
  isDone: boolean
  createdAt: Date
  /** Letzte Änderung, beim Abhaken also der Zeitpunkt des Abhakens */
  changedAt: Date
  /** Produkt nach einer Entnahme samt Lebensmittelart, für das vorbelegte Erfassen (#195) */
  productId: string | null
  foodTypeId: string | null
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

export interface RestockList {
  /** Fehlt bis zum Ziel, Wasser zuerst */
  gaps: RestockGap[]
  /** Ersetzen: nach einer Entnahme auf die Liste gesetzt */
  replace: RestockItem[]
  /** Eigene Einträge */
  own: RestockItem[]
  /** Erledigt, zuletzt abgehakt zuerst */
  done: RestockItem[]
  /** Offene Lücken und offene Einträge zusammen („3 offen“) */
  openCount: number
}

interface RestockListInput {
  items: readonly RestockItem[]
  gaps: readonly RestockGap[]
}

const byCreation = (a: RestockItem, b: RestockItem) => a.createdAt.getTime() - b.createdAt.getTime()
const byLatestChange = (a: RestockItem, b: RestockItem) =>
  b.changedAt.getTime() - a.changedAt.getTime()

/** Teilt die Einträge in die Abschnitte der Seite; Erledigte rutschen nach unten. */
export function buildRestockList({ items, gaps }: RestockListInput): RestockList {
  const open = items.filter((item) => !item.isDone).sort(byCreation)
  return {
    gaps: [...gaps],
    replace: open.filter((item) => item.source === 'nachkauf'),
    own: open.filter((item) => item.source === 'manuell'),
    done: items.filter((item) => item.isDone).sort(byLatestChange),
    openCount: gaps.length + open.length,
  }
}
