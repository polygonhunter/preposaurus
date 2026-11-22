// Adressen der Vorrat-Seiten (UX-Konzept §6: jeder Screen hat eine Adresse, auch Filter stehen
// dort). Die Parameter heißen deutsch, die Werte der Fachlogik bleiben englisch. Die Prüfung
// übernimmt `stockFilterSchema`.
import type { DueSort, StockFilter, StockTarget } from '../schemas'

type StockStatus = StockFilter['status']
type SearchParams = Readonly<Record<string, string | string[] | undefined>>
type LinkFilter = Partial<
  Pick<StockFilter, 'status' | 'search' | 'containerId' | 'storageLocationId'>
>

export const STOCK_PATH = '/vorrat'
const DUE_PATH = '/uebersicht/bald-faellig'
export const CAPTURE_PATH = '/neu'

const STATUS_SLUGS: Record<StockStatus, string> = {
  'in-stock': 'im-vorrat',
  'due-soon': 'bald-faellig',
  expired: 'abgelaufen',
  incomplete: 'unvollstaendig',
  consumed: 'verbraucht',
  discarded: 'entsorgt',
}

export const STOCK_PARAMS = {
  search: 'suche',
  status: 'zustand',
  containerId: 'behaelter',
  storageLocationId: 'lagerort',
} as const

const STATUS_BY_SLUG = new Map(Object.entries(STATUS_SLUGS).map(([status, slug]) => [slug, status]))

// Schlüssel der Warengruppen sind feste Slugs aus dem Seed (a–z, _)
export const groupPath = (groupKey: string) => `${STOCK_PATH}/${groupKey}`

export const targetPath = ({ kind, id }: StockTarget) =>
  `${STOCK_PATH}/${kind === 'food-type' ? 'art' : 'produkt'}/${id}`

/** Sprungmarke einer Kategorie auf Ebene 2 */
export const categoryAnchor = (categoryId: string) => `kategorie-${categoryId}`

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

// Ein leeres Feld aus dem Formular („Alle“) gilt als nicht gesetzt
const nonEmpty = (value: string | undefined) => (value === '' ? undefined : value)

/** Rohwerte für `stockFilterSchema` aus der Adresse. Unbekannter Zustand bleibt unbekannt. */
export function readStockParams(params: SearchParams): Record<string, string | undefined> {
  const status = firstValue(params[STOCK_PARAMS.status])
  return {
    search: nonEmpty(firstValue(params[STOCK_PARAMS.search])),
    status: status === undefined ? undefined : (STATUS_BY_SLUG.get(status) ?? status),
    containerId: nonEmpty(firstValue(params[STOCK_PARAMS.containerId])),
    storageLocationId: nonEmpty(firstValue(params[STOCK_PARAMS.storageLocationId])),
  }
}

/** Treffermodus, sobald Suche, ein anderer Zustand als „Im Vorrat“ oder ein Filter aktiv ist. */
export function isHitMode(filter: StockFilter): boolean {
  const values = [filter.search, filter.containerId, filter.storageLocationId]
  return filter.status !== 'in-stock' || values.some((value) => value !== undefined && value !== '')
}

export function stockHref(filter: LinkFilter): string {
  const params = new URLSearchParams()
  if (filter.search) params.set(STOCK_PARAMS.search, filter.search)
  if (filter.status && filter.status !== 'in-stock') {
    params.set(STOCK_PARAMS.status, STATUS_SLUGS[filter.status])
  }
  if (filter.containerId) params.set(STOCK_PARAMS.containerId, filter.containerId)
  if (filter.storageLocationId) {
    params.set(STOCK_PARAMS.storageLocationId, filter.storageLocationId)
  }
  const query = params.toString()
  return query === '' ? STOCK_PATH : `${STOCK_PATH}?${query}`
}

export const statusSlug = (status: StockStatus) => STATUS_SLUGS[status]

export const DUE_SORT_PARAM = 'sortierung'
const LOCATION_SLUG = 'lagerort'

/** Bald fällig, nach Lagerort mit `?sortierung=lagerort`, sonst nach Datum. */
export const dueHref = (sort: DueSort) =>
  sort === 'location' ? `${DUE_PATH}?${DUE_SORT_PARAM}=${LOCATION_SLUG}` : DUE_PATH

export function readDueSort(params: SearchParams): DueSort {
  return firstValue(params[DUE_SORT_PARAM]) === LOCATION_SLUG ? 'location' : 'date'
}
