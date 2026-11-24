// Adresse des Verlaufs (#48, UX-Konzept §6: auch Filter stehen in der Adresse). Die Parameter und
// Werte heißen deutsch wie im Vorrat, geprüft wird mit `historyFilterSchema`.
import { CAPTURE_PREFILL_PARAMS } from '@/shared/config/stock-paths'
import type { HistoryFilter } from '../schemas/history'

type SearchParams = Readonly<Record<string, string | string[] | undefined>>
type Outcome = NonNullable<HistoryFilter['outcome']>
type Period = HistoryFilter['period']

export const HISTORY_PATH = '/vorrat/verlauf'

const PARAMS = { outcome: 'ausgang', period: 'zeitraum' } as const
// Lebensmittelart bzw. Produkt ohne Art heißen wie beim vorbelegten Erfassen (#195)
const TARGET_PARAMS = CAPTURE_PREFILL_PARAMS

const OUTCOME_SLUGS: Record<Outcome, string> = { consumed: 'verbraucht', discarded: 'entsorgt' }
const PERIOD_SLUGS: Record<Period, string> = {
  '30-days': '30-tage',
  '3-months': '3-monate',
  '12-months': '12-monate',
  all: 'alles',
}
const DEFAULT_PERIOD: Period = '30-days'

const reverse = (slugs: Record<string, string>) =>
  new Map(Object.entries(slugs).map(([value, slug]) => [slug, value]))
const OUTCOME_BY_SLUG = reverse(OUTCOME_SLUGS)
const PERIOD_BY_SLUG = reverse(PERIOD_SLUGS)

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/** Unbekannte Werte bleiben unbekannt, damit das Schema sie ablehnt. */
const fromSlug = (map: Map<string, string>, slug: string | undefined) =>
  slug === undefined ? undefined : (map.get(slug) ?? slug)

function readTarget(params: SearchParams) {
  for (const kind of ['food-type', 'product'] as const) {
    const id = firstValue(params[TARGET_PARAMS[kind]])
    if (id !== undefined) return { kind, id }
  }
  return undefined
}

/** Rohwerte für `historyFilterSchema` aus der Adresse. */
export function readHistoryParams(params: SearchParams): Record<string, unknown> {
  return {
    outcome: fromSlug(OUTCOME_BY_SLUG, firstValue(params[PARAMS.outcome])),
    period: fromSlug(PERIOD_BY_SLUG, firstValue(params[PARAMS.period])),
    target: readTarget(params),
  }
}

export function historyHref(filter: Partial<HistoryFilter>): string {
  const params = new URLSearchParams()
  if (filter.target) params.set(TARGET_PARAMS[filter.target.kind], filter.target.id)
  if (filter.outcome) params.set(PARAMS.outcome, OUTCOME_SLUGS[filter.outcome])
  if (filter.period && filter.period !== DEFAULT_PERIOD) {
    params.set(PARAMS.period, PERIOD_SLUGS[filter.period])
  }
  const query = params.toString()
  return query === '' ? HISTORY_PATH : `${HISTORY_PATH}?${query}`
}
