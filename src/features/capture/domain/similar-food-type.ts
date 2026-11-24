// Dublettenprüfung für neue Lebensmittelarten (#142, #110): Heißt eine sichtbare Art schon so oder
// trägt sie den Namen als Suchwort (Startliste #212, eigene Suchwörter #126), gibt es keine neue Art,
// sondern die vorhandene. Groß- und Kleinschreibung, Umlaute (auch ae, oe, ue) und ß zählen nicht.
// Ausgeblendete Arten prüft hier niemand, die Liste enthält nur sichtbare (#142). Einen gleichen
// Namen einer ausgeblendeten Art lehnt danach die Verwaltung ab (catalog/domain/catalog-name.ts).
import { normalizeSearchText } from '@/shared/lib/search-text'
import { FOOD_TYPE_SEARCH_TERMS } from './food-type-search-terms'

interface ComparableFoodType {
  key: string
  name: string
  /** Eigene Suchwörter einer eigenen Art */
  searchTerms?: readonly string[]
}

const termsOf = (foodType: ComparableFoodType) => [
  ...(FOOD_TYPE_SEARCH_TERMS[foodType.key] ?? []),
  ...(foodType.searchTerms ?? []),
]

/** Vorhandene Art zum Namen: zuerst gleicher Name, dann gleiches Suchwort, sonst null. */
export function findSimilarFoodType<T extends ComparableFoodType>(
  foodTypes: readonly T[],
  name: string,
): T | null {
  const wanted = normalizeSearchText(name)
  if (wanted === '') return null
  const byName = foodTypes.find((foodType) => normalizeSearchText(foodType.name) === wanted)
  if (byName !== undefined) return byName
  const byTerm = foodTypes.find((foodType) =>
    termsOf(foodType).some((term) => normalizeSearchText(term) === wanted),
  )
  return byTerm ?? null
}
