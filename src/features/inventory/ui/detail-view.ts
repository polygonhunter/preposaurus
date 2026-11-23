// Ableitungen für die Detailseite (UX-Konzept §8.4) aus dem DTO von `getFoodTypeDetail`: Säulen
// je MHD, die Datumszeile für „1 entnehmen“ und die Nährwertzeile mit Herkunft.
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { BestBeforeGroupDto, FoodTypeDetail, NutritionDto, UnitStateDto } from '../schemas'
import { STATE_BADGE, formatDate, formatPackages, stillGoodLabel } from './stock-format'

type DetailProduct = FoodTypeDetail['products'][number]

export interface ShelfLifeColumn {
  key: string
  label: string
  count: number
  state: UnitStateDto
}

const NO_DATE_LABEL = 'Datum fehlt'
// Sortiert hinter jedes ISO-Datum
const NO_DATE_SORT_KEY = '9999'

/** Text einer Datumszeile: „11/2027“, „03/2028, geschätzt“ oder „Datum fehlt“. */
export function groupLabel(group: BestBeforeGroupDto): string {
  return group.kind === 'no-date' ? NO_DATE_LABEL : formatDate(group)
}

/** Säulen je Datum über alle Produkte, frühestes links, „Datum fehlt“ zuletzt. */
export function shelfLifeColumns(products: readonly DetailProduct[]): ShelfLifeColumn[] {
  const columns = new Map<string, { column: ShelfLifeColumn; sortKey: string }>()
  for (const group of products.flatMap((product) => product.bestBeforeGroups)) {
    const label = groupLabel(group)
    const existing = columns.get(label)
    if (existing) {
      existing.column.count += group.units.length
      continue
    }
    const isDated = group.kind === 'dated'
    const state = isDated ? group.state : 'no-date'
    columns.set(label, {
      column: { key: label, label, count: group.units.length, state },
      sortKey: isDated ? group.date : NO_DATE_SORT_KEY,
    })
  }
  return [...columns.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ column }) => column)
}

/** Die Datumszeile, aus der „1 entnehmen“ nimmt (frühestes MHD), für Knopf und Markierung. */
export function fifoGroupOf(
  products: readonly DetailProduct[],
  fifoUnitId: string | null,
): BestBeforeGroupDto | null {
  if (fifoUnitId === null) return null
  const groups = products.flatMap((product) => product.bestBeforeGroups)
  return groups.find((group) => group.units.some((unit) => unit.id === fifoUnitId)) ?? null
}

/** Packungen einer Datumszeile, die „Noch gut“ bekommen können: abgelaufen, MHD, noch ungeprüft. */
export function stillGoodCandidates(group: BestBeforeGroupDto): string[] {
  if (group.kind !== 'dated' || group.state !== 'expired') return []
  return group.units
    .filter((unit) => unit.kind === 'best-before' && unit.checkedAt === null)
    .map((unit) => unit.id)
}

/** Zustand einer Datumszeile als Ton und Wort. Alle geprüft: „noch gut (geprüft am …)“ (#47). */
export function groupBadge(group: BestBeforeGroupDto) {
  if (group.kind === 'no-date') return STATE_BADGE['no-date']
  const checked = group.units.map((unit) => unit.checkedAt)
  const isAllChecked = checked.every((day) => day !== null)
  const latest = checked
    .filter((day) => day !== null)
    .sort()
    .at(-1)
  if (isAllChecked && latest !== undefined) {
    return { tone: 'green' as const, label: stillGoodLabel(latest) }
  }
  return STATE_BADGE[group.state]
}

/** Nur einige Packungen geprüft: „1 Packung noch gut (geprüft am …)“, sonst null. */
export function partlyCheckedNote(group: BestBeforeGroupDto): string | null {
  const checked = group.units.map((unit) => unit.checkedAt).filter((day) => day !== null)
  const latest = checked.sort().at(-1)
  if (latest === undefined || checked.length === group.units.length) return null
  return `${formatPackages(checked.length)} ${stillGoodLabel(latest)}`
}

const ORIGIN_LABEL: Record<NonNullable<NutritionDto['per100']['kcal']['origin']>, string> = {
  label: 'vom Etikett',
  manual: 'von Hand',
  'ai-estimate': 'KI-Schätzung',
  reference: 'Richtwert',
}

/** „359 kcal · 13 g Eiweiß · 71 g KH · 1,5 g Fett“, mit „ca.“ bei Richtwert oder Schätzung. */
export function nutritionLine(nutrition: NutritionDto): string | null {
  const { kcal, protein, carbs, fat } = nutrition.per100
  if (kcal.value === null) return null
  const prefix = nutrition.isKcalEstimated ? 'ca. ' : ''
  const parts = [`${prefix}${formatGermanNumber(kcal.value)} kcal`]
  const macros: [number | null, string][] = [
    [protein.value, 'Eiweiß'],
    [carbs.value, 'KH'],
    [fat.value, 'Fett'],
  ]
  for (const [value, name] of macros) {
    if (value !== null) parts.push(`${formatGermanNumber(value)} g ${name}`)
  }
  return parts.join(' · ')
}

/** Herkunft der kcal als Wort, ohne Wert null. */
export function nutritionOrigin(nutrition: NutritionDto): string | null {
  const origin = nutrition.per100.kcal.origin
  return origin === null ? null : ORIGIN_LABEL[origin]
}
