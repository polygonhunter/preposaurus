// Suche in der Verwaltung der Lebensmittelarten (#126): Name, eigene Suchwörter oder Kategorie
// enthalten jedes eingegebene Wort. Groß- und Kleinschreibung und Umlaute spielen keine Rolle.
import { normalizeSearchText } from '@/shared/lib/search-text'
import type { FoodTypeEntry } from './category'

type Searchable = Pick<FoodTypeEntry, 'name' | 'categoryName' | 'searchTerms'>

export function filterFoodTypes<T extends Searchable>(entries: readonly T[], query: string): T[] {
  const words = normalizeSearchText(query)
    .split(/\s+/)
    .filter((word) => word !== '')
  if (words.length === 0) return []
  return entries.filter((entry) => {
    const text = normalizeSearchText(
      [entry.name, entry.categoryName, ...entry.searchTerms].join(' '),
    )
    return words.every((word) => text.includes(word))
  })
}
